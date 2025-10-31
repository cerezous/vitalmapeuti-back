// Script específico para SQLite para actualizar el campo turno
const sequelize = require('./config/database');

async function actualizarTurnoSQLite() {
  const transaction = await sequelize.transaction();
  
  try {
    
    // Verificar registros existentes
    const [results] = await sequelize.query(`
      SELECT turno, COUNT(*) as count 
      FROM procedimientos_medicina 
      GROUP BY turno
    `, { transaction });
    
    results.forEach(row => {
    });
    
    // Actualizar los valores existentes
    
    // Día -> 12 h
    const [dayResults] = await sequelize.query(`
      UPDATE procedimientos_medicina 
      SET turno = '12 h' 
      WHERE turno = 'Día'
    `, { transaction });
    
    // Noche -> 12 h  
    const [nightResults] = await sequelize.query(`
      UPDATE procedimientos_medicina 
      SET turno = '12 h' 
      WHERE turno = 'Noche'
    `, { transaction });
    
    // 24 h se mantiene igual (no necesita actualización)
    
    // Verificar el resultado
    const [finalResults] = await sequelize.query(`
      SELECT turno, COUNT(*) as count 
      FROM procedimientos_medicina 
      GROUP BY turno
    `, { transaction });
    
    finalResults.forEach(row => {
    });
    
    await transaction.commit();
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error en actualización:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

actualizarTurnoSQLite();
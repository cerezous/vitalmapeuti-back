const sequelize = require('./config/database');

async function eliminarEnCascadaManual() {
  try {
    await sequelize.authenticate();
    
    const userId = 3;
    
    const transaction = await sequelize.transaction();
    
    try {
      
      // 1. Eliminar procedimientos_medicina directamente
      const [medResult] = await sequelize.query(
        'DELETE FROM procedimientos_medicina WHERE usuarioId = ?',
        { replacements: [userId], transaction }
      );
      
      // 2. Eliminar otros registros si existen
      const [nasResult] = await sequelize.query(
        'DELETE FROM nas WHERE usuarioId = ?',
        { replacements: [userId], transaction }
      );
      
      const [apache2Result] = await sequelize.query(
        'DELETE FROM apache2 WHERE usuarioId = ?',
        { replacements: [userId], transaction }
      );
      
      // 3. Eliminar el usuario
      const [userResult] = await sequelize.query(
        'DELETE FROM usuarios WHERE id = ?',
        { replacements: [userId], transaction }
      );
      
      await transaction.commit();
      
    } catch (error) {
      await transaction.rollback();
      console.error('Error en la transacción:', error.message);
      throw error;
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

eliminarEnCascadaManual();
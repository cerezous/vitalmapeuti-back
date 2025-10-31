const sequelize = require('./config/database');

async function probarEliminacionSQLite() {
  try {
    await sequelize.authenticate();
    
    const userId = 3;
    
    // Verificar primero que existan los registros
    const [countResult] = await sequelize.query(
      'SELECT COUNT(*) as count FROM procedimientos_medicina WHERE usuarioId = ?',
      { replacements: [userId], type: sequelize.QueryTypes.SELECT }
    );
    
    if (countResult.count > 0) {
      const transaction = await sequelize.transaction();
      
      try {
        // Eliminar usando el método correcto para SQLite
        const deleteResult = await sequelize.query(
          'DELETE FROM procedimientos_medicina WHERE usuarioId = ?',
          { 
            replacements: [userId], 
            type: sequelize.QueryTypes.DELETE,
            transaction 
          }
        );
        
        
        // Verificar después de eliminar
        const [countAfter] = await sequelize.query(
          'SELECT COUNT(*) as count FROM procedimientos_medicina WHERE usuarioId = ?',
          { replacements: [userId], type: sequelize.QueryTypes.SELECT, transaction }
        );
        
        // Eliminar el usuario
        const userDeleteResult = await sequelize.query(
          'DELETE FROM usuarios WHERE id = ?',
          { 
            replacements: [userId], 
            type: sequelize.QueryTypes.DELETE,
            transaction 
          }
        );
        
        
        await transaction.commit();
        
      } catch (error) {
        await transaction.rollback();
        console.error('Error en la transacción:', error.message);
        throw error;
      }
    } else {
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

probarEliminacionSQLite();
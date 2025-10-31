// Script para ejecutar la migración de turnos de medicina
const sequelize = require('./config/database');
const migration = require('./migrations/update_turno_medicina');

async function ejecutarMigracion() {
  try {
    
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    
    // Ejecutar la migración
    await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);
    
  } catch (error) {
    console.error('❌ Error ejecutando migración:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

ejecutarMigracion();
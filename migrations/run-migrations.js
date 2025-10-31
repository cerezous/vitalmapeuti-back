const sequelize = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  try {
    console.log('🔄 Iniciando migraciones exactas de SQLite a PostgreSQL...');
    
    // Ejecutar migraciones específicas en orden
    const migrations = [
      '001-create-exact-sqlite-tables.js',
      '002-create-sqlite-indexes.js'
    ];
    
    for (const migrationFile of migrations) {
      try {
        console.log(`🔄 Ejecutando migración: ${migrationFile}`);
        const migration = require(path.join(__dirname, migrationFile));
        if (typeof migration.up === 'function') {
          await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
          console.log(`✅ Migración ${migrationFile} ejecutada correctamente`);
        }
      } catch (error) {
        console.error(`❌ Error en migración ${migrationFile}:`, error.message);
        throw error;
      }
    }
    
    console.log('🎉 Todas las migraciones completadas - Estructura SQLite replicada en PostgreSQL');
    
  } catch (error) {
    console.error('❌ Error durante las migraciones:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;

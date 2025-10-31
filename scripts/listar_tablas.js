const sequelize = require('./config/database');

async function listarTablas() {
  try {
    await sequelize.authenticate();
    
    // Obtener todas las tablas
    const [results] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
    
    results.forEach(table => {
    });
    
    // Verificar específicamente las tablas que podrían tener usuarioId
    const tablasConUsuarioId = [
      'nas', 'apache2', 'CategorizacionKinesiologias', 'ProcedimientoKinesiologias',
      'ProcedimientoAuxiliars', 'ProcedimientoMedicinas', 'CuestionarioBurnouts',
      'RegistroProcedimientos', 'RegistroProcedimientosTENS'
    ];
    
    for (const tabla of tablasConUsuarioId) {
      try {
        const [structure] = await sequelize.query(`PRAGMA table_info(${tabla});`);
        if (structure.length > 0) {
          structure.forEach(col => {
            if (col.name.toLowerCase().includes('usuario')) {
            }
          });
        }
      } catch (error) {
        // Tabla no existe, intentar con nombres pluralizados automáticamente
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

listarTablas();
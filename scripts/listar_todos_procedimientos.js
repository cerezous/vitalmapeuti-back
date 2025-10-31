require('dotenv').config();
const sequelize = require('./config/database');
const ProcedimientoTENS = require('./models/ProcedimientoTENS');
require('./config/associations');

async function listarTodosLosProcedimientos() {
  try {
    
    const procedimientos = await ProcedimientoTENS.findAll({
      order: [['registroId', 'ASC'], ['id', 'ASC']]
    });
    
    
    procedimientos.forEach((proc, index) => {
      
      if (proc.nombre.includes('Aseo y cuidados')) {
      }
    });
    
    // Contar cuántos procedimientos de aseo hay
    const procedimientosAseo = procedimientos.filter(p => 
      p.nombre.includes('Aseo y cuidados')
    );
    
    
    procedimientosAseo.forEach((proc, index) => {
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

listarTodosLosProcedimientos();
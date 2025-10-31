require('dotenv').config();
const sequelize = require('./config/database');
const ProcedimientoTENS = require('./models/ProcedimientoTENS');
require('./config/associations');

async function listarProcedimientos() {
  try {
    
    const procedimientos = await ProcedimientoTENS.findAll({
      order: [['nombre', 'ASC']]
    });
    
    
    procedimientos.forEach((proc, index) => {
    });
    
    // Buscar específicamente el de aseo
    const aseo = await ProcedimientoTENS.findOne({
      where: {
        nombre: {
          [require('sequelize').Op.like]: '%aseo%'
        }
      }
    });
    
    if (aseo) {
    } else {
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

listarProcedimientos();
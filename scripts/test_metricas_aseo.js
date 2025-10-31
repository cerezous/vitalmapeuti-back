require('dotenv').config();
const sequelize = require('./config/database');
const ProcedimientoTENS = require('./models/ProcedimientoTENS');
const RegistroProcedimientosTENS = require('./models/RegistroProcedimientosTENS');
require('./config/associations');
const { Op } = require('sequelize');

// Función para convertir tiempo a minutos
function convertirTiempoAMinutos(tiempo) {
  if (!tiempo) return 0;
  
  const tiempoStr = tiempo.toString().trim();
  
  // Si contiene ":" es formato HH:MM
  if (tiempoStr.includes(':')) {
    const [horas, minutos] = tiempoStr.split(':').map(num => parseInt(num) || 0);
    const totalMinutos = (horas * 60) + minutos;
    return totalMinutos;
  }
  
  // Si no contiene ":", asumimos que son minutos directamente
  const minutosDirecto = parseInt(tiempoStr) || 0;
  return minutosDirecto;
}

async function testTiempoPromedioAseo() {
  try {
    
    // Buscar el procedimiento de aseo
    const procedimientoAseo = await ProcedimientoTENS.findOne({
      where: {
        nombre: 'Aseo y cuidados del paciente (aseo parcial o completo, cuidados de la piel, etc)'
      }
    });
    
    if (!procedimientoAseo) {
      
      const procedimientosAseo = await ProcedimientoTENS.findAll({
        where: {
          nombre: {
            [Op.like]: '%aseo%'
          }
        }
      });
      
      procedimientosAseo.forEach(p => {
      });
      
      return;
    }
    
    
    // Buscar todos los registros que incluyan este procedimiento
    const registrosConAseo = await RegistroProcedimientosTENS.findAll({
      include: [{
        model: ProcedimientoTENS,
        as: 'procedimientos',
        where: {
          id: procedimientoAseo.id
        }
      }]
    });
    
    
    if (registrosConAseo.length > 0) {
      let tiemposTotales = [];
      
      registrosConAseo.forEach((registro, index) => {
        
        const procedimientosAseo = registro.procedimientos.filter(p => p.id === procedimientoAseo.id);
        procedimientosAseo.forEach(procedimiento => {
          const tiempoEmpleado = procedimiento.tiempo; // El campo se llama 'tiempo'
          const tiempoMinutos = convertirTiempoAMinutos(tiempoEmpleado);
          tiemposTotales.push(tiempoMinutos);
          
        });
      });
      
      const tiempoTotal = tiemposTotales.reduce((sum, tiempo) => sum + tiempo, 0);
      const tiempoPromedio = Math.round(tiempoTotal / tiemposTotales.length);
      
    } else {
    }
    
  } catch (error) {
    console.error('Error en test:', error);
  }
  
  process.exit(0);
}

testTiempoPromedioAseo();
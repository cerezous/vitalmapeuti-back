require('dotenv').config();
const sequelize = require('./config/database');
const ProcedimientoTENS = require('./models/ProcedimientoTENS');
require('./config/associations');

// Función para convertir tiempo a minutos
function convertirTiempoAMinutos(tiempo) {
  if (!tiempo) {
    return 0;
  }
  
  const str = tiempo.toString().trim();
  
  // Patrón para formato HH:MM
  const timeMatch = str.match(/^(\d{1,2}):(\d{2})$/);
  if (timeMatch) {
    const hours = parseInt(timeMatch[1]);
    const minutes = parseInt(timeMatch[2]);
    const totalMinutes = hours * 60 + minutes;
    return totalMinutes;
  }
  
  // Si es solo número, asumimos que son minutos
  const numMatch = str.match(/^(\d+)$/);
  if (numMatch) {
    const minutes = parseInt(numMatch[1]);
    return minutes;
  }
  
  return 0;
}

async function testCalculoPromedio() {
  try {
    
    // Buscar todos los procedimientos con el nombre de aseo
    const procedimientosAseo = await ProcedimientoTENS.findAll({
      where: {
        nombre: 'Aseo y cuidados del paciente (aseo parcial o completo, cuidados de la piel, etc)'
      }
    });
    
    
    let tiemposTotales = [];
    
    procedimientosAseo.forEach((proc, index) => {
      
      const tiempoMinutos = convertirTiempoAMinutos(proc.tiempo);
      tiemposTotales.push(tiempoMinutos);
    });
    
    if (tiemposTotales.length > 0) {
      const tiempoTotal = tiemposTotales.reduce((sum, tiempo) => sum + tiempo, 0);
      const tiempoPromedio = Math.round(tiempoTotal / tiemposTotales.length);
      
    } else {
    }
    
  } catch (error) {
    console.error('Error en test:', error);
  }
  
  process.exit(0);
}

testCalculoPromedio();
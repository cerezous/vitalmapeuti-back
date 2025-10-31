require('dotenv').config();
const sequelize = require('./config/database');
const RegistroProcedimientosTENS = require('./models/RegistroProcedimientosTENS');
const ProcedimientoTENS = require('./models/ProcedimientoTENS');
require('./config/associations');
const { Op } = require('sequelize');

// Función para convertir tiempo a minutos (copiada del archivo de rutas)
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
  
  // Patrón para formato decimal (ej: 0.5 = 30 minutos)
  const decimalMatch = str.match(/^0\.(\d+)$/);
  if (decimalMatch) {
    const minutes = Math.round(parseFloat(decimalMatch[1]) * 60);
    return minutes;
  }
  
  return 0;
}

async function testMetricasCompletas() {
  try {
    
    const fechaActual = new Date();
    const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);

    // Total de procedimientos
    const totalProcedimientos = await ProcedimientoTENS.count();

    // Tiempo promedio del procedimiento "Aseo y cuidados del paciente"
    const procedimientoAseo = await ProcedimientoTENS.findOne({
      where: {
        nombre: 'Aseo y cuidados del paciente (aseo parcial o completo, cuidados de la piel, etc)'
      }
    });
    
    let tiempoPromedioAseo = 0;
    if (procedimientoAseo) {
      
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
            const tiempoMinutos = convertirTiempoAMinutos(procedimiento.tiempo);
            tiemposTotales.push(tiempoMinutos);
          });
        });
        
        if (tiemposTotales.length > 0) {
          const tiempoTotal = tiemposTotales.reduce((sum, tiempo) => sum + tiempo, 0);
          tiempoPromedioAseo = Math.round(tiempoTotal / tiemposTotales.length);
        }
      }
    } else {
    }

    // Tiempo total acumulado
    const registrosConTiempo = await RegistroProcedimientosTENS.findAll({
      attributes: ['tiempoTotal']
    });

    const tiempoTotalMinutos = registrosConTiempo.reduce((total, registro) => {
      return total + (registro.tiempoTotal || 0);
    }, 0);

    const horas = Math.floor(tiempoTotalMinutos / 60);
    const minutosRestantes = tiempoTotalMinutos % 60;

    // Promedio de procedimientos por turno
    const totalRegistros = await RegistroProcedimientosTENS.count();
    const promedioProcedimientos = totalRegistros > 0 ? totalProcedimientos / totalRegistros : 0;

      tiempoTotal: {
        minutos: tiempoTotalMinutos,
        horas,
        minutosRestantes,
        texto: `${horas}h ${minutosRestantes}m`
      },
      totalProcedimientos: {
        total: totalProcedimientos,
        texto: totalProcedimientos.toString()
      },
      promedioProcedimientos: {
        promedio: Math.round(promedioProcedimientos * 10) / 10,
        totalProcedimientos,
        totalTurnos: totalRegistros
      },
      tiempoPromedioAseo: {
        minutos: tiempoPromedioAseo,
        texto: `${tiempoPromedioAseo} min`
      }
    });
    
  } catch (error) {
    console.error('Error en test:', error);
  }
  
  process.exit(0);
}

testMetricasCompletas();
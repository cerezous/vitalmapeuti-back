const sequelize = require('./config/database');
// Importar asociaciones
require('./config/associations');
const RegistroProcedimientosTENS = require('./models/RegistroProcedimientosTENS');

// Función para convertir tiempo HH:MM a minutos
const convertirTiempoAMinutos = (tiempo) => {
  if (!tiempo) return 0;
  if (typeof tiempo === 'number') return tiempo;
  
  const str = tiempo.toString();
  const tiempoHTMLMatch = str.match(/^(\d{1,2}):(\d{2})$/);
  
  if (tiempoHTMLMatch) {
    return parseInt(tiempoHTMLMatch[1]) * 60 + parseInt(tiempoHTMLMatch[2]);
  }
  
  return 0;
};

async function arreglarTiempoTotal() {
  try {
    
    await sequelize.authenticate();
    
    // Obtener todos los registros TENS con sus procedimientos
    const registros = await RegistroProcedimientosTENS.findAll({
      include: [{
        model: require('./models/ProcedimientoTENS'),
        as: 'procedimientos'
      }]
    });

    
    for (const registro of registros) {
      let tiempoTotalCalculado = 0;
      
      
      if (registro.procedimientos && registro.procedimientos.length > 0) {
        registro.procedimientos.forEach((proc) => {
          const minutos = convertirTiempoAMinutos(proc.tiempo);
          tiempoTotalCalculado += minutos;
        });
      }
      
      
      if (registro.tiempoTotal !== tiempoTotalCalculado) {
        // Actualizar el registro
        await registro.update({ tiempoTotal: tiempoTotalCalculado });
      } else {
      }
    }
    
    
  } catch (error) {
    console.error('Error al arreglar tiempo total:', error);
  } finally {
    await sequelize.close();
  }
}

arreglarTiempoTotal();
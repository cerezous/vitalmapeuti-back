require('dotenv').config();
const Paciente = require('./models/Paciente');
const { Op } = require('sequelize');

async function debugPacientesEgresados() {
  try {

    // 1. Mostrar todos los pacientes con fecha de egreso
    const todosEgresados = await Paciente.findAll({
      where: {
        fechaEgresoUTI: {
          [Op.not]: null
        }
      },
      attributes: ['rut', 'nombreCompleto', 'fechaEgresoUTI'],
      order: [['fechaEgresoUTI', 'DESC']]
    });
    
    todosEgresados.forEach(p => {
    });

    // 2. Calcular fecha de inicio de ayer (nueva lógica)
    const inicioAyer = new Date();
    inicioAyer.setDate(inicioAyer.getDate() - 1);
    inicioAyer.setHours(0, 0, 0, 0);

    // 3. Buscar pacientes egresados desde ayer
    const egresadosRecientes = await Paciente.findAll({
      where: {
        fechaEgresoUTI: {
          [Op.gte]: inicioAyer
        }
      },
      attributes: ['rut', 'nombreCompleto', 'fechaEgresoUTI'],
      order: [['fechaEgresoUTI', 'DESC']]
    });

    if (egresadosRecientes.length === 0) {
    } else {
      egresadosRecientes.forEach(p => {
      });
    }

    // 4. Verificar si hay egresos de hoy
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);
    
    const egresadosHoy = await Paciente.findAll({
      where: {
        fechaEgresoUTI: {
          [Op.gte]: inicioHoy
        }
      },
      attributes: ['rut', 'nombreCompleto', 'fechaEgresoUTI'],
      order: [['fechaEgresoUTI', 'DESC']]
    });

    if (egresadosHoy.length === 0) {
    } else {
      egresadosHoy.forEach(p => {
      });
    }

    // 5. Verificar la configuración de zona horaria

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

debugPacientesEgresados();
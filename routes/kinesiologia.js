const express = require('express');
const router = express.Router();
const CategorizacionKinesiologia = require('../models/CategorizacionKinesiologia');
const ProcedimientoKinesiologia = require('../models/ProcedimientoKinesiologia');
const Paciente = require('../models/Paciente');
const { Op } = require('sequelize');

// Middleware para verificar autenticación
const authenticateToken = require('../middleware/auth');

// GET /api/kinesiologia/dia/:pacienteRut/:fecha - Obtener detalles de un día específico
router.get('/dia/:pacienteRut/:fecha', authenticateToken, async (req, res) => {
  try {
    const { pacienteRut, fecha } = req.params;


    // Obtener categorización del día
    const categorizacion = await CategorizacionKinesiologia.findOne({
      where: {
        pacienteRut: pacienteRut,
        fechaCategorizacion: fecha
      },
      order: [['createdAt', 'DESC']]
    });


    // Obtener procedimientos del día
    const procedimientos = await ProcedimientoKinesiologia.findAll({
      where: {
        pacienteRut: pacienteRut,
        fecha: fecha
      },
      order: [['createdAt', 'ASC']]
    });

    if (procedimientos.length > 0) {
    }

    res.json({
      success: true,
      data: {
        fecha: fecha,
        categorizacion: categorizacion ? {
          id: categorizacion.id,
          puntajeTotal: categorizacion.puntajeTotal,
          complejidad: categorizacion.complejidad,
          cargaAsistencial: categorizacion.cargaAsistencial,
          patronRespiratorio: categorizacion.patronRespiratorio,
          asistenciaVentilatoria: categorizacion.asistenciaVentilatoria,
          sasGlasgow: categorizacion.sasGlasgow,
          tosSecreciones: categorizacion.tosSecreciones,
          asistencia: categorizacion.asistencia,
          observaciones: categorizacion.observaciones,
          fechaCategorizacion: categorizacion.fechaCategorizacion,
          horaRegistro: categorizacion.createdAt
        } : null,
        procedimientos: procedimientos.map(proc => ({
          id: proc.id,
          nombre: proc.nombre,
          tiempo: proc.tiempo,
          turno: proc.turno,
          observaciones: proc.observaciones,
          fecha: proc.fecha
        }))
      }
    });
  } catch (error) {
    console.error('Error al obtener detalles del día de kinesiología:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/kinesiologia/metricas - Obtener métricas del dashboard de kinesiología
router.get('/metricas', authenticateToken, async (req, res) => {
  try {
    // Fecha del mes actual en formato YYYY-MM-DD
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const inicioMes = `${año}-${mes}-01`;
    
    // Obtener procedimientos del mes actual
    const procedimientosMes = await ProcedimientoKinesiologia.findAll({
      where: {
        fecha: {
          [Op.gte]: inicioMes
        }
      },
      attributes: ['tiempo', 'fecha', 'turno'],
      raw: true
    });

    // Calcular total de procedimientos
    const totalProcedimientos = procedimientosMes.length;

    // Calcular tiempo total en minutos
    const tiempoTotalMinutos = procedimientosMes.reduce((total, proc) => {
      const [horas, minutos] = proc.tiempo.split(':').map(Number);
      return total + (horas * 60) + minutos;
    }, 0);
    
    const tiempoTotalHoras = Math.floor(tiempoTotalMinutos / 60);
    const tiempoTotalMins = tiempoTotalMinutos % 60;

    // Calcular promedio de procedimientos por turno (separado por Día y Noche)
    const turnosDia = new Set();
    const turnosNoche = new Set();
    let procedimientosDia = 0;
    let procedimientosNoche = 0;
    
    procedimientosMes.forEach(proc => {
      if (proc.turno === 'Día') {
        turnosDia.add(`${proc.fecha}-${proc.turno}`);
        procedimientosDia++;
      } else if (proc.turno === 'Noche') {
        turnosNoche.add(`${proc.fecha}-${proc.turno}`);
        procedimientosNoche++;
      }
    });
    
    const promedioDia = turnosDia.size > 0 ? 
      Math.round(procedimientosDia / turnosDia.size) : 0;
    const promedioNoche = turnosNoche.size > 0 ? 
      Math.round(procedimientosNoche / turnosNoche.size) : 0;

    // Obtener categorizaciones actuales de pacientes activos
    const pacientesActivos = await Paciente.findAll({
      where: {
        camaAsignada: { [Op.ne]: null },
        fechaEgresoUTI: null
      },
      attributes: ['rut', 'nombreCompleto', 'camaAsignada']
    });

    // Contar pacientes por gravedad y calcular promedio de puntaje
    let complejidadBaja = 0;
    let complejidadMedia = 0;
    let complejidadAlta = 0;
    let sumaPuntajes = 0;
    let pacientesCategorizados = 0;

    // Para cada paciente activo, obtener su última categorización
    for (const paciente of pacientesActivos) {
      const ultimaCategorizacion = await CategorizacionKinesiologia.findOne({
        where: { pacienteRut: paciente.rut },
        order: [['fechaCategorizacion', 'DESC'], ['createdAt', 'DESC']],
        limit: 1
      });

      if (ultimaCategorizacion) {
        pacientesCategorizados++;
        sumaPuntajes += ultimaCategorizacion.puntajeTotal || 0;
        
        if (ultimaCategorizacion.complejidad === 'Baja') {
          complejidadBaja++;
        } else if (ultimaCategorizacion.complejidad === 'Mediana') {
          complejidadMedia++;
        } else if (ultimaCategorizacion.complejidad === 'Alta') {
          complejidadAlta++;
        }
      }
    }

    // Calcular promedio de puntaje
    const promedioPuntaje = pacientesCategorizados > 0 ? 
      (sumaPuntajes / pacientesCategorizados).toFixed(1) : 0;
    
    // Determinar complejidad predominante
    let complejidadPredominante = 'Sin categorizar';
    if (pacientesCategorizados > 0) {
      const max = Math.max(complejidadBaja, complejidadMedia, complejidadAlta);
      if (max === complejidadAlta) {
        complejidadPredominante = 'Alta';
      } else if (max === complejidadMedia) {
        complejidadPredominante = 'Mediana';
      } else {
        complejidadPredominante = 'Baja';
      }
    }

    res.json({
      message: 'Métricas obtenidas exitosamente',
      data: {
        totalProcedimientos: {
          cantidad: totalProcedimientos,
          texto: `${totalProcedimientos}`
        },
        gravedad: {
          promedioPuntaje: promedioPuntaje,
          complejidadPredominante: complejidadPredominante,
          baja: complejidadBaja,
          media: complejidadMedia,
          alta: complejidadAlta,
          total: pacientesCategorizados,
          totalPacientesActivos: pacientesActivos.length
        },
        promedioDia: {
          promedio: promedioDia,
          totalTurnos: turnosDia.size,
          totalProcedimientos: procedimientosDia
        },
        promedioNoche: {
          promedio: promedioNoche,
          totalTurnos: turnosNoche.size,
          totalProcedimientos: procedimientosNoche
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener métricas de kinesiología:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener las métricas de kinesiología'
    });
  }
});

module.exports = router;

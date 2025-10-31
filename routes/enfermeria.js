const express = require('express');
const router = express.Router();
const NAS = require('../models/NAS');
const RegistroProcedimientos = require('../models/RegistroProcedimientos');
const ProcedimientoRegistro = require('../models/ProcedimientoRegistro');
const CategorizacionKinesiologia = require('../models/CategorizacionKinesiologia');
const { Op, fn, col, where } = require('sequelize');

// Middleware para verificar autenticación
const authenticateToken = require('../middleware/auth');

// GET /api/enfermeria/calendario/:pacienteRut - Obtener datos del calendario de enfermería
router.get('/calendario/:pacienteRut', authenticateToken, async (req, res) => {
  try {
    const { pacienteRut } = req.params;
    const diasAtras = parseInt(req.query.dias) || 30;

    // Calcular fecha de inicio (hace X días)
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - diasAtras);
    fechaInicio.setHours(0, 0, 0, 0);

    // Obtener registros NAS del paciente en el rango de fechas
    const registrosNAS = await NAS.findAll({
      where: {
        pacienteRut: pacienteRut,
        fechaRegistro: {
          [Op.gte]: fechaInicio
        }
      },
      attributes: ['id', 'fechaRegistro', 'puntuacionTotal'],
      order: [['fechaRegistro', 'ASC']]
    });

    // Obtener procedimientos del paciente en el rango de fechas
    const procedimientos = await ProcedimientoRegistro.findAll({
      where: {
        pacienteRut: pacienteRut
      },
      include: [{
        model: RegistroProcedimientos,
        as: 'registro',
        attributes: ['turno', 'tiempoTotal', 'fecha'],
        where: {
          fecha: {
            [Op.gte]: fechaInicio
          }
        },
        required: true
      }],
      attributes: ['id'],
      order: [[{ model: RegistroProcedimientos, as: 'registro' }, 'fecha', 'ASC']]
    });

    // Agrupar datos por día
    const datosPorDia = {};

    // Procesar registros NAS
    registrosNAS.forEach(nas => {
      // Usar solo la parte de fecha en zona horaria local
      const fechaObj = new Date(nas.fechaRegistro);
      const year = fechaObj.getFullYear();
      const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const day = String(fechaObj.getDate()).padStart(2, '0');
      const fecha = `${year}-${month}-${day}`;
      
      if (!datosPorDia[fecha]) {
        datosPorDia[fecha] = {
          fecha: fecha,
          nas: null,
          procedimientos: { dia: 0, noche: 0 }
        };
      }

      // Solo un NAS por día
      datosPorDia[fecha].nas = nas.puntuacionTotal;
    });

    // Procesar procedimientos
    procedimientos.forEach(proc => {
      if (!proc.registro) return;
      
      // Usar solo la parte de fecha del campo DATEONLY
      const fecha = proc.registro.fecha; // Ya viene como YYYY-MM-DD del modelo DATEONLY
      
      if (!datosPorDia[fecha]) {
        datosPorDia[fecha] = {
          fecha: fecha,
          nas: null,
          procedimientos: { dia: 0, noche: 0 }
        };
      }

      const turno = proc.registro.turno;
      const tiempo = proc.registro.tiempoTotal || 0;

      if (turno === 'Día') {
        datosPorDia[fecha].procedimientos.dia += tiempo;
      } else if (turno === 'Noche') {
        datosPorDia[fecha].procedimientos.noche += tiempo;
      } else if (turno === '24 h') {
        // Dividir el tiempo entre día y noche
        datosPorDia[fecha].procedimientos.dia += Math.floor(tiempo / 2);
        datosPorDia[fecha].procedimientos.noche += Math.ceil(tiempo / 2);
      }
    });

    // Formatear respuesta
    const resultado = Object.keys(datosPorDia).map(fecha => {
      const datos = datosPorDia[fecha];

      return {
        fecha: fecha,
        nas: datos.nas,
        procedimientos: {
          dia: datos.procedimientos.dia,
          noche: datos.procedimientos.noche
        }
      };
    });

    // Ordenar por fecha
    resultado.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    console.error('Error al obtener datos de calendario de enfermería:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/enfermeria/dia/:pacienteRut/:fecha - Obtener detalles de un día específico
router.get('/dia/:pacienteRut/:fecha', authenticateToken, async (req, res) => {
  try {
    const { pacienteRut, fecha } = req.params;


    // Obtener todos los registros NAS de ese día usando SQL DATE para comparar solo la parte de fecha
    const registrosNAS = await NAS.findAll({
      where: {
        pacienteRut: pacienteRut,
        [Op.and]: [
          where(fn('DATE', col('fechaRegistro')), fecha)
        ]
      },
      order: [['fechaRegistro', 'DESC']]
      // Obtener todos los atributos para mostrar el detalle completo
    });

    if (registrosNAS.length > 0) {
      res.json({
        success: true,
        data: {
          id: registrosNAS[0].id,
          puntuacion: registrosNAS[0].puntuacionTotal,
          fechaRegistro: registrosNAS[0].fechaRegistro
        }
      });
    }

    // Obtener todos los procedimientos de ese día
    const procedimientos = await ProcedimientoRegistro.findAll({
      where: {
        pacienteRut: pacienteRut
      },
      include: [{
        model: RegistroProcedimientos,
        as: 'registro',
        where: {
          fecha: fecha
        },
        attributes: ['id', 'turno', 'tiempoTotal', 'fecha'],
        required: true
      }],
      attributes: ['id', 'nombre', 'tiempo'],
      order: [[{ model: RegistroProcedimientos, as: 'registro' }, 'turno', 'ASC']]
    });

    // Obtener categorización de kinesiología de ese día
    const categorizacion = await CategorizacionKinesiologia.findOne({
      where: {
        pacienteRut: pacienteRut,
        fechaCategorizacion: fecha
      },
      order: [['createdAt', 'DESC']],
      attributes: [
        'id', 
        'puntajeTotal', 
        'complejidad', 
        'cargaAsistencial',
        'patronRespiratorio',
        'asistenciaVentilatoria',
        'sasGlasgow',
        'tosSecreciones',
        'asistencia',
        'observaciones',
        'fechaCategorizacion',
        'createdAt'
      ]
    });


    const respuesta = {
      success: true,
      data: {
        fecha: fecha,
        nas: registrosNAS.map(nas => ({
          id: nas.id,
          puntuacion: nas.puntuacionTotal,
          fecha: nas.fechaRegistro,
          horaRegistro: nas.createdAt,
          // Devolver todos los items para mostrar el detalle
          detalle: nas.toJSON()
        })),
        procedimientos: procedimientos.map(proc => ({
          id: proc.id,
          nombre: proc.nombre,
          tiempo: proc.tiempo,
          turno: proc.registro?.turno,
          registroId: proc.registro?.id
        })),
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
        } : null
      }
    };

    // Agregar estadísticas adicionales
    respuesta.data.estadisticas = {
      cantidadNAS: respuesta.data.nas.length,
      cantidadProcedimientos: respuesta.data.procedimientos.length,
      tieneCategorizacion: !!respuesta.data.categorizacion
    };

    res.json(respuesta);
  } catch (error) {
    console.error('Error al obtener detalles del día:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/enfermeria/metricas - Obtener métricas del dashboard de enfermería
router.get('/metricas', authenticateToken, async (req, res) => {
  try {
    // Fecha del mes actual en formato YYYY-MM-DD
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const inicioMes = `${año}-${mes}-01`;
    
    // Obtener registros de procedimientos del mes actual de enfermería
    // Los registros de enfermería tienen turno "Día" o "Noche" (medicina tiene "24 h")
    const registrosMes = await RegistroProcedimientos.findAll({
      where: {
        fecha: {
          [Op.gte]: inicioMes
        },
        turno: {
          [Op.in]: ['Día', 'Noche'] // Solo registros de enfermería
        }
      },
      include: [{
        model: ProcedimientoRegistro,
        as: 'procedimientos'
      }],
      attributes: ['id', 'turno', 'fecha']
    });

    // Calcular total de procedimientos
    const totalProcedimientos = registrosMes.reduce((sum, registro) => {
      return sum + (registro.procedimientos?.length || 0);
    }, 0);

    res.json({
      message: 'Métricas obtenidas exitosamente',
      data: {
        totalProcedimientos: {
          cantidad: totalProcedimientos,
          texto: `${totalProcedimientos}`
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener métricas de enfermería:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener las métricas de enfermería'
    });
  }
});

module.exports = router;


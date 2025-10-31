const express = require('express');
const router = express.Router();
const CuestionarioBurnout = require('../models/CuestionarioBurnout');
const Usuario = require('../models/Usuario');
const auth = require('../middleware/auth');

// Guardar respuesta del cuestionario
router.post('/guardar', auth, async (req, res) => {
  try {
    const { respuestas, estamento } = req.body;
    const usuarioId = req.user.id;

    // Verificar si el usuario ya ha respondido el cuestionario
    const respuestaExistente = await CuestionarioBurnout.findOne({
      where: { usuarioId }
    });

    if (respuestaExistente) {
      return res.status(400).json({
        message: 'Ya has completado este cuestionario anteriormente. Solo se permite una respuesta por usuario.',
        fechaRespuestaAnterior: respuestaExistente.fechaRespuesta
      });
    }

    // Validar que se proporcionen todas las respuestas
    const respuestasRequeridas = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10', 'p11', 'p12', 'p13', 'p14', 'p15', 'p16', 'p17', 'p18', 'p19', 'p20', 'p21', 'p22'];
    
    for (const pregunta of respuestasRequeridas) {
      if (respuestas[pregunta] === undefined || respuestas[pregunta] === null) {
        return res.status(400).json({
          message: `Falta la respuesta para la pregunta ${pregunta}`
        });
      }
      if (respuestas[pregunta] < 0 || respuestas[pregunta] > 6) {
        return res.status(400).json({
          message: `La respuesta para la pregunta ${pregunta} debe estar entre 0 y 6`
        });
      }
    }

    // Calcular puntajes
    const puntajes = CuestionarioBurnout.calcularPuntajes(respuestas);
    const interpretacion = CuestionarioBurnout.interpretarNiveles(
      puntajes.agotamientoEmocional,
      puntajes.despersonalizacion,
      puntajes.realizacionPersonal
    );

    // Crear registro en la base de datos
    const cuestionarioData = {
      usuarioId,
      estamento,
      fechaRespuesta: new Date(),
      ...respuestas,
      ...puntajes,
      ...interpretacion
    };

    const cuestionario = await CuestionarioBurnout.create(cuestionarioData);

    res.status(201).json({
      message: 'Cuestionario guardado exitosamente',
      data: cuestionario
    });

  } catch (error) {
    console.error('Error al guardar cuestionario:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener historial de respuestas del usuario
router.get('/historial', auth, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    
    const historial = await CuestionarioBurnout.findAll({
      where: { usuarioId },
      order: [['fechaRespuesta', 'DESC']]
    });

    res.json(historial);

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener última respuesta del usuario
router.get('/ultima', auth, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    
    const ultimaRespuesta = await CuestionarioBurnout.findOne({
      where: { usuarioId },
      order: [['fechaRespuesta', 'DESC']]
    });

    if (!ultimaRespuesta) {
      return res.json(null);
    }

    res.json(ultimaRespuesta);

  } catch (error) {
    console.error('Error al obtener última respuesta:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener estadísticas generales (solo para administradores)
router.get('/estadisticas', auth, async (req, res) => {
  try {
    // Verificar que el usuario sea administrador
    if (req.user.estamento !== 'Administrador') {
      return res.status(403).json({
        message: 'No tienes permisos para acceder a estas estadísticas'
      });
    }

    const totalCuestionarios = await CuestionarioBurnout.count();
    
    if (totalCuestionarios === 0) {
      return res.json({
        totalCuestionarios: 0,
        porEstamento: {}
      });
    }

    // Estadísticas por estamento con conteos de niveles altos/bajos
    const estadisticasPorEstamento = await CuestionarioBurnout.findAll({
      attributes: [
        'estamento',
        [CuestionarioBurnout.sequelize.fn('COUNT', CuestionarioBurnout.sequelize.col('id')), 'total'],
        [CuestionarioBurnout.sequelize.fn('AVG', CuestionarioBurnout.sequelize.col('agotamientoEmocional')), 'promedioAgotamiento'],
        [CuestionarioBurnout.sequelize.fn('AVG', CuestionarioBurnout.sequelize.col('despersonalizacion')), 'promedioDespersonalizacion'],
        [CuestionarioBurnout.sequelize.fn('AVG', CuestionarioBurnout.sequelize.col('realizacionPersonal')), 'promedioRealizacion'],
        [CuestionarioBurnout.sequelize.fn('SUM', CuestionarioBurnout.sequelize.literal("CASE WHEN nivelAgotamiento = 'alto' THEN 1 ELSE 0 END")), 'nivelAgotamientoAlto'],
        [CuestionarioBurnout.sequelize.fn('SUM', CuestionarioBurnout.sequelize.literal("CASE WHEN nivelDespersonalizacion = 'alto' THEN 1 ELSE 0 END")), 'nivelDespersonalizacionAlto'],
        [CuestionarioBurnout.sequelize.fn('SUM', CuestionarioBurnout.sequelize.literal("CASE WHEN nivelRealizacion = 'bajo' THEN 1 ELSE 0 END")), 'nivelRealizacionBajo']
      ],
      group: ['estamento'],
      raw: true
    });

    // Procesar estadísticas por estamento
    const procesarEstamento = (data) => {
      const resultado = {};
      data.forEach(item => {
        resultado[item.estamento] = {
          total: parseInt(item.total),
          promedioAgotamiento: parseFloat(item.promedioAgotamiento || 0),
          promedioDespersonalizacion: parseFloat(item.promedioDespersonalizacion || 0),
          promedioRealizacion: parseFloat(item.promedioRealizacion || 0),
          nivelAgotamientoAlto: parseInt(item.nivelAgotamientoAlto || 0),
          nivelDespersonalizacionAlto: parseInt(item.nivelDespersonalizacionAlto || 0),
          nivelRealizacionBajo: parseInt(item.nivelRealizacionBajo || 0)
        };
      });
      return resultado;
    };

    res.json({
      totalCuestionarios,
      porEstamento: procesarEstamento(estadisticasPorEstamento)
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener todos los cuestionarios con información de usuario (solo para administradores)
router.get('/todos', auth, async (req, res) => {
  try {
    // Verificar que el usuario sea administrador
    if (req.user.estamento !== 'Administrador') {
      return res.status(403).json({
        message: 'No tienes permisos para acceder a esta información'
      });
    }

    const cuestionarios = await CuestionarioBurnout.findAll({
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombres', 'apellidos', 'usuario']
      }],
      order: [['fechaRespuesta', 'DESC']]
    });

    res.json(cuestionarios);

  } catch (error) {
    console.error('Error al obtener todos los cuestionarios:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener respuestas detalladas de un cuestionario específico (solo para administradores)
router.get('/respuestas/:id', auth, async (req, res) => {
  try {
    
    // Verificar que el usuario sea administrador
    if (req.user.estamento !== 'Administrador') {
      return res.status(403).json({
        message: 'No tienes permisos para acceder a esta información'
      });
    }

    const { id } = req.params;
    
    const cuestionario = await CuestionarioBurnout.findByPk(id);
    
    if (!cuestionario) {
      return res.status(404).json({
        message: 'Cuestionario no encontrado'
      });
    }
    

    // Extraer solo las respuestas individuales (p1-p22)
    const respuestas = {
      p1: cuestionario.p1,
      p2: cuestionario.p2,
      p3: cuestionario.p3,
      p4: cuestionario.p4,
      p5: cuestionario.p5,
      p6: cuestionario.p6,
      p7: cuestionario.p7,
      p8: cuestionario.p8,
      p9: cuestionario.p9,
      p10: cuestionario.p10,
      p11: cuestionario.p11,
      p12: cuestionario.p12,
      p13: cuestionario.p13,
      p14: cuestionario.p14,
      p15: cuestionario.p15,
      p16: cuestionario.p16,
      p17: cuestionario.p17,
      p18: cuestionario.p18,
      p19: cuestionario.p19,
      p20: cuestionario.p20,
      p21: cuestionario.p21,
      p22: cuestionario.p22
    };

    res.json(respuestas);

  } catch (error) {
    console.error('Error al obtener respuestas detalladas:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;

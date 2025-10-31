const express = require('express');
const router = express.Router();
const Apache2 = require('../models/Apache2');
const Paciente = require('../models/Paciente');
const { Op } = require('sequelize');

// Middleware para verificar autenticación (puedes ajustar según tu sistema de auth)
const verificarAuth = (req, res, next) => {
  // Por ahora permitir todas las solicitudes, luego puedes agregar verificación de JWT
  next();
};

// POST /api/apache2 - Crear nueva evaluación APACHE II
router.post('/', verificarAuth, async (req, res) => {
  try {
    const {
      pacienteRut,
      fechaEvaluacion,
      temperatura,
      presionArterial,
      frecuenciaCardiaca,
      frecuenciaRespiratoria,
      oxigenacion,
      phArterial,
      sodio,
      potasio,
      creatinina,
      hematocrito,
      leucocitos,
      glasgow,
      edad,
      enfermedadCronica,
      rangosSeleccionados,
      observaciones,
      usuarioId
    } = req.body;

    // Buscar el paciente por RUT
    const paciente = await Paciente.findOne({ 
      where: { rut: pacienteRut } 
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: `No se encontró un paciente con RUT ${pacienteRut}`
      });
    }

    // Procesar la fecha de evaluación
    let fechaEvaluacionProcessed;
    
    // Intentar procesar la fecha de manera más robusta
    if (fechaEvaluacion) {
      const fechaStr = String(fechaEvaluacion).trim();
      
      // Intentar diferentes formatos de fecha
      let fechaValida = null;
      
      // Formato YYYY-MM-DD (preferido)
      if (fechaStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = fechaStr.split('-').map(num => parseInt(num, 10));
        fechaValida = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
      }
      // Formato DD/MM/YYYY
      else if (fechaStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        const [day, month, year] = fechaStr.split('/').map(num => parseInt(num, 10));
        fechaValida = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
      }
      // Intentar parsear como fecha ISO
      else {
        try {
          const tentativa = new Date(fechaStr);
          if (!isNaN(tentativa.getTime())) {
            fechaValida = tentativa;
          }
        } catch (e) {
        }
      }
      
      if (fechaValida && !isNaN(fechaValida.getTime())) {
        fechaEvaluacionProcessed = fechaValida;
      } else {
        console.error('❌ PROCESANDO FECHA - Formato inválido, usando fecha actual');
        console.error('❌ PROCESANDO FECHA - Valor rechazado:', fechaStr);
        fechaEvaluacionProcessed = new Date();
      }
    } else {
      fechaEvaluacionProcessed = new Date();
    }

    // Crear la evaluación APACHE II
    
    // Verificación adicional: asegurar que la fecha sea válida
    if (!fechaEvaluacionProcessed || isNaN(fechaEvaluacionProcessed.getTime())) {
      console.error('ERROR: fechaEvaluacionProcessed no es válida, usando fecha actual como fallback');
      fechaEvaluacionProcessed = new Date();
    }
    
    const apache2 = await Apache2.create({
      pacienteId: paciente.id,
      fechaEvaluacion: fechaEvaluacionProcessed,
      temperatura: temperatura || 0,
      presionArterial: presionArterial || 0,
      frecuenciaCardiaca: frecuenciaCardiaca || 0,
      frecuenciaRespiratoria: frecuenciaRespiratoria || 0,
      oxigenacion: oxigenacion || 0,
      phArterial: phArterial || 0,
      sodio: sodio || 0,
      potasio: potasio || 0,
      creatinina: creatinina || 0,
      hematocrito: hematocrito || 0,
      leucocitos: leucocitos || 0,
      glasgow: glasgow || 0,
      edad: edad || 0,
      enfermedadCronica: enfermedadCronica || 0,
      rangosSeleccionados: rangosSeleccionados || {},
      observaciones: observaciones || null,
      usuarioId: usuarioId || null
    });


    // Incluir información del paciente en la respuesta
    const evaluacionCompleta = await Apache2.findByPk(apache2.id, {
      include: [{
        model: Paciente,
        attributes: ['id', 'nombreCompleto', 'rut', 'numeroFicha']
      }]
    });


    res.status(201).json({
      success: true,
      message: 'Evaluación APACHE II creada exitosamente',
      data: evaluacionCompleta
    });

  } catch (error) {
    console.error('Error al crear evaluación APACHE II:', error);
    
    // Manejar errores de validación específicos
    if (error.name === 'SequelizeValidationError') {
      const errores = error.errors.map(e => ({
        campo: e.path,
        mensaje: e.message,
        valor: e.value
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Errores de validación en los datos',
        errores: errores
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/apache2 - Obtener todas las evaluaciones APACHE II
router.get('/', verificarAuth, async (req, res) => {
  try {
    const { pacienteRut, limit = 50, offset = 0, orderBy = 'fechaEvaluacion', order = 'DESC' } = req.query;

    let whereClause = {};
    
    // Filtrar por paciente si se proporciona RUT
    if (pacienteRut) {
      const paciente = await Paciente.findOne({ 
        where: { rut: pacienteRut } 
      });
      
      if (!paciente) {
        return res.status(404).json({
          success: false,
          message: `No se encontró un paciente con RUT ${pacienteRut}`
        });
      }
      
      whereClause.pacienteId = paciente.id;
    }

    const evaluaciones = await Apache2.findAndCountAll({
      where: whereClause,
      include: [{
        model: Paciente,
        attributes: ['id', 'nombreCompleto', 'rut', 'numeroFicha']
      }],
      order: [[orderBy, order.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: evaluaciones.rows,
      pagination: {
        total: evaluaciones.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(evaluaciones.count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener evaluaciones APACHE II:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/apache2/:id - Obtener evaluación APACHE II específica
router.get('/:id', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const evaluacion = await Apache2.findByPk(id, {
      include: [{
        model: Paciente,
        attributes: ['id', 'nombreCompleto', 'rut', 'numeroFicha', 'edad', 'fechaIngresoUTI']
      }]
    });

    if (!evaluacion) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la evaluación APACHE II con ID ${id}`
      });
    }

    res.json({
      success: true,
      data: evaluacion
    });

  } catch (error) {
    console.error('Error al obtener evaluación APACHE II:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/apache2/:id - Actualizar evaluación APACHE II
router.put('/:id', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      temperatura,
      presionArterial,
      frecuenciaCardiaca,
      frecuenciaRespiratoria,
      oxigenacion,
      phArterial,
      sodio,
      potasio,
      creatinina,
      hematocrito,
      leucocitos,
      glasgow,
      edad,
      enfermedadCronica,
      rangosSeleccionados,
      observaciones
    } = req.body;

    const evaluacion = await Apache2.findByPk(id);

    if (!evaluacion) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la evaluación APACHE II con ID ${id}`
      });
    }

    // Actualizar los campos
    await evaluacion.update({
      temperatura: temperatura !== undefined ? temperatura : evaluacion.temperatura,
      presionArterial: presionArterial !== undefined ? presionArterial : evaluacion.presionArterial,
      frecuenciaCardiaca: frecuenciaCardiaca !== undefined ? frecuenciaCardiaca : evaluacion.frecuenciaCardiaca,
      frecuenciaRespiratoria: frecuenciaRespiratoria !== undefined ? frecuenciaRespiratoria : evaluacion.frecuenciaRespiratoria,
      oxigenacion: oxigenacion !== undefined ? oxigenacion : evaluacion.oxigenacion,
      phArterial: phArterial !== undefined ? phArterial : evaluacion.phArterial,
      sodio: sodio !== undefined ? sodio : evaluacion.sodio,
      potasio: potasio !== undefined ? potasio : evaluacion.potasio,
      creatinina: creatinina !== undefined ? creatinina : evaluacion.creatinina,
      hematocrito: hematocrito !== undefined ? hematocrito : evaluacion.hematocrito,
      leucocitos: leucocitos !== undefined ? leucocitos : evaluacion.leucocitos,
      glasgow: glasgow !== undefined ? glasgow : evaluacion.glasgow,
      edad: edad !== undefined ? edad : evaluacion.edad,
      enfermedadCronica: enfermedadCronica !== undefined ? enfermedadCronica : evaluacion.enfermedadCronica,
      rangosSeleccionados: rangosSeleccionados !== undefined ? rangosSeleccionados : evaluacion.rangosSeleccionados,
      observaciones: observaciones !== undefined ? observaciones : evaluacion.observaciones
    });

    // Obtener la evaluación actualizada con información del paciente
    const evaluacionActualizada = await Apache2.findByPk(id, {
      include: [{
        model: Paciente,
        attributes: ['id', 'nombreCompleto', 'rut', 'numeroFicha']
      }]
    });

    res.json({
      success: true,
      message: 'Evaluación APACHE II actualizada exitosamente',
      data: evaluacionActualizada
    });

  } catch (error) {
    console.error('Error al actualizar evaluación APACHE II:', error);
    
    if (error.name === 'SequelizeValidationError') {
      const errores = error.errors.map(e => ({
        campo: e.path,
        mensaje: e.message,
        valor: e.value
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Errores de validación en los datos',
        errores: errores
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// DELETE /api/apache2/:id - Eliminar evaluación APACHE II
router.delete('/:id', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const evaluacion = await Apache2.findByPk(id);

    if (!evaluacion) {
      return res.status(404).json({
        success: false,
        message: `No se encontró la evaluación APACHE II con ID ${id}`
      });
    }

    await evaluacion.destroy();

    res.json({
      success: true,
      message: 'Evaluación APACHE II eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar evaluación APACHE II:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/apache2/paciente/:rut - Obtener evaluaciones de un paciente específico por RUT
router.get('/paciente/:rut', verificarAuth, async (req, res) => {
  try {
    const { rut } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    // Buscar el paciente por RUT
    const paciente = await Paciente.findOne({ 
      where: { rut: rut } 
    });

    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: `No se encontró un paciente con RUT ${rut}`
      });
    }

    const evaluaciones = await Apache2.findAndCountAll({
      where: { pacienteId: paciente.id },
      include: [{
        model: Paciente,
        attributes: ['id', 'nombreCompleto', 'rut', 'numeroFicha']
      }],
      order: [['fechaEvaluacion', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Log para debug
    if (evaluaciones.rows.length > 0) {
    }

    res.json({
      success: true,
      paciente: {
        id: paciente.id,
        nombreCompleto: paciente.nombreCompleto,
        rut: paciente.rut,
        numeroFicha: paciente.numeroFicha
      },
      evaluaciones: evaluaciones.rows,
      pagination: {
        total: evaluaciones.count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(evaluaciones.count / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener evaluaciones del paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/apache2/estadisticas/general - Obtener estadísticas generales
router.get('/estadisticas/general', verificarAuth, async (req, res) => {
  try {
    const totalEvaluaciones = await Apache2.count();
    
    const estadisticasRiesgo = await Apache2.findAll({
      attributes: [
        'nivelRiesgo',
        [Apache2.sequelize.fn('COUNT', Apache2.sequelize.col('nivelRiesgo')), 'cantidad']
      ],
      group: ['nivelRiesgo'],
      raw: true
    });

    const promedioScore = await Apache2.findAll({
      attributes: [
        [Apache2.sequelize.fn('AVG', Apache2.sequelize.col('puntajeTotal')), 'promedio'],
        [Apache2.sequelize.fn('MIN', Apache2.sequelize.col('puntajeTotal')), 'minimo'],
        [Apache2.sequelize.fn('MAX', Apache2.sequelize.col('puntajeTotal')), 'maximo']
      ],
      raw: true
    });

    res.json({
      success: true,
      data: {
        totalEvaluaciones,
        estadisticasRiesgo,
        promedioScore: promedioScore[0]
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
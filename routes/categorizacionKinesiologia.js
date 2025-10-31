const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const CategorizacionKinesiologia = require('../models/CategorizacionKinesiologia');
const Paciente = require('../models/Paciente');
const Usuario = require('../models/Usuario');

// Middleware para validar token JWT (asume que ya existe)
const authenticateToken = require('../middleware/auth'); // Ajusta la ruta según tu estructura

// Crear nueva categorización
router.post('/', (req, res, next) => {
  next();
}, authenticateToken, async (req, res) => {
  try {
    
    const {
      pacienteRut,
      fechaCategorizacion,
      patronRespiratorio,
      asistenciaVentilatoria,
      sasGlasgow,
      tosSecreciones,
      asistencia,
      observaciones
    } = req.body;

    // Validar que el paciente existe
    const paciente = await Paciente.findOne({ where: { rut: pacienteRut } });
    if (!paciente) {
      return res.status(404).json({ 
        error: 'Paciente no encontrado',
        message: `No existe un paciente con RUT ${pacienteRut}`
      });
    }

    // Validar que el usuario existe
    const usuario = await Usuario.findByPk(req.user.id);
    if (!usuario) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        message: 'El usuario autenticado no existe'
      });
    }

    // Calcular puntaje total
    const puntajeTotal = patronRespiratorio + asistenciaVentilatoria + sasGlasgow + tosSecreciones + asistencia;

    // Calcular complejidad y carga asistencial
    const { complejidad, cargaAsistencial } = CategorizacionKinesiologia.calcularComplejidad(puntajeTotal);

    // Verificar si ya existe una categorización para este paciente en la fecha especificada
    const categorizacionExistente = await CategorizacionKinesiologia.findOne({
      where: {
        pacienteRut: pacienteRut,
        fechaCategorizacion: fechaCategorizacion
      }
    });

    if (categorizacionExistente) {
      return res.status(409).json({
        error: 'Categorización ya existe',
        message: `Ya existe una categorización para el paciente ${paciente.nombreCompleto} en la fecha ${fechaCategorizacion}`,
        categorizacionId: categorizacionExistente.id
      });
    }

    // Crear nueva categorización
    const nuevaCategorizacion = await CategorizacionKinesiologia.create({
      pacienteRut,
      usuarioId: req.user.id,
      fechaCategorizacion,
      patronRespiratorio,
      asistenciaVentilatoria,
      sasGlasgow,
      tosSecreciones,
      asistencia,
      puntajeTotal,
      complejidad,
      cargaAsistencial,
      observaciones
    });

    // Incluir información del paciente y usuario en la respuesta
    const categorizacionCompleta = await CategorizacionKinesiologia.findByPk(nuevaCategorizacion.id, {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          attributes: ['nombreCompleto', 'rut', 'numeroFicha']
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombres', 'apellidos', 'usuario']
        }
      ]
    });

    res.status(201).json({
      message: 'Categorización creada exitosamente',
      data: categorizacionCompleta
    });

  } catch (error) {
    console.error('Error al crear categorización:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Error de validación',
        message: 'Los datos proporcionados no son válidos',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }))
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al crear la categorización'
    });
  }
});

// Obtener categorizaciones por RUT del paciente
router.get('/paciente/:rut', authenticateToken, async (req, res) => {
  try {
    const { rut } = req.params;
    const { page = 1, limit = 10, fechaDesde, fechaHasta } = req.query;

    // Validar que el paciente existe
    const paciente = await Paciente.findOne({ where: { rut } });
    if (!paciente) {
      return res.status(404).json({ 
        error: 'Paciente no encontrado',
        message: `No existe un paciente con RUT ${rut}`
      });
    }

    // Construir filtros de fecha
    const whereClause = { pacienteRut: rut };
    if (fechaDesde || fechaHasta) {
      whereClause.fechaCategorizacion = {};
      if (fechaDesde) whereClause.fechaCategorizacion[Op.gte] = fechaDesde;
      if (fechaHasta) whereClause.fechaCategorizacion[Op.lte] = fechaHasta;
    }

    const offset = (page - 1) * limit;

    const { count, rows: categorizaciones } = await CategorizacionKinesiologia.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombres', 'apellidos', 'usuario']
        }
      ],
      order: [['fechaCategorizacion', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      message: 'Categorizaciones obtenidas exitosamente',
      data: {
        categorizaciones,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        },
        paciente: {
          nombreCompleto: paciente.nombreCompleto,
          rut: paciente.rut,
          numeroFicha: paciente.numeroFicha
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener categorizaciones:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener las categorizaciones'
    });
  }
});

// Obtener categorización específica por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const categorizacion = await CategorizacionKinesiologia.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          attributes: ['nombreCompleto', 'rut', 'numeroFicha']
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombres', 'apellidos', 'usuario']
        }
      ]
    });

    if (!categorizacion) {
      return res.status(404).json({ 
        error: 'Categorización no encontrada',
        message: `No existe una categorización con ID ${id}`
      });
    }

    res.json({
      message: 'Categorización obtenida exitosamente',
      data: categorizacion
    });

  } catch (error) {
    console.error('Error al obtener categorización:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener la categorización'
    });
  }
});

// Actualizar categorización
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fechaCategorizacion,
      patronRespiratorio,
      asistenciaVentilatoria,
      sasGlasgow,
      tosSecreciones,
      asistencia,
      observaciones
    } = req.body;

    const categorizacion = await CategorizacionKinesiologia.findByPk(id);
    
    if (!categorizacion) {
      return res.status(404).json({ 
        error: 'Categorización no encontrada',
        message: `No existe una categorización con ID ${id}`
      });
    }

    // Calcular nuevo puntaje total
    const puntajeTotal = patronRespiratorio + asistenciaVentilatoria + sasGlasgow + tosSecreciones + asistencia;

    // Calcular nueva complejidad y carga asistencial
    const { complejidad, cargaAsistencial } = CategorizacionKinesiologia.calcularComplejidad(puntajeTotal);

    // Actualizar categorización
    await categorizacion.update({
      fechaCategorizacion: fechaCategorizacion || categorizacion.fechaCategorizacion,
      patronRespiratorio: patronRespiratorio || categorizacion.patronRespiratorio,
      asistenciaVentilatoria: asistenciaVentilatoria || categorizacion.asistenciaVentilatoria,
      sasGlasgow: sasGlasgow || categorizacion.sasGlasgow,
      tosSecreciones: tosSecreciones || categorizacion.tosSecreciones,
      asistencia: asistencia || categorizacion.asistencia,
      puntajeTotal,
      complejidad,
      cargaAsistencial,
      observaciones: observaciones !== undefined ? observaciones : categorizacion.observaciones
    });

    // Obtener categorización actualizada con relaciones
    const categorizacionActualizada = await CategorizacionKinesiologia.findByPk(id, {
      include: [
        {
          model: Paciente,
          as: 'paciente',
          attributes: ['nombreCompleto', 'rut', 'numeroFicha']
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombres', 'apellidos', 'usuario']
        }
      ]
    });

    res.json({
      message: 'Categorización actualizada exitosamente',
      data: categorizacionActualizada
    });

  } catch (error) {
    console.error('Error al actualizar categorización:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Error de validación',
        message: 'Los datos proporcionados no son válidos',
        details: error.errors.map(err => ({
          field: err.path,
          message: err.message,
          value: err.value
        }))
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al actualizar la categorización'
    });
  }
});

// Eliminar categorización
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const categorizacion = await CategorizacionKinesiologia.findByPk(id);
    
    if (!categorizacion) {
      return res.status(404).json({ 
        error: 'Categorización no encontrada',
        message: `No existe una categorización con ID ${id}`
      });
    }

    await categorizacion.destroy();

    res.json({
      message: 'Categorización eliminada exitosamente',
      data: { id: parseInt(id) }
    });

  } catch (error) {
    console.error('Error al eliminar categorización:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al eliminar la categorización'
    });
  }
});

// Obtener estadísticas de categorizaciones
router.get('/estadisticas/resumen', authenticateToken, async (req, res) => {
  try {
    const { fechaDesde, fechaHasta } = req.query;

    // Construir filtros de fecha
    const whereClause = {};
    if (fechaDesde || fechaHasta) {
      whereClause.fechaCategorizacion = {};
      if (fechaDesde) whereClause.fechaCategorizacion[Op.gte] = fechaDesde;
      if (fechaHasta) whereClause.fechaCategorizacion[Op.lte] = fechaHasta;
    }

    // Obtener estadísticas por complejidad
    const estadisticas = await CategorizacionKinesiologia.findAll({
      attributes: [
        'complejidad',
        [sequelize.fn('COUNT', sequelize.col('id')), 'cantidad'],
        [sequelize.fn('AVG', sequelize.col('puntajeTotal')), 'puntajePromedio']
      ],
      where: whereClause,
      group: ['complejidad'],
      order: [['complejidad', 'ASC']]
    });

    // Total de categorizaciones
    const total = await CategorizacionKinesiologia.count({ where: whereClause });

    res.json({
      message: 'Estadísticas obtenidas exitosamente',
      data: {
        estadisticas,
        total,
        periodo: { fechaDesde, fechaHasta }
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener las estadísticas'
    });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const ProcedimientoKinesiologia = require('../models/ProcedimientoKinesiologia');
const Paciente = require('../models/Paciente');
const Usuario = require('../models/Usuario');

// Middleware de autenticación
const authenticateToken = require('../middleware/auth');

// Crear múltiples procedimientos
router.post('/batch', authenticateToken, async (req, res) => {
  try {
    const { pacienteRut, procedimientos } = req.body;


    // Validar que el paciente existe (solo si se proporciona un RUT)
    if (pacienteRut) {
      const paciente = await Paciente.findOne({ where: { rut: pacienteRut } });
      if (!paciente) {
        return res.status(404).json({ 
          error: 'Paciente no encontrado',
          message: `No existe un paciente con RUT ${pacienteRut}`
        });
      }
    }

    // Validar que hay procedimientos para crear
    if (!procedimientos || !Array.isArray(procedimientos) || procedimientos.length === 0) {
      return res.status(400).json({
        error: 'Datos inválidos',
        message: 'Debe proporcionar al menos un procedimiento'
      });
    }

    // Crear todos los procedimientos
    const procedimientosCreados = [];
    
    for (const proc of procedimientos) {
      const nuevoProcedimiento = await ProcedimientoKinesiologia.create({
        pacienteRut,
        usuarioId: req.user.id,
        nombre: proc.nombre,
        fecha: proc.fecha,
        turno: proc.turno || null,
        tiempo: proc.tiempo,
        observaciones: proc.observaciones || null
      });
      
      procedimientosCreados.push(nuevoProcedimiento);
    }

    // Obtener los procedimientos creados con información completa
    const procedimientosCompletos = await ProcedimientoKinesiologia.findAll({
      where: {
        id: {
          [Op.in]: procedimientosCreados.map(p => p.id)
        }
      },
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
      ],
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']]
    });

    res.status(201).json({
      message: `${procedimientosCreados.length} procedimientos creados exitosamente`,
      data: procedimientosCompletos
    });

  } catch (error) {
    console.error('Error al crear procedimientos:', error);
    
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
      message: 'Ocurrió un error al crear los procedimientos'
    });
  }
});

// Obtener todos los procedimientos (para listado general)
router.get('/todos', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, fechaDesde, fechaHasta } = req.query;

    // Construir filtros de fecha
    const whereClause = {};
    if (fechaDesde || fechaHasta) {
      whereClause.fecha = {};
      if (fechaDesde) whereClause.fecha[Op.gte] = fechaDesde;
      if (fechaHasta) whereClause.fecha[Op.lte] = fechaHasta;
    }

    const offset = (page - 1) * limit;

    const { count, rows: procedimientos } = await ProcedimientoKinesiologia.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Paciente,
          as: 'paciente',
          attributes: ['nombreCompleto', 'rut', 'numeroFicha'],
          required: false // LEFT JOIN para incluir procedimientos sin paciente
        },
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombres', 'apellidos', 'usuario']
        }
      ],
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      message: 'Procedimientos obtenidos exitosamente',
      data: {
        procedimientos,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener todos los procedimientos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener los procedimientos'
    });
  }
});

// Obtener procedimientos por paciente
router.get('/paciente/:rut', authenticateToken, async (req, res) => {
  try {
    const { rut } = req.params;
    const { page = 1, limit = 50, fechaDesde, fechaHasta } = req.query;

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
      whereClause.fecha = {};
      if (fechaDesde) whereClause.fecha[Op.gte] = fechaDesde;
      if (fechaHasta) whereClause.fecha[Op.lte] = fechaHasta;
    }

    const offset = (page - 1) * limit;

    const { count, rows: procedimientos } = await ProcedimientoKinesiologia.findAndCountAll({
      where: whereClause,
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
      ],
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: offset
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      message: 'Procedimientos obtenidos exitosamente',
      data: {
        procedimientos,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
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
    console.error('Error al obtener procedimientos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener los procedimientos'
    });
  }
});

// Eliminar procedimiento
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const procedimiento = await ProcedimientoKinesiologia.findByPk(id);
    if (!procedimiento) {
      return res.status(404).json({
        error: 'Procedimiento no encontrado',
        message: `No existe un procedimiento con ID ${id}`
      });
    }

    await procedimiento.destroy();

    res.json({
      message: 'Procedimiento eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar procedimiento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al eliminar el procedimiento'
    });
  }
});

module.exports = router;
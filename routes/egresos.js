const express = require('express');
const router = express.Router();
const Egreso = require('../models/Egreso');
const Paciente = require('../models/Paciente');

// Middleware para verificar autenticación
const verificarAuth = (req, res, next) => {
  next();
};

// GET /api/egresos - Obtener todos los egresos
router.get('/', verificarAuth, async (req, res) => {
  try {
    const egresos = await Egreso.findAll({
      order: [['fechaEgresoUTI', 'DESC']]
    });
    
    res.json({
      success: true,
      data: egresos
    });
  } catch (error) {
    console.error('Error al obtener egresos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/egresos/:id - Obtener un egreso por ID
router.get('/:id', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const egreso = await Egreso.findByPk(id);
    
    if (!egreso) {
      return res.status(404).json({
        success: false,
        message: 'Egreso no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: egreso
    });
  } catch (error) {
    console.error('Error al obtener egreso:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/egresos - Crear un nuevo egreso
router.post('/', verificarAuth, async (req, res) => {
  try {
    const {
      pacienteId,
      fechaEgresoUTI,
      motivoEgreso
    } = req.body;


    // Validaciones básicas
    if (!pacienteId || !fechaEgresoUTI || !motivoEgreso) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios',
        required: ['pacienteId', 'fechaEgresoUTI', 'motivoEgreso']
      });
    }

    // Buscar el paciente
    const paciente = await Paciente.findByPk(pacienteId);
    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Verificar que el paciente esté activo (no tenga fecha de egreso)
    if (paciente.fechaEgresoUTI !== null) {
      return res.status(400).json({
        success: false,
        message: 'El paciente ya ha sido egresado'
      });
    }

    // Calcular días de estadía
    const fechaIngreso = new Date(paciente.fechaIngresoUTI);
    const fechaEgreso = new Date(fechaEgresoUTI);
    const diffTime = Math.abs(fechaEgreso - fechaIngreso);
    const diasEstadia = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Crear el registro de egreso
    const nuevoEgreso = await Egreso.create({
      pacienteId: paciente.id,
      nombreCompleto: paciente.nombreCompleto,
      rut: paciente.rut,
      numeroFicha: paciente.numeroFicha,
      edad: paciente.edad,
      camaAsignada: paciente.camaAsignada,
      fechaIngresoUTI: paciente.fechaIngresoUTI,
      fechaEgresoUTI: fechaEgreso,
      motivoEgreso: motivoEgreso,
      diasEstadia: diasEstadia
    });

    // Actualizar el paciente con la fecha de egreso
    await paciente.update({
      fechaEgresoUTI: fechaEgreso,
      camaAsignada: null // Liberar la cama
    });

    res.status(201).json({
      success: true,
      message: 'Egreso registrado exitosamente',
      data: nuevoEgreso
    });
  } catch (error) {
    console.error('Error al crear egreso:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: error.errors.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;


const express = require('express');
const router = express.Router();
const Paciente = require('../models/Paciente');
const Apache2 = require('../models/Apache2');
const NAS = require('../models/NAS');
const CategorizacionKinesiologia = require('../models/CategorizacionKinesiologia');
const Egreso = require('../models/Egreso');
const { Op } = require('sequelize');

// Middleware para verificar autenticación (puedes ajustar según tu sistema de auth)
const verificarAuth = (req, res, next) => {
  // Por ahora permitir todas las solicitudes, luego puedes agregar verificación de JWT
  next();
};

// GET /api/pacientes - Obtener todos los pacientes activos (sin fecha de egreso)
router.get('/', verificarAuth, async (req, res) => {
  try {
    const pacientes = await Paciente.findAll({
      where: {
        fechaEgresoUTI: null
      },
      order: [['fechaIngresoUTI', 'DESC']],
      limit: 100 // Limitar para evitar cargar demasiados
    });

    // Obtener todos los datos relacionados en consultas paralelas más eficientes
    const pacientesIds = pacientes.map(p => p.id);
    const pacientesRuts = pacientes.map(p => p.rut);

    // Obtener todos los Apaches recientes en una consulta
    const apaches = await Apache2.findAll({
      where: { pacienteId: { [Op.in]: pacientesIds } },
      attributes: ['pacienteId', 'puntajeTotal', 'fechaEvaluacion'],
      order: [['fechaEvaluacion', 'DESC']],
      raw: true
    });

    // Obtener todos los NAS recientes en una consulta
    const nas = await NAS.findAll({
      where: { pacienteRut: { [Op.in]: pacientesRuts } },
      attributes: ['pacienteRut', 'puntuacionTotal', 'fechaRegistro'],
      order: [['fechaRegistro', 'DESC']],
      raw: true
    });

    // Obtener todas las categorizaciones recientes en una consulta
    const categorizaciones = await CategorizacionKinesiologia.findAll({
      where: { pacienteRut: { [Op.in]: pacientesRuts } },
      attributes: ['pacienteRut', 'complejidad', 'puntajeTotal', 'fechaCategorizacion'],
      order: [['fechaCategorizacion', 'DESC']],
      raw: true
    });

    // Crear mapas para acceso rápido
    const apachesMap = new Map();
    apaches.forEach(a => {
      if (!apachesMap.has(a.pacienteId) || new Date(a.fechaEvaluacion) > new Date(apachesMap.get(a.pacienteId).fechaEvaluacion)) {
        apachesMap.set(a.pacienteId, a);
      }
    });

    const nasMap = new Map();
    nas.forEach(n => {
      if (!nasMap.has(n.pacienteRut) || new Date(n.fechaRegistro) > new Date(nasMap.get(n.pacienteRut).fechaRegistro)) {
        nasMap.set(n.pacienteRut, n);
      }
    });

    const categorizacionesMap = new Map();
    categorizaciones.forEach(c => {
      if (!categorizacionesMap.has(c.pacienteRut) || new Date(c.fechaCategorizacion) > new Date(categorizacionesMap.get(c.pacienteRut).fechaCategorizacion)) {
        categorizacionesMap.set(c.pacienteRut, c);
      }
    });

    // Combinar datos
    const pacientesConDatos = pacientes.map(paciente => {
      const ultimoApache = apachesMap.get(paciente.id);
      const ultimoNAS = nasMap.get(paciente.rut);
      const ultimaCategorizacion = categorizacionesMap.get(paciente.rut);

      return {
        ...paciente.toJSON(),
        ultimoApache: ultimoApache ? {
          puntaje: ultimoApache.puntajeTotal,
          fecha: ultimoApache.fechaEvaluacion
        } : null,
        ultimoNAS: ultimoNAS ? {
          puntaje: ultimoNAS.puntuacionTotal,
          fecha: ultimoNAS.fechaRegistro
        } : null,
        ultimaCategorizacion: ultimaCategorizacion ? {
          complejidad: ultimaCategorizacion.complejidad,
          puntaje: ultimaCategorizacion.puntajeTotal,
          fecha: ultimaCategorizacion.fechaCategorizacion
        } : null
      };
    });
    
    res.json({
      success: true,
      data: pacientesConDatos
    });
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/pacientes/egresados-recientes - Obtener pacientes egresados en las últimas 48 horas (2 días)
router.get('/egresados-recientes', verificarAuth, async (req, res) => {
  try {
    // Calcular fecha de hace 48 horas (2 días)
    const hace48Horas = new Date();
    hace48Horas.setHours(hace48Horas.getHours() - 48);

    const egresosRecientes = await Egreso.findAll({
      where: {
        fechaEgresoUTI: {
          [Op.gte]: hace48Horas
        }
      },
      order: [['fechaEgresoUTI', 'DESC']]
    });

    // Formatear los datos para mantener la estructura esperada por el frontend
    const pacientesEgresados = egresosRecientes.map(egreso => ({
      id: egreso.pacienteId,
      rut: egreso.rut,
      nombreCompleto: egreso.nombreCompleto,
      edad: egreso.edad,
      numeroFicha: egreso.numeroFicha,
      fechaIngresoUTI: egreso.fechaIngresoUTI,
      fechaEgresoUTI: egreso.fechaEgresoUTI,
      camaAsignada: egreso.camaAsignada,
      ultimoApache: null,
      ultimoNAS: null,
      ultimaCategorizacion: null
    }));

    res.json({
      success: true,
      data: pacientesEgresados
    });
  } catch (error) {
    console.error('Error al obtener pacientes egresados recientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/pacientes/:id - Obtener un paciente por ID
router.get('/:id', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const paciente = await Paciente.findByPk(id);
    
    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: paciente
    });
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/pacientes - Crear un nuevo paciente
router.post('/', verificarAuth, async (req, res) => {
  try {
    const {
      nombreCompleto,
      rut,
      numeroFicha,
      edad,
      fechaIngresoUTI,
      camaAsignada
    } = req.body;


    // Validaciones básicas
    if (!nombreCompleto || !rut || !numeroFicha || !edad || !fechaIngresoUTI) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios',
        required: ['nombreCompleto', 'rut', 'numeroFicha', 'edad', 'fechaIngresoUTI']
      });
    }

    // Verificar si el RUT ya existe
    const rutExiste = await Paciente.findOne({ where: { rut } });
    if (rutExiste) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un paciente con este RUT'
      });
    }

    // Verificar si el número de ficha ya existe
    const fichaExiste = await Paciente.findOne({ where: { numeroFicha } });
    if (fichaExiste) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un paciente con este número de ficha'
      });
    }

    // Verificar si la cama está disponible (si se especifica)
    if (camaAsignada) {
      const camaOcupada = await Paciente.findOne({ 
        where: { 
          camaAsignada: parseInt(camaAsignada),
          fechaEgresoUTI: null // Solo pacientes activos
        } 
      });
      if (camaOcupada) {
        return res.status(409).json({
          success: false,
          message: `La cama ${camaAsignada} ya está ocupada`
        });
      }
    }

    // Crear el nuevo paciente
    const nuevoPaciente = await Paciente.create({
      nombreCompleto: nombreCompleto.toUpperCase().trim(),
      rut: rut.trim(),
      numeroFicha: numeroFicha.trim(),
      edad: parseInt(edad),
      fechaIngresoUTI: new Date(fechaIngresoUTI),
      camaAsignada: camaAsignada ? parseInt(camaAsignada) : null
    });

    res.status(201).json({
      success: true,
      message: 'Paciente creado exitosamente',
      data: nuevoPaciente
    });
  } catch (error) {
    console.error('Error al crear paciente:', error);
    
    // Manejar errores de validación de Sequelize
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: errors
      });
    }
    
    // Manejar errores de unicidad
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        success: false,
        message: 'Conflicto de datos únicos',
        errors: error.errors.map(err => ({
          field: err.path,
          message: `${err.path} ya existe en el sistema`
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

// PUT /api/pacientes/:id - Actualizar un paciente
router.put('/:id', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombreCompleto,
      rut,
      numeroFicha,
      edad,
      fechaIngresoUTI,
      camaAsignada
    } = req.body;

    const paciente = await Paciente.findByPk(id);
    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    // Verificar si la cama está disponible (si se especifica y es diferente a la actual)
    if (camaAsignada && parseInt(camaAsignada) !== paciente.camaAsignada) {
      const camaOcupada = await Paciente.findOne({ 
        where: { 
          camaAsignada: parseInt(camaAsignada),
          fechaEgresoUTI: null // Solo pacientes activos
        } 
      });
      if (camaOcupada && camaOcupada.id !== paciente.id) {
        return res.status(409).json({
          success: false,
          message: `La cama ${camaAsignada} ya está ocupada`
        });
      }
    }

    // Actualizar solo los campos proporcionados
    const camposActualizar = {};
    if (nombreCompleto) camposActualizar.nombreCompleto = nombreCompleto.toUpperCase().trim();
    if (rut) camposActualizar.rut = rut.trim();
    if (numeroFicha) camposActualizar.numeroFicha = numeroFicha.trim();
    if (edad) camposActualizar.edad = parseInt(edad);
    if (fechaIngresoUTI) camposActualizar.fechaIngresoUTI = new Date(fechaIngresoUTI);
    if (camaAsignada !== undefined) camposActualizar.camaAsignada = camaAsignada ? parseInt(camaAsignada) : null;

    await paciente.update(camposActualizar);

    res.json({
      success: true,
      message: 'Paciente actualizado exitosamente',
      data: paciente
    });
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    
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

// DELETE /api/pacientes/:id - Eliminar un paciente
router.delete('/:id', verificarAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const paciente = await Paciente.findByPk(id);
    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    await paciente.destroy();

    res.json({
      success: true,
      message: 'Paciente eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
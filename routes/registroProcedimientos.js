const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const RegistroProcedimientos = require('../models/RegistroProcedimientos');
const ProcedimientoRegistro = require('../models/ProcedimientoRegistro');
const Usuario = require('../models/Usuario');
const Paciente = require('../models/Paciente');

// Middleware para validar token JWT
const authenticateToken = require('../middleware/auth');

// Crear nuevo registro de procedimientos
router.post('/', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      turno,
      fecha,
      procedimientos
    } = req.body;

    // Validaciones
    if (!turno || !['Día', 'Noche', '24 h'].includes(turno)) {
      return res.status(400).json({
        error: 'Turno inválido',
        message: 'El turno debe ser "Día", "Noche" o "24 h"'
      });
    }

    if (!fecha) {
      return res.status(400).json({
        error: 'Fecha requerida',
        message: 'Debe proporcionar una fecha'
      });
    }

    if (!procedimientos || procedimientos.length === 0) {
      return res.status(400).json({
        error: 'Procedimientos requeridos',
        message: 'Debe agregar al menos un procedimiento'
      });
    }

    // Las validaciones de estamento se manejan en cada API específica (auxiliares, kinesiología, etc.)

    // Calcular tiempo total (sumando todos los tiempos de los procedimientos)
    let tiempoTotal = 0;
    for (const proc of procedimientos) {
      const [horas, minutos] = proc.tiempo.split(':').map(Number);
      tiempoTotal += horas * 60 + minutos;
    }

    // Crear registro principal
    const nuevoRegistro = await RegistroProcedimientos.create({
      usuarioId: req.user.id,
      turno,
      fecha,
      tiempoTotal
    }, { transaction });

    // Crear procedimientos individuales
    const procedimientosCrear = procedimientos.map(proc => ({
      registroId: nuevoRegistro.id,
      nombre: proc.nombre,
      tiempo: proc.tiempo,
      pacienteRut: proc.pacienteRut || null
    }));

    await ProcedimientoRegistro.bulkCreate(procedimientosCrear, { transaction });

    await transaction.commit();

    // Obtener el registro completo con relaciones
    const registroCompleto = await RegistroProcedimientos.findByPk(nuevoRegistro.id, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombres', 'apellidos', 'usuario', 'estamento']
        },
        {
          model: ProcedimientoRegistro,
          as: 'procedimientos',
          include: [
            {
              model: Paciente,
              as: 'paciente',
              attributes: ['nombreCompleto', 'rut', 'numeroFicha']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      message: 'Registro creado exitosamente',
      data: registroCompleto
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear registro:', error);
    
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
      message: 'Ocurrió un error al crear el registro'
    });
  }
});

// IMPORTANTE: Las rutas específicas deben ir ANTES de las rutas con parámetros dinámicos

// Obtener métricas del usuario actual
router.get('/metricas/usuario', authenticateToken, async (req, res) => {
  try {
    const CategorizacionKinesiologia = require('../models/CategorizacionKinesiologia');
    const usuarioId = req.user.id;
    
    
    // 1. Total de Procedimientos del usuario
    // Obtener registros del usuario
    const registrosUsuario = await RegistroProcedimientos.findAll({
      where: { usuarioId },
      attributes: ['id']
    });
    
    const registrosIds = registrosUsuario.map(r => r.id);
    
    let totalProcedimientos = 0;
    if (registrosIds.length > 0) {
      totalProcedimientos = await ProcedimientoRegistro.count({
        where: { registroId: { [Op.in]: registrosIds } }
      });
    }

    // 2. Tiempo Total de Procedimientos del usuario
    const tiempoTotalResult = await RegistroProcedimientos.sum('tiempoTotal', {
      where: { usuarioId }
    });
    const tiempoTotalMinutos = tiempoTotalResult || 0;
    const tiempoTotalHoras = Math.floor(tiempoTotalMinutos / 60);
    const tiempoTotalMins = tiempoTotalMinutos % 60;

    // 3. Total de Categorizaciones del usuario
    const totalCategorizaciones = await CategorizacionKinesiologia.count({
      where: { usuarioId }
    });

    // 4. Número de Pacientes Atendidos (únicos)
    let numeroPacientesAtendidos = 0;
    if (registrosIds.length > 0) {
      const pacientesRaw = await sequelize.query(
        `SELECT DISTINCT pacienteRut FROM procedimientos_registro WHERE registroId IN (?) AND pacienteRut IS NOT NULL`,
        {
          replacements: [registrosIds],
          type: sequelize.QueryTypes.SELECT
        }
      );
      numeroPacientesAtendidos = pacientesRaw.length;
    }

    res.json({
      message: 'Métricas del usuario obtenidas exitosamente',
      data: {
        totalProcedimientos,
        tiempoTotal: {
          minutos: tiempoTotalMinutos,
          horas: tiempoTotalHoras,
          minutosRestantes: tiempoTotalMins,
          texto: `${tiempoTotalHoras}h ${tiempoTotalMins}m`
        },
        totalCategorizaciones,
        pacientesAtendidos: numeroPacientesAtendidos
      }
    });

  } catch (error) {
    console.error('Error al obtener métricas del usuario:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener las métricas del usuario',
      details: error.message
    });
  }
});

// Obtener métricas para el dashboard
router.get('/metricas/dashboard', authenticateToken, async (req, res) => {
  try {
    const CategorizacionKinesiologia = require('../models/CategorizacionKinesiologia');
    
    // 1. Tiempo Total de Procedimientos (Mes actual)
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const tiempoTotalResult = await RegistroProcedimientos.sum('tiempoTotal', {
      where: {
        createdAt: {
          [Op.gte]: inicioMes
        }
      }
    });
    const tiempoTotalMinutos = tiempoTotalResult || 0;
    const tiempoTotalHoras = Math.floor(tiempoTotalMinutos / 60);
    const tiempoTotalMins = tiempoTotalMinutos % 60;

    // 2. Carga de Pacientes Críticos (%)
    const totalPacientesActivos = await Paciente.count({
      where: {
        fechaEgresoUTI: null // Solo pacientes activos
      }
    });

    // Obtener última categorización de cada paciente activo
    const pacientesActivos = await Paciente.findAll({
      where: { fechaEgresoUTI: null },
      attributes: ['rut']
    });

    let pacientesAlta = 0;
    for (const paciente of pacientesActivos) {
      const ultimaCategorizacion = await CategorizacionKinesiologia.findOne({
        where: { pacienteRut: paciente.rut },
        order: [['fechaCategorizacion', 'DESC'], ['createdAt', 'DESC']],
        limit: 1
      });
      
      if (ultimaCategorizacion && ultimaCategorizacion.complejidad === 'Alta') {
        pacientesAlta++;
      }
    }

    const porcentajeCriticos = totalPacientesActivos > 0 ? Math.round((pacientesAlta / totalPacientesActivos) * 100) : 0;

    // 3. Promedio de Procedimientos por Turno
    const registrosConProcedimientos = await RegistroProcedimientos.findAll({
      include: [{
        model: ProcedimientoRegistro,
        as: 'procedimientos',
        attributes: ['id']
      }],
      where: {
        createdAt: {
          [Op.gte]: inicioMes
        }
      }
    });

    let totalProcedimientos = 0;
    registrosConProcedimientos.forEach(registro => {
      totalProcedimientos += registro.procedimientos.length;
    });

    const totalTurnos = registrosConProcedimientos.length;
    const promedioProcedimientos = totalTurnos > 0 ? Math.round(totalProcedimientos / totalTurnos) : 0;

    // 4. Ratio Kinesiólogo-Paciente Activo (según normativa chilena 1:8)
    // Contar kinesiólogos activos (que han registrado en los últimos 30 días)
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);
    
    const kinesiologosActivos = await Usuario.count({
      distinct: true,
      col: 'id',
      where: {
        estamento: 'Kinesiología'
      },
      include: [{
        model: RegistroProcedimientos,
        as: 'registrosProcedimientos',
        where: {
          createdAt: {
            [Op.gte]: hace30Dias
          }
        },
        required: true
      }]
    });

    // Calcular ratio con TODOS los pacientes activos, no solo críticos
    const ratioKinesiologo = kinesiologosActivos > 0 ? 
      (totalPacientesActivos / kinesiologosActivos).toFixed(1) : '0.0';

    // Niveles según normativa chilena: óptimo ≤8, aceptable ≤10, crítico >10
    const ratioNumero = parseFloat(ratioKinesiologo);
    let nivelRatio;
    if (ratioNumero <= 8) {
      nivelRatio = 'optimo';
    } else if (ratioNumero <= 10) {
      nivelRatio = 'aceptable';
    } else {
      nivelRatio = 'critico';
    }

    res.json({
      message: 'Métricas obtenidas exitosamente',
      data: {
        tiempoTotal: {
          minutos: tiempoTotalMinutos,
          horas: tiempoTotalHoras,
          minutosRestantes: tiempoTotalMins,
          texto: `${tiempoTotalHoras}h ${tiempoTotalMins}m`
        },
        pacientesCriticos: {
          total: pacientesAlta,
          porcentaje: porcentajeCriticos,
          de: totalPacientesActivos
        },
        promedioProcedimientos: {
          promedio: promedioProcedimientos,
          totalProcedimientos,
          totalTurnos
        },
        ratioKinesiologo: {
          ratio: ratioKinesiologo,
          totalPacientes: totalPacientesActivos,
          kinesiologosActivos,
          nivel: nivelRatio
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener métricas:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener las métricas'
    });
  }
});

// Obtener todos los registros (con paginación y filtros)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, fechaDesde, fechaHasta, turno, incluirProcedimientos } = req.query;


    // Construir filtros
    const whereClause = {};
    if (fechaDesde || fechaHasta) {
      whereClause.fecha = {};
      if (fechaDesde) whereClause.fecha[Op.gte] = fechaDesde;
      if (fechaHasta) whereClause.fecha[Op.lte] = fechaHasta;
    }
    if (turno) {
      whereClause.turno = turno;
    }

    const offset = (page - 1) * limit;

    // Configurar includes (relaciones)
    const includes = [
      {
        model: Usuario,
        as: 'usuario',
        attributes: ['nombres', 'apellidos', 'usuario', 'estamento']
      }
    ];

    // Si se solicita, incluir procedimientos
    if (incluirProcedimientos === 'true' || incluirProcedimientos === true) {
      includes.push({
        model: ProcedimientoRegistro,
        as: 'procedimientos',
        include: [
          {
            model: Paciente,
            as: 'paciente',
            attributes: ['nombreCompleto', 'rut', 'numeroFicha', 'camaAsignada']
          }
        ]
      });
    }

    const { count, rows: registros } = await RegistroProcedimientos.findAndCountAll({
      where: whereClause,
      include: includes,
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      message: 'Registros obtenidos exitosamente',
      data: {
        registros,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener registros:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener los registros'
    });
  }
});

// Obtener registro específico por ID con todos los procedimientos
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const registro = await RegistroProcedimientos.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombres', 'apellidos', 'usuario', 'estamento']
        },
        {
          model: ProcedimientoRegistro,
          as: 'procedimientos',
          include: [
            {
              model: Paciente,
              as: 'paciente',
              attributes: ['nombreCompleto', 'rut', 'numeroFicha', 'camaAsignada']
            }
          ]
        }
      ]
    });

    if (!registro) {
      return res.status(404).json({
        error: 'Registro no encontrado',
        message: `No existe un registro con ID ${id}`
      });
    }

    res.json({
      message: 'Registro obtenido exitosamente',
      data: registro
    });

  } catch (error) {
    console.error('Error al obtener registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener el registro'
    });
  }
});

// Eliminar registro
router.delete('/:id', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;

    const registro = await RegistroProcedimientos.findByPk(id);
    
    if (!registro) {
      return res.status(404).json({
        error: 'Registro no encontrado',
        message: `No existe un registro con ID ${id}`
      });
    }

    // Eliminar procedimientos asociados primero
    await ProcedimientoRegistro.destroy({
      where: { registroId: id },
      transaction
    });

    // Eliminar registro principal
    await registro.destroy({ transaction });

    await transaction.commit();

    res.json({
      message: 'Registro eliminado exitosamente',
      data: { id: parseInt(id) }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al eliminar registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al eliminar el registro'
    });
  }
});

// Agregar procedimientos a un registro existente
router.post('/:id/procedimientos', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { procedimientos } = req.body;

    if (!procedimientos || procedimientos.length === 0) {
      return res.status(400).json({
        error: 'Procedimientos requeridos',
        message: 'Debe agregar al menos un procedimiento'
      });
    }

    // Verificar que el registro existe
    const registro = await RegistroProcedimientos.findByPk(id);
    if (!registro) {
      return res.status(404).json({
        error: 'Registro no encontrado',
        message: `No existe un registro con ID ${id}`
      });
    }

    // Verificar permisos (propietario o administrador)
    if (registro.usuarioId !== req.user.id) {
      const usuario = await Usuario.findByPk(req.user.id);
      if (usuario.estamento !== 'Administrador') {
        return res.status(403).json({
          error: 'Sin permisos',
          message: 'Solo puede editar sus propios registros'
        });
      }
    }

    // Validar procedimientos
    let tiempoTotalNuevos = 0;
    for (const proc of procedimientos) {
      if (!proc.nombre || !proc.tiempo) {
        return res.status(400).json({
          error: 'Datos incompletos',
          message: 'Cada procedimiento debe tener nombre y tiempo'
        });
      }

      // Validar que el paciente existe si se especifica
      if (proc.pacienteRut) {
        const paciente = await Paciente.findOne({ where: { rut: proc.pacienteRut } });
        if (!paciente) {
          return res.status(404).json({
            error: 'Paciente no encontrado',
            message: `No existe un paciente con RUT ${proc.pacienteRut}`
          });
        }
      }

      // Calcular tiempo
      const [horas, minutos] = proc.tiempo.split(':').map(Number);
      tiempoTotalNuevos += (horas * 60) + minutos;
    }

    // Crear procedimientos individuales
    const procedimientosCrear = procedimientos.map(proc => ({
      registroId: parseInt(id),
      nombre: proc.nombre,
      tiempo: proc.tiempo,
      pacienteRut: proc.pacienteRut || null
    }));

    const nuevosProcedimientos = await ProcedimientoRegistro.bulkCreate(procedimientosCrear, { 
      transaction,
      returning: true 
    });

    // Actualizar tiempo total del registro
    await registro.update({
      tiempoTotal: registro.tiempoTotal + tiempoTotalNuevos
    }, { transaction });

    await transaction.commit();

    // Obtener los procedimientos creados con sus relaciones
    const procedimientosCompletos = await ProcedimientoRegistro.findAll({
      where: { id: nuevosProcedimientos.map(p => p.id) },
      include: [
        {
          model: Paciente,
          as: 'paciente',
          attributes: ['nombreCompleto', 'rut', 'numeroFicha', 'camaAsignada']
        }
      ]
    });

    res.status(201).json({
      message: 'Procedimientos agregados exitosamente',
      data: procedimientosCompletos
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al agregar procedimientos:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al agregar los procedimientos'
    });
  }
});

// Eliminar procedimiento específico de un registro
router.delete('/:registroId/procedimientos/:procedimientoId', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { registroId, procedimientoId } = req.params;

    // Verificar que el procedimiento existe y pertenece al registro
    const procedimiento = await ProcedimientoRegistro.findOne({
      where: { 
        id: procedimientoId,
        registroId: registroId
      }
    });

    if (!procedimiento) {
      return res.status(404).json({
        error: 'Procedimiento no encontrado',
        message: `No existe el procedimiento especificado en este registro`
      });
    }

    // Verificar que el registro existe
    const registro = await RegistroProcedimientos.findByPk(registroId);
    if (!registro) {
      return res.status(404).json({
        error: 'Registro no encontrado',
        message: `No existe un registro con ID ${registroId}`
      });
    }

    // Verificar permisos (propietario o administrador)
    if (registro.usuarioId !== req.user.id) {
      const usuario = await Usuario.findByPk(req.user.id);
      if (usuario.estamento !== 'Administrador') {
        return res.status(403).json({
          error: 'Sin permisos',
          message: 'Solo puede editar sus propios registros'
        });
      }
    }

    // Calcular tiempo del procedimiento a eliminar
    const [horas, minutos] = procedimiento.tiempo.split(':').map(Number);
    const tiempoProcedimiento = (horas * 60) + minutos;

    // Eliminar procedimiento
    await procedimiento.destroy({ transaction });

    // Actualizar tiempo total del registro
    await registro.update({
      tiempoTotal: Math.max(0, registro.tiempoTotal - tiempoProcedimiento)
    }, { transaction });

    await transaction.commit();

    res.json({
      message: 'Procedimiento eliminado exitosamente',
      data: { id: parseInt(procedimientoId) }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al eliminar procedimiento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al eliminar el procedimiento'
    });
  }
});

// Actualizar procedimiento individual
router.put('/:registroId/procedimientos/:procedimientoId', authenticateToken, async (req, res) => {
  try {
    const { registroId, procedimientoId } = req.params;
    const { nombre, tiempo, pacienteRut } = req.body;

    // Validaciones
    if (!nombre || !tiempo) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El nombre y tiempo son obligatorios'
      });
    }

    // Verificar que el registro existe
    const registro = await RegistroProcedimientos.findByPk(registroId);
    if (!registro) {
      return res.status(404).json({
        error: 'Registro no encontrado',
        message: `No existe un registro con ID ${registroId}`
      });
    }

    // Verificar que el procedimiento existe
    const procedimiento = await ProcedimientoRegistro.findByPk(procedimientoId);
    if (!procedimiento) {
      return res.status(404).json({
        error: 'Procedimiento no encontrado',
        message: `No existe un procedimiento con ID ${procedimientoId}`
      });
    }

    // Verificar que el procedimiento pertenece al registro
    if (procedimiento.registroId !== parseInt(registroId)) {
      return res.status(400).json({
        error: 'Procedimiento no válido',
        message: 'El procedimiento no pertenece a este registro'
      });
    }

    // Verificar permisos (solo el propietario o administrador puede editar)
    if (registro.usuarioId !== req.user.id) {
      const usuario = await Usuario.findByPk(req.user.id);
      if (usuario.estamento !== 'Administrador') {
        return res.status(403).json({
          error: 'Sin permisos',
          message: 'Solo puede editar sus propios procedimientos'
        });
      }
    }

    // Si hay paciente, validar que exista
    if (pacienteRut) {
      const paciente = await Paciente.findOne({ where: { rut: pacienteRut } });
      if (!paciente) {
        return res.status(404).json({
          error: 'Paciente no encontrado',
          message: `No existe un paciente con RUT ${pacienteRut}`
        });
      }
    }

    // Actualizar el procedimiento
    await procedimiento.update({
      nombre,
      tiempo,
      pacienteRut: pacienteRut || null
    });

    // Recalcular tiempo total del registro
    const procedimientosDelRegistro = await ProcedimientoRegistro.findAll({
      where: { registroId: parseInt(registroId) }
    });

    let tiempoTotal = 0;
    procedimientosDelRegistro.forEach(proc => {
      const [horas, minutos] = proc.tiempo.split(':').map(Number);
      tiempoTotal += horas * 60 + minutos;
    });

    // Actualizar el tiempo total del registro
    await registro.update({ tiempoTotal });

    res.json({
      message: 'Procedimiento actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar procedimiento:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Error de validación',
        message: error.errors.map(e => e.message).join(', ')
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al actualizar el procedimiento'
    });
  }
});

module.exports = router;


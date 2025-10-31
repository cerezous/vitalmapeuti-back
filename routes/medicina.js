const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const ProcedimientoMedicina = require('../models/ProcedimientoMedicina');
const Usuario = require('../models/Usuario');
const Paciente = require('../models/Paciente');

// Middleware para validar token JWT
const authenticateToken = require('../middleware/auth');

// Crear procedimientos de medicina
router.post('/', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { turno, fecha, procedimientos } = req.body;

    // Validaciones básicas
    if (!turno || !['24 h', '22 h', '12 h'].includes(turno)) {
      return res.status(400).json({
        error: 'Turno inválido',
        message: 'El turno debe ser "24 h", "22 h" o "12 h"'
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

    // Validar que el usuario tenga permisos de medicina
    const usuario = await Usuario.findByPk(req.user.id);
    if (!usuario || (usuario.estamento !== 'Medicina' && usuario.estamento !== 'Administrador')) {
      return res.status(403).json({
        error: 'Sin permisos',
        message: 'No tiene permisos para registrar procedimientos de medicina'
      });
    }

    const procedimientosCreados = [];
    let tiempoTotal = 0;

    // Crear cada procedimiento
    for (const procedimiento of procedimientos) {
      // Validar que el procedimiento sea válido
      const procedimientosValidos = ProcedimientoMedicina.getProcedimientosValidos();
      if (!procedimientosValidos.includes(procedimiento.nombre)) {
        return res.status(400).json({
          error: 'Procedimiento inválido',
          message: `El procedimiento "${procedimiento.nombre}" no es válido para medicina`
        });
      }

      // Validar que si el procedimiento requiere paciente, esté presente
      if (ProcedimientoMedicina.requierePaciente(procedimiento.nombre) && !procedimiento.pacienteRut) {
        return res.status(400).json({
          error: 'Paciente requerido',
          message: `El procedimiento "${procedimiento.nombre}" requiere un paciente asignado`
        });
      }

      // Si hay paciente, validar que exista
      if (procedimiento.pacienteRut) {
        const paciente = await Paciente.findOne({ where: { rut: procedimiento.pacienteRut } });
        if (!paciente) {
          return res.status(404).json({
            error: 'Paciente no encontrado',
            message: `No existe un paciente con RUT ${procedimiento.pacienteRut}`
          });
        }
      }

      // Convertir tiempo a minutos para sumar
      const [horas, minutos] = procedimiento.tiempo.split(':').map(Number);
      tiempoTotal += horas * 60 + minutos;

      // Crear el procedimiento
      const nuevoProcedimiento = await ProcedimientoMedicina.create({
        usuarioId: req.user.id,
        turno,
        fecha,
        nombre: procedimiento.nombre,
        tiempo: procedimiento.tiempo,
        pacienteRut: procedimiento.pacienteRut || null,
        observaciones: procedimiento.observaciones || null
      }, { transaction });

      procedimientosCreados.push(nuevoProcedimiento);
    }

    await transaction.commit();

    // Obtener procedimientos con relaciones para la respuesta
    const procedimientosConRelaciones = await ProcedimientoMedicina.findAll({
      where: {
        id: procedimientosCreados.map(p => p.id)
      },
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombres', 'apellidos', 'usuario', 'estamento']
        },
        {
          model: Paciente,
          as: 'paciente',
          attributes: ['nombreCompleto', 'rut', 'numeroFicha', 'camaAsignada'],
          required: false
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    res.status(201).json({
      message: 'Procedimientos de medicina registrados exitosamente',
      data: {
        procedimientos: procedimientosConRelaciones,
        resumen: {
          total: procedimientosCreados.length,
          turno,
          fecha,
          tiempoTotal,
          usuario: `${usuario.nombres} ${usuario.apellidos}`
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear procedimientos de medicina:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Error de validación',
        message: error.errors.map(e => e.message).join(', ')
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al crear los procedimientos de medicina'
    });
  }
});

// Obtener procedimientos de medicina con filtros y paginación
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      fechaDesde,
      fechaHasta,
      turno,
      usuarioId,
      pacienteRut,
      nombre
    } = req.query;

    // Construir filtros
    const whereClause = {};
    
    if (fechaDesde || fechaHasta) {
      whereClause.fecha = {};
      if (fechaDesde) whereClause.fecha[Op.gte] = fechaDesde;
      if (fechaHasta) whereClause.fecha[Op.lte] = fechaHasta;
    }
    
    if (turno) whereClause.turno = turno;
    if (usuarioId) whereClause.usuarioId = usuarioId;
    if (pacienteRut) whereClause.pacienteRut = pacienteRut;
    if (nombre) whereClause.nombre = { [Op.like]: `%${nombre}%` };

    const offset = (page - 1) * limit;

    const { count, rows: procedimientos } = await ProcedimientoMedicina.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombres', 'apellidos', 'usuario', 'estamento']
        },
        {
          model: Paciente,
          as: 'paciente',
          attributes: ['nombreCompleto', 'rut', 'numeroFicha', 'camaAsignada'],
          required: false
        }
      ],
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      message: 'Procedimientos de medicina obtenidos exitosamente',
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
    console.error('Error al obtener procedimientos de medicina:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener los procedimientos de medicina'
    });
  }
});

// Obtener métricas de medicina
router.get('/metricas', authenticateToken, async (req, res) => {
  try {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);


    // 1. TOTAL DE PROCEDIMIENTOS DEL MES (todos los usuarios)
    const totalProcedimientosMes = await ProcedimientoMedicina.count({
      where: {
        fecha: {
          [Op.gte]: inicioMes.toISOString().split('T')[0],
          [Op.lte]: finMes.toISOString().split('T')[0]
        }
      }
    });

    // 2. TIEMPO TOTAL DEL MES (todos los usuarios)
    const procedimientosTiempo = await ProcedimientoMedicina.findAll({
      where: {
        fecha: {
          [Op.gte]: inicioMes.toISOString().split('T')[0],
          [Op.lte]: finMes.toISOString().split('T')[0]
        }
      },
      attributes: ['tiempo']
    });

    let tiempoTotalMinutos = 0;
    procedimientosTiempo.forEach(proc => {
      const [horas, minutos] = proc.tiempo.split(':').map(Number);
      tiempoTotalMinutos += horas * 60 + minutos;
    });

    const tiempoTotalHoras = Math.floor(tiempoTotalMinutos / 60);
    const minutosRestantes = tiempoTotalMinutos % 60;

    // 3. ANÁLISIS POR TURNOS (SESIONES DE REGISTRO)
    // Obtener todas las sesiones de registro del mes (agrupadas por usuario, fecha y turno)
    const procedimientosDelMes = await ProcedimientoMedicina.findAll({
      where: {
        fecha: {
          [Op.gte]: inicioMes.toISOString().split('T')[0],
          [Op.lte]: finMes.toISOString().split('T')[0]
        }
      },
      attributes: ['usuarioId', 'fecha', 'turno', 'id'],
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['nombres', 'apellidos']
      }],
      order: [['fecha', 'ASC'], ['usuarioId', 'ASC']]
    });

    // 4. ANÁLISIS ESPECÍFICO DE INTERCONSULTA
    // Obtener solo los procedimientos de "Interconsulta" para calcular su promedio de tiempo
    const procedimientosInterconsulta = await ProcedimientoMedicina.findAll({
      where: {
        fecha: {
          [Op.gte]: inicioMes.toISOString().split('T')[0],
          [Op.lte]: finMes.toISOString().split('T')[0]
        },
        nombre: 'Interconsulta (lectura de HC, evaluación/reevaluación, evolución)'
      },
      attributes: ['tiempo', 'nombre']
    });

    // Calcular promedio de tiempo de Interconsulta
    let promedioInterconsulta = 0;
    if (procedimientosInterconsulta.length > 0) {
      const tiempoTotalInterconsulta = procedimientosInterconsulta.reduce((total, proc) => {
        const [horas, minutos] = proc.tiempo.split(':').map(Number);
        return total + (horas * 60 + minutos);
      }, 0);
      promedioInterconsulta = tiempoTotalInterconsulta / procedimientosInterconsulta.length;
    }

    // Agrupar por turnos únicos (fecha + turno) - varios usuarios pueden colaborar
    const turnos = {};
    procedimientosDelMes.forEach(proc => {
      const claveTurno = `${proc.fecha}-${proc.turno}`;
      if (!turnos[claveTurno]) {
        turnos[claveTurno] = {
          fecha: proc.fecha,
          turno: proc.turno,
          procedimientos: [],
          usuarios: new Set()
        };
      }
      turnos[claveTurno].procedimientos.push(proc.id);
      turnos[claveTurno].usuarios.add(proc.usuarioId);
    });

    // Convertir a array y calcular estadísticas
    const listaTurnos = Object.values(turnos);
    const totalTurnos = listaTurnos.length;
    
    // Calcular promedio de procedimientos por turno
    const promedioProcedimientosPorTurno = totalTurnos > 0 ? 
      Math.round((totalProcedimientosMes / totalTurnos) * 10) / 10 : 0;

    // 4. ANÁLISIS DETALLADO POR DÍAS
    const diasConRegistros = {};
    listaTurnos.forEach(turno => {
      if (!diasConRegistros[turno.fecha]) {
        diasConRegistros[turno.fecha] = {
          fecha: turno.fecha,
          turnos: 0,
          procedimientos: 0,
          usuarios: new Set()
        };
      }
      diasConRegistros[turno.fecha].turnos++;
      diasConRegistros[turno.fecha].procedimientos += turno.procedimientos.length;
      // Agregar todos los usuarios que participaron en este turno
      Array.from(turno.usuarios).forEach(usuarioId => {
        diasConRegistros[turno.fecha].usuarios.add(usuarioId);
      });
    });

    const diasActividad = Object.values(diasConRegistros);
    const totalDiasConActividad = diasActividad.length;
    const promedioProcedimientosPorDia = totalDiasConActividad > 0 ? 
      Math.round((totalProcedimientosMes / totalDiasConActividad) * 10) / 10 : 0;


    res.json({
      message: 'Métricas de medicina obtenidas exitosamente',
      data: {
        // Total de procedimientos del mes
        totalProcedimientos: {
          cantidad: totalProcedimientosMes,
          texto: `${totalProcedimientosMes} procedimiento${totalProcedimientosMes !== 1 ? 's' : ''} este mes`
        },
        
        // Tiempo total invertido
        tiempoTotal: {
          minutos: tiempoTotalMinutos,
          horas: tiempoTotalHoras,
          minutosRestantes,
          texto: tiempoTotalHoras > 0 ? `${tiempoTotalHoras}h ${minutosRestantes}m` : `${minutosRestantes}m`
        },
        
        // Métricas de sesiones (compatibilidad con frontend)
        promedioDia: {
          promedio: 0, // No se usa en medicina
          totalTurnos: 0,
          totalProcedimientos: 0
        },
        promedioNoche: {
          promedio: 0, // No se usa en medicina
          totalTurnos: 0,
          totalProcedimientos: 0
        },
        promedio24h: {
          promedio: promedioProcedimientosPorTurno,
          totalTurnos: totalTurnos,
          totalProcedimientos: totalProcedimientosMes
        },
        
        // Nueva métrica específica de Interconsulta
        promedioInterconsulta: {
          promedio: Math.round(promedioInterconsulta * 10) / 10, // Redondear a 1 decimal
          cantidad: procedimientosInterconsulta.length,
          texto: `${Math.round(promedioInterconsulta * 10) / 10} min promedio`
        },
        
        // Métricas adicionales específicas de medicina
        estadisticasDetalladas: {
          sesionesTotales: totalTurnos,
          diasConActividad: totalDiasConActividad,
          promedioPorSesion: promedioProcedimientosPorTurno,
          promedioPorDiaActivo: promedioProcedimientosPorDia,
          diasDelMes: finMes.getDate(),
          porcentajeDiasActivos: Math.round((totalDiasConActividad / finMes.getDate()) * 100)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener métricas de medicina:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener las métricas de medicina'
    });
  }
});

// Actualizar procedimiento de medicina
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, tiempo, pacienteRut, observaciones } = req.body;
    
    const procedimiento = await ProcedimientoMedicina.findByPk(id);
    if (!procedimiento) {
      return res.status(404).json({
        error: 'Procedimiento no encontrado',
        message: `No existe un procedimiento de medicina con ID ${id}`
      });
    }

    // Verificar que el usuario sea el propietario o administrador
    if (procedimiento.usuarioId !== req.user.id) {
      const usuario = await Usuario.findByPk(req.user.id);
      if (usuario.estamento !== 'Administrador') {
        return res.status(403).json({
          error: 'Sin permisos',
          message: 'Solo puede editar sus propios procedimientos'
        });
      }
    }

    // Validaciones
    if (!nombre || !tiempo) {
      return res.status(400).json({
        error: 'Datos requeridos',
        message: 'El nombre y tiempo son obligatorios'
      });
    }

    // Validar que el procedimiento sea válido
    const procedimientosValidos = ProcedimientoMedicina.getProcedimientosValidos();
    if (!procedimientosValidos.includes(nombre)) {
      return res.status(400).json({
        error: 'Procedimiento inválido',
        message: `El procedimiento "${nombre}" no es válido para medicina`
      });
    }

    // Validar que si el procedimiento requiere paciente, esté presente
    if (ProcedimientoMedicina.requierePaciente(nombre) && !pacienteRut) {
      return res.status(400).json({
        error: 'Paciente requerido',
        message: `El procedimiento "${nombre}" requiere un paciente asignado`
      });
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
      pacienteRut: pacienteRut || null,
      observaciones: observaciones || null
    });

    // Obtener el procedimiento actualizado con relaciones
    const procedimientoActualizado = await ProcedimientoMedicina.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['nombres', 'apellidos', 'usuario', 'estamento']
        },
        {
          model: Paciente,
          as: 'paciente',
          attributes: ['nombreCompleto', 'rut', 'numeroFicha', 'camaAsignada'],
          required: false
        }
      ]
    });

    res.json({
      message: 'Procedimiento de medicina actualizado exitosamente',
      data: procedimientoActualizado
    });

  } catch (error) {
    console.error('Error al actualizar procedimiento de medicina:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        error: 'Error de validación',
        message: error.errors.map(e => e.message).join(', ')
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al actualizar el procedimiento de medicina'
    });
  }
});

// Eliminar procedimiento de medicina
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const procedimiento = await ProcedimientoMedicina.findByPk(id);
    if (!procedimiento) {
      return res.status(404).json({
        error: 'Procedimiento no encontrado',
        message: `No existe un procedimiento de medicina con ID ${id}`
      });
    }

    // Verificar que el usuario sea el propietario o administrador
    if (procedimiento.usuarioId !== req.user.id) {
      const usuario = await Usuario.findByPk(req.user.id);
      if (usuario.estamento !== 'Administrador') {
        return res.status(403).json({
          error: 'Sin permisos',
          message: 'Solo puede eliminar sus propios procedimientos'
        });
      }
    }

    await procedimiento.destroy();

    res.json({
      message: 'Procedimiento de medicina eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar procedimiento de medicina:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al eliminar el procedimiento de medicina'
    });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const ProcedimientoAuxiliar = require('../models/ProcedimientoAuxiliar');
const Usuario = require('../models/Usuario');
const Paciente = require('../models/Paciente');

// Middleware para validar token JWT
const authenticateToken = require('../middleware/auth');

// Crear nuevo procedimiento auxiliar
router.post('/', authenticateToken, async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      turno,
      fecha,
      procedimientos
    } = req.body;

    // Validaciones básicas
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

    if (!procedimientos || !Array.isArray(procedimientos) || procedimientos.length === 0) {
      return res.status(400).json({
        error: 'Procedimientos requeridos',
        message: 'Debe proporcionar al menos un procedimiento'
      });
    }

    // Obtener usuario actual para validar estamento
    const usuario = await Usuario.findByPk(req.user.id);
    if (!usuario) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        message: 'No se pudo verificar la identidad del usuario'
      });
    }

    // Validar que el usuario sea auxiliar o administrador
    if (usuario.estamento !== 'Auxiliares' && usuario.estamento !== 'Administrador') {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo usuarios auxiliares o administradores pueden registrar procedimientos auxiliares'
      });
    }

    // Validar cada procedimiento
    const procedimientosValidos = ProcedimientoAuxiliar.getProcedimientosValidos();
    const procedimientosCrear = [];

    for (const proc of procedimientos) {
      // Validar nombre del procedimiento
      if (!procedimientosValidos.includes(proc.nombre)) {
        return res.status(400).json({
          error: 'Procedimiento inválido',
          message: `"${proc.nombre}" no es un procedimiento auxiliar válido`
        });
      }

      // Validar tiempo
      if (!proc.tiempo || !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(proc.tiempo)) {
        return res.status(400).json({
          error: 'Tiempo inválido',
          message: `El tiempo debe estar en formato HH:MM (${proc.nombre})`
        });
      }

      // Los procedimientos auxiliares ya no requieren paciente específico

      // Agregar al array de procedimientos a crear
      procedimientosCrear.push({
        usuarioId: req.user.id,
        turno,
        fecha,
        nombre: proc.nombre,
        tiempo: proc.tiempo,
        pacienteRut: proc.pacienteRut || null,
        observaciones: proc.observaciones || null
      });
    }

    // Crear todos los procedimientos
    const procedimientosCreados = await ProcedimientoAuxiliar.bulkCreate(
      procedimientosCrear, 
      { transaction }
    );

    await transaction.commit();

    // Obtener los procedimientos creados con sus relaciones
    let procedimientosCompletos;
    try {
      procedimientosCompletos = await ProcedimientoAuxiliar.findAll({
        where: {
          id: {
            [Op.in]: procedimientosCreados.map(p => p.id)
          }
        },
        include: [
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['nombres', 'apellidos', 'usuario', 'estamento'],
            required: false
          },
          {
            model: Paciente,
            as: 'paciente',
            attributes: ['nombreCompleto', 'rut', 'numeroFicha', 'camaAsignada'],
            required: false
          }
        ]
      });
    } catch (includeError) {
      console.error('Error al obtener relaciones:', includeError);
      // Si falla el include, devolver al menos los procedimientos básicos
      procedimientosCompletos = procedimientosCreados;
    }

    res.status(201).json({
      message: 'Procedimientos auxiliares registrados exitosamente',
      data: {
        procedimientos: procedimientosCompletos,
        resumen: {
          total: procedimientosCompletos.length,
          turno,
          fecha,
          usuario: `${usuario.nombres} ${usuario.apellidos}`
        }
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error al crear procedimientos auxiliares:', error);
    console.error('Stack trace:', error.stack);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      errors: error.errors
    });
    
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

    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({
        error: 'Error de referencia',
        message: 'Algunos datos referenciados no existen (usuario o paciente)'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al registrar los procedimientos auxiliares',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Obtener todos los procedimientos auxiliares (con paginación y filtros)
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
    if (nombre) whereClause.nombre = nombre;

    const offset = (page - 1) * limit;

    const { count, rows: procedimientos } = await ProcedimientoAuxiliar.findAndCountAll({
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
          attributes: ['nombreCompleto', 'rut', 'numeroFicha', 'camaAsignada']
        }
      ],
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      message: 'Procedimientos auxiliares obtenidos exitosamente',
      data: {
        procedimientos,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener procedimientos auxiliares:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener los procedimientos auxiliares'
    });
  }
});

// Obtener procedimientos agrupados por turno (para el menú auxiliares)
router.get('/agrupados', authenticateToken, async (req, res) => {
  try {
    const { 
      fechaDesde, 
      fechaHasta, 
      limit = 20 
    } = req.query;

    // Construir filtros
    const whereClause = {};
    if (fechaDesde || fechaHasta) {
      whereClause.fecha = {};
      if (fechaDesde) whereClause.fecha[Op.gte] = fechaDesde;
      if (fechaHasta) whereClause.fecha[Op.lte] = fechaHasta;
    }

    // Obtener procedimientos con sus relaciones
    const procedimientos = await ProcedimientoAuxiliar.findAll({
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
          attributes: ['nombreCompleto', 'rut', 'numeroFicha', 'camaAsignada']
        }
      ],
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit) * 10 // Obtener más registros para agrupar
    });

    // Agrupar por fecha y turno
    const grupos = {};
    
    procedimientos.forEach(proc => {
      const key = `${proc.fecha}-${proc.turno}`;
      if (!grupos[key]) {
        grupos[key] = {
          fecha: proc.fecha,
          turno: proc.turno,
          procedimientos: [],
          tiempoTotal: 0,
          cantidadProcedimientos: 0
        };
      }
      
      grupos[key].procedimientos.push(proc);
      grupos[key].cantidadProcedimientos++;
      
      // Calcular tiempo total
      const [horas, minutos] = proc.tiempo.split(':').map(Number);
      grupos[key].tiempoTotal += (horas * 60) + minutos;
    });

    // Convertir a array y ordenar
    const gruposArray = Object.values(grupos)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .slice(0, parseInt(limit));

    res.json({
      message: 'Procedimientos agrupados obtenidos exitosamente',
      data: gruposArray
    });

  } catch (error) {
    console.error('Error al obtener procedimientos agrupados:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener los procedimientos agrupados'
    });
  }
});

// Obtener métricas para el dashboard de auxiliares (totales de todos los usuarios)
router.get('/metricas', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Obteniendo métricas globales de auxiliares');
    
    // Calcular rango de fechas del mes actual
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    console.log('📅 Inicio del mes:', inicioMes);
    
    // Función helper para convertir tiempo HH:MM a minutos
    const tiempoAMinutos = (tiempo) => {
      if (!tiempo || typeof tiempo !== 'string') return 0;
      try {
        const partes = tiempo.split(':');
        if (partes.length !== 2) return 0;
        const horas = parseInt(partes[0]) || 0;
        const minutos = parseInt(partes[1]) || 0;
        return horas * 60 + minutos;
      } catch (e) {
        return 0;
      }
    };
    
    // Obtener procedimientos del mes actual de TODOS los usuarios
    const procedimientosMes = await ProcedimientoAuxiliar.findAll({
      where: {
        fecha: {
          [Op.gte]: inicioMes
        }
      },
      attributes: ['tiempo', 'fecha', 'turno'],
      raw: true,
      order: [['fecha', 'DESC']]
    });
    
    console.log('📊 Procedimientos encontrados (todos los usuarios):', procedimientosMes.length);
    if (procedimientosMes.length > 0) {
      console.log('📋 Primer procedimiento:', JSON.stringify(procedimientosMes[0], null, 2));
    }

    // Calcular tiempo total en minutos
    let tiempoTotalMinutos = 0;
    procedimientosMes.forEach(proc => {
      tiempoTotalMinutos += tiempoAMinutos(proc.tiempo);
    });
    
    const tiempoTotalHoras = Math.floor(tiempoTotalMinutos / 60);
    const minutosRestantes = tiempoTotalMinutos % 60;

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
      } else if (proc.turno === '24 h') {
        // Los turnos de 24h cuentan para ambos promedios
        turnosDia.add(`${proc.fecha}-Día`);
        turnosNoche.add(`${proc.fecha}-Noche`);
        procedimientosDia++;
        procedimientosNoche++;
      }
    });
    
    console.log('📈 Estadísticas calculadas:', {
      totalProcedimientos: procedimientosMes.length,
      turnosDia: turnosDia.size,
      turnosNoche: turnosNoche.size,
      procedimientosDia,
      procedimientosNoche,
      tiempoTotalMinutos
    });
    
    const promedioDia = turnosDia.size > 0 ? 
      Math.round((procedimientosDia / turnosDia.size) * 100) / 100 : 0;
    const promedioNoche = turnosNoche.size > 0 ? 
      Math.round((procedimientosNoche / turnosNoche.size) * 100) / 100 : 0;

    const response = {
      message: 'Métricas obtenidas exitosamente',
      data: {
        totalProcedimientos: {
          cantidad: procedimientosMes.length,
          texto: `${procedimientosMes.length}`
        },
        tiempoTotal: {
          minutos: tiempoTotalMinutos,
          horas: tiempoTotalHoras,
          minutosRestantes: minutosRestantes,
          texto: `${tiempoTotalHoras}h ${minutosRestantes}m`
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
    };
    
    console.log('✅ Métricas calculadas:', JSON.stringify(response.data, null, 2));
    
    res.json(response);

  } catch (error) {
    console.error('❌ Error al obtener métricas:', error);
    console.error('Stack trace:', error.stack);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    if (error.errors) {
      console.error('Validation errors:', error.errors);
    }
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al obtener las métricas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Eliminar procedimiento auxiliar
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const procedimiento = await ProcedimientoAuxiliar.findByPk(id);
    
    if (!procedimiento) {
      return res.status(404).json({
        error: 'Procedimiento no encontrado',
        message: `No existe un procedimiento auxiliar con ID ${id}`
      });
    }

    // Verificar que el usuario puede eliminar este procedimiento
    const usuario = await Usuario.findByPk(req.user.id);
    if (usuario.estamento !== 'Administrador' && procedimiento.usuarioId !== req.user.id) {
      return res.status(403).json({
        error: 'Acceso denegado',
        message: 'Solo puedes eliminar tus propios procedimientos o ser administrador'
      });
    }

    await procedimiento.destroy();

    res.json({
      message: 'Procedimiento auxiliar eliminado exitosamente',
      data: { id: parseInt(id) }
    });

  } catch (error) {
    console.error('Error al eliminar procedimiento auxiliar:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error al eliminar el procedimiento auxiliar'
    });
  }
});

module.exports = router;

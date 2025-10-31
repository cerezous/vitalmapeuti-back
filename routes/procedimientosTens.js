const express = require('express');
const { Op } = require('sequelize');
const RegistroProcedimientosTENS = require('../models/RegistroProcedimientosTENS');
const ProcedimientoTENS = require('../models/ProcedimientoTENS');
const Usuario = require('../models/Usuario');
const Paciente = require('../models/Paciente');

const router = express.Router();

// Middleware para validar token JWT
const authenticateToken = require('../middleware/auth');

// Middleware para verificar que el usuario sea TENS o Administrador
const requireTensOrAdmin = (req, res, next) => {
  if (req.user.estamento !== 'TENS' && req.user.estamento !== 'Administrador') {
    return res.status(403).json({
      message: 'No tienes permisos para acceder a esta sección. Solo usuarios TENS y Administradores pueden realizar registros en este módulo.'
    });
  }
  next();
};

// Función auxiliar para convertir tiempo a minutos
const convertirTiempoAMinutos = (tiempo) => {
  if (!tiempo) {
    return 0;
  }
  
  // Si ya es un número, devolverlo
  if (typeof tiempo === 'number') {
    return tiempo;
  }
  
  // Si es string, intentar parsearlo
  const str = tiempo.toString().toLowerCase();
  
  // Formato "HH:MM" del input time de HTML
  const tiempoHTMLMatch = str.match(/^(\d{1,2}):(\d{2})$/);
  if (tiempoHTMLMatch) {
    const resultado = parseInt(tiempoHTMLMatch[1]) * 60 + parseInt(tiempoHTMLMatch[2]);
    return resultado;
  }
  
  // Formato "1h 30m" o "1 h 30 m"
  const horasMinutosMatch = str.match(/(\d+)\s*h(?:oras?)?\s*(\d+)\s*m(?:in(?:utos?)?)?/);
  if (horasMinutosMatch) {
    return parseInt(horasMinutosMatch[1]) * 60 + parseInt(horasMinutosMatch[2]);
  }
  
  // Solo horas: "2h" o "2 horas"
  const soloHorasMatch = str.match(/(\d+)\s*h(?:oras?)?$/);
  if (soloHorasMatch) {
    return parseInt(soloHorasMatch[1]) * 60;
  }
  
  // Solo minutos: "45m" o "45 min"
  const soloMinutosMatch = str.match(/(\d+)\s*m(?:in(?:utos?)?)?$/);
  if (soloMinutosMatch) {
    return parseInt(soloMinutosMatch[1]);
  }
  
  // Formato decimal de horas: "1.5" (interpretar como horas)
  const decimalMatch = str.match(/^(\d*\.?\d+)$/);
  if (decimalMatch) {
    return Math.round(parseFloat(decimalMatch[1]) * 60);
  }
  
  return 0;
};

// GET /api/procedimientos-tens - Obtener todos los registros TENS
router.get('/', authenticateToken, requireTensOrAdmin, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      fechaDesde,
      fechaHasta,
      turno,
      incluirProcedimientos
    } = req.query;

    const offset = (page - 1) * limit;
    
    // Construir condiciones de filtrado
    const whereConditions = {};
    
    if (fechaDesde || fechaHasta) {
      whereConditions.fecha = {};
      if (fechaDesde) whereConditions.fecha[Op.gte] = fechaDesde;
      if (fechaHasta) whereConditions.fecha[Op.lte] = fechaHasta;
    }
    
    if (turno) {
      whereConditions.turno = turno;
    }

    // Configurar includes
    const includes = [
      {
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nombres', 'apellidos', 'usuario']
      }
    ];

    if (incluirProcedimientos === 'true' || incluirProcedimientos === true) {
      includes.push({
        model: ProcedimientoTENS,
        as: 'procedimientos',
        include: [
          {
            model: Paciente,
            as: 'paciente',
            attributes: ['rut', 'nombreCompleto', 'numeroFicha', 'camaAsignada'],
            required: false
          }
        ]
      });
    }

    const { count, rows: registros } = await RegistroProcedimientosTENS.findAndCountAll({
      where: whereConditions,
      include: includes,
      order: [['fecha', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    // Debug: Mostrar datos de los registros recuperados
    registros.forEach((registro, index) => {
    });

    // Calcular información de paginación
    const totalPages = Math.ceil(count / limit);
    const pagination = {
      currentPage: parseInt(page),
      totalPages,
      totalItems: count,
      itemsPerPage: parseInt(limit)
    };

    res.json({
      success: true,
      data: {
        registros,
        pagination
      }
    });
  } catch (error) {
    console.error('Error al obtener registros TENS:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los registros TENS',
      error: error.message
    });
  }
});

// GET /api/procedimientos-tens/:id - Obtener registro específico
router.get('/:id', authenticateToken, requireTensOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const registro = await RegistroProcedimientosTENS.findByPk(id, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombres', 'apellidos', 'usuario']
        },
        {
          model: ProcedimientoTENS,
          as: 'procedimientos',
          include: [
            {
              model: Paciente,
              as: 'paciente',
              attributes: ['rut', 'nombreCompleto', 'numeroFicha', 'camaAsignada'],
              required: false
            }
          ]
        }
      ]
    });

    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro TENS no encontrado'
      });
    }

    res.json({
      success: true,
      data: registro
    });
  } catch (error) {
    console.error('Error al obtener registro TENS:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el registro TENS',
      error: error.message
    });
  }
});

// POST /api/procedimientos-tens - Crear nuevo registro TENS
router.post('/', authenticateToken, requireTensOrAdmin, async (req, res) => {
  try {
    const { turno, fecha, procedimientos } = req.body;
    const usuarioId = req.user.id;

    // Validaciones
    if (!turno || !fecha || !Array.isArray(procedimientos) || procedimientos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos: turno, fecha y procedimientos son obligatorios'
      });
    }

    if (!['Día', 'Noche', '24 h'].includes(turno)) {
      return res.status(400).json({
        success: false,
        message: 'El turno debe ser "Día", "Noche" o "24 h"'
      });
    }

    // Calcular tiempo total
    let tiempoTotal = 0;
    for (const proc of procedimientos) {
      const minutos = convertirTiempoAMinutos(proc.tiempo);
      tiempoTotal += minutos;
    }

    // Crear el registro principal
    const nuevoRegistro = await RegistroProcedimientosTENS.create({
      usuarioId,
      turno,
      fecha,
      tiempoTotal
    });

    // Crear los procedimientos
    const procedimientosCreados = await Promise.all(
      procedimientos.map(proc => 
        ProcedimientoTENS.create({
          registroId: nuevoRegistro.id,
          nombre: proc.nombre,
          tiempo: proc.tiempo,
          pacienteRut: proc.pacienteRut || null
        })
      )
    );

    // Obtener el registro completo con relaciones
    const registroCompleto = await RegistroProcedimientosTENS.findByPk(nuevoRegistro.id, {
      include: [
        {
          model: Usuario,
          as: 'usuario',
          attributes: ['id', 'nombres', 'apellidos', 'usuario']
        },
        {
          model: ProcedimientoTENS,
          as: 'procedimientos',
          include: [
            {
              model: Paciente,
              as: 'paciente',
              attributes: ['rut', 'nombreCompleto', 'numeroFicha', 'camaAsignada'],
              required: false
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Registro TENS creado exitosamente',
      data: registroCompleto
    });
  } catch (error) {
    console.error('Error al crear registro TENS:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear el registro TENS',
      error: error.message
    });
  }
});

// DELETE /api/procedimientos-tens/:id - Eliminar registro
router.delete('/:id', authenticateToken, requireTensOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    const registro = await RegistroProcedimientosTENS.findByPk(id);

    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro TENS no encontrado'
      });
    }

    // Verificar que el usuario sea el propietario del registro o sea administrador
    if (registro.usuarioId !== usuarioId && req.user.estamento !== 'Administrador') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar este registro'
      });
    }

    // Los procedimientos se eliminarán automáticamente por CASCADE
    await registro.destroy();

    res.json({
      success: true,
      message: 'Registro TENS eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar registro TENS:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el registro TENS',
      error: error.message
    });
  }
});

// POST /api/procedimientos-tens/:id/procedimientos - Agregar procedimientos a un registro
router.post('/:id/procedimientos', authenticateToken, requireTensOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { procedimientos } = req.body;
    const usuarioId = req.user.id;

    const registro = await RegistroProcedimientosTENS.findByPk(id);

    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro TENS no encontrado'
      });
    }

    // Verificar permisos
    if (registro.usuarioId !== usuarioId && req.user.estamento !== 'Administrador') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar este registro'
      });
    }

    if (!Array.isArray(procedimientos) || procedimientos.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de procedimientos'
      });
    }

    // Crear los nuevos procedimientos
    const procedimientosCreados = await Promise.all(
      procedimientos.map(proc => 
        ProcedimientoTENS.create({
          registroId: id,
          nombre: proc.nombre,
          tiempo: proc.tiempo,
          pacienteRut: proc.pacienteRut || null
        })
      )
    );

    // Recalcular tiempo total
    const todosProcedimientos = await ProcedimientoTENS.findAll({
      where: { registroId: id }
    });

    const nuevoTiempoTotal = todosProcedimientos.reduce((total, proc) => {
      return total + convertirTiempoAMinutos(proc.tiempo);
    }, 0);

    await registro.update({ tiempoTotal: nuevoTiempoTotal });

    res.status(201).json({
      success: true,
      message: 'Procedimientos agregados exitosamente',
      data: procedimientosCreados
    });
  } catch (error) {
    console.error('Error al agregar procedimientos TENS:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar los procedimientos TENS',
      error: error.message
    });
  }
});

// DELETE /api/procedimientos-tens/:id/procedimientos/:procId - Eliminar procedimiento específico
router.delete('/:id/procedimientos/:procId', authenticateToken, requireTensOrAdmin, async (req, res) => {
  try {
    const { id, procId } = req.params;
    const usuarioId = req.user.id;

    const registro = await RegistroProcedimientosTENS.findByPk(id);
    
    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro TENS no encontrado'
      });
    }

    // Verificar permisos
    if (registro.usuarioId !== usuarioId && req.user.estamento !== 'Administrador') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar este registro'
      });
    }

    const procedimiento = await ProcedimientoTENS.findOne({
      where: { id: procId, registroId: id }
    });

    if (!procedimiento) {
      return res.status(404).json({
        success: false,
        message: 'Procedimiento no encontrado'
      });
    }

    await procedimiento.destroy();

    // Recalcular tiempo total
    const procedimientosRestantes = await ProcedimientoTENS.findAll({
      where: { registroId: id }
    });

    const nuevoTiempoTotal = procedimientosRestantes.reduce((total, proc) => {
      return total + convertirTiempoAMinutos(proc.tiempo);
    }, 0);

    await registro.update({ tiempoTotal: nuevoTiempoTotal });

    res.json({
      success: true,
      message: 'Procedimiento eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar procedimiento TENS:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el procedimiento TENS',
      error: error.message
    });
  }
});

// GET /api/procedimientos-tens/metricas/dashboard - Métricas para el dashboard
router.get('/metricas/dashboard', authenticateToken, async (req, res) => {
  try {
    const fechaActual = new Date();
    const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);

    // Total de procedimientos
    const totalProcedimientos = await ProcedimientoTENS.count();

    // Registros este mes
    const registrosEsteMes = await RegistroProcedimientosTENS.count({
      where: {
        fecha: {
          [Op.gte]: inicioMes
        }
      }
    });

    // Tiempo promedio del procedimiento "Aseo y cuidados del paciente"
    const procedimientoAseo = await ProcedimientoTENS.findOne({
      where: {
        nombre: 'Aseo y cuidados del paciente (aseo parcial o completo, cuidados de la piel, etc)'
      }
    });
    
    let tiempoPromedioAseo = 0;
    if (procedimientoAseo) {
      
      // Buscar todos los procedimientos con el nombre de aseo (no por ID específico)
      const procedimientosAseo = await ProcedimientoTENS.findAll({
        where: {
          nombre: 'Aseo y cuidados del paciente (aseo parcial o completo, cuidados de la piel, etc)'
        }
      });
      
      
      if (procedimientosAseo.length > 0) {
        const tiemposTotales = procedimientosAseo.map(proc => {
          const minutos = convertirTiempoAMinutos(proc.tiempo);
          return minutos;
        });
        
        const tiempoTotal = tiemposTotales.reduce((sum, tiempo) => sum + tiempo, 0);
        tiempoPromedioAseo = Math.round(tiempoTotal / tiemposTotales.length);
        
      }
    }    // Tiempo total acumulado
    const registrosConTiempo = await RegistroProcedimientosTENS.findAll({
      attributes: ['tiempoTotal']
    });

    const tiempoTotalMinutos = registrosConTiempo.reduce((total, registro) => {
      return total + (registro.tiempoTotal || 0);
    }, 0);

    const horas = Math.floor(tiempoTotalMinutos / 60);
    const minutosRestantes = tiempoTotalMinutos % 60;

    // Promedio de procedimientos por turno
    const totalRegistros = await RegistroProcedimientosTENS.count();
    const promedioProcedimientos = totalRegistros > 0 ? totalProcedimientos / totalRegistros : 0;

    res.json({
      success: true,
      data: {
        tiempoTotal: {
          minutos: tiempoTotalMinutos,
          horas,
          minutosRestantes,
          texto: `${horas}h ${minutosRestantes}m`
        },
        totalProcedimientos: {
          total: totalProcedimientos,
          texto: totalProcedimientos.toString()
        },
        promedioProcedimientos: {
          promedio: Math.round(promedioProcedimientos * 10) / 10,
          totalProcedimientos,
          totalTurnos: totalRegistros
        },
        tiempoPromedioAseo: {
          minutos: tiempoPromedioAseo,
          texto: `${tiempoPromedioAseo} min`
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener métricas dashboard TENS:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las métricas del dashboard TENS',
      error: error.message
    });
  }
});

// GET /api/procedimientos-tens/metricas/usuario - Métricas del usuario actual
router.get('/metricas/usuario', authenticateToken, async (req, res) => {
  try {
    const usuarioId = req.user.id;
    const fechaActual = new Date();
    const inicioMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);

    // Registros del usuario
    const registrosUsuario = await RegistroProcedimientosTENS.findAll({
      where: { usuarioId }
    });

    // Procedimientos del usuario
    const procedimientosUsuario = await ProcedimientoTENS.count({
      include: [
        {
          model: RegistroProcedimientosTENS,
          as: 'registro',
          where: { usuarioId }
        }
      ]
    });

    // Registros este mes
    const registrosEsteMes = await RegistroProcedimientosTENS.count({
      where: {
        usuarioId,
        fecha: {
          [Op.gte]: inicioMes
        }
      }
    });

    // Tiempo total del usuario
    const tiempoTotalMinutos = registrosUsuario.reduce((total, registro) => {
      return total + (registro.tiempoTotal || 0);
    }, 0);

    const horas = Math.floor(tiempoTotalMinutos / 60);
    const minutosRestantes = tiempoTotalMinutos % 60;

    // Pacientes atendidos (únicos por RUT)
    const pacientesAtendidos = await ProcedimientoTENS.count({
      distinct: true,
      col: 'pacienteRut',
      where: {
        pacienteRut: {
          [Op.not]: null
        }
      },
      include: [
        {
          model: RegistroProcedimientosTENS,
          as: 'registro',
          where: { usuarioId }
        }
      ]
    });

    res.json({
      success: true,
      data: {
        totalProcedimientos: procedimientosUsuario,
        tiempoTotal: {
          minutos: tiempoTotalMinutos,
          horas,
          minutosRestantes,
          texto: `${horas}h ${minutosRestantes}m`
        },
        pacientesAtendidos,
        registrosEsteMes
      }
    });
  } catch (error) {
    console.error('Error al obtener métricas usuario TENS:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las métricas del usuario TENS',
      error: error.message
    });
  }
});

module.exports = router;
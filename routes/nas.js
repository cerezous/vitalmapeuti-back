const express = require('express');
const router = express.Router();
const NAS = require('../models/NAS');
const Paciente = require('../models/Paciente');
const Usuario = require('../models/Usuario');
const { Op } = require('sequelize');

// ========== MIDDLEWARE DE VALIDACIÓN ==========

// Middleware para validar que existe el paciente por RUT
const validarPacienteExiste = async (req, res, next) => {
  try {
    const { pacienteRut } = req.body;
    
    if (!pacienteRut) {
      return res.status(400).json({
        success: false,
        message: 'RUT del paciente es requerido'
      });
    }
    
    const paciente = await Paciente.findOne({ where: { rut: pacienteRut } });
    if (!paciente) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado con el RUT proporcionado'
      });
    }
    
    req.paciente = paciente;
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al validar paciente',
      error: error.message
    });
  }
};

// Middleware para validar selecciones NAS
const validarSeleccionesNAS = (req, res, next) => {
  try {
    const { selecciones } = req.body;
    
    if (!selecciones || typeof selecciones !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Las selecciones NAS son requeridas'
      });
    }
    
    // Validar usando el método estático del modelo
    const errores = NAS.validarSelecciones(selecciones);
    
    if (errores.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Selecciones NAS inválidas',
        errores: errores
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al validar selecciones NAS',
      error: error.message
    });
  }
};

// ========== RUTAS CRUD ==========

// GET /api/nas - Obtener todos los registros NAS con filtros opcionales
router.get('/', async (req, res) => {
  try {
    const { 
      pacienteRut, 
      fechaInicio, 
      fechaFin,
      page = 1, 
      limit = 10,
      orderBy = 'fechaRegistro',
      orderDir = 'DESC'
    } = req.query;
    
    // Construir filtros
    const where = {};
    
    if (pacienteRut) {
      where.pacienteRut = pacienteRut;
    }
    
    if (fechaInicio && fechaFin) {
      where.fechaRegistro = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
      };
    } else if (fechaInicio) {
      where.fechaRegistro = {
        [Op.gte]: new Date(fechaInicio)
      };
    } else if (fechaFin) {
      where.fechaRegistro = {
        [Op.lte]: new Date(fechaFin)
      };
    }
    
    // Paginación
    const offset = (page - 1) * limit;
    
    const { rows: registros, count: total } = await NAS.findAndCountAll({
      where,
      include: [
        {
          model: Paciente,
          attributes: ['rut', 'nombreCompleto', 'numeroFicha'],
          foreignKey: 'rut',
          sourceKey: 'pacienteRut'
        },
        {
          model: Usuario,
          attributes: ['id', 'usuario'],
          foreignKey: 'usuarioId'
        }
      ],
      order: [[orderBy, orderDir.toUpperCase()]],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        registros,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalRecords: total,
          recordsPerPage: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener registros NAS',
      error: error.message
    });
  }
});

// GET /api/nas/:id - Obtener un registro NAS específico
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const registro = await NAS.findByPk(id, {
      include: [
        {
          model: Paciente,
          attributes: ['rut', 'nombreCompleto', 'numeroFicha'],
          foreignKey: 'rut',
          sourceKey: 'pacienteRut'
        },
        {
          model: Usuario,
          attributes: ['id', 'usuario'],
          foreignKey: 'usuarioId'
        }
      ]
    });
    
    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro NAS no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: registro
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener registro NAS',
      error: error.message
    });
  }
});

// GET /api/nas/paciente/:rut - Obtener registros NAS de un paciente específico
router.get('/paciente/:rut', async (req, res) => {
  try {
    const { rut } = req.params;
    const { limit = 10, orderBy = 'fechaRegistro', orderDir = 'DESC' } = req.query;
    
    const registros = await NAS.findAll({
      where: { pacienteRut: rut },
      include: [
        {
          model: Paciente,
          attributes: ['rut', 'nombreCompleto', 'numeroFicha'],
          foreignKey: 'rut',
          sourceKey: 'pacienteRut'
        },
        {
          model: Usuario,
          attributes: ['id', 'usuario'],
          foreignKey: 'usuarioId'
        }
      ],
      order: [[orderBy, orderDir.toUpperCase()]],
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: registros
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener registros NAS del paciente',
      error: error.message
    });
  }
});

// POST /api/nas - Crear nuevo registro NAS
router.post('/', validarPacienteExiste, validarSeleccionesNAS, async (req, res) => {
  try {
    
    const { 
      pacienteRut, 
      usuarioId,
      fechaRegistro,
      selecciones,
      observaciones
    } = req.body;
    
    // Determinar la fecha a usar (la proporcionada o la actual)
    const fechaParaRegistro = fechaRegistro || new Date().toISOString().split('T')[0];
    
    // Verificar si ya existe un registro para este paciente en esta fecha
    // Crear fecha en zona horaria local para evitar problemas de conversión
    const [year, month, day] = fechaParaRegistro.split('-').map(Number);
    const fechaInicio = new Date(year, month - 1, day, 0, 0, 0, 0);
    const fechaFin = new Date(year, month - 1, day, 23, 59, 59, 999);
    
    
    const registroExistente = await NAS.findOne({
      where: {
        pacienteRut,
        fechaRegistro: {
          [Op.between]: [fechaInicio, fechaFin]
        }
      }
    });
    
    
    if (registroExistente) {
      return res.status(409).json({
        success: false,
        message: `Ya existe un registro NAS para este paciente en la fecha ${fechaParaRegistro}. Fecha del registro existente: ${registroExistente.fechaRegistro}`
      });
    }
    
    // Crear datos del registro con las selecciones
    // Convertir la fecha string a Date en zona horaria local
    const fechaRegistroDate = new Date(year, month - 1, day, 12, 0, 0, 0); // Usar mediodía para evitar problemas de zona horaria
    
    const datosRegistro = {
      pacienteRut,
      usuarioId,
      fechaRegistro: fechaRegistroDate,
      observaciones,
      // Inicializar todos los ítems en false
      item_1a: false, item_1b: false, item_1c: false,
      item_2: false, item_3: false,
      item_4a: false, item_4b: false, item_4c: false,
      item_5: false,
      item_6a: false, item_6b: false, item_6c: false,
      item_7a: false, item_7b: false,
      item_8a: false, item_8b: false, item_8c: false,
      item_9: false, item_10: false, item_11: false, item_12: false, item_13: false,
      item_14: false, item_15: false, item_16: false, item_17: false, item_18: false,
      item_19: false, item_20: false, item_21: false, item_22: false, item_23: false
    };
    
    // Aplicar las selecciones del frontend
    Object.keys(selecciones).forEach(item => {
      if (selecciones[item] === true && datosRegistro.hasOwnProperty(item)) {
        datosRegistro[item] = true;
      }
    });
    
    // Crear el registro
    const nuevoRegistro = await NAS.create(datosRegistro);
    
    // Obtener el registro completo con las relaciones
    const registroCompleto = await NAS.findByPk(nuevoRegistro.id, {
      include: [
        {
          model: Paciente,
          attributes: ['rut', 'nombreCompleto', 'numeroFicha'],
          foreignKey: 'rut',
          sourceKey: 'pacienteRut'
        },
        {
          model: Usuario,
          attributes: ['id', 'usuario'],
          foreignKey: 'usuarioId'
        }
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Registro NAS creado exitosamente',
      data: registroCompleto
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear registro NAS',
      error: error.message
    });
  }
});

// PUT /api/nas/:id - Actualizar registro NAS
router.put('/:id', validarSeleccionesNAS, async (req, res) => {
  try {
    const { id } = req.params;
    const { selecciones, observaciones } = req.body;
    
    const registro = await NAS.findByPk(id);
    
    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro NAS no encontrado'
      });
    }
    
    // Preparar datos de actualización
    const datosActualizacion = {};
    
    if (observaciones !== undefined) {
      datosActualizacion.observaciones = observaciones;
    }
    
    if (selecciones) {
      // Resetear todos los ítems
      Object.keys(registro.dataValues).forEach(key => {
        if (key.startsWith('item_')) {
          datosActualizacion[key] = false;
        }
      });
      
      // Aplicar nuevas selecciones
      Object.keys(selecciones).forEach(item => {
        if (selecciones[item] === true && datosActualizacion.hasOwnProperty(item)) {
          datosActualizacion[item] = true;
        }
      });
    }
    
    // Actualizar el registro
    await registro.update(datosActualizacion);
    
    // Obtener el registro actualizado con las relaciones
    const registroActualizado = await NAS.findByPk(id, {
      include: [
        {
          model: Paciente,
          attributes: ['rut', 'nombreCompleto', 'numeroFicha'],
          foreignKey: 'rut',
          sourceKey: 'pacienteRut'
        },
        {
          model: Usuario,
          attributes: ['id', 'usuario'],
          foreignKey: 'usuarioId'
        }
      ]
    });
    
    res.json({
      success: true,
      message: 'Registro NAS actualizado exitosamente',
      data: registroActualizado
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar registro NAS',
      error: error.message
    });
  }
});

// DELETE /api/nas/:id - Eliminar registro NAS
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const registro = await NAS.findByPk(id);
    
    if (!registro) {
      return res.status(404).json({
        success: false,
        message: 'Registro NAS no encontrado'
      });
    }
    
    await registro.destroy();
    
    res.json({
      success: true,
      message: 'Registro NAS eliminado exitosamente'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar registro NAS',
      error: error.message
    });
  }
});

// ========== RUTAS DE ESTADÍSTICAS Y ANÁLISIS ==========

// GET /api/nas/estadisticas/resumen - Obtener estadísticas generales
router.get('/estadisticas/resumen', async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    const where = {};
    if (fechaInicio && fechaFin) {
      where.fechaRegistro = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
      };
    }
    
    const estadisticas = await NAS.findAll({
      where,
      attributes: [
        'puntuacionTotal',
        'fechaRegistro'
      ]
    });
    
    // Calcular estadísticas
    const puntuaciones = estadisticas.map(e => e.puntuacionTotal);
    const promedio = puntuaciones.reduce((a, b) => a + b, 0) / puntuaciones.length || 0;
    const minimo = Math.min(...puntuaciones) || 0;
    const maximo = Math.max(...puntuaciones) || 0;
    
    // Distribución por nivel de carga
    const distribucion = {
      baja: estadisticas.filter(e => e.puntuacionTotal < 40).length,
      moderada: estadisticas.filter(e => e.puntuacionTotal >= 40 && e.puntuacionTotal < 60).length,
      alta: estadisticas.filter(e => e.puntuacionTotal >= 60 && e.puntuacionTotal < 80).length,
      muyAlta: estadisticas.filter(e => e.puntuacionTotal >= 80).length
    };
    
    res.json({
      success: true,
      data: {
        totalRegistros: estadisticas.length,
        puntuacion: {
          promedio: parseFloat(promedio.toFixed(2)),
          minimo,
          maximo
        },
        distribucionCarga: distribucion
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
});

// GET /api/nas/estadisticas/items-frecuentes - Obtener ítems más seleccionados
router.get('/estadisticas/items-frecuentes', async (req, res) => {
  try {
    const { fechaInicio, fechaFin, limit = 10 } = req.query;
    
    const where = {};
    if (fechaInicio && fechaFin) {
      where.fechaRegistro = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)]
      };
    }
    
    const registros = await NAS.findAll({ where });
    
    // Contar frecuencia de cada ítem
    const contadorItems = {};
    const nombresItems = {
      item_1a: 'Monitorización horaria (1a)',
      item_1b: 'Presencia continua ≥2h (1b)',
      item_1c: 'Presencia continua ≥4h (1c)',
      item_2: 'Analíticas (2)',
      item_3: 'Medicación (3)',
      item_4a: 'Higiene normal (4a)',
      item_4b: 'Higiene >2h (4b)',
      item_4c: 'Higiene >4h (4c)',
      item_5: 'Cuidados drenajes (5)',
      item_6a: 'Movilización ≤3 veces (6a)',
      item_6b: 'Movilización >3 veces (6b)',
      item_6c: 'Movilización ≥3 enfermeras (6c)',
      item_7a: 'Apoyo familia ~1h (7a)',
      item_7b: 'Apoyo familia ≥3h (7b)',
      item_8a: 'Admin rutinarias <2h (8a)',
      item_8b: 'Admin ~2h (8b)',
      item_8c: 'Admin ~4h (8c)',
      item_9: 'Soporte respiratorio (9)',
      item_10: 'Cuidados vía aérea (10)',
      item_11: 'Mejora función pulmonar (11)',
      item_12: 'Fármacos vasoactivos (12)',
      item_13: 'Reposición IV grandes pérdidas (13)',
      item_14: 'Monitorización aurícula izq (14)',
      item_15: 'RCP tras parada (15)',
      item_16: 'Hemofiltración/diálisis (16)',
      item_17: 'Diuresis cuantitativa (17)',
      item_18: 'Monitorización PIC (18)',
      item_19: 'Tratamiento acid/alc metabólica (19)',
      item_20: 'Nutrición parenteral (20)',
      item_21: 'Nutrición enteral (21)',
      item_22: 'Intervención específica UCI (22)',
      item_23: 'Intervención fuera UCI (23)'
    };
    
    // Inicializar contadores
    Object.keys(nombresItems).forEach(item => {
      contadorItems[item] = 0;
    });
    
    // Contar ocurrencias
    registros.forEach(registro => {
      Object.keys(nombresItems).forEach(item => {
        if (registro[item] === true) {
          contadorItems[item]++;
        }
      });
    });
    
    // Convertir a array y ordenar por frecuencia
    const itemsFrecuentes = Object.entries(contadorItems)
      .map(([item, count]) => ({
        item,
        nombre: nombresItems[item],
        frecuencia: count,
        porcentaje: registros.length > 0 ? ((count / registros.length) * 100).toFixed(1) : '0.0'
      }))
      .sort((a, b) => b.frecuencia - a.frecuencia)
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: itemsFrecuentes
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener ítems frecuentes',
      error: error.message
    });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const ProcedimientoSistema = require('../models/ProcedimientoSistema');
const { Op } = require('sequelize');

// Middleware de autenticación
const authenticateToken = require('../middleware/auth');

// Obtener todos los procedimientos con filtros y paginación
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit, 
      estamento, 
      activo, 
      search,
      requierePaciente 
    } = req.query;

    // Si no se especifica límite, devolver todos los procedimientos
    const limitValue = limit ? parseInt(limit) : null;
    const offset = limitValue ? (page - 1) * limitValue : 0;
    const whereClause = {};

    // Filtros
    if (estamento && estamento !== 'todos') {
      whereClause.estamento = estamento;
    }

    if (activo !== undefined) {
      whereClause.activo = activo === 'true';
    }

    if (requierePaciente !== undefined) {
      whereClause.requierePaciente = requierePaciente === 'true';
    }

    if (search) {
      whereClause[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { descripcion: { [Op.like]: `%${search}%` } }
      ];
    }

    const queryOptions = {
      where: whereClause,
      order: [['estamento', 'ASC'], ['orden', 'ASC'], ['nombre', 'ASC']]
    };

    // Solo agregar límite y offset si se especifica un límite
    if (limitValue) {
      queryOptions.limit = limitValue;
      queryOptions.offset = offset;
    }

    const { count, rows } = await ProcedimientoSistema.findAndCountAll(queryOptions);

    res.json({
      success: true,
      data: {
        procedimientos: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: limitValue ? Math.ceil(count / limitValue) : 1,
          totalItems: count,
          itemsPerPage: limitValue || count
        }
      }
    });
  } catch (error) {
    console.error('Error al obtener procedimientos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener procedimientos por estamento (para los selects de los modales)
router.get('/por-estamento/:estamento', authenticateToken, async (req, res) => {
  try {
    const { estamento } = req.params;
    const { requierePaciente } = req.query;

    const whereClause = {
      estamento: estamento,
      activo: true
    };

    if (requierePaciente !== undefined) {
      whereClause.requierePaciente = requierePaciente === 'true';
    }

    const procedimientos = await ProcedimientoSistema.findAll({
      where: whereClause,
      order: [['orden', 'ASC'], ['nombre', 'ASC']],
      attributes: ['id', 'nombre', 'descripcion', 'tiempoEstimado', 'requierePaciente']
    });

    res.json({
      success: true,
      data: procedimientos
    });
  } catch (error) {
    console.error('Error al obtener procedimientos por estamento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener un procedimiento por ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const procedimiento = await ProcedimientoSistema.findByPk(id);

    if (!procedimiento) {
      return res.status(404).json({
        success: false,
        message: 'Procedimiento no encontrado'
      });
    }

    res.json({
      success: true,
      data: procedimiento
    });
  } catch (error) {
    console.error('Error al obtener procedimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Crear nuevo procedimiento
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { nombre, descripcion, estamento, tiempoEstimado, requierePaciente, activo, orden } = req.body;

    // Validaciones
    if (!nombre || !estamento) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y estamento son requeridos'
      });
    }

    // Verificar si ya existe un procedimiento con el mismo nombre
    const procedimientoExistente = await ProcedimientoSistema.findOne({
      where: { nombre: nombre }
    });

    if (procedimientoExistente) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe un procedimiento con este nombre'
      });
    }

    const nuevoProcedimiento = await ProcedimientoSistema.create({
      nombre,
      descripcion: descripcion || null,
      estamento,
      tiempoEstimado: tiempoEstimado || 0,
      requierePaciente: requierePaciente !== undefined ? requierePaciente : true,
      activo: activo !== undefined ? activo : true,
      orden: orden || 0
    });

    res.status(201).json({
      success: true,
      data: nuevoProcedimiento,
      message: 'Procedimiento creado exitosamente'
    });
  } catch (error) {
    console.error('Error al crear procedimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Actualizar procedimiento
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, estamento, tiempoEstimado, requierePaciente, activo, orden } = req.body;

    const procedimiento = await ProcedimientoSistema.findByPk(id);

    if (!procedimiento) {
      return res.status(404).json({
        success: false,
        message: 'Procedimiento no encontrado'
      });
    }

    // Si se está cambiando el nombre, verificar que no exista otro con el mismo nombre
    if (nombre && nombre !== procedimiento.nombre) {
      const procedimientoExistente = await ProcedimientoSistema.findOne({
        where: { 
          nombre: nombre,
          id: { [Op.ne]: id }
        }
      });

      if (procedimientoExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe otro procedimiento con este nombre'
        });
      }
    }

    // Actualizar campos
    await procedimiento.update({
      nombre: nombre || procedimiento.nombre,
      descripcion: descripcion !== undefined ? descripcion : procedimiento.descripcion,
      estamento: estamento || procedimiento.estamento,
      tiempoEstimado: tiempoEstimado !== undefined ? tiempoEstimado : procedimiento.tiempoEstimado,
      requierePaciente: requierePaciente !== undefined ? requierePaciente : procedimiento.requierePaciente,
      activo: activo !== undefined ? activo : procedimiento.activo,
      orden: orden !== undefined ? orden : procedimiento.orden
    });

    res.json({
      success: true,
      data: procedimiento,
      message: 'Procedimiento actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar procedimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Eliminar procedimiento
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const procedimiento = await ProcedimientoSistema.findByPk(id);

    if (!procedimiento) {
      return res.status(404).json({
        success: false,
        message: 'Procedimiento no encontrado'
      });
    }

    await procedimiento.destroy();

    res.json({
      success: true,
      message: 'Procedimiento eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar procedimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Activar/Desactivar procedimiento
router.patch('/:id/toggle-activo', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const procedimiento = await ProcedimientoSistema.findByPk(id);

    if (!procedimiento) {
      return res.status(404).json({
        success: false,
        message: 'Procedimiento no encontrado'
      });
    }

    await procedimiento.update({ activo: !procedimiento.activo });

    res.json({
      success: true,
      data: procedimiento,
      message: `Procedimiento ${procedimiento.activo ? 'activado' : 'desactivado'} exitosamente`
    });
  } catch (error) {
    console.error('Error al cambiar estado del procedimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener estadísticas de procedimientos
router.get('/estadisticas/generales', authenticateToken, async (req, res) => {
  try {
    const totalProcedimientos = await ProcedimientoSistema.count();
    const procedimientosActivos = await ProcedimientoSistema.count({ where: { activo: true } });
    const procedimientosInactivos = await ProcedimientoSistema.count({ where: { activo: false } });

    // Contar por estamento
    const porEstamento = await ProcedimientoSistema.findAll({
      attributes: [
        'estamento',
        [ProcedimientoSistema.sequelize.fn('COUNT', ProcedimientoSistema.sequelize.col('id')), 'cantidad']
      ],
      group: ['estamento'],
      raw: true
    });

    res.json({
      success: true,
      data: {
        total: totalProcedimientos,
        activos: procedimientosActivos,
        inactivos: procedimientosInactivos,
        porEstamento: porEstamento
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

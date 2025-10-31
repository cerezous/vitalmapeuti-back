const express = require('express');
const router = express.Router();
const Usuario = require('../models/Usuario');
const auth = require('../middleware/auth');
const sequelize = require('../config/database');
const { enviarCorreoBienvenida } = require('../config/email');

// Middleware para verificar que el usuario sea administrador
const requireAdmin = (req, res, next) => {
  if (req.user.estamento !== 'Administrador') {
    return res.status(403).json({
      message: 'No tienes permisos para realizar esta acción'
    });
  }
  next();
};

// Obtener todos los usuarios (solo administradores)
router.get('/', auth, requireAdmin, async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'usuario', 'nombres', 'apellidos', 'correo', 'estamento', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json(usuarios);

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener usuario por ID (solo administradores)
router.get('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await Usuario.findByPk(id, {
      attributes: ['id', 'usuario', 'nombres', 'apellidos', 'correo', 'estamento', 'createdAt', 'updatedAt']
    });

    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    res.json(usuario);

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Crear nuevo usuario (solo administradores)
router.post('/', auth, requireAdmin, async (req, res) => {
  try {
    const { usuario, nombres, apellidos, correo, estamento, contraseña } = req.body;

    // Validar campos requeridos
    if (!usuario || !nombres || !apellidos || !correo || !estamento || !contraseña) {
      return res.status(400).json({
        message: 'Todos los campos son requeridos'
      });
    }

    // Verificar que el usuario no exista
    const usuarioExistente = await Usuario.findOne({ where: { usuario } });
    if (usuarioExistente) {
      return res.status(400).json({
        message: 'El nombre de usuario ya existe'
      });
    }

    // Verificar que el correo no exista
    const correoExistente = await Usuario.findOne({ where: { correo } });
    if (correoExistente) {
      return res.status(400).json({
        message: 'El correo electrónico ya está registrado'
      });
    }

    // Crear el usuario
    const nuevoUsuario = await Usuario.create({
      usuario,
      nombres,
      apellidos,
      correo,
      estamento,
      contraseña // Se encriptará automáticamente en el modelo
    });

    // Enviar correo de bienvenida (en segundo plano)
    try {
      await enviarCorreoBienvenida(nuevoUsuario, contraseña);
      console.log(`✅ Correo de bienvenida enviado a ${correo}`);
    } catch (error) {
      console.warn(`⚠️ No se pudo enviar correo de bienvenida a ${correo}:`, error.message);
      // No fallar la creación del usuario si el correo falla
    }

    // Devolver el usuario sin la contraseña
    const usuarioRespuesta = await Usuario.findByPk(nuevoUsuario.id, {
      attributes: ['id', 'usuario', 'nombres', 'apellidos', 'correo', 'estamento', 'createdAt', 'updatedAt']
    });

    res.status(201).json(usuarioRespuesta);

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Actualizar usuario (solo administradores)
router.put('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario, nombres, apellidos, correo, estamento, contraseña } = req.body;

    // Buscar el usuario
    const usuarioExistente = await Usuario.findByPk(id);
    if (!usuarioExistente) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que no se esté intentando cambiar a un usuario que ya existe
    if (usuario && usuario !== usuarioExistente.usuario) {
      const usuarioConNombre = await Usuario.findOne({ where: { usuario } });
      if (usuarioConNombre) {
        return res.status(400).json({
          message: 'El nombre de usuario ya existe'
        });
      }
    }

    // Verificar que no se esté intentando cambiar a un correo que ya existe
    if (correo && correo !== usuarioExistente.correo) {
      const usuarioConCorreo = await Usuario.findOne({ where: { correo } });
      if (usuarioConCorreo) {
        return res.status(400).json({
          message: 'El correo electrónico ya está registrado'
        });
      }
    }

    // Preparar datos para actualizar
    const datosActualizacion = {};
    if (usuario) datosActualizacion.usuario = usuario;
    if (nombres) datosActualizacion.nombres = nombres;
    if (apellidos) datosActualizacion.apellidos = apellidos;
    if (correo) datosActualizacion.correo = correo;
    if (estamento) datosActualizacion.estamento = estamento;
    if (contraseña) datosActualizacion.contraseña = contraseña; // Se encriptará automáticamente

    // Actualizar el usuario
    await usuarioExistente.update(datosActualizacion);

    // Devolver el usuario actualizado sin la contraseña
    const usuarioActualizado = await Usuario.findByPk(id, {
      attributes: ['id', 'usuario', 'nombres', 'apellidos', 'correo', 'estamento', 'createdAt', 'updatedAt']
    });

    res.json(usuarioActualizado);

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Eliminar usuario (solo administradores)
router.delete('/:id', auth, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que no se esté intentando eliminar a sí mismo
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        message: 'No puedes eliminar tu propia cuenta'
      });
    }

    // Buscar el usuario
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({
        message: 'Usuario no encontrado'
      });
    }

    // Eliminar el usuario - los registros relacionados se eliminarán automáticamente por CASCADE
    await usuario.destroy();

    res.json({
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;

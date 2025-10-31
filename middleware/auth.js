const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token no proporcionado',
        message: 'Se requiere autenticación para acceder a este recurso'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vitalmape-secret-key-2024');
    
    // Verificar que el usuario aún existe
    const usuario = await Usuario.findByPk(decoded.id, {
      attributes: ['id', 'usuario', 'nombres', 'apellidos', 'correo', 'estamento']
    });

    if (!usuario) {
      return res.status(401).json({
        error: 'Usuario no válido',
        message: 'El usuario asociado al token no existe'
      });
    }

    // Agregar información del usuario al request
    req.user = {
      id: usuario.id,
      usuario: usuario.usuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      correo: usuario.correo,
      estamento: usuario.estamento
    };

    next();
  } catch (error) {
    console.error('Error en autenticación:', error);
    console.error('Tipo de error:', error.name);
    console.error('Mensaje del error:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: 'Token inválido',
        message: 'El token proporcionado no es válido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        error: 'Token expirado',
        message: 'El token ha expirado, por favor inicie sesión nuevamente'
      });
    }

    res.status(500).json({
      error: 'Error interno del servidor',
      message: 'Ocurrió un error durante la autenticación'
    });
  }
};

module.exports = authenticateToken;
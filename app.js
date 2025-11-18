// Cargar variables de entorno ANTES que todo
require('dotenv').config();

// Ejecutar migraciones automáticamente en producción (DESHABILITADO para mejor rendimiento)
// Descomentar solo si necesitas ejecutar migraciones manualmente
// if (process.env.NODE_ENV === 'production') {
//   console.log('🚀 Ejecutando migraciones automáticas...');
//   require('./auto-migrate');
// }

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
const sequelize = require('./config/database');
const Usuario = require('./models/Usuario');
const Paciente = require('./models/Paciente');
const NAS = require('./models/NAS');
const Apache2 = require('./models/Apache2');
// Importar funciones de correo (ahora habilitado)
const { enviarCorreoBienvenida, enviarCorreoRecuperacion, enviarNotificacion } = require('./config/email');

// Configurar asociaciones entre modelos
require('./config/associations');

// Importar rutas
const pacientesRoutes = require('./routes/pacientes');
const apache2Routes = require('./routes/apache2');
const nasRoutes = require('./routes/nas');
const categorizacionKinesiologiaRoutes = require('./routes/categorizacionKinesiologia');
const procedimientosKinesiologiaRoutes = require('./routes/procedimientosKinesiologia');
const registroProcedimientosRoutes = require('./routes/registroProcedimientos');
const procedimientosTensRoutes = require('./routes/procedimientosTens');
const egresosRoutes = require('./routes/egresos');
const enfermeriaRoutes = require('./routes/enfermeria');
const kinesiologiaRoutes = require('./routes/kinesiologia');
const auxiliaresRoutes = require('./routes/auxiliares');
const medicinaRoutes = require('./routes/medicina');
const burnoutRoutes = require('./routes/burnout');
const usuariosRoutes = require('./routes/usuarios');
const procedimientosSistemaRoutes = require('./routes/procedimientosSistema');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware CORS - ACTUALIZADO
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://vitalmapeuti.onrender.com',
    'https://vitalmapeuti-back.onrender.com',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint para Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'VitalMape UTI Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Sincronizar base de datos
const sincronizarDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');
    
    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync({ force: false }); // No recrear tablas existentes
    console.log('✅ Modelos sincronizados');
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
  }
};

// API básica (solo para verificación del backend)
app.get('/api', (req, res) => {
  res.json({ 
    mensaje: 'API de VitalMape Backend',
    version: '1.0.0',
    estado: 'funcionando'
  });
});

// ========== CONFIGURACIÓN DE RUTAS MODULARES ==========
app.use('/api/pacientes', pacientesRoutes);
app.use('/api/apache2', apache2Routes);
app.use('/api/nas', nasRoutes);
app.use('/api/categorizacion-kinesiologia', categorizacionKinesiologiaRoutes);
app.use('/api/procedimientos-kinesiologia', procedimientosKinesiologiaRoutes);
app.use('/api/registro-procedimientos', registroProcedimientosRoutes);
app.use('/api/procedimientos-tens', procedimientosTensRoutes);
app.use('/api/egresos', egresosRoutes);
app.use('/api/enfermeria', enfermeriaRoutes);
app.use('/api/kinesiologia', kinesiologiaRoutes);
app.use('/api/auxiliares', auxiliaresRoutes);
app.use('/api/medicina', medicinaRoutes);
app.use('/api/burnout', burnoutRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/procedimientos-sistema', procedimientosSistemaRoutes);

// Importar rutas de estadísticas
const estadisticasRoutes = require('./routes/estadisticas');
app.use('/api/estadisticas', estadisticasRoutes);

// ========== RUTAS DE AUTENTICACIÓN ==========

// Ruta para login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { usuario, contraseña } = req.body;
    
    console.log('🔐 Intento de login:', usuario);
    
    // Buscar usuario por nombre de usuario
    const usuarioEncontrado = await Usuario.findOne({ where: { usuario } });
    
    if (!usuarioEncontrado) {
      console.log('❌ Usuario no encontrado:', usuario);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    
    // Verificar contraseña
    const contraseñaValida = await usuarioEncontrado.verificarContraseña(contraseña);
    
    if (!contraseñaValida) {
      console.log('❌ Contraseña incorrecta para:', usuario);
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }
    
    // Generar token JWT
    const jwtSecret = process.env.JWT_SECRET || 'vitalmape-secret-key-2024';
    
    const token = jwt.sign(
      { 
        id: usuarioEncontrado.id, 
        usuario: usuarioEncontrado.usuario,
        estamento: usuarioEncontrado.estamento
      },
      jwtSecret,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Login exitoso:', usuario);
    
    // Excluir contraseña de la respuesta
    const usuarioResponse = {
      id: usuarioEncontrado.id,
      nombres: usuarioEncontrado.nombres,
      apellidos: usuarioEncontrado.apellidos,
      usuario: usuarioEncontrado.usuario,
      correo: usuarioEncontrado.correo,
      estamento: usuarioEncontrado.estamento
    };
    
    res.json({
      token,
      usuario: usuarioResponse,
      mensaje: 'Login exitoso'
    });
  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Middleware para verificar token JWT
const verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vitalmape-secret-key-2024');
    req.usuario = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Ruta para obtener perfil del usuario autenticado
app.get('/api/auth/profile', verificarToken, async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.usuario.id, {
      attributes: { exclude: ['contraseña'] }
    });
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json(usuario);
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
});

// Ruta para renovar token (útil cuando cambia JWT_SECRET)
app.post('/api/auth/refresh-token', async (req, res) => {
  try {
    const oldToken = req.headers.authorization?.split(' ')[1];
    
    if (!oldToken) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    // Intentar decodificar el token con las claves anteriores comunes
    const oldSecrets = ['vitalmape-secret-key', 'tu_clave_secreta_aqui'];
    let decoded = null;
    
    // Primero intentar con la clave actual
    try {
      decoded = jwt.verify(oldToken, process.env.JWT_SECRET || 'vitalmape-secret-key-2024');
    } catch (error) {
      // Intentar con claves anteriores
      for (const secret of oldSecrets) {
        try {
          decoded = jwt.verify(oldToken, secret);
          break;
        } catch (e) {
          continue;
        }
      }
    }

    if (!decoded) {
      return res.status(401).json({ error: 'Token no válido para renovación' });
    }

    // Verificar que el usuario aún existe
    const usuario = await Usuario.findByPk(decoded.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Generar nuevo token con la clave actual
    const newToken = jwt.sign(
      { 
        id: usuario.id, 
        usuario: usuario.usuario,
        estamento: usuario.estamento
      },
      process.env.JWT_SECRET || 'vitalmape-secret-key-2024',
      { expiresIn: '24h' }
    );

    res.json({ 
      token: newToken,
      usuario: {
        id: usuario.id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        usuario: usuario.usuario,
        correo: usuario.correo,
        estamento: usuario.estamento
      }
    });

  } catch (error) {
    console.error('Error al renovar token:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ========== RUTAS DE CORREO ==========

// Ruta para enviar correo de bienvenida
app.post('/api/email/bienvenida', verificarToken, async (req, res) => {
  try {
    const { usuarioId, contraseña } = req.body;
    
    const usuario = await Usuario.findByPk(usuarioId);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    const resultado = await enviarCorreoBienvenida(usuario, contraseña);
    
    if (resultado.success) {
      res.json({ mensaje: 'Correo de bienvenida enviado exitosamente' });
    } else {
      res.status(500).json({ error: 'Error al enviar correo', detalles: resultado.error });
    }
  } catch (error) {
    console.error('Error en envío de correo:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para solicitar recuperación de contraseña
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { correo } = req.body;
    
    if (!correo || !correo.trim()) {
      return res.status(400).json({ error: 'El correo es requerido' });
    }
    
    const usuario = await Usuario.findOne({ where: { correo: correo.trim() } });
    if (!usuario) {
      return res.status(404).json({ error: 'No se encontró una cuenta con ese correo electrónico' });
    }
    
    // Generar token de recuperación
    const resetToken = jwt.sign(
      { id: usuario.id, tipo: 'reset' },
      process.env.JWT_SECRET || 'vitalmape-secret-key-2024',
      { expiresIn: '1h' }
    );
    
    try {
      const resultado = await enviarCorreoRecuperacion(usuario, resetToken);
      
      if (resultado.success) {
        res.json({ 
          mensaje: 'Se ha enviado un correo con las instrucciones para recuperar tu contraseña',
          success: true 
        });
      } else {
        console.error('Error enviando correo de recuperación:', resultado.error);
        res.status(500).json({ 
          error: 'Error al enviar el correo de recuperación', 
          detalles: resultado.error 
        });
      }
    } catch (emailError) {
      console.error('Error en servicio de correo:', emailError);
      res.status(500).json({ 
        error: 'Error al enviar el correo de recuperación. Inténtalo más tarde.' 
      });
    }
  } catch (error) {
    console.error('Error en recuperación de contraseña:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para validar token y obtener información del usuario
app.get('/api/auth/validate-reset-token', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Token es requerido' });
    }
    
    // Verificar token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'vitalmape-secret-key-2024');
      
      if (decodedToken.tipo !== 'reset') {
        return res.status(400).json({ error: 'Token inválido para recuperación de contraseña' });
      }
    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(400).json({ error: 'El token ha expirado. Solicita una nueva recuperación de contraseña.' });
      }
      return res.status(400).json({ error: 'Token inválido' });
    }
    
    // Buscar usuario
    const usuario = await Usuario.findByPk(decodedToken.id, {
      attributes: ['id', 'usuario', 'nombres', 'apellidos']
    });
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    res.json({ 
      success: true,
      usuario: usuario.usuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos
    });
    
  } catch (error) {
    console.error('Error al validar token:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para restablecer contraseña con token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, nuevaContraseña } = req.body;
    
    if (!token || !nuevaContraseña) {
      return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
    }
    
    if (nuevaContraseña.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    // Verificar token
    let decodedToken;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET || 'vitalmape-secret-key-2024');
      
      if (decodedToken.tipo !== 'reset') {
        return res.status(400).json({ error: 'Token inválido para recuperación de contraseña' });
      }
    } catch (tokenError) {
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(400).json({ error: 'El token ha expirado. Solicita una nueva recuperación de contraseña.' });
      }
      return res.status(400).json({ error: 'Token inválido' });
    }
    
    // Buscar usuario
    const usuario = await Usuario.findByPk(decodedToken.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    // Actualizar contraseña (se hasheará automáticamente por el modelo)
    await usuario.update({ contraseña: nuevaContraseña });
    
    res.json({ 
      mensaje: 'Contraseña actualizada exitosamente',
      success: true 
    });
    
  } catch (error) {
    console.error('Error al restablecer contraseña:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para enviar notificaciones
app.post('/api/email/notificacion', verificarToken, async (req, res) => {
  try {
    const { destinatarios, asunto, mensaje } = req.body;
    
    if (!destinatarios || !Array.isArray(destinatarios) || destinatarios.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un destinatario' });
    }
    
    const resultado = await enviarNotificacion(destinatarios, asunto, mensaje);
    
    if (resultado.success) {
      res.json({ mensaje: 'Notificación enviada exitosamente' });
    } else {
      res.status(500).json({ error: 'Error al enviar notificación', detalles: resultado.error });
    }
  } catch (error) {
    console.error('Error en envío de notificación:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// Ruta para obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: { exclude: ['contraseña'] } // Excluir contraseña de la respuesta
    });
    res.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// Ruta para verificar si un nombre de usuario ya existe
app.get('/api/usuarios/check-username/:usuario', async (req, res) => {
  try {
    const { usuario } = req.params;
    const usuarioExistente = await Usuario.findOne({
      where: { usuario: usuario }
    });
    
    res.json({ exists: !!usuarioExistente });
  } catch (error) {
    console.error('Error al verificar usuario:', error);
    res.status(500).json({ error: 'Error al verificar usuario' });
  }
});

// Ruta para registro público de usuarios
app.post('/api/auth/register', async (req, res) => {
  try {
    const { nombres, apellidos, estamento, correo, contraseña } = req.body;
    
    console.log('📝 Registro de nuevo usuario:', { nombres, apellidos, estamento, correo });
    
    // Validar campos requeridos (sin usuario, se genera automáticamente)
    if (!nombres || !apellidos || !estamento || !correo || !contraseña) {
      return res.status(400).json({ 
        error: 'Campos requeridos',
        message: 'Todos los campos son obligatorios'
      });
    }
    
    // TEMPORAL: Permitir creación de administradores para configuración inicial
    // TODO: Remover después de crear el administrador
    if (estamento === 'Administrador') {
      console.log('⚠️ Creando usuario Administrador (modo temporal)');
    }
    
    // Generar nombre de usuario automáticamente desde nombres y apellidos
    // Primera letra del nombre + primer apellido
    const nombreLimpio = nombres.trim().toLowerCase();
    const apellidosLimpio = apellidos.trim().toLowerCase();
    const apellidosSeparados = apellidosLimpio.split(/\s+/);
    
    const primeraLetraNombre = nombreLimpio.charAt(0);
    const primerApellido = apellidosSeparados[0] || '';
    let usuario = primeraLetraNombre + primerApellido;
    
    // Si el usuario ya existe y hay segundo apellido, agregar primera letra del segundo apellido
    let usuarioExiste = await Usuario.findOne({ where: { usuario } });
    if (usuarioExiste && apellidosSeparados.length > 1) {
      const segundoApellido = apellidosSeparados[1];
      usuario = usuario + segundoApellido.charAt(0);
    }
    
    // Si aún existe, agregar un número al final
    let contador = 2;
    let usuarioFinal = usuario;
    usuarioExiste = await Usuario.findOne({ where: { usuario: usuarioFinal } });
    
    while (usuarioExiste) {
      usuarioFinal = usuario + contador;
      usuarioExiste = await Usuario.findOne({ where: { usuario: usuarioFinal } });
      contador++;
    }
    
    console.log('👤 Usuario generado:', usuarioFinal);
    
    const nuevoUsuario = await Usuario.create({
      nombres,
      apellidos,
      usuario: usuarioFinal,
      estamento,
      correo,
      contraseña
    });
    
    // Enviar correo de bienvenida
    try {
      const resultadoCorreo = await enviarCorreoBienvenida(nuevoUsuario, contraseña);
      if (resultadoCorreo.success) {
        console.log(`✅ Correo de bienvenida enviado a ${correo}`);
      } else {
        console.error('❌ Error enviando correo de bienvenida:', resultadoCorreo.error);
        // Si el correo falla, fallar el registro
        return res.status(500).json({ 
          error: 'Error al enviar correo de bienvenida', 
          message: 'No se pudo completar el registro. Inténtalo más tarde.' 
        });
      }
    } catch (emailError) {
      console.error('❌ Error en envío de correo:', emailError);
      return res.status(500).json({ 
        error: 'Error en el servicio de correo', 
        message: 'No se pudo completar el registro. Inténtalo más tarde.' 
      });
    }
    
    // Excluir contraseña de la respuesta
    const usuarioResponse = {
      id: nuevoUsuario.id,
      nombres: nuevoUsuario.nombres,
      apellidos: nuevoUsuario.apellidos,
      usuario: nuevoUsuario.usuario,
      estamento: nuevoUsuario.estamento,
      correo: nuevoUsuario.correo,
      createdAt: nuevoUsuario.createdAt,
      updatedAt: nuevoUsuario.updatedAt
    };
    
    console.log('✅ Usuario registrado exitosamente:', usuarioFinal);
    
    res.status(201).json(usuarioResponse);
  } catch (error) {
    console.error('❌ Error al crear usuario:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        error: 'El usuario o correo ya existe',
        message: 'El nombre de usuario o correo electrónico ya está en uso'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      return res.status(400).json({ 
        error: 'Datos de validación incorrectos',
        errors
      });
    }
    
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ========== RUTAS PARA PACIENTES ==========

// Ruta para obtener todos los pacientes
app.get('/api/pacientes', async (req, res) => {
  try {
    const pacientes = await Paciente.findAll({
      order: [['fechaIngresoUTI', 'DESC']]
    });
    res.json(pacientes);
  } catch (error) {
    console.error('Error al obtener pacientes:', error);
    res.status(500).json({ error: 'Error al obtener pacientes' });
  }
});

// Ruta para obtener un paciente por ID
app.get('/api/pacientes/:id', async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    res.json(paciente);
  } catch (error) {
    console.error('Error al obtener paciente:', error);
    res.status(500).json({ error: 'Error al obtener paciente' });
  }
});

// Ruta para crear un nuevo paciente
app.post('/api/pacientes', async (req, res) => {
  try {
    const { 
      nombres, 
      apellidos, 
      rut, 
      numeroFicha, 
      edad, 
      fechaIngresoUTI, 
      fechaEgresoUTI, 
      reingresos 
    } = req.body;
    
    const nuevoPaciente = await Paciente.create({
      nombres,
      apellidos,
      rut,
      numeroFicha,
      edad,
      fechaIngresoUTI,
      fechaEgresoUTI,
      reingresos
    });
    
    res.status(201).json(nuevoPaciente);
  } catch (error) {
    console.error('Error al crear paciente:', error);
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ error: 'Datos de validación incorrectos', detalles: error.errors });
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'El RUT o número de ficha ya existe' });
    } else {
      res.status(500).json({ error: 'Error al crear paciente' });
    }
  }
});

// Ruta para actualizar un paciente
app.put('/api/pacientes/:id', async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    await paciente.update(req.body);
    res.json(paciente);
  } catch (error) {
    console.error('Error al actualizar paciente:', error);
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ error: 'Datos de validación incorrectos', detalles: error.errors });
    } else if (error.name === 'SequelizeUniqueConstraintError') {
      res.status(400).json({ error: 'El RUT o número de ficha ya existe' });
    } else {
      res.status(500).json({ error: 'Error al actualizar paciente' });
    }
  }
});

// Ruta para eliminar un paciente
app.delete('/api/pacientes/:id', async (req, res) => {
  try {
    const paciente = await Paciente.findByPk(req.params.id);
    if (!paciente) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    await paciente.destroy();
    res.json({ mensaje: 'Paciente eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar paciente:', error);
    res.status(500).json({ error: 'Error al eliminar paciente' });
  }
});

// Ruta para obtener pacientes actualmente en UTI
app.get('/api/pacientes/uti/activos', async (req, res) => {
  try {
    const pacientesActivos = await Paciente.findAll({
      where: {
        fechaEgresoUTI: null
      },
      order: [['fechaIngresoUTI', 'ASC']]
    });
    res.json(pacientesActivos);
  } catch (error) {
    console.error('Error al obtener pacientes activos:', error);
    res.status(500).json({ error: 'Error al obtener pacientes activos' });
  }
});

// ========== RUTAS PARA NAS (Nursing Activities Score) ==========

// Ruta para obtener todos los registros NAS
app.get('/api/nas', async (req, res) => {
  try {
    const nas = await NAS.findAll({
      order: [['fechaRegistro', 'DESC']]
    });
    res.json(nas);
  } catch (error) {
    console.error('Error al obtener registros NAS:', error);
    res.status(500).json({ error: 'Error al obtener registros NAS' });
  }
});

// Ruta para obtener un registro NAS por ID
app.get('/api/nas/:id', async (req, res) => {
  try {
    const nas = await NAS.findByPk(req.params.id);
    if (!nas) {
      return res.status(404).json({ error: 'Registro NAS no encontrado' });
    }
    res.json(nas);
  } catch (error) {
    console.error('Error al obtener registro NAS:', error);
    res.status(500).json({ error: 'Error al obtener registro NAS' });
  }
});

// Ruta para crear un nuevo registro NAS
app.post('/api/nas', async (req, res) => {
  try {
    const {
      pacienteId,
      usuarioId,
      fechaRegistro,
      monitorizacion,
      analisisExamenes,
      medicamentos,
      higiene,
      cuidados,
      cambiosPosturales,
      familiares,
      administrativo,
      soporteVentilatorio,
      cuidadosVia,
      mejoraVentilacion,
      vasoactivos,
      fluidoterapia,
      auriculaIzquierda,
      rcp,
      trr,
      cuantificacionDiuresis,
      picc,
      metabolismo,
      parenteral,
      enteral,
      especificasUCI,
      especificasFueraUCI
    } = req.body;
    
    const nuevoNAS = await NAS.create({
      pacienteId,
      usuarioId,
      fechaRegistro,
      monitorizacion,
      analisisExamenes,
      medicamentos,
      higiene,
      cuidados,
      cambiosPosturales,
      familiares,
      administrativo,
      soporteVentilatorio,
      cuidadosVia,
      mejoraVentilacion,
      vasoactivos,
      fluidoterapia,
      auriculaIzquierda,
      rcp,
      trr,
      cuantificacionDiuresis,
      picc,
      metabolismo,
      parenteral,
      enteral,
      especificasUCI,
      especificasFueraUCI
    });
    
    res.status(201).json(nuevoNAS);
  } catch (error) {
    console.error('Error al crear registro NAS:', error);
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ error: 'Datos de validación incorrectos', detalles: error.errors });
    } else {
      res.status(500).json({ error: 'Error al crear registro NAS' });
    }
  }
});

// Ruta para actualizar un registro NAS
app.put('/api/nas/:id', async (req, res) => {
  try {
    const nas = await NAS.findByPk(req.params.id);
    if (!nas) {
      return res.status(404).json({ error: 'Registro NAS no encontrado' });
    }
    
    await nas.update(req.body);
res.json(nas);
  } catch (error) {
    console.error('Error al actualizar registro NAS:', error);
    if (error.name === 'SequelizeValidationError') {
      res.status(400).json({ error: 'Datos de validación incorrectos', detalles: error.errors });
    } else {
      res.status(500).json({ error: 'Error al actualizar registro NAS' });
    }
  }
});

// Ruta para eliminar un registro NAS
app.delete('/api/nas/:id', async (req, res) => {
  try {
    const nas = await NAS.findByPk(req.params.id);
    if (!nas) {
      return res.status(404).json({ error: 'Registro NAS no encontrado' });
    }
    
    await nas.destroy();
    res.json({ mensaje: 'Registro NAS eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar registro NAS:', error);
    res.status(500).json({ error: 'Error al eliminar registro NAS' });
  }
});

// Ruta para obtener registros NAS de un paciente específico
app.get('/api/nas/paciente/:pacienteId', async (req, res) => {
  try {
    const nas = await NAS.findAll({
      where: { pacienteId: req.params.pacienteId },
      order: [['fechaRegistro', 'DESC']]
    });
    res.json(nas);
  } catch (error) {
    console.error('Error al obtener registros NAS del paciente:', error);
    res.status(500).json({ error: 'Error al obtener registros NAS del paciente' });
  }
});

// Ruta para obtener estadísticas NAS
app.get('/api/nas/estadisticas', async (req, res) => {
  try {
    const totalRegistros = await NAS.count();
    const promedioPuntuacion = await NAS.findAll({
      attributes: [
        [sequelize.fn('AVG', sequelize.literal('monitorizacion + analisisExamenes + medicamentos + higiene + cuidados + cambiosPosturales + familiares + administrativo + soporteVentilatorio + cuidadosVia + mejoraVentilacion + vasoactivos + fluidoterapia + auriculaIzquierda + rcp + trr + cuantificacionDiuresis + picc + metabolismo + parenteral + enteral + especificasUCI + especificasFueraUCI')), 'promedio']
      ]
    });
    
    res.json({
      totalRegistros,
      promedioPuntuacion: promedioPuntuacion[0]?.dataValues?.promedio || 0
    });
  } catch (error) {
    console.error('Error al obtener estadísticas NAS:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas NAS' });
  }
});

// ========== CONFIGURACIÓN PARA SINGLE PAGE APPLICATION (SPA) ==========
// COMENTADO: Frontend ahora está separado y se despliega independientemente

// Servir archivos estáticos del frontend build en producción
// const frontendBuildPath = path.join(__dirname, '../frontend/build');
// app.use(express.static(frontendBuildPath));

// Manejar todas las rutas que no son de API para SPA usando middleware
// Esto permite que los botones del navegador (atrás, adelante, F5) funcionen correctamente
// app.use((req, res, next) => {
//   // Solo para rutas que no empiecen con /api
//   if (!req.path.startsWith('/api')) {
//     res.sendFile(path.join(frontendBuildPath, 'index.html'));
//   } else {
//     next(); // Continuar a otros middlewares para APIs
//   }
// });

// Endpoint temporal para probar verificación de contraseñas
app.post('/api/auth/test-password', async (req, res) => {
  try {
    const { usuario, password } = req.body;
    
    const usuarioEncontrado = await Usuario.findOne({ where: { usuario } });
    if (!usuarioEncontrado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    
    console.log('Usuario encontrado:', usuarioEncontrado.usuario);
    console.log('Contraseña almacenada:', usuarioEncontrado.contraseña);
    console.log('Contraseña a verificar:', password);
    
    const contraseñaValida = await usuarioEncontrado.verificarContraseña(password);
    console.log('Resultado verificación:', contraseñaValida);
    
    res.json({
      usuario: usuarioEncontrado.usuario,
      contraseñaAlmacenada: usuarioEncontrado.contraseña,
      contraseñaVerificada: contraseñaValida
    });
    
  } catch (error) {
    console.error('Error en test-password:', error);
    res.status(500).json({ error: 'Error interno del servidor', details: error.message });
  }
});

// Endpoint temporal para actualizar estamento de usuario (SOLO PARA DESARROLLO)
app.put('/api/auth/update-estamento', async (req, res) => {
  try {
    const { usuario, nuevoEstamento } = req.body;
    
    const usuarioEncontrado = await Usuario.findOne({ where: { usuario } });
    if (!usuarioEncontrado) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado',
        message: `El usuario ${usuario} no existe en la base de datos`
      });
    }
    
    await usuarioEncontrado.update({ estamento: nuevoEstamento });
    
    res.json({
      message: 'Estamento actualizado exitosamente',
      usuario: {
        id: usuarioEncontrado.id,
        usuario: usuarioEncontrado.usuario,
        nombres: usuarioEncontrado.nombres,
        apellidos: usuarioEncontrado.apellidos,
        correo: usuarioEncontrado.correo,
        estamento: usuarioEncontrado.estamento
      }
    });
    
  } catch (error) {
    console.error('Error al actualizar estamento:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Endpoint temporal para importar usuarios (SOLO PARA DESARROLLO)
app.post('/api/auth/import-user', async (req, res) => {
  try {
    const { usuario, contraseña, nombres, apellidos, correo, estamento } = req.body;
    
    // Verificar que el usuario no exista
    const usuarioExistente = await Usuario.findOne({ where: { usuario } });
    if (usuarioExistente) {
      return res.status(400).json({ 
        error: 'Usuario ya existe',
        message: `El usuario ${usuario} ya existe en la base de datos`
      });
    }
    
    // Crear usuario con contraseña ya hasheada usando query directo para evitar hooks
    const [nuevoUsuario] = await sequelize.query(
      `INSERT INTO usuarios (usuario, contraseña, nombres, apellidos, correo, estamento, "createdAt", "updatedAt") 
       VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      {
        replacements: [usuario, contraseña, nombres, apellidos, correo, estamento],
        type: sequelize.QueryTypes.INSERT
      }
    );
    
    // Obtener el usuario creado
    const usuarioCreado = await Usuario.findByPk(nuevoUsuario);
    
    res.status(201).json({
      message: 'Usuario importado exitosamente',
      usuario: {
        id: usuarioCreado.id,
        usuario: usuarioCreado.usuario,
        nombres: usuarioCreado.nombres,
        apellidos: usuarioCreado.apellidos,
        correo: usuarioCreado.correo,
        estamento: usuarioCreado.estamento
      }
    });
    
  } catch (error) {
    console.error('Error al importar usuario:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  await sincronizarDB();
});

module.exports = app;
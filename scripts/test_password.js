const Usuario = require('./models/Usuario');
const sequelize = require('./config/database');
const bcrypt = require('bcryptjs');

async function probarContraseña() {
  try {
    await sequelize.authenticate();
    
    // Buscar el usuario test
    const usuario = await Usuario.findOne({ where: { usuario: 'usertest' } });
    
    if (!usuario) {
      return;
    }
    
    
    // Probar verificación de contraseña directamente
    const contraseñaCorrecta = await bcrypt.compare('test123', usuario.contraseña);
    
    // Probar con el método del modelo
    const contraseñaModelo = await usuario.verificarContraseña('test123');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

probarContraseña();
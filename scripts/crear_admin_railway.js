// Script para crear un usuario administrador en Railway (PostgreSQL)
const sequelize = require('./config/database');
const Usuario = require('./models/Usuario');

async function crearAdmin() {
  try {
    await sequelize.authenticate();
    await sequelize.sync(); // Asegura que la tabla exista

    const existe = await Usuario.findOne({ where: { usuario: 'mcerezop' } });
    if (existe) {
      console.log('El usuario administrador ya existe.');
      process.exit(0);
    }

    const admin = await Usuario.create({
      nombres: 'Matías',
      apellidos: 'Cerezo Prado',
      usuario: 'mcerezop',
      correo: 'mcerezopr@gmail.com',
      estamento: 'Administrador',
      contraseña: 'catita1008'
    });
    console.log('Usuario administrador creado:', admin.usuario);
    process.exit(0);
  } catch (error) {
    console.error('Error al crear admin:', error);
    process.exit(1);
  }
}

crearAdmin();

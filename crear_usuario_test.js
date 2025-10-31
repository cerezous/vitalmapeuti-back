const path = require('path');

// Cargar variables de entorno
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Usar la misma configuración que app.js
const sequelize = require('./config/database');
const Usuario = require('./models/Usuario');

// Configurar asociaciones (necesario para que los modelos funcionen)
require('./config/associations');

async function crearUsuarioTest() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión establecida correctamente\n');

    // Verificar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ 
      where: { usuario: 'test' } 
    });

    if (usuarioExistente) {
      console.log('⚠️  El usuario "test" ya existe, eliminándolo...');
      await Usuario.destroy({ where: { usuario: 'test' } });
      console.log('✅ Usuario anterior eliminado\n');
    }

    // Verificar si el correo existe y eliminarlo también
    const correoExistente = await Usuario.findOne({ 
      where: { correo: 'test@test.com' } 
    });

    if (correoExistente) {
      console.log('⚠️  El correo ya existe, eliminando usuario asociado...');
      await Usuario.destroy({ where: { correo: 'test@test.com' } });
    }

    // Crear nuevo usuario de prueba
    const nuevoUsuario = await Usuario.create({
      nombres: 'Test',
      apellidos: 'Usuario',
      usuario: 'test',
      correo: 'test@test.com',
      estamento: 'Administrador',
      contraseña: 'test123' // Se hasheará automáticamente por el modelo
    });

    console.log('✅ Usuario de prueba creado exitosamente!\n');
    console.log('📋 Credenciales para acceder:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 Usuario: test');
    console.log('🔐 Contraseña: test123');
    console.log('👑 Estamento: Administrador');
    console.log('📧 Correo: test@test.com');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error al crear usuario:', error.message);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`   - ${err.path}: ${err.message}`);
      });
    }
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

crearUsuarioTest();


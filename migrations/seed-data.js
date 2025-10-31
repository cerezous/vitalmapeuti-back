const sequelize = require('../config/database');
const { Usuario } = require('../config/associations');
const bcrypt = require('bcryptjs');

async function seedData() {
  try {
    console.log('🌱 Iniciando seed de datos iniciales...');
    
    // Verificar si ya existen usuarios
    const existingUsers = await Usuario.count();
    if (existingUsers > 0) {
      console.log('⚠️  Ya existen usuarios en la base de datos. Saltando seed...');
      return;
    }
    
    // Crear usuario administrador por defecto
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const adminUser = await Usuario.create({
      nombres: 'Administrador',
      apellidos: 'Sistema',
      usuario: 'admin',
      estamento: 'Administrador',
      correo: 'admin@vitalmape.com',
      contraseña: adminPassword
    });
    
    console.log('✅ Usuario administrador creado:', {
      id: adminUser.id,
      usuario: adminUser.usuario,
      correo: adminUser.correo,
      estamento: adminUser.estamento
    });
    
    // Crear usuarios de ejemplo para cada estamento
    const usuariosEjemplo = [
      {
        nombres: 'Dr. Juan',
        apellidos: 'Pérez',
        usuario: 'medicina',
        estamento: 'Medicina',
        correo: 'medicina@vitalmape.com',
        contraseña: await bcrypt.hash('medicina123', 10)
      },
      {
        nombres: 'Enfermera',
        apellidos: 'González',
        usuario: 'enfermeria',
        estamento: 'Enfermería',
        correo: 'enfermeria@vitalmape.com',
        contraseña: await bcrypt.hash('enfermeria123', 10)
      },
      {
        nombres: 'Kinesiólogo',
        apellidos: 'Martínez',
        usuario: 'kinesiologia',
        estamento: 'Kinesiología',
        correo: 'kinesiologia@vitalmape.com',
        contraseña: await bcrypt.hash('kinesiologia123', 10)
      },
      {
        nombres: 'TENS',
        apellidos: 'Rodríguez',
        usuario: 'tens',
        estamento: 'TENS',
        correo: 'tens@vitalmape.com',
        contraseña: await bcrypt.hash('tens123', 10)
      },
      {
        nombres: 'Auxiliar',
        apellidos: 'López',
        usuario: 'auxiliares',
        estamento: 'Auxiliares',
        correo: 'auxiliares@vitalmape.com',
        contraseña: await bcrypt.hash('auxiliares123', 10)
      }
    ];
    
    for (const usuarioData of usuariosEjemplo) {
      const usuario = await Usuario.create(usuarioData);
      console.log(`✅ Usuario ${usuarioData.estamento} creado:`, {
        id: usuario.id,
        usuario: usuario.usuario,
        correo: usuario.correo
      });
    }
    
    console.log('🎉 Seed de datos completado exitosamente');
    console.log('\n📋 Usuarios creados:');
    console.log('👤 admin / admin123 (Administrador)');
    console.log('👤 medicina / medicina123 (Medicina)');
    console.log('👤 enfermeria / enfermeria123 (Enfermería)');
    console.log('👤 kinesiologia / kinesiologia123 (Kinesiología)');
    console.log('👤 tens / tens123 (TENS)');
    console.log('👤 auxiliares / auxiliares123 (Auxiliares)');
    
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedData();
}

module.exports = seedData;

const Usuario = require('./models/Usuario');
const sequelize = require('./config/database');

// Configurar asociaciones
require('./config/associations');

async function testDeleteUsuario() {
  try {
    await sequelize.authenticate();
    
    // Buscar un usuario para eliminar (que no sea administrador)
    const usuario = await Usuario.findOne({
      where: {
        estamento: 'Enfermería' // O cualquier estamento que no sea Administrador
      },
      limit: 1
    });
    
    if (!usuario) {
      return;
    }
    
      id: usuario.id,
      usuario: usuario.usuario,
      nombres: usuario.nombres,
      apellidos: usuario.apellidos,
      estamento: usuario.estamento
    });
    
    // Intentar eliminar el usuario
    await usuario.destroy();
    
  } catch (error) {
    console.error('Error detallado:', {
      message: error.message,
      name: error.name,
      sql: error.sql,
      parent: error.parent,
      original: error.original
    });
    
    if (error.name === 'SequelizeForeignKeyConstraintError') {
    }
  } finally {
    await sequelize.close();
  }
}

testDeleteUsuario();
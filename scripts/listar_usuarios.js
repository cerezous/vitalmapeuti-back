const Usuario = require('./models/Usuario');
const sequelize = require('./config/database');

async function listarUsuarios() {
  try {
    await sequelize.authenticate();
    
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'usuario', 'nombres', 'apellidos', 'estamento'],
      order: [['id', 'ASC']]
    });
    
    usuarios.forEach(usuario => {
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

listarUsuarios();
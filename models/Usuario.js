const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombres: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  apellidos: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  usuario: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 50]
    }
  },
  estamento: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [['Kinesiología', 'Enfermería', 'Medicina', 'Médico', 'Jefatura', 'Administrador', 'Auxiliares', 'TENS']]
    }
  },
  correo: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      isEmail: true,
      len: [5, 100]
    }
  },
  contraseña: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 255]
    }
  }
}, {
  tableName: 'usuarios',
  timestamps: true,
  hooks: {
    beforeCreate: async (usuario) => {
      if (usuario.contraseña) {
        const salt = await bcrypt.genSalt(10);
        usuario.contraseña = await bcrypt.hash(usuario.contraseña, salt);
      }
    },
    beforeUpdate: async (usuario) => {
      if (usuario.changed('contraseña')) {
        const salt = await bcrypt.genSalt(10);
        usuario.contraseña = await bcrypt.hash(usuario.contraseña, salt);
      }
    }
  }
});

// Método para verificar contraseña
Usuario.prototype.verificarContraseña = async function(contraseña) {
  return await bcrypt.compare(contraseña, this.contraseña);
};

module.exports = Usuario;

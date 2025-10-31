const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProcedimientoRegistro = sequelize.define('ProcedimientoRegistro', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  registroId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: true
    }
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  tiempo: {
    type: DataTypes.STRING(5), // Formato HH:MM
    allowNull: false,
    validate: {
      notEmpty: true,
      is: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    }
  },
  pacienteRut: {
    type: DataTypes.STRING(15),
    allowNull: true,
    validate: {
      is: /^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-[0-9kK]$/i
    }
  }
}, {
  tableName: 'procedimientos_registro',
  timestamps: true,
  indexes: [
    {
      fields: ['registroId']
    },
    {
      fields: ['pacienteRut']
    }
  ]
});

module.exports = ProcedimientoRegistro;


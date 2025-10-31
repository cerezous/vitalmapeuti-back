const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RegistroProcedimientosTENS = sequelize.define('RegistroProcedimientosTENS', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: true
    }
  },
  turno: {
    type: DataTypes.ENUM('Día', 'Noche', '24 h'),
    allowNull: false
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  tiempoTotal: {
    type: DataTypes.INTEGER, // Tiempo total en minutos
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      isInt: true
    }
  }
}, {
  tableName: 'registro_procedimientos_tens',
  timestamps: true,
  indexes: [
    {
      fields: ['usuarioId']
    },
    {
      fields: ['fecha']
    },
    {
      fields: ['turno']
    },
    {
      fields: ['fecha', 'turno']
    }
  ]
});

module.exports = RegistroProcedimientosTENS;
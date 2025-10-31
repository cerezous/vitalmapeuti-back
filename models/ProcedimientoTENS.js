const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProcedimientoTENS = sequelize.define('ProcedimientoTENS', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  registroId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'RegistroProcedimientosTENS',
      key: 'id'
    }
  },
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  tiempo: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  pacienteRut: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'procedimientos_tens',
  timestamps: true
});

module.exports = ProcedimientoTENS;
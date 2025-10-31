const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProcedimientoSistema = sequelize.define('ProcedimientoSistema', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  descripcion: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  estamento: {
    type: DataTypes.ENUM('Enfermería', 'Kinesiología', 'Medicina', 'TENS', 'Auxiliar'),
    allowNull: false
  },
  tiempoEstimado: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Tiempo estimado en minutos'
  },
  requierePaciente: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Si el procedimiento requiere un paciente específico'
  },
  activo: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  orden: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0,
    comment: 'Orden de aparición en los selects'
  }
}, {
  tableName: 'procedimientos_sistema',
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = ProcedimientoSistema;

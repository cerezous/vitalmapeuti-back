const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Egreso = sequelize.define('Egreso', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pacienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'pacientes',
      key: 'id'
    }
  },
  nombreCompleto: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  rut: {
    type: DataTypes.STRING(15),
    allowNull: false
  },
  numeroFicha: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  edad: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  camaAsignada: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  fechaIngresoUTI: {
    type: DataTypes.DATE,
    allowNull: false
  },
  fechaEgresoUTI: {
    type: DataTypes.DATE,
    allowNull: false
  },
  motivoEgreso: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isIn: [['Alta médica', 'Traslado dentro de UPC', 'Traslado a UCM o fuera de UPC', 'Traslado a extrasistema', 'Fallecimiento']]
    }
  },
  diasEstadia: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'egresos',
  timestamps: true
});

module.exports = Egreso;


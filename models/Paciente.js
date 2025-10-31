const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Paciente = sequelize.define('Paciente', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nombreCompleto: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [5, 200]
    }
  },
  rut: {
    type: DataTypes.STRING(15), // Aumentar tamaño para permitir puntos
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [8, 15],
      is: /^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-[0-9kK]$/i // Formato RUT chileno con o sin puntos
    }
  },
  numeroFicha: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [1, 20]
    }
  },
  edad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 150,
      isInt: true
    }
  },
  fechaIngresoUTI: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true,
      notFuture: function(value) {
        const today = new Date();
        today.setHours(23, 59, 59, 999); // Permitir hasta el final del día actual
        if (new Date(value) > today) {
          throw new Error('La fecha de ingreso no puede ser futura');
        }
      }
    }
  },
  fechaEgresoUTI: {
    type: DataTypes.DATE,
    allowNull: true, // Puede ser null si el paciente aún está en UTI
    validate: {
      isDate: true,
      isAfter: function() {
        return this.fechaIngresoUTI;
      }
    }
  },
  reingresos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      isInt: true
    }
  },
  camaAsignada: {
    type: DataTypes.INTEGER,
    allowNull: true, // Puede ser null si no se asigna cama específica
    validate: {
      min: 1,
      max: 27,
      isInt: true
    }
  }
}, {
  tableName: 'pacientes',
  timestamps: true,
  hooks: {
    beforeValidate: (paciente) => {
      // Validar que fecha de egreso sea posterior o igual a fecha de ingreso
      if (paciente.fechaEgresoUTI && paciente.fechaIngresoUTI) {
        if (new Date(paciente.fechaEgresoUTI) < new Date(paciente.fechaIngresoUTI)) {
          throw new Error('La fecha de egreso no puede ser anterior a la fecha de ingreso');
        }
      }
    }
  }
});

// Método para verificar si el paciente está actualmente en UTI
Paciente.prototype.estaEnUTI = function() {
  return this.fechaEgresoUTI === null;
};

// Método para calcular días de estadía
Paciente.prototype.diasEstadia = function() {
  const fechaFin = this.fechaEgresoUTI || new Date();
  const fechaInicio = new Date(this.fechaIngresoUTI);
  const diffTime = Math.abs(fechaFin - fechaInicio);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

module.exports = Paciente;

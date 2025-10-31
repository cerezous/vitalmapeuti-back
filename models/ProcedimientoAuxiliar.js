const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProcedimientoAuxiliar = sequelize.define('ProcedimientoAuxiliar', {
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
    },
    references: {
      model: 'usuarios',
      key: 'id'
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
  nombre: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
      // La validación de lista permitida se hace con getProcedimientosValidos() en rutas si aplica
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
    allowNull: true, // Algunos procedimientos no requieren paciente específico
    validate: {
      is: /^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-[0-9kK]$/i
    },
    references: {
      model: 'pacientes',
      key: 'rut'
    }
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'procedimientos_auxiliares',
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
      fields: ['nombre']
    },
    {
      fields: ['pacienteRut']
    },
    {
      fields: ['fecha', 'turno']
    },
    {
      fields: ['usuarioId', 'fecha']
    }
  ]
});

// Método estático para validar si un procedimiento requiere paciente
// Todos los procedimientos auxiliares ya no requieren paciente específico
ProcedimientoAuxiliar.requierePaciente = function(nombreProcedimiento) {
  return false; // Ningún procedimiento auxiliar requiere paciente
};

// Método estático para obtener lista de procedimientos válidos
ProcedimientoAuxiliar.getProcedimientosValidos = function() {
  // Debe coincidir con frontend/src/services/auxiliaresAPI.ts (getProcedimientosValidos)
  return [
    'Entrega de turno',
    'Recepción de turno',
    'Aseo terminal (se debe registrar 1 por 1)',
    'Entrega de interconsulta (se debe registrar 1 por 1)',
    'Entrega de exámenes (se debe registrar 1 por 1)',
    'Entrega de recetas / recepción de fármacos (trayecto hacia y desde farmacia - (se debe registrar 1 por 1))',
    'Aseo diurno (registrar tiempo total)',
    'Aseo nocturno (registrar tiempo total)',
    'Aseo de equipos',
    'Preparación de material',
    'Traslados de paciente (se debe registrar 1 por 1)',
    'Traslados a procedimientos (se debe registrar 1 por 1)',
    'Recepción / entrega de ropa (se debe registrar 1 por 1)',
    'Reposición de insumos (para diurnos incluye traslados a bodega'
  ];
};

module.exports = ProcedimientoAuxiliar;

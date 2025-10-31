const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProcedimientoMedicina = sequelize.define('ProcedimientoMedicina', {
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
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      isIn: [['24 h', '22 h', '12 h']]
    }
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
      // La validación de procedimientos válidos se hace en las rutas usando getProcedimientosValidos()
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
    allowNull: true, // Algunos procedimientos médicos no requieren paciente específico
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
  tableName: 'procedimientos_medicina',
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
ProcedimientoMedicina.requierePaciente = function(nombreProcedimiento) {
  // Debe estar alineado con el frontend (medicinaAPI.requierePaciente)
  const procedimientosSinPaciente = [
    'Tareas administrativas (evoluciones, revisión de HC, indicaciones, recetas, etc)',
    'Logística (solicitud de insumos o situación similar por la cual se debe retrasar un procedimiento)',
    'Interconsulta (lectura de HC, evaluación/reevaluación, evolución)',
    'Entrega de turno',
    'Recepción de turno',
    'Discusión con especialidades',
    'Visita clínica',
    'Redacción de licencia médica'
  ];
  return !procedimientosSinPaciente.includes(nombreProcedimiento);
};

// Método estático para obtener procedimientos válidos
ProcedimientoMedicina.getProcedimientosValidos = function() {
  // Debe coincidir con frontend/src/services/medicinaAPI.ts (getProcedimientosValidos)
  return [
    // Procedimientos habituales de medicina
    'Tareas administrativas (evoluciones, revisión de HC, indicaciones, recetas, etc)',
    'Logística (solicitud de insumos o situación similar por la cual se debe retrasar un procedimiento)',
    'Informe médico (redacción para traslados)',
    'Egreso (redacción de egreso, indicaciones, etc)',
    'Entrega de turno',
    'Recepción de turno',
    'Discusión con especialidades',
    'Visita clínica',
    'Redacción de licencia médica',
    'Desfibrilación o cardioversión',
    'Ingreso (redacción de ingreso, evaluación y procedimientos correspondientes)',
    'Instalación CHD',
    'Instalación CVC',
    'Interconsulta (lectura de HC, evaluación/reevaluación, evolución)',
    'IOT',
    'PCR (incluye IOT por PCR)',

    // Otros procedimientos (requieren paciente)
    'Cambio de TQT',
    'Colonoscopía (indicación de sedación y/o supervisión)',
    'Decanulación',
    'Ecografía',
    'Endoscopía (indicación de sedación y/o supervisión)',
    'Endoscopía + Colonoscopía (indicación de sedación y/o supervisión)',
    'Fibrobroncoscopía (indicación de sedación, supervisión o realización del procedimiento)',
    'Instalación de Cistotomia (indicación de sedación/analgesia o supervisión)',
    'Instalación de gastrotomía (indicación de sedación y/o supervisión)',
    'Instalación de SNY (indicación de sedación y/o supervisión)',
    'Instalación de TQT',
    'Instalación de tunelizado (indicación de sedación y/o supervisión)',
    'Instalación LA',
    'Instalación PICCLINE',
    'Mielograma (indicación de analgesia, supervisión o realización del procedimiento)',
    'Paracentesís (supervisión o realización del procedimiento)',
    'Punción lumbar (indicación de sedación, supervisión o realización del procedimiento)',
    'Toracocentesís (indicación de sedación/analgesia, supervisión o realización del procedimiento)'
  ];
};

module.exports = ProcedimientoMedicina;

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Paciente = require('./Paciente');
const Usuario = require('./Usuario');

const ProcedimientoKinesiologia = sequelize.define('ProcedimientoKinesiologia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pacienteRut: {
    type: DataTypes.STRING(12),
    allowNull: true, // Permitir NULL para procedimientos generales (entrega de turno, administrativos)
    references: {
      model: 'pacientes',
      key: 'rut'
    }
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  },
  nombre: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true,
      isIn: [[
        // Kinesiología principales (ambas variantes donde aplica)
        'Tareas administrativas (evoluciones, estadísticas, etc)',
        'Tareas administrativas (evoluciones, estadísticas, reuniones clínicas, etc)',
        'Recepción de turno',
        'Entrega de turno',
        'Entrega de turno (solo cuando se recibe turno)',
        'Kinesiterapia respiratoria (Ev, KTR, EMR, etc)',
        'Kinesiterapia respiratoria (Ev, KTR, EMR, instalación de oxigenoterapia, etc)',
        'Kinesiterapia motora',
        'Kinesiterapia integral (respiratorio + motor)',
        'Ingreso (recepción y evaluación del paciente)',
        'Traslado a otra unidad',
        'Cultivo de secreción bronquial',
        'Film array respiratorio',
        'Baciloscopía',
        'Instalación de VMNI',
        'Instalación de CNAF',
        'IOT',
        'PCR',
        'PCR (incluye IOT por PCR)',
        'Instalación de TQT',
        'Cambio de TQT',
        'Decanulación',

        // Otros procedimientos (compartidos)
        'Asistencia en aseos (general o parcial)',
        'Instalación VVP',
        'Instalación CVC',
        'Instalación CHD',
        'Instalación LA',
        'Instalación PICCLINE',
        'Instalación de tunelizado',
        'Instalación de Cistotomia',
        'Instalación de Sonda Foley',
        'Instalación de Sonda rectal',
        'Instalación de gastrotomía',
        'Instalación de SNG',
        'Instalación de SNY',
        'Toma de exámenes',
        'Hemocultivos',
        'TAC simple',
        'TAC con contraste',
        'RMN',
        'RMN con traslado a BUPA',
        'Electrocardiograma',
        'MAKI',
        'Premeditación QMT',
        'Cateterismo vesical',
        'Endoscopía',
        'Colonoscopía',
        'Endoscopía + Colonoscopía',
        'Fibrobroncoscopía',
        'Ecografía',
        'Radiografía',
        'Toracocentesís',
        'Paracentesís',
        'Punción lumbar',
        'Mielograma',
        'Traslado a pabellón',
        'Curación simple',
        'Diálisis',
        'Curación avanzada',
        'Evaluación de enfermería'
      ]]
    }
  },
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notEmpty: true,
      isDate: true
    }
  },
  turno: {
    type: DataTypes.ENUM('Día', 'Noche'),
    allowNull: true,
    defaultValue: null
  },
  tiempo: {
    type: DataTypes.STRING(5), // Formato HH:MM
    allowNull: false,
    validate: {
      notEmpty: true,
      is: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ // Validar formato HH:MM
    }
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'procedimientos_kinesiologia',
  timestamps: true,
  indexes: [
    {
      fields: ['pacienteRut']
    },
    {
      fields: ['usuarioId']
    },
    {
      fields: ['fecha']
    }
  ]
});

module.exports = ProcedimientoKinesiologia;
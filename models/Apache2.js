const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Apache2 = sequelize.define('Apache2', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // Referencia al paciente (foreign key)
  pacienteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Pacientes',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },

  // Scores individuales de APACHE II
  temperatura: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 4,
      isInt: true
    }
  },
  
  presionArterial: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 4,
      isInt: true
    }
  },
  
  frecuenciaCardiaca: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 4,
      isInt: true
    }
  },
  
  frecuenciaRespiratoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 4,
      isInt: true
    }
  },
  
  oxigenacion: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 4,
      isInt: true
    }
  },
  
  phArterial: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 4,
      isInt: true
    }
  },
  
  sodio: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 4,
      isInt: true
    }
  },
  
  potasio: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 4,
      isInt: true
    }
  },
  
  creatinina: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 4,
      isInt: true
    }
  },
  
  hematocrito: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 4,
      isInt: true
    }
  },
  
  leucocitos: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 4,
      isInt: true
    }
  },
  
  glasgow: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 4,
      isInt: true
    }
  },
  
  edad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 6,
      isInt: true
    }
  },
  
  enfermedadCronica: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5,
      isInt: true
    }
  },

  // Puntaje total calculado
  puntajeTotal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 71, // Máximo teórico APACHE II
      isInt: true
    }
  },

  // Porcentaje de riesgo de mortalidad
  riesgoMortalidad: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: '0%',
    validate: {
      notEmpty: true,
      is: /^\d{1,2}%$/ // Formato: número seguido de %
    }
  },

  // Nivel de riesgo (textual)
  nivelRiesgo: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Bajo',
    validate: {
      notEmpty: true,
      isIn: [['Bajo', 'Bajo-Moderado', 'Moderado', 'Alto', 'Muy Alto', 'Crítico', 'Extremo']]
    }
  },

  // Información adicional sobre los rangos seleccionados (JSON)
  rangosSeleccionados: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Almacena los rangos específicos seleccionados para cada parámetro'
  },

  // Usuario que realizó la evaluación
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Opcional por ahora
    references: {
      model: 'Usuarios',
      key: 'id'
    }
  },

  // Fecha y hora de la evaluación
  fechaEvaluacion: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isDate: true
    }
  },

  // Observaciones adicionales
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: [0, 1000] // Máximo 1000 caracteres
    }
  }

}, {
  tableName: 'apache2',
  timestamps: true, // Añade createdAt y updatedAt automáticamente
  indexes: [
    {
      fields: ['pacienteId']
    },
    {
      fields: ['fechaEvaluacion']
    },
    {
      fields: ['puntajeTotal']
    },
    {
      fields: ['nivelRiesgo']
    }
  ]
});

// Hook para calcular automáticamente el puntaje total antes de guardar
Apache2.addHook('beforeSave', (apache2, options) => {
  // Calcular puntaje total
  apache2.puntajeTotal = 
    apache2.temperatura + 
    apache2.presionArterial + 
    apache2.frecuenciaCardiaca + 
    apache2.frecuenciaRespiratoria + 
    apache2.oxigenacion + 
    apache2.phArterial + 
    apache2.sodio + 
    apache2.potasio + 
    apache2.creatinina + 
    apache2.hematocrito + 
    apache2.leucocitos + 
    apache2.glasgow + 
    apache2.edad + 
    apache2.enfermedadCronica;

  // Calcular riesgo de mortalidad basado en el puntaje total
  const score = apache2.puntajeTotal;
  let risk, level;

  if (score <= 4) {
    risk = '4%';
    level = 'Bajo';
  } else if (score <= 9) {
    risk = '8%';
    level = 'Bajo-Moderado';
  } else if (score <= 14) {
    risk = '15%';
    level = 'Moderado';
  } else if (score <= 19) {
    risk = '25%';
    level = 'Alto';
  } else if (score <= 24) {
    risk = '40%';
    level = 'Muy Alto';
  } else if (score <= 29) {
    risk = '55%';
    level = 'Crítico';
  } else if (score <= 34) {
    risk = '73%';
    level = 'Crítico';
  } else {
    risk = '85%';
    level = 'Extremo';
  }

  apache2.riesgoMortalidad = risk;
  apache2.nivelRiesgo = level;
});

module.exports = Apache2;
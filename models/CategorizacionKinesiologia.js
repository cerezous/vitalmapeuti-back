const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CategorizacionKinesiologia = sequelize.define('CategorizacionKinesiologia', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pacienteRut: {
    type: DataTypes.STRING(15),
    allowNull: false,
    validate: {
      notEmpty: true,
      is: /^[0-9]{1,2}\.?[0-9]{3}\.?[0-9]{3}-[0-9kK]$/i
    }
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isInt: true
    }
  },
  fechaCategorizacion: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: true
    }
  },
  patronRespiratorio: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isIn: [[1, 3, 5]]
    }
  },
  asistenciaVentilatoria: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isIn: [[1, 3, 5]]
    }
  },
  sasGlasgow: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isIn: [[1, 3, 5]]
    }
  },
  tosSecreciones: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isIn: [[1, 3, 5]]
    }
  },
  asistencia: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      isIn: [[1, 3, 5]]
    }
  },
  puntajeTotal: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 5,
      max: 25,
      isInt: true
    }
  },
  complejidad: {
    type: DataTypes.ENUM('Baja', 'Mediana', 'Alta'),
    allowNull: false
  },
  cargaAsistencial: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  observaciones: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'categorizaciones_kinesiologia',
  timestamps: true,
  indexes: [
    {
      fields: ['pacienteRut']
    },
    {
      fields: ['usuarioId']
    },
    {
      fields: ['fechaCategorizacion']
    },
    {
      fields: ['pacienteRut', 'fechaCategorizacion']
    }
  ]
});

// Método para calcular complejidad basado en puntaje
CategorizacionKinesiologia.calcularComplejidad = function(puntaje) {
  if (puntaje === 5) {
    return { complejidad: 'Baja', cargaAsistencial: '0-1' };
  } else if (puntaje >= 6 && puntaje <= 10) {
    return { complejidad: 'Mediana', cargaAsistencial: '2-3 + Noche' };
  } else if (puntaje >= 11) {
    return { complejidad: 'Alta', cargaAsistencial: '3-4 + Noche' };
  }
  return { complejidad: '', cargaAsistencial: '' };
};

module.exports = CategorizacionKinesiologia;
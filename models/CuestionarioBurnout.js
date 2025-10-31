const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CuestionarioBurnout = sequelize.define('CuestionarioBurnout', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  usuarioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Usuarios',
      key: 'id'
    }
  },
  estamento: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fechaRespuesta: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  // Respuestas individuales
  p1: { type: DataTypes.INTEGER, allowNull: false },
  p2: { type: DataTypes.INTEGER, allowNull: false },
  p3: { type: DataTypes.INTEGER, allowNull: false },
  p4: { type: DataTypes.INTEGER, allowNull: false },
  p5: { type: DataTypes.INTEGER, allowNull: false },
  p6: { type: DataTypes.INTEGER, allowNull: false },
  p7: { type: DataTypes.INTEGER, allowNull: false },
  p8: { type: DataTypes.INTEGER, allowNull: false },
  p9: { type: DataTypes.INTEGER, allowNull: false },
  p10: { type: DataTypes.INTEGER, allowNull: false },
  p11: { type: DataTypes.INTEGER, allowNull: false },
  p12: { type: DataTypes.INTEGER, allowNull: false },
  p13: { type: DataTypes.INTEGER, allowNull: false },
  p14: { type: DataTypes.INTEGER, allowNull: false },
  p15: { type: DataTypes.INTEGER, allowNull: false },
  p16: { type: DataTypes.INTEGER, allowNull: false },
  p17: { type: DataTypes.INTEGER, allowNull: false },
  p18: { type: DataTypes.INTEGER, allowNull: false },
  p19: { type: DataTypes.INTEGER, allowNull: false },
  p20: { type: DataTypes.INTEGER, allowNull: false },
  p21: { type: DataTypes.INTEGER, allowNull: false },
  p22: { type: DataTypes.INTEGER, allowNull: false },
  // Puntajes calculados
  agotamientoEmocional: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  despersonalizacion: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  realizacionPersonal: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // Interpretación de resultados
  nivelAgotamiento: {
    type: DataTypes.ENUM('bajo', 'medio', 'alto'),
    allowNull: false
  },
  nivelDespersonalizacion: {
    type: DataTypes.ENUM('bajo', 'medio', 'alto'),
    allowNull: false
  },
  nivelRealizacion: {
    type: DataTypes.ENUM('bajo', 'medio', 'alto'),
    allowNull: false
  }
}, {
  tableName: 'CuestionarioBurnout',
  timestamps: true
});

// Métodos estáticos para cálculos
CuestionarioBurnout.calcularPuntajes = (respuestas) => {
  // Agotamiento Emocional: preguntas 1,2,3,6,8,13,14,16,20
  const agotamientoEmocional = [1,2,3,6,8,13,14,16,20].reduce((sum, num) => 
    sum + (respuestas[`p${num}`] || 0), 0
  );
  
  // Despersonalización: preguntas 5,10,11,15,22
  const despersonalizacion = [5,10,11,15,22].reduce((sum, num) => 
    sum + (respuestas[`p${num}`] || 0), 0
  );
  
  // Realización Personal: preguntas 4,7,9,12,17,18,19,21
  const realizacionPersonal = [4,7,9,12,17,18,19,21].reduce((sum, num) => 
    sum + (respuestas[`p${num}`] || 0), 0
  );

  return {
    agotamientoEmocional,
    despersonalizacion,
    realizacionPersonal
  };
};

CuestionarioBurnout.interpretarNiveles = (agotamientoEmocional, despersonalizacion, realizacionPersonal) => {
  // Interpretación según estándares MBI
  let nivelAgotamiento = 'bajo';
  if (agotamientoEmocional >= 41) nivelAgotamiento = 'alto';
  else if (agotamientoEmocional >= 27) nivelAgotamiento = 'medio';

  let nivelDespersonalizacion = 'bajo';
  if (despersonalizacion >= 15) nivelDespersonalizacion = 'alto';
  else if (despersonalizacion >= 9) nivelDespersonalizacion = 'medio';

  let nivelRealizacion = 'alto';
  if (realizacionPersonal <= 30) nivelRealizacion = 'bajo';
  else if (realizacionPersonal <= 38) nivelRealizacion = 'medio';

  return {
    nivelAgotamiento,
    nivelDespersonalizacion,
    nivelRealizacion
  };
};

module.exports = CuestionarioBurnout;

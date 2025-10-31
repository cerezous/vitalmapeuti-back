'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('CuestionarioBurnout', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      estamento: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Estamento del usuario al momento de responder el cuestionario'
      },
      fechaRespuesta: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      // Respuestas individuales (p1 a p22)
      p1: { type: Sequelize.INTEGER, allowNull: false },
      p2: { type: Sequelize.INTEGER, allowNull: false },
      p3: { type: Sequelize.INTEGER, allowNull: false },
      p4: { type: Sequelize.INTEGER, allowNull: false },
      p5: { type: Sequelize.INTEGER, allowNull: false },
      p6: { type: Sequelize.INTEGER, allowNull: false },
      p7: { type: Sequelize.INTEGER, allowNull: false },
      p8: { type: Sequelize.INTEGER, allowNull: false },
      p9: { type: Sequelize.INTEGER, allowNull: false },
      p10: { type: Sequelize.INTEGER, allowNull: false },
      p11: { type: Sequelize.INTEGER, allowNull: false },
      p12: { type: Sequelize.INTEGER, allowNull: false },
      p13: { type: Sequelize.INTEGER, allowNull: false },
      p14: { type: Sequelize.INTEGER, allowNull: false },
      p15: { type: Sequelize.INTEGER, allowNull: false },
      p16: { type: Sequelize.INTEGER, allowNull: false },
      p17: { type: Sequelize.INTEGER, allowNull: false },
      p18: { type: Sequelize.INTEGER, allowNull: false },
      p19: { type: Sequelize.INTEGER, allowNull: false },
      p20: { type: Sequelize.INTEGER, allowNull: false },
      p21: { type: Sequelize.INTEGER, allowNull: false },
      p22: { type: Sequelize.INTEGER, allowNull: false },
      // Puntajes calculados por dimensión
      agotamientoEmocional: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Puntaje de agotamiento emocional (preguntas 1,2,3,6,8,13,14,16,20)'
      },
      despersonalizacion: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Puntaje de despersonalización (preguntas 5,10,11,15,22)'
      },
      realizacionPersonal: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Puntaje de realización personal (preguntas 4,7,9,12,17,18,19,21)'
      },
      // Interpretación de resultados
      nivelAgotamiento: {
        type: Sequelize.ENUM('bajo', 'medio', 'alto'),
        allowNull: false
      },
      nivelDespersonalizacion: {
        type: Sequelize.ENUM('bajo', 'medio', 'alto'),
        allowNull: false
      },
      nivelRealizacion: {
        type: Sequelize.ENUM('bajo', 'medio', 'alto'),
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Agregar índices para mejorar el rendimiento
    await queryInterface.addIndex('CuestionarioBurnout', ['usuarioId']);
    await queryInterface.addIndex('CuestionarioBurnout', ['fechaRespuesta']);
    await queryInterface.addIndex('CuestionarioBurnout', ['estamento']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('CuestionarioBurnout');
  }
};

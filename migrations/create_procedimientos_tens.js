const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Crear tabla registro_procedimientos_tens
    await queryInterface.createTable('registro_procedimientos_tens', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      turno: {
        type: DataTypes.ENUM('Día', 'Noche'),
        allowNull: false
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      tiempoTotal: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Tiempo total en minutos'
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      }
    });

    // Crear tabla procedimientos_tens
    await queryInterface.createTable('procedimientos_tens', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      registroId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'registro_procedimientos_tens',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nombre: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      tiempo: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      pacienteRut: {
        type: DataTypes.STRING(20),
        allowNull: true,
        references: {
          model: 'pacientes',
          key: 'rut'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false
      }
    });

    // Crear índices para mejorar rendimiento
    await queryInterface.addIndex('registro_procedimientos_tens', ['usuarioId']);
    await queryInterface.addIndex('registro_procedimientos_tens', ['fecha']);
    await queryInterface.addIndex('registro_procedimientos_tens', ['turno']);
    await queryInterface.addIndex('procedimientos_tens', ['registroId']);
    await queryInterface.addIndex('procedimientos_tens', ['pacienteRut']);
  },

  down: async (queryInterface, Sequelize) => {
    // Eliminar tablas en orden inverso debido a las foreign keys
    await queryInterface.dropTable('procedimientos_tens');
    await queryInterface.dropTable('registro_procedimientos_tens');
  }
};
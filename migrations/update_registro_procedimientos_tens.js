const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Modificar la columna turno para incluir '24 h'
      await queryInterface.changeColumn('registro_procedimientos_tens', 'turno', {
        type: DataTypes.ENUM('Día', 'Noche', '24 h'),
        allowNull: false
      });

      // Modificar la columna tiempoTotal para agregar validaciones
      await queryInterface.changeColumn('registro_procedimientos_tens', 'tiempoTotal', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Tiempo total en minutos'
      });

      // Agregar índices si no existen
      try {
        await queryInterface.addIndex('registro_procedimientos_tens', ['usuarioId'], {
          name: 'registro_procedimientos_tens_usuarioId'
        });
      } catch (error) {
      }

      try {
        await queryInterface.addIndex('registro_procedimientos_tens', ['fecha'], {
          name: 'registro_procedimientos_tens_fecha'
        });
      } catch (error) {
      }

      try {
        await queryInterface.addIndex('registro_procedimientos_tens', ['turno'], {
          name: 'registro_procedimientos_tens_turno'
        });
      } catch (error) {
      }

      try {
        await queryInterface.addIndex('registro_procedimientos_tens', ['fecha', 'turno'], {
          name: 'registro_procedimientos_tens_fecha_turno'
        });
      } catch (error) {
      }


    } catch (error) {
      console.error('Error durante la migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Revertir la columna turno
      await queryInterface.changeColumn('registro_procedimientos_tens', 'turno', {
        type: DataTypes.ENUM('Día', 'Noche'),
        allowNull: false
      });

      // Eliminar índices
      await queryInterface.removeIndex('registro_procedimientos_tens', 'registro_procedimientos_tens_usuarioId');
      await queryInterface.removeIndex('registro_procedimientos_tens', 'registro_procedimientos_tens_fecha');
      await queryInterface.removeIndex('registro_procedimientos_tens', 'registro_procedimientos_tens_turno');
      await queryInterface.removeIndex('registro_procedimientos_tens', 'registro_procedimientos_tens_fecha_turno');

    } catch (error) {
      console.error('Error durante la reversión de migración:', error);
      throw error;
    }
  }
};
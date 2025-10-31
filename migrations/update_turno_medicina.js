// Migración para actualizar las opciones de turno en ProcedimientoMedicina
// Cambia de ('Día', 'Noche', '24 h') a ('24 h', '22 h', '12 h')

const { Sequelize } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Primero, agregar una columna temporal para almacenar los valores convertidos
      await queryInterface.addColumn('procedimientos_medicina', 'turno_temp', {
        type: Sequelize.ENUM('24 h', '22 h', '12 h'),
        allowNull: true
      }, { transaction });

      // Convertir los valores existentes
      // Día -> 12 h
      await queryInterface.sequelize.query(`
        UPDATE "procedimientos_medicina" 
        SET turno_temp = '12 h' 
        WHERE turno = 'Día'
      `, { transaction });

      // Noche -> 12 h  
      await queryInterface.sequelize.query(`
        UPDATE "procedimientos_medicina" 
        SET turno_temp = '12 h' 
        WHERE turno = 'Noche'
      `, { transaction });

      // 24 h -> 24 h (se mantiene igual)
      await queryInterface.sequelize.query(`
        UPDATE "procedimientos_medicina" 
        SET turno_temp = '24 h' 
        WHERE turno = '24 h'
      `, { transaction });

      // Eliminar la columna original
      await queryInterface.removeColumn('procedimientos_medicina', 'turno', { transaction });

      // Renombrar la columna temporal
      await queryInterface.renameColumn('procedimientos_medicina', 'turno_temp', 'turno', { transaction });

      // Hacer la columna NOT NULL
      await queryInterface.changeColumn('procedimientos_medicina', 'turno', {
        type: Sequelize.ENUM('24 h', '22 h', '12 h'),
        allowNull: false
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en migración:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Revertir los cambios
      await queryInterface.addColumn('procedimientos_medicina', 'turno_temp', {
        type: Sequelize.ENUM('Día', 'Noche', '24 h'),
        allowNull: true
      }, { transaction });

      // Convertir los valores de vuelta
      await queryInterface.sequelize.query(`
        UPDATE "procedimientos_medicina" 
        SET turno_temp = 'Día' 
        WHERE turno = '12 h'
      `, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE "procedimientos_medicina" 
        SET turno_temp = '24 h' 
        WHERE turno = '24 h'
      `, { transaction });

      await queryInterface.sequelize.query(`
        UPDATE "procedimientos_medicina" 
        SET turno_temp = '12 h' 
        WHERE turno = '22 h'
      `, { transaction });

      await queryInterface.removeColumn('procedimientos_medicina', 'turno', { transaction });
      await queryInterface.renameColumn('procedimientos_medicina', 'turno_temp', 'turno', { transaction });

      await queryInterface.changeColumn('procedimientos_medicina', 'turno', {
        type: Sequelize.ENUM('Día', 'Noche', '24 h'),
        allowNull: false
      }, { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Error en rollback:', error);
      throw error;
    }
  }
};
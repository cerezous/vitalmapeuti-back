const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

async function migrate() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    // Verificar si la tabla ya existe
    const tables = await queryInterface.showAllTables();
    if (tables.includes('procedimientos_medicina')) {
      return;
    }

    
    await queryInterface.createTable('procedimientos_medicina', {
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
        onDelete: 'RESTRICT'
      },
      turno: {
        type: DataTypes.ENUM('Día', 'Noche', '24 h'),
        allowNull: false
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      nombre: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      tiempo: {
        type: DataTypes.STRING(5), // Formato HH:MM
        allowNull: false
      },
      pacienteRut: {
        type: DataTypes.STRING(15),
        allowNull: true,
        references: {
          model: 'pacientes',
          key: 'rut'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    });

    // Crear índices
    await queryInterface.addIndex('procedimientos_medicina', ['usuarioId'], {
      name: 'procedimientos_medicina_usuarioId_idx'
    });
    
    await queryInterface.addIndex('procedimientos_medicina', ['fecha'], {
      name: 'procedimientos_medicina_fecha_idx'
    });
    
    await queryInterface.addIndex('procedimientos_medicina', ['turno'], {
      name: 'procedimientos_medicina_turno_idx'
    });
    
    await queryInterface.addIndex('procedimientos_medicina', ['nombre'], {
      name: 'procedimientos_medicina_nombre_idx'
    });
    
    await queryInterface.addIndex('procedimientos_medicina', ['pacienteRut'], {
      name: 'procedimientos_medicina_pacienteRut_idx'
    });
    
    await queryInterface.addIndex('procedimientos_medicina', ['fecha', 'turno'], {
      name: 'procedimientos_medicina_fecha_turno_idx'
    });
    
    await queryInterface.addIndex('procedimientos_medicina', ['usuarioId', 'fecha'], {
      name: 'procedimientos_medicina_usuarioId_fecha_idx'
    });

    
  } catch (error) {
    console.error('❌ Error al crear tabla procedimientos_medicina:', error);
    throw error;
  }
}

async function rollback() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    await queryInterface.dropTable('procedimientos_medicina');
  } catch (error) {
    console.error('❌ Error al eliminar tabla procedimientos_medicina:', error);
    throw error;
  }
}

async function checkMigrationNeeded() {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  return !tables.includes('procedimientos_medicina');
}

module.exports = {
  migrate,
  rollback,
  checkMigrationNeeded,
  description: 'Crear tabla procedimientos_medicina para separar procedimientos médicos'
};

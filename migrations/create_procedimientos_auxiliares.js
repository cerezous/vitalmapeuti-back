// Migración para crear la tabla procedimientos_auxiliares

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

async function migrate() {
  try {

    // Crear la tabla procedimientos_auxiliares
    await sequelize.getQueryInterface().createTable('procedimientos_auxiliares', {
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
        }
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
        allowNull: true, // Algunos procedimientos no requieren paciente específico
        references: {
          model: 'pacientes',
          key: 'rut'
        }
      },
      observaciones: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });

    // Crear índices para mejorar el rendimiento
    await sequelize.getQueryInterface().addIndex('procedimientos_auxiliares', ['usuarioId'], {
      name: 'idx_procedimientos_auxiliares_usuario'
    });

    await sequelize.getQueryInterface().addIndex('procedimientos_auxiliares', ['fecha'], {
      name: 'idx_procedimientos_auxiliares_fecha'
    });

    await sequelize.getQueryInterface().addIndex('procedimientos_auxiliares', ['turno'], {
      name: 'idx_procedimientos_auxiliares_turno'
    });

    await sequelize.getQueryInterface().addIndex('procedimientos_auxiliares', ['nombre'], {
      name: 'idx_procedimientos_auxiliares_nombre'
    });

    await sequelize.getQueryInterface().addIndex('procedimientos_auxiliares', ['pacienteRut'], {
      name: 'idx_procedimientos_auxiliares_paciente'
    });

    await sequelize.getQueryInterface().addIndex('procedimientos_auxiliares', ['fecha', 'turno'], {
      name: 'idx_procedimientos_auxiliares_fecha_turno'
    });

    await sequelize.getQueryInterface().addIndex('procedimientos_auxiliares', ['usuarioId', 'fecha'], {
      name: 'idx_procedimientos_auxiliares_usuario_fecha'
    });


  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

// Función para revertir la migración
async function rollback() {
  try {

    // Eliminar tabla
    await sequelize.getQueryInterface().dropTable('procedimientos_auxiliares');


  } catch (error) {
    console.error('❌ Error durante el rollback:', error);
    throw error;
  }
}

// Verificar si necesitamos ejecutar la migración
async function checkMigrationNeeded() {
  try {
    const tables = await sequelize.getQueryInterface().showAllTables();
    return !tables.includes('procedimientos_auxiliares'); // Retorna true si no existe la tabla
  } catch (error) {
    console.error('Error al verificar tablas:', error);
    return true; // Si hay error, asumimos que necesitamos migrar
  }
}

module.exports = {
  migrate,
  rollback,
  checkMigrationNeeded
};

// Si se ejecuta directamente
if (require.main === module) {
  const action = process.argv[2];
  
  if (action === 'rollback') {
    rollback()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    checkMigrationNeeded()
      .then(needed => {
        if (needed) {
          return migrate();
        } else {
        }
      })
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

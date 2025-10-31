// Migración para agregar el campo 'estamento' a la tabla registros_procedimientos
// y actualizar registros existentes

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

async function migrate() {
  try {

    // 1. Agregar la columna estamento si no existe
    await sequelize.getQueryInterface().addColumn('registros_procedimientos', 'estamento', {
      type: DataTypes.STRING(50),
      allowNull: true, // Temporalmente permitir null para registros existentes
      validate: {
        notEmpty: true,
        isIn: [['Kinesiología', 'Enfermería', 'Medicina', 'Auxiliares']]
      }
    });

    // 2. Actualizar registros existentes basándose en el estamento del usuario
    const RegistroProcedimientos = require('../models/RegistroProcedimientos');
    const Usuario = require('../models/Usuario');
    
    // Cargar asociaciones
    require('../config/associations');
    
    // Cargar todos los registros existentes con sus usuarios
    const registros = await RegistroProcedimientos.findAll({
      include: [{
        model: Usuario,
        as: 'usuario',
        attributes: ['estamento']
      }]
    });


    for (const registro of registros) {
      if (registro.usuario && registro.usuario.estamento) {
        await registro.update({
          estamento: registro.usuario.estamento
        });
      } else {
        // Si no podemos determinar el estamento, usar 'Enfermería' como valor por defecto
        await registro.update({
          estamento: 'Enfermería'
        });
      }
    }

    // 3. Cambiar la columna para que no permita NULL
    await sequelize.getQueryInterface().changeColumn('registros_procedimientos', 'estamento', {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        isIn: [['Kinesiología', 'Enfermería', 'Medicina', 'Auxiliares']]
      }
    });

    // 4. Agregar índices para mejorar el rendimiento
    await sequelize.getQueryInterface().addIndex('registros_procedimientos', ['estamento'], {
      name: 'idx_registros_procedimientos_estamento'
    });

    await sequelize.getQueryInterface().addIndex('registros_procedimientos', ['estamento', 'fecha'], {
      name: 'idx_registros_procedimientos_estamento_fecha'
    });


  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    throw error;
  }
}

// Función para revertir la migración
async function rollback() {
  try {

    // Eliminar índices
    try {
      await sequelize.getQueryInterface().removeIndex('registros_procedimientos', 'idx_registros_procedimientos_estamento');
      await sequelize.getQueryInterface().removeIndex('registros_procedimientos', 'idx_registros_procedimientos_estamento_fecha');
    } catch (error) {
    }

    // Eliminar columna
    await sequelize.getQueryInterface().removeColumn('registros_procedimientos', 'estamento');


  } catch (error) {
    console.error('❌ Error durante el rollback:', error);
    throw error;
  }
}

// Verificar si necesitamos ejecutar la migración
async function checkMigrationNeeded() {
  try {
    const tableInfo = await sequelize.getQueryInterface().describeTable('registros_procedimientos');
    return !tableInfo.estamento; // Retorna true si no existe la columna
  } catch (error) {
    console.error('Error al verificar tabla:', error);
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

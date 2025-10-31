const { QueryInterface, DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    console.log('🔄 Creando tablas exactas de SQLite en PostgreSQL...');

    // 1. Tabla usuarios
    await queryInterface.createTable('usuarios', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombres: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      apellidos: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      usuario: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      estamento: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      correo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      contraseña: {
        type: DataTypes.STRING(255),
        allowNull: false
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

    // 2. Tabla pacientes
    await queryInterface.createTable('pacientes', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombreCompleto: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      rut: {
        type: DataTypes.STRING(15),
        allowNull: false,
        unique: true
      },
      numeroFicha: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
      },
      edad: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      fechaIngresoUTI: {
        type: DataTypes.DATE,
        allowNull: false
      },
      fechaEgresoUTI: {
        type: DataTypes.DATE,
        allowNull: true
      },
      reingresos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      camaAsignada: {
        type: DataTypes.INTEGER,
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

    // 3. Tabla apache2
    await queryInterface.createTable('apache2', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      pacienteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'pacientes',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      temperatura: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      presionArterial: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      frecuenciaCardiaca: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      frecuenciaRespiratoria: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      oxigenacion: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      phArterial: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      sodio: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      potasio: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      creatinina: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      hematocrito: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      leucocitos: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      glasgow: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      edad: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      enfermedadCronica: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      puntajeTotal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      riesgoMortalidad: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: '0%'
      },
      nivelRiesgo: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'Bajo'
      },
      rangosSeleccionados: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      fechaEvaluacion: {
        type: DataTypes.DATE,
        allowNull: false
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

    // 4. Tabla categorizaciones_kinesiologia
    await queryInterface.createTable('categorizaciones_kinesiologia', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      pacienteRut: {
        type: DataTypes.STRING(15),
        allowNull: false,
        references: {
          model: 'pacientes',
          key: 'rut'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      fechaCategorizacion: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      patronRespiratorio: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      asistenciaVentilatoria: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      sasGlasgow: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      tosSecreciones: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      asistencia: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      puntajeTotal: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      complejidad: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      cargaAsistencial: {
        type: DataTypes.STRING(20),
        allowNull: false
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

    // 5. Tabla registros_procedimientos
    await queryInterface.createTable('registros_procedimientos', {
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
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      turno: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      tiempoTotal: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      estamento: {
        type: DataTypes.STRING(50),
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

    // 6. Tabla procedimientos_registro
    await queryInterface.createTable('procedimientos_registro', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      registroId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'registros_procedimientos',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      nombre: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      tiempo: {
        type: DataTypes.STRING(5),
        allowNull: false
      },
      pacienteRut: {
        type: DataTypes.STRING(15),
        allowNull: true,
        references: {
          model: 'pacientes',
          key: 'rut'
        },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
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

    // 7. Tabla egresos
    await queryInterface.createTable('egresos', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      pacienteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'pacientes',
          key: 'id'
        }
      },
      nombreCompleto: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      rut: {
        type: DataTypes.STRING(15),
        allowNull: false
      },
      numeroFicha: {
        type: DataTypes.STRING(20),
        allowNull: false
      },
      edad: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      camaAsignada: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      fechaIngresoUTI: {
        type: DataTypes.DATE,
        allowNull: false
      },
      fechaEgresoUTI: {
        type: DataTypes.DATE,
        allowNull: false
      },
      motivoEgreso: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      diasEstadia: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
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

    // 8. Tabla nas
    await queryInterface.createTable('nas', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      pacienteRut: {
        type: DataTypes.STRING(12),
        allowNull: false,
        references: {
          model: 'pacientes',
          key: 'rut'
        }
      },
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        }
      },
      fechaRegistro: {
        type: DataTypes.DATE,
        allowNull: false
      },
      item_1a: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_1b: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_1c: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_2: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_3: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_4a: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_4b: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_4c: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_5: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_6a: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_6b: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_6c: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_7a: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_7b: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_8a: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_8b: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_8c: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_9: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_10: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_11: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_12: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_13: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_14: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_15: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_16: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_17: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_18: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_19: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_20: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_21: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_22: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      item_23: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      puntuacionTotal: {
        type: DataTypes.DECIMAL(5, 2),
        defaultValue: 0
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

    // 9. Tabla usuarios_backup
    await queryInterface.createTable('usuarios_backup', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true
      },
      nombres: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      apellidos: {
        type: DataTypes.STRING(100),
        allowNull: false
      },
      usuario: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true
      },
      estamento: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      correo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      contraseña: {
        type: DataTypes.STRING(255),
        allowNull: false
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

    // 10. Tabla procedimientos_kinesiologia
    await queryInterface.createTable('procedimientos_kinesiologia', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      pacienteRut: {
        type: DataTypes.STRING(12),
        allowNull: true,
        references: {
          model: 'pacientes',
          key: 'rut'
        }
      },
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        }
      },
      nombre: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      turno: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
          isIn: [['Día', 'Noche']]
        }
      },
      tiempo: {
        type: DataTypes.STRING(5),
        allowNull: false
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

    // 11. Tabla procedimientos_auxiliares
    await queryInterface.createTable('procedimientos_auxiliares', {
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
        type: DataTypes.TEXT,
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
        type: DataTypes.STRING(5),
        allowNull: false
      },
      pacienteRut: {
        type: DataTypes.STRING(15),
        allowNull: true,
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

    // 12. Tabla CuestionarioBurnout
    await queryInterface.createTable('CuestionarioBurnout', {
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
      estamento: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      fechaRespuesta: {
        type: DataTypes.DATE,
        allowNull: false
      },
      p1: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p2: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p3: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p4: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p5: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p6: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p7: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p8: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p9: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p10: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p11: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p12: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p13: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p14: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p15: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p16: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p17: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p18: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p19: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p20: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p21: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      p22: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
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
      nivelAgotamiento: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      nivelDespersonalizacion: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      nivelRealizacion: {
        type: DataTypes.TEXT,
        allowNull: false
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

    // 13. Tabla registro_procedimientos_tens
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
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      turno: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
      },
      tiempoTotal: {
        type: DataTypes.INTEGER,
        defaultValue: 0
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

    // 14. Tabla procedimientos_tens
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
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
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
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
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

    // 15. Tabla procedimientos_medicina
    await queryInterface.createTable('procedimientos_medicina', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true
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
        type: DataTypes.TEXT,
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
        type: DataTypes.STRING(5),
        allowNull: false
      },
      pacienteRut: {
        type: DataTypes.STRING(15),
        allowNull: true,
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

    // 16. Tabla procedimientos_sistema
    await queryInterface.createTable('procedimientos_sistema', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      nombre: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      estamento: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      tiempoEstimado: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      requierePaciente: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      orden: {
        type: DataTypes.INTEGER,
        defaultValue: 0
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

    console.log('✅ Todas las tablas creadas correctamente');
  },

  down: async (queryInterface) => {
    console.log('🔄 Eliminando tablas...');
    
    const tables = [
      'procedimientos_sistema',
      'procedimientos_medicina',
      'procedimientos_tens',
      'registro_procedimientos_tens',
      'CuestionarioBurnout',
      'procedimientos_auxiliares',
      'procedimientos_kinesiologia',
      'usuarios_backup',
      'nas',
      'egresos',
      'procedimientos_registro',
      'registros_procedimientos',
      'categorizaciones_kinesiologia',
      'apache2',
      'pacientes',
      'usuarios'
    ];

    for (const table of tables) {
      await queryInterface.dropTable(table);
    }

    console.log('✅ Todas las tablas eliminadas');
  }
};

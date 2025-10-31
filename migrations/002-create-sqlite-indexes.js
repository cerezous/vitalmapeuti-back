const { QueryInterface } = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    console.log('🔄 Creando índices exactos de SQLite en PostgreSQL...');

    // Índices para apache2
    await queryInterface.addIndex('apache2', ['pacienteId'], {
      name: 'apache2_paciente_id'
    });
    await queryInterface.addIndex('apache2', ['fechaEvaluacion'], {
      name: 'apache2_fecha_evaluacion'
    });
    await queryInterface.addIndex('apache2', ['puntajeTotal'], {
      name: 'apache2_puntaje_total'
    });
    await queryInterface.addIndex('apache2', ['nivelRiesgo'], {
      name: 'apache2_nivel_riesgo'
    });

    // Índices para categorizaciones_kinesiologia
    await queryInterface.addIndex('categorizaciones_kinesiologia', ['pacienteRut'], {
      name: 'categorizaciones_kinesiologia_paciente_rut'
    });
    await queryInterface.addIndex('categorizaciones_kinesiologia', ['usuarioId'], {
      name: 'categorizaciones_kinesiologia_usuario_id'
    });
    await queryInterface.addIndex('categorizaciones_kinesiologia', ['fechaCategorizacion'], {
      name: 'categorizaciones_kinesiologia_fecha_categorizacion'
    });
    await queryInterface.addIndex('categorizaciones_kinesiologia', ['pacienteRut', 'fechaCategorizacion'], {
      name: 'categorizaciones_kinesiologia_paciente_rut_fecha_categorizacion'
    });

    // Índices para registros_procedimientos
    await queryInterface.addIndex('registros_procedimientos', ['usuarioId'], {
      name: 'registros_procedimientos_usuario_id'
    });
    await queryInterface.addIndex('registros_procedimientos', ['fecha'], {
      name: 'registros_procedimientos_fecha'
    });
    await queryInterface.addIndex('registros_procedimientos', ['turno'], {
      name: 'registros_procedimientos_turno'
    });
    await queryInterface.addIndex('registros_procedimientos', ['fecha', 'turno'], {
      name: 'registros_procedimientos_fecha_turno'
    });

    // Índices para procedimientos_registro
    await queryInterface.addIndex('procedimientos_registro', ['registroId'], {
      name: 'procedimientos_registro_registro_id'
    });
    await queryInterface.addIndex('procedimientos_registro', ['pacienteRut'], {
      name: 'procedimientos_registro_paciente_rut'
    });

    // Índices para nas
    await queryInterface.addIndex('nas', ['pacienteRut'], {
      name: 'nas_paciente_rut'
    });
    await queryInterface.addIndex('nas', ['fechaRegistro'], {
      name: 'nas_fecha_registro'
    });

    // Índices para procedimientos_kinesiologia
    await queryInterface.addIndex('procedimientos_kinesiologia', ['pacienteRut'], {
      name: 'procedimientos_kinesiologia_paciente_rut'
    });
    await queryInterface.addIndex('procedimientos_kinesiologia', ['usuarioId'], {
      name: 'procedimientos_kinesiologia_usuario_id'
    });
    await queryInterface.addIndex('procedimientos_kinesiologia', ['fecha'], {
      name: 'procedimientos_kinesiologia_fecha'
    });

    // Índices para procedimientos_auxiliares
    await queryInterface.addIndex('procedimientos_auxiliares', ['usuarioId'], {
      name: 'idx_procedimientos_auxiliares_usuario'
    });
    await queryInterface.addIndex('procedimientos_auxiliares', ['fecha'], {
      name: 'idx_procedimientos_auxiliares_fecha'
    });
    await queryInterface.addIndex('procedimientos_auxiliares', ['turno'], {
      name: 'idx_procedimientos_auxiliares_turno'
    });
    await queryInterface.addIndex('procedimientos_auxiliares', ['nombre'], {
      name: 'idx_procedimientos_auxiliares_nombre'
    });
    await queryInterface.addIndex('procedimientos_auxiliares', ['pacienteRut'], {
      name: 'idx_procedimientos_auxiliares_paciente'
    });
    await queryInterface.addIndex('procedimientos_auxiliares', ['fecha', 'turno'], {
      name: 'idx_procedimientos_auxiliares_fecha_turno'
    });
    await queryInterface.addIndex('procedimientos_auxiliares', ['usuarioId', 'fecha'], {
      name: 'idx_procedimientos_auxiliares_usuario_fecha'
    });
    await queryInterface.addIndex('procedimientos_auxiliares', ['usuarioId'], {
      name: 'procedimientos_auxiliares_usuario_id'
    });
    await queryInterface.addIndex('procedimientos_auxiliares', ['fecha'], {
      name: 'procedimientos_auxiliares_fecha'
    });
    await queryInterface.addIndex('procedimientos_auxiliares', ['turno'], {
      name: 'procedimientos_auxiliares_turno'
    });
    await queryInterface.addIndex('procedimientos_auxiliares', ['nombre'], {
      name: 'procedimientos_auxiliares_nombre'
    });
    await queryInterface.addIndex('procedimientos_auxiliares', ['pacienteRut'], {
      name: 'procedimientos_auxiliares_paciente_rut'
    });
    await queryInterface.addIndex('procedimientos_auxiliares', ['fecha', 'turno'], {
      name: 'procedimientos_auxiliares_fecha_turno'
    });
    await queryInterface.addIndex('procedimientos_auxiliares', ['usuarioId', 'fecha'], {
      name: 'procedimientos_auxiliares_usuario_id_fecha'
    });

    // Índices para registro_procedimientos_tens
    await queryInterface.addIndex('registro_procedimientos_tens', ['usuarioId'], {
      name: 'registro_procedimientos_tens_usuario_id'
    });
    await queryInterface.addIndex('registro_procedimientos_tens', ['fecha'], {
      name: 'registro_procedimientos_tens_fecha'
    });
    await queryInterface.addIndex('registro_procedimientos_tens', ['turno'], {
      name: 'registro_procedimientos_tens_turno'
    });
    await queryInterface.addIndex('registro_procedimientos_tens', ['fecha', 'turno'], {
      name: 'registro_procedimientos_tens_fecha_turno'
    });

    // Índices para procedimientos_tens
    await queryInterface.addIndex('procedimientos_tens', ['registroId'], {
      name: 'procedimientos_tens_registro_id'
    });
    await queryInterface.addIndex('procedimientos_tens', ['pacienteRut'], {
      name: 'procedimientos_tens_paciente_rut'
    });

    // Índices para procedimientos_medicina
    await queryInterface.addIndex('procedimientos_medicina', ['usuarioId'], {
      name: 'procedimientos_medicina_usuario_id'
    });
    await queryInterface.addIndex('procedimientos_medicina', ['fecha'], {
      name: 'procedimientos_medicina_fecha'
    });
    await queryInterface.addIndex('procedimientos_medicina', ['turno'], {
      name: 'procedimientos_medicina_turno'
    });
    await queryInterface.addIndex('procedimientos_medicina', ['nombre'], {
      name: 'procedimientos_medicina_nombre'
    });
    await queryInterface.addIndex('procedimientos_medicina', ['pacienteRut'], {
      name: 'procedimientos_medicina_paciente_rut'
    });
    await queryInterface.addIndex('procedimientos_medicina', ['fecha', 'turno'], {
      name: 'procedimientos_medicina_fecha_turno'
    });
    await queryInterface.addIndex('procedimientos_medicina', ['usuarioId', 'fecha'], {
      name: 'procedimientos_medicina_usuario_id_fecha'
    });

    console.log('✅ Todos los índices creados correctamente');
  },

  down: async (queryInterface) => {
    console.log('🔄 Eliminando índices...');
    
    const indexes = [
      'apache2_paciente_id',
      'apache2_fecha_evaluacion',
      'apache2_puntaje_total',
      'apache2_nivel_riesgo',
      'categorizaciones_kinesiologia_paciente_rut',
      'categorizaciones_kinesiologia_usuario_id',
      'categorizaciones_kinesiologia_fecha_categorizacion',
      'categorizaciones_kinesiologia_paciente_rut_fecha_categorizacion',
      'registros_procedimientos_usuario_id',
      'registros_procedimientos_fecha',
      'registros_procedimientos_turno',
      'registros_procedimientos_fecha_turno',
      'procedimientos_registro_registro_id',
      'procedimientos_registro_paciente_rut',
      'nas_paciente_rut',
      'nas_fecha_registro',
      'procedimientos_kinesiologia_paciente_rut',
      'procedimientos_kinesiologia_usuario_id',
      'procedimientos_kinesiologia_fecha',
      'idx_procedimientos_auxiliares_usuario',
      'idx_procedimientos_auxiliares_fecha',
      'idx_procedimientos_auxiliares_turno',
      'idx_procedimientos_auxiliares_nombre',
      'idx_procedimientos_auxiliares_paciente',
      'idx_procedimientos_auxiliares_fecha_turno',
      'idx_procedimientos_auxiliares_usuario_fecha',
      'procedimientos_auxiliares_usuario_id',
      'procedimientos_auxiliares_fecha',
      'procedimientos_auxiliares_turno',
      'procedimientos_auxiliares_nombre',
      'procedimientos_auxiliares_paciente_rut',
      'procedimientos_auxiliares_fecha_turno',
      'procedimientos_auxiliares_usuario_id_fecha',
      'registro_procedimientos_tens_usuario_id',
      'registro_procedimientos_tens_fecha',
      'registro_procedimientos_tens_turno',
      'registro_procedimientos_tens_fecha_turno',
      'procedimientos_tens_registro_id',
      'procedimientos_tens_paciente_rut',
      'procedimientos_medicina_usuario_id',
      'procedimientos_medicina_fecha',
      'procedimientos_medicina_turno',
      'procedimientos_medicina_nombre',
      'procedimientos_medicina_paciente_rut',
      'procedimientos_medicina_fecha_turno',
      'procedimientos_medicina_usuario_id_fecha'
    ];

    for (const index of indexes) {
      try {
        await queryInterface.removeIndex('apache2', index);
      } catch (error) {
        // Ignorar errores si el índice no existe
      }
    }

    console.log('✅ Todos los índices eliminados');
  }
};

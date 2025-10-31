const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Iniciando migraciones automáticas...');

try {
  // Ejecutar migraciones
  console.log('📊 Ejecutando migraciones de base de datos...');
  execSync('node migrations/run-migrations.js', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ Migraciones completadas exitosamente');
  
  // Ejecutar seed (opcional)
  console.log('🌱 Ejecutando seed de datos...');
  execSync('node migrations/seed-data.js', { 
    stdio: 'inherit',
    cwd: __dirname 
  });
  console.log('✅ Seed completado exitosamente');
  
} catch (error) {
  console.error('❌ Error ejecutando migraciones:', error.message);
  // No salir con error para que el servidor pueda iniciar
  console.log('⚠️ Continuando con el inicio del servidor...');
}

console.log('🎉 Migraciones automáticas finalizadas');

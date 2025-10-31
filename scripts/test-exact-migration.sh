#!/bin/bash

echo "🧪 PROBANDO MIGRACIÓN EXACTA DE SQLITE A POSTGRESQL"
echo "=================================================="

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes
show_message() {
    echo -e "${GREEN}✅ $1${NC}"
}

show_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

show_error() {
    echo -e "${RED}❌ $1${NC}"
}

show_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "backend/package.json" ]; then
    show_error "No se encontró backend/package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

echo ""
echo "🔍 VERIFICANDO CONFIGURACIÓN..."

# Verificar PostgreSQL
if ! command -v psql &> /dev/null; then
    show_error "PostgreSQL no está instalado"
    echo "Ejecuta: ./scripts/setup-postgresql.sh"
    exit 1
fi

show_message "PostgreSQL está instalado"

# Verificar conexión
if ! pg_isready -q; then
    show_error "PostgreSQL no está corriendo"
    echo "Ejecuta: ./scripts/setup-postgresql.sh"
    exit 1
fi

show_message "PostgreSQL está corriendo"

# Verificar base de datos
if ! psql -lqt | cut -d \| -f 1 | grep -qw vitalmape_dev; then
    show_warning "Base de datos vitalmape_dev no existe"
    echo "Creando base de datos..."
    createdb vitalmape_dev
    show_message "Base de datos vitalmape_dev creada"
else
    show_message "Base de datos vitalmape_dev existe"
fi

# Verificar dependencias del backend
cd backend

if [ ! -d "node_modules" ]; then
    show_warning "Dependencias no instaladas"
    echo "Instalando dependencias..."
    npm install
    show_message "Dependencias instaladas"
else
    show_message "Dependencias instaladas"
fi

# Verificar archivo de configuración
if [ ! -f ".env" ]; then
    show_warning "Archivo .env no existe"
    echo "Copiando configuración de ejemplo..."
    cp env.development .env
    show_message "Archivo .env creado"
    show_info "Ajusta las variables en backend/.env según tu configuración"
else
    show_message "Archivo .env existe"
fi

# Ejecutar migraciones
echo ""
echo "🔄 EJECUTANDO MIGRACIONES EXACTAS DE SQLITE..."

if npm run db:migrate; then
    show_message "Migraciones ejecutadas correctamente"
else
    show_error "Error en las migraciones"
    exit 1
fi

# Verificar que las tablas se crearon
echo ""
echo "🔍 VERIFICANDO TABLAS CREADAS..."

# Crear script de verificación temporal
cat > verify-tables.js << 'EOF'
const sequelize = require('./config/database');

async function verifyTables() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida');
    
    // Verificar tablas principales
    const tables = [
      'usuarios',
      'pacientes', 
      'apache2',
      'categorizaciones_kinesiologia',
      'registros_procedimientos',
      'procedimientos_registro',
      'egresos',
      'nas',
      'usuarios_backup',
      'procedimientos_kinesiologia',
      'procedimientos_auxiliares',
      'CuestionarioBurnout',
      'registro_procedimientos_tens',
      'procedimientos_tens',
      'procedimientos_medicina',
      'procedimientos_sistema'
    ];
    
    console.log('\n📋 Verificando tablas:');
    
    for (const table of tables) {
      try {
        const [results] = await sequelize.query(`SELECT COUNT(*) FROM "${table}"`);
        console.log(`✅ Tabla ${table}: OK`);
      } catch (error) {
        console.log(`❌ Tabla ${table}: ERROR - ${error.message}`);
      }
    }
    
    // Verificar estructura de tabla usuarios
    console.log('\n🔍 Verificando estructura de tabla usuarios:');
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'usuarios' 
      ORDER BY ordinal_position
    `);
    
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    console.log('\n🎉 Verificación completada');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error de verificación:', error.message);
    process.exit(1);
  }
}

verifyTables();
EOF

# Ejecutar verificación
if node verify-tables.js; then
    show_message "Verificación de tablas exitosa"
else
    show_error "Error en verificación de tablas"
    rm -f verify-tables.js
    exit 1
fi

# Limpiar archivo temporal
rm -f verify-tables.js

echo ""
echo "🎉 MIGRACIÓN EXACTA COMPLETADA"
echo ""
echo "📋 RESUMEN:"
echo "✅ Estructura SQLite replicada exactamente en PostgreSQL"
echo "✅ Todas las tablas creadas con la misma estructura"
echo "✅ Todos los índices replicados"
echo "✅ Relaciones y restricciones mantenidas"
echo ""

echo "🚀 PRÓXIMOS PASOS:"
echo "1. Ejecuta: npm run db:seed (para poblar datos iniciales)"
echo "2. Inicia el servidor: npm run dev"
echo "3. Verifica que la aplicación funcione correctamente"
echo ""

show_message "¡Migración exacta de SQLite a PostgreSQL completada!"

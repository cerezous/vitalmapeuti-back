#!/bin/bash

echo "🧪 PROBANDO CONFIGURACIÓN POSTGRESQL"
echo "===================================="

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

# Probar conexión con Node.js
echo ""
echo "🔌 PROBANDO CONEXIÓN CON NODE.JS..."

# Crear script de prueba temporal
cat > test-connection.js << 'EOF'
const sequelize = require('./config/database');

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    
    // Probar sincronización
    await sequelize.sync({ force: false });
    console.log('✅ Sincronización de modelos exitosa');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    process.exit(1);
  }
}

testConnection();
EOF

# Ejecutar prueba
if node test-connection.js; then
    show_message "Conexión con Node.js exitosa"
else
    show_error "Error en conexión con Node.js"
    rm -f test-connection.js
    exit 1
fi

# Limpiar archivo temporal
rm -f test-connection.js

echo ""
echo "🎉 CONFIGURACIÓN POSTGRESQL COMPLETADA"
echo ""
echo "📋 PRÓXIMOS PASOS:"
echo "1. Ajusta las variables en backend/.env si es necesario"
echo "2. Ejecuta: cd backend && npm run db:migrate"
echo "3. Ejecuta: cd backend && npm run db:seed"
echo "4. Inicia el servidor: cd backend && npm run dev"
echo ""

show_message "¡PostgreSQL configurado y funcionando correctamente!"

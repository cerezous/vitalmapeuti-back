#!/bin/bash

echo "🐘 CONFIGURANDO POSTGRESQL PARA VITALMAPE"
echo "========================================"

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

# Verificar si PostgreSQL está instalado
if ! command -v psql &> /dev/null; then
    show_error "PostgreSQL no está instalado"
    echo ""
    echo "📋 INSTALACIÓN DE POSTGRESQL:"
    echo ""
    echo "🍎 macOS (con Homebrew):"
    echo "   brew install postgresql"
    echo "   brew services start postgresql"
    echo ""
    echo "🐧 Ubuntu/Debian:"
    echo "   sudo apt update"
    echo "   sudo apt install postgresql postgresql-contrib"
    echo "   sudo systemctl start postgresql"
    echo ""
    echo "🪟 Windows:"
    echo "   Descargar desde: https://www.postgresql.org/download/windows/"
    echo ""
    exit 1
fi

show_message "PostgreSQL está instalado"

# Verificar si el servicio está corriendo
if ! pg_isready -q; then
    show_warning "PostgreSQL no está corriendo"
    echo ""
    echo "🚀 INICIAR POSTGRESQL:"
    echo ""
    echo "🍎 macOS:"
    echo "   brew services start postgresql"
    echo ""
    echo "🐧 Linux:"
    echo "   sudo systemctl start postgresql"
    echo ""
    echo "🪟 Windows:"
    echo "   Iniciar desde Servicios de Windows"
    echo ""
    exit 1
fi

show_message "PostgreSQL está corriendo"

# Configurar base de datos
echo ""
echo "🔧 CONFIGURANDO BASE DE DATOS..."

# Crear base de datos si no existe
createdb vitalmape_dev 2>/dev/null || show_info "Base de datos vitalmape_dev ya existe"

show_message "Base de datos vitalmape_dev configurada"

echo ""
echo "📋 CONFIGURACIÓN COMPLETADA"
echo ""
echo "🔗 DATOS DE CONEXIÓN:"
echo "   Host: localhost"
echo "   Puerto: 5432"
echo "   Base de datos: vitalmape_dev"
echo "   Usuario: postgres"
echo "   Contraseña: (la que configuraste)"
echo ""

echo "🚀 PRÓXIMOS PASOS:"
echo "1. Configura las variables de entorno en backend/env.development"
echo "2. Ejecuta: cd backend && npm run db:migrate"
echo "3. Ejecuta: cd backend && npm run db:seed"
echo "4. Inicia el servidor: cd backend && npm run dev"
echo ""

show_message "¡PostgreSQL configurado correctamente!"

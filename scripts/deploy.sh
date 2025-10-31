#!/bin/bash

echo "🚀 DESPLEGANDO VITALMAPE A PRODUCCIÓN"
echo "======================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    show_error "No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

echo ""
echo "📋 ESTRUCTURA DEL PROYECTO LIMPIA:"
echo "├── backend/          # API Node.js + Express"
echo "├── frontend/         # React + TypeScript + Tailwind"
echo "├── scripts/          # Scripts de utilidad y tests"
echo "├── docs/            # Documentación"
echo "├── data/            # Bases de datos y archivos de datos"
echo "└── package.json     # Configuración principal"
echo ""

# Verificar dependencias
show_message "Verificando estructura del proyecto..."

# Backend
if [ -d "backend" ]; then
    if [ ! -f "backend/package.json" ]; then
        show_error "No se encontró package.json en el directorio backend"
        exit 1
    fi
    show_message "Backend encontrado correctamente"
else
    show_error "No se encontró el directorio backend"
    exit 1
fi

# Frontend
if [ -d "frontend" ]; then
    if [ ! -f "frontend/package.json" ]; then
        show_error "No se encontró package.json en el directorio frontend"
        exit 1
    fi
    show_message "Frontend encontrado correctamente"
else
    show_error "No se encontró el directorio frontend"
    exit 1
fi

show_message "Estructura del proyecto verificada correctamente"

echo ""
echo "🔧 CONFIGURACIÓN NECESARIA:"
echo ""
echo "1. BACKEND (Railway):"
echo "   - Ve a https://railway.app"
echo "   - Conecta tu repositorio de GitHub"
echo "   - Configura las variables de entorno desde scripts/production.env"
echo ""
echo "2. FRONTEND (Vercel):"
echo "   - Ve a https://vercel.com"
echo "   - Conecta tu repositorio de GitHub"
echo "   - Configura el directorio como 'frontend'"
echo "   - Configura la URL del backend cuando esté desplegado"
echo ""

echo "📖 INSTRUCCIONES DETALLADAS:"
echo "Lee el archivo docs/DEPLOYMENT_INSTRUCTIONS.md para instrucciones paso a paso"
echo ""

echo "🎯 PRÓXIMOS PASOS:"
echo "1. Lee docs/DEPLOYMENT_INSTRUCTIONS.md"
echo "2. Sigue las instrucciones paso a paso"
echo "3. Si tienes dudas, pregúntame!"
echo ""
echo "💡 TIPS:"
echo "- Railway y Vercel son gratuitos para proyectos pequeños"
echo "- El proceso completo toma unos 10-15 minutos"
echo "- Una vez configurado, los despliegues futuros son automáticos"
echo ""

show_message "¡Proyecto limpio y listo para desplegar!"
#!/bin/bash

echo "🔗 PROBANDO CONEXIÓN FRONTEND ↔ BACKEND"
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

echo ""
echo "🔍 VERIFICANDO SERVIDORES..."

# Verificar Backend
echo "Probando Backend (puerto 3001)..."
BACKEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/usuarios)
if [ "$BACKEND_RESPONSE" = "401" ]; then
    show_message "Backend funcionando correctamente (401 = requiere autenticación)"
else
    show_error "Backend no responde correctamente (código: $BACKEND_RESPONSE)"
    exit 1
fi

# Verificar Frontend
echo "Probando Frontend (puerto 3000)..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    show_message "Frontend funcionando correctamente"
else
    show_error "Frontend no responde correctamente (código: $FRONTEND_RESPONSE)"
    exit 1
fi

echo ""
echo "🔐 PROBANDO LOGIN..."

# Probar login con admin
echo "Probando login con admin..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"usuario": "admin", "contraseña": "admin123"}')

echo "Respuesta del login:"
echo "$LOGIN_RESPONSE" | jq . 2>/dev/null || echo "$LOGIN_RESPONSE"

# Verificar si el login fue exitoso
if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    show_message "Login exitoso - Token recibido"
    
    # Extraer token
    TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)
    if [ "$TOKEN" != "null" ] && [ "$TOKEN" != "" ]; then
        show_message "Token extraído correctamente"
        
        echo ""
        echo "🔒 PROBANDO PETICIÓN AUTENTICADA..."
        
        # Probar petición autenticada
        AUTH_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/api/usuarios)
        echo "Respuesta de usuarios autenticados:"
        echo "$AUTH_RESPONSE" | jq . 2>/dev/null || echo "$AUTH_RESPONSE"
        
        if echo "$AUTH_RESPONSE" | grep -q "usuarios"; then
            show_message "Petición autenticada exitosa"
        else
            show_warning "Petición autenticada no devolvió usuarios"
        fi
    else
        show_error "No se pudo extraer el token"
    fi
else
    show_error "Login falló"
    echo "Posibles causas:"
    echo "1. Usuario admin no existe en la base de datos"
    echo "2. Contraseña incorrecta"
    echo "3. Error en la configuración de la base de datos"
fi

echo ""
echo "📋 RESUMEN DE LA CONEXIÓN:"
echo "=========================="
echo "Backend: http://localhost:3001 ✅"
echo "Frontend: http://localhost:3000 ✅"
echo "API Base URL: http://localhost:3001/api"
echo ""
echo "🎯 PRÓXIMOS PASOS:"
echo "1. Abre http://localhost:3000 en tu navegador"
echo "2. Haz login con: admin / admin123"
echo "3. Si funciona, la conexión está completa"
echo "4. Si no funciona, revisa la consola del navegador (F12)"

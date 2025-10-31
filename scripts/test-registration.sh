#!/bin/bash

# Script para probar la conectividad y el registro de usuarios
echo "🧪 Probando conectividad con el backend..."

# URL del backend
BACKEND_URL="https://vitalmapeuti-back.onrender.com"

# Probar health check
echo "1. Probando health check..."
curl -s "$BACKEND_URL/api/health" | jq '.' || echo "❌ Error en health check"

echo ""
echo "2. Probando endpoint de API básico..."
curl -s "$BACKEND_URL/api" | jq '.' || echo "❌ Error en endpoint básico"

echo ""
echo "3. Probando registro de usuario..."
curl -X POST "$BACKEND_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "Origin: https://vitalmapeuti.onrender.com" \
  -d '{
    "nombres": "Test",
    "apellidos": "Usuario",
    "estamento": "Enfermería",
    "correo": "test@example.com",
    "contraseña": "123456"
  }' | jq '.' || echo "❌ Error en registro"

echo ""
echo "✅ Pruebas completadas"

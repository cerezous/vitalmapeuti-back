#!/bin/bash

echo "🚀 Desplegando backend en Railway..."

# Ir al directorio del backend
cd backend

# Inicializar proyecto Railway
echo "📦 Inicializando proyecto Railway..."
railway init

# Configurar variables de entorno
echo "⚙️ Configurando variables de entorno..."
railway variables set PORT=3001
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=$(openssl rand -base64 32)

# Desplegar
echo "🚀 Desplegando..."
railway up --detach

echo "✅ ¡Despliegue completado!"
echo "🔗 Obtén la URL con: railway domain"

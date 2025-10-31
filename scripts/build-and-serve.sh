#!/bin/bash

# Script para construir el frontend y reiniciar el servidor
echo "🔨 Construyendo frontend..."
cd frontend
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend construido exitosamente"
    
    echo "🚀 Reiniciando servidor backend..."
    cd ../backend
    
    # Detener servidor si está corriendo
    pkill -f "node.*app.js" 2>/dev/null || true
    
    # Iniciar servidor en segundo plano
    nohup node app.js > server.log 2>&1 &
    
    echo "✅ Servidor backend reiniciado"
    echo "📝 Log del servidor: backend/server.log"
    echo "🌐 Aplicación disponible en: http://localhost:3001"
    echo ""
    echo "📋 Para ver los logs del servidor:"
    echo "   tail -f backend/server.log"
else
    echo "❌ Error al construir el frontend"
    exit 1
fi

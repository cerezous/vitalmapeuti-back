#!/bin/bash

# Script para obtener la IP local de tu Mac
# Útil para acceder al frontend desde el celular

echo ""
echo "🔍 Obteniendo tu IP local..."
echo ""

# Obtener la IP local (excluye localhost)
IP=$(ifconfig | grep "inet " | grep -Fv 127.0.0.1 | awk '{print $2}' | head -1)

if [ -z "$IP" ]; then
    echo "❌ No se pudo detectar tu IP local."
    echo ""
    echo "Asegúrate de estar conectado a WiFi y ejecuta este comando manualmente:"
    echo "   ifconfig | grep 'inet '"
    echo ""
else
    echo "✅ Tu IP local es: $IP"
    echo ""
    echo "📱 Para acceder desde tu celular:"
    echo ""
    echo "   Frontend: http://$IP:3000"
    echo "   Backend:  http://$IP:3001/api"
    echo ""
    echo "📝 Asegúrate de que:"
    echo "   1. Tu celular esté en la misma red WiFi"
    echo "   2. El backend esté corriendo (node app.js en la carpeta backend) - Puerto 3001"
    echo "   3. El frontend esté corriendo (npm start en la carpeta frontend) - Puerto 3000"
    echo ""
fi


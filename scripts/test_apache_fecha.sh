#!/bin/bash

# Configuración de la prueba
API_BASE_URL="http://localhost:3001/api"
FECHA_PRUEBA="2025-10-12"  # Fecha diferente a la actual (hoy es 15 de octubre)
RUT_PACIENTE="67.890.123-5"  # Rodrigo Alejandro Cortés Aguilar - Cama 19

echo "🧪 INICIANDO PRUEBA DE FECHA APACHE II"
echo "======================================="
echo "Paciente: $RUT_PACIENTE"
echo "Fecha de prueba seleccionada: $FECHA_PRUEBA"
echo "Fecha actual del sistema: $(date +%Y-%m-%d)"
echo ""

# JSON con los datos de Apache II
JSON_DATA='{
  "pacienteRut": "'$RUT_PACIENTE'",
  "fechaEvaluacion": "'$FECHA_PRUEBA'",
  "temperatura": 1,
  "presionArterial": 2,
  "frecuenciaCardiaca": 1,
  "frecuenciaRespiratoria": 1,
  "oxigenacion": 2,
  "phArterial": 1,
  "sodio": 0,
  "potasio": 0,
  "creatinina": 0,
  "hematocrito": 0,
  "leucocitos": 0,
  "glasgow": 2,
  "edad": 3,
  "enfermedadCronica": 2,
  "rangosSeleccionados": {
    "temperatura": "38.5-38.9°C (+1)",
    "presionArterial": "50-69 mmHg (+2)",
    "frecuenciaCardiaca": "110-139 lpm (+1)",
    "frecuenciaRespiratoria": "25-34 rpm (+1)",
    "oxigenacion": "200-349 mmHg (+2)",
    "phArterial": "7.25-7.32 (+1)",
    "glasgow": "10-13 (+2)",
    "edad": "55-64 años (+3)",
    "enfermedadCronica": "Sí (+2)"
  },
  "observaciones": "Prueba de fecha - Evaluación con fecha seleccionada diferente a la actual",
  "usuarioId": 1
}'

echo "📤 ENVIANDO DATOS AL BACKEND:"
echo "- Fecha que debería guardarse: $FECHA_PRUEBA"
echo ""

# Enviar la petición POST
response=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d "$JSON_DATA" \
  "$API_BASE_URL/apache2")

echo "📥 RESPUESTA DEL SERVIDOR:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"
echo ""

# Extraer el ID de la evaluación creada (si fue exitosa)
evaluation_id=$(echo "$response" | jq -r '.data.id // empty' 2>/dev/null)

if [ ! -z "$evaluation_id" ]; then
  echo "✅ EVALUACIÓN CREADA EXITOSAMENTE con ID: $evaluation_id"
  echo ""
  echo "🔍 VERIFICANDO EN BASE DE DATOS..."
  echo "Evaluación ID: $evaluation_id"
else
  echo "❌ No se pudo crear la evaluación"
fi
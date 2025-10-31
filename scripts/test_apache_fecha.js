const axios = require('axios');

// Configuración de la prueba
const API_BASE_URL = 'http://localhost:3001/api';
const FECHA_PRUEBA = '2025-10-12'; // Fecha diferente a la actual (hoy es 15 de octubre)
const RUT_PACIENTE = '67.890.123-5'; // Rodrigo Alejandro Cortés Aguilar - Cama 19

async function testFechaApache() {
    try {

        // Datos de ejemplo para Apache II (valores mínimos para una prueba válida)
        const apache2Data = {
            pacienteRut: RUT_PACIENTE,
            fechaEvaluacion: FECHA_PRUEBA,
            temperatura: 1, // Punto por temperatura alta
            presionArterial: 2, // Puntos por presión baja
            frecuenciaCardiaca: 1, // Punto por frecuencia alta
            frecuenciaRespiratoria: 1, // Punto por frecuencia alta
            oxigenacion: 2, // Puntos por oxigenación baja
            phArterial: 1, // Punto por pH bajo
            sodio: 0, // Normal
            potasio: 0, // Normal
            creatinina: 0, // Normal
            hematocrito: 0, // Normal
            leucocitos: 0, // Normal
            glasgow: 2, // Puntos por Glasgow bajo
            edad: 3, // Puntos por edad (asumiendo 55-64 años)
            enfermedadCronica: 2, // Puntos por enfermedad crónica
            rangosSeleccionados: {
                temperatura: "38.5-38.9°C (+1)",
                presionArterial: "50-69 mmHg (+2)",
                frecuenciaCardiaca: "110-139 lpm (+1)",
                frecuenciaRespiratoria: "25-34 rpm (+1)",
                oxigenacion: "200-349 mmHg (+2)",
                phArterial: "7.25-7.32 (+1)",
                glasgow: "10-13 (+2)",
                edad: "55-64 años (+3)",
                enfermedadCronica: "Sí (+2)"
            },
            observaciones: 'Prueba de fecha - Evaluación con fecha seleccionada diferente a la actual',
            usuarioId: 1 // ID de usuario de prueba
        };


        // Enviar la petición POST
        const response = await axios.post(`${API_BASE_URL}/apache2`, apache2Data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {

            // Ahora verificar qué fecha se guardó en la base de datos
            const evaluacionId = response.data.data.id;
            
            
            return evaluacionId;
        } else {
            console.error('❌ Error al crear evaluación:', response.data.message);
            return null;
        }

    } catch (error) {
        console.error('❌ ERROR EN LA PRUEBA:', error.response?.data || error.message);
        return null;
    }
}

// Ejecutar la prueba
testFechaApache().then(evaluacionId => {
    if (evaluacionId) {
    }
});
// Script de prueba para verificar las nuevas opciones de turno
const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

async function probarNuevosTurnos() {
  try {
    
    // Datos de prueba
    const testData = {
      turno: '22 h',
      fecha: '2024-12-20',
      procedimientos: [
        {
          nombre: 'Administrativo (evoluciones, revisión de HC, indicaciones, etc)',
          tiempo: '01:30'
        }
      ]
    };
    
    
    // Nota: Esta prueba necesitaría un token válido para funcionar completamente
    // Por ahora solo verificamos que el endpoint esté disponible
    
    const response = await axios.get(`${API_URL}/medicina/procedimientos-validos`);
    
    
  } catch (error) {
    if (error.response?.status === 401) {
    } else {
      console.error('❌ Error en prueba:', error.message);
    }
  }
}

probarNuevosTurnos();
const axios = require('axios');

async function testEndpointMetricas() {
  try {
    
    // Hacer una petición GET al endpoint de métricas
    const response = await axios.get('http://localhost:3001/api/procedimientos-tens/metricas/dashboard');
    
    
    if (response.data.data && response.data.data.tiempoPromedioAseo) {
    } else {
    }
    
  } catch (error) {
    if (error.response) {
    } else if (error.request) {
    } else {
    }
  }
}

testEndpointMetricas();
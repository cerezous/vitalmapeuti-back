require('dotenv').config();
const jwt = require('jsonwebtoken');

// Crear un token temporal válido para testing
const payload = {
  id: 1,
  username: 'admin',
  email: 'admin@hospital.cl',
  estamento: 'Administrador'
};

const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });


// Tambien hacer la petición con axios
const axios = require('axios');

async function testConTokenValido() {
  try {
    
    const response = await axios.get('http://localhost:3001/api/procedimientos-tens/metricas/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    
    if (response.data.data && response.data.data.tiempoPromedioAseo) {
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Ejecutar el test después de generar el token
testConTokenValido();
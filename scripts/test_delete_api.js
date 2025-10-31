const axios = require('axios');

async function testLogin() {
  try {
    // Primero hacer login para obtener un token
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      usuario: 'temp_admin',
      contraseña: 'temp123'
    });
    
    const token = loginResponse.data.token;
    
    // Intentar eliminar un usuario con el token
    const deleteResponse = await axios.delete('http://localhost:3001/api/usuarios/3', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    
  } catch (error) {
    console.error('Error detallado:');
    console.error('Status:', error.response?.status);
    console.error('StatusText:', error.response?.statusText);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    if (error.response?.data) {
    }
  }
}

testLogin();
// Script para importar usuarios a producción
const usuarios = [
  {
    usuario: "mcerezop",
    contraseña: "$2b$10$aOXClRXRmwK/jsMLyYRXruRfqgVHtWJMcge/VTCiy5L1W.VzMXbMS",
    nombres: "Matías",
    apellidos: "Cerezo Prado",
    correo: "matias.cerezo@admin.com",
    estamento: "Administrador"
  },
  {
    usuario: "vquintero",
    contraseña: "$2b$10$JSgwHw.z73VE9N2tgUFdv.twek4IJlY0L5VivdUqh.yrbQ2fxfGGW",
    nombres: "Vanessa",
    apellidos: "Quintero",
    correo: "java2581@gmail.com",
    estamento: "Medicina"
  },
  {
    usuario: "jquinteros",
    contraseña: "$2b$10$sExbZqHk.I43RHqCE/zjC.fKJqhszqaiNJJXCkDZXqAFaNkYvqAq6",
    nombres: "Juan Pablo",
    apellidos: "Quinteros Miranda",
    correo: "juanpablo.quinteros@gmail.com",
    estamento: "Kinesiología"
  },
  {
    usuario: "mcerezo",
    contraseña: "$2b$10$nMVU8o1Ap.KaNWptd3v0N.bEGVa5btki5O6iscjJ2uEpzQ5GVnt4C",
    nombres: "MATIAS ANDRES",
    apellidos: "CEREZO PRADO",
    correo: "mcerezopr@gmail.com",
    estamento: "TENS"
  },
  {
    usuario: "cbrito",
    contraseña: "$2b$10$R8Sn4dDR07wWItccT35GTeVD.91saGuajZaVnVmLvfFbbKkhO0p1G",
    nombres: "Catalina",
    apellidos: "Brito Astudillo",
    correo: "catalina.andrea.brito@gmail.com",
    estamento: "Kinesiología"
  }
];

// Función para importar usuarios
async function importarUsuarios() {
  const baseURL = 'https://vitalmapeuti-production.up.railway.app/api';
  
  for (const usuario of usuarios) {
    try {
      const response = await fetch(`${baseURL}/auth/import-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(usuario)
      });
      
      const result = await response.json();
      console.log(`Usuario ${usuario.usuario}:`, result);
    } catch (error) {
      console.error(`Error con usuario ${usuario.usuario}:`, error);
    }
  }
}

// Ejecutar importación
importarUsuarios();

# VitalMape Backend API

Backend API para el Sistema de Gestión de UTI VitalMape.

## Descripción

Este es el backend del sistema VitalMape, una aplicación web para la gestión de pacientes en Unidades de Terapia Intensiva (UTI). Proporciona una API REST completa para el manejo de pacientes, procedimientos médicos, usuarios y estadísticas.

## Características

- **API REST** completa con Express.js
- **Base de datos PostgreSQL** con Sequelize ORM
- **Autenticación JWT** para seguridad
- **Sistema de migraciones** para manejo de base de datos
- **Envío de emails** con Nodemailer
- **CORS** configurado para frontend
- **Logging** completo de operaciones

## Tecnologías

- Node.js 18.x
- Express.js 5.x
- PostgreSQL
- Sequelize ORM
- JWT para autenticación
- Nodemailer para emails
- bcryptjs para hash de contraseñas

## Instalación

1. Clona el repositorio:
```bash
git clone <url-del-repositorio>
cd vitalmape-backend
```

2. Instala las dependencias:
```bash
npm install
```

3. Configura las variables de entorno:
```bash
cp env.example .env
```

4. Edita el archivo `.env` con tus configuraciones:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vitalmape_db
DB_USER=tu_usuario
DB_PASS=tu_contraseña
JWT_SECRET=tu_jwt_secret
EMAIL_USER=mcerezopr@gmail.com
EMAIL_PASS=tu_password_email
```

5. Ejecuta las migraciones:
```bash
npm run db:migrate
```

6. (Opcional) Pobla la base de datos con datos de prueba:
```bash
npm run db:seed
```

## Scripts disponibles

- `npm start` - Inicia el servidor en producción
- `npm run dev` - Inicia el servidor en modo desarrollo con nodemon
- `npm run build` - Instala dependencias
- `npm run db:migrate` - Ejecuta las migraciones de base de datos
- `npm run db:seed` - Pobla la base de datos con datos de prueba

## Estructura del proyecto

```
backend/
├── config/           # Configuraciones de base de datos, email, etc.
├── middleware/       # Middleware personalizado (auth, etc.)
├── migrations/       # Migraciones de base de datos
├── models/          # Modelos de Sequelize
├── routes/          # Rutas de la API
├── app.js           # Archivo principal de la aplicación
└── package.json     # Dependencias y scripts
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario

### Pacientes
- `GET /api/pacientes` - Obtener todos los pacientes
- `POST /api/pacientes` - Crear nuevo paciente
- `PUT /api/pacientes/:id` - Actualizar paciente
- `DELETE /api/pacientes/:id` - Eliminar paciente

### Procedimientos
- `GET /api/procedimientos/*` - Varios endpoints para diferentes tipos de procedimientos
- `POST /api/procedimientos/*` - Crear procedimientos
- `PUT /api/procedimientos/*` - Actualizar procedimientos

### Estadísticas
- `GET /api/estadisticas/*` - Endpoints para estadísticas y reportes

## Despliegue

### Railway
El proyecto está configurado para desplegarse en Railway. Solo necesitas:

1. Conectar tu repositorio a Railway
2. Configurar las variables de entorno en Railway
3. Railway detectará automáticamente la configuración y desplegará

### Variables de entorno requeridas en producción:
- `DB_HOST`
- `DB_PORT` 
- `DB_NAME`
- `DB_USER`
- `DB_PASS`
- `JWT_SECRET`
- `EMAIL_USER`
- `EMAIL_PASS`
- `NODE_ENV=production`

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## Licencia

ISC - Ver archivo LICENSE para más detalles.

## Autor

Matías Cerezo Prado - mcerezopr@gmail.com

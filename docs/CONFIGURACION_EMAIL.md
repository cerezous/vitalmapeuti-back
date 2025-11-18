# Configuración de Email para Recuperación de Contraseña

## Variables de Entorno Requeridas

Para que la recuperación de contraseña funcione correctamente, necesitas configurar las siguientes variables de entorno en tu plataforma de producción (Railway, Render, etc.):

### Opción 1: Usando SendGrid (Recomendado para producción)

```env
SENDGRID_API_KEY=tu_api_key_de_sendgrid
FRONTEND_URL=https://tu-frontend-url.vercel.app
```

**Ventajas:**
- Mayor confiabilidad
- Mejor deliverability
- Estadísticas de envío
- Escalable

**Cómo obtener la API Key:**
1. Ve a https://app.sendgrid.com
2. Settings → API Keys
3. Create API Key
4. Copia la clave generada

### Opción 2: Usando Gmail SMTP (Fallback)

Si no tienes SendGrid configurado, el sistema intentará usar Gmail SMTP como fallback:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mcerezopr@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion_gmail
FRONTEND_URL=https://tu-frontend-url.vercel.app
```

**Importante:** Para usar Gmail SMTP necesitas:
1. Habilitar "Acceso de aplicaciones menos seguras" O mejor aún:
2. Crear una "Contraseña de aplicación" en tu cuenta de Google:
   - Ve a https://myaccount.google.com/apppasswords
   - Genera una contraseña de aplicación
   - Usa esa contraseña en `SMTP_PASS` (sin espacios)

## Verificación de Configuración

El sistema ahora incluye logs detallados que te ayudarán a diagnosticar problemas:

```
📧 Iniciando envío de correo de recuperación...
👤 Usuario: [nombre]
📮 Correo: [email]
🔍 DEBUG Variables de entorno:
SENDGRID_API_KEY: CONFIGURADO / NO CONFIGURADO
SMTP_HOST: smtp.gmail.com / NO CONFIGURADO
SMTP_USER: mcerezopr@gmail.com / NO CONFIGURADO
NODE_ENV: production / development
```

## Flujo de Envío

1. **Primer intento:** SendGrid (si `SENDGRID_API_KEY` está configurado)
2. **Fallback automático:** Gmail SMTP (si SendGrid falla o no está configurado)
3. **Error final:** Solo si ambos métodos fallan

## Solución de Problemas

### Error: "Error al enviar el correo de recuperación"

**Posibles causas:**
1. Variables de entorno no configuradas
2. API Key de SendGrid inválida o expirada
3. Contraseña de aplicación de Gmail incorrecta
4. Firewall bloqueando conexiones SMTP

**Solución:**
1. Verifica que todas las variables estén configuradas en tu plataforma de producción
2. Revisa los logs del servidor para ver qué método está intentando usar
3. Prueba la configuración localmente primero

### Error: "Dirección de correo inválida"

**Causa:** El correo del usuario no está en formato válido o no existe en la base de datos.

**Solución:** Verifica que el correo esté correctamente registrado en la base de datos.

### El correo no llega a la bandeja de entrada

**Posibles causas:**
1. El correo está en spam
2. El dominio del remitente no está verificado (SendGrid)
3. El enlace de recuperación tiene un error en `FRONTEND_URL`

**Solución:**
1. Verifica la carpeta de spam
2. En SendGrid, verifica que el dominio esté verificado
3. Asegúrate de que `FRONTEND_URL` apunte a la URL correcta de tu frontend

## Testing Local

Para probar localmente, crea un archivo `.env` en `backendprod/`:

```env
NODE_ENV=development
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mcerezopr@gmail.com
SMTP_PASS=tu_contraseña_de_aplicacion
FRONTEND_URL=http://localhost:3000
JWT_SECRET=tu_secret_key_local
```

Luego prueba el endpoint:

```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"correo": "usuario@ejemplo.com"}'
```

## Notas Importantes

- El token de recuperación expira en 1 hora
- El enlace de recuperación debe apuntar a la ruta `/recuperar-contraseña` en tu frontend
- El frontend debe estar configurado para recibir el parámetro `token` en la query string
- Los logs del servidor mostrarán información detallada sobre el proceso de envío


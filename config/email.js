const nodemailer = require('nodemailer');

// Función para validar email
function validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Función para enviar correo de bienvenida - SOLUCIÓN DIRECTA CON SENDGRID API
async function enviarCorreoBienvenida(usuario, contraseña) {
    console.log('📧 Iniciando envío de correo de bienvenida...');
    console.log('👤 Usuario:', usuario.nombres, usuario.apellidos);
    console.log('📮 Correo:', usuario.correo || usuario.email);
    
    // DEBUG: Mostrar todas las variables de entorno relacionadas con correo
    console.log('🔍 DEBUG Variables de entorno:');
    console.log('SENDGRID_API_KEY:', process.env.SENDGRID_API_KEY ? 'CONFIGURADO' : 'NO CONFIGURADO');
    console.log('SMTP_HOST:', process.env.SMTP_HOST || 'NO CONFIGURADO');
    console.log('SMTP_USER:', process.env.SMTP_USER || 'NO CONFIGURADO');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'NO CONFIGURADO');
    
    // Verificación rápida
    if (!process.env.SENDGRID_API_KEY) {
        console.log('❌ SendGrid no configurado - Intentando con Gmail SMTP como fallback');
        
        // FALLBACK: Intentar con Gmail SMTP
        try {
            return await enviarCorreoConGmail(usuario, contraseña);
        } catch (error) {
            console.error('❌ Fallback Gmail también falló:', error.message);
            return { success: false, error: 'No se pudo enviar correo con ningún método' };
        }
    }

    const emailDestinatario = usuario.correo || usuario.email;
    if (!emailDestinatario || !validarEmail(emailDestinatario)) {
        console.error('❌ Dirección de correo inválida:', emailDestinatario);
        return { success: false, error: `Dirección de correo inválida: ${emailDestinatario}` };
    }

    console.log('📤 Enviando correo de bienvenida con SendGrid API...');
    
    // Usar SendGrid API directamente
    try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
            to: emailDestinatario,
            from: 'mcerezopr@gmail.com', // Email verificado en SendGrid
            subject: '¡Bienvenido a VitalMape UTI!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">¡Bienvenido a VitalMape UTI!</h1>
                            <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">Sistema de Gestión de Unidad de Terapia Intensiva</p>
                        </div>
                        
                        <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                            <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 20px;">Información de tu cuenta</h2>
                            <p style="margin: 8px 0; color: #34495e;"><strong>Nombre:</strong> ${usuario.nombres} ${usuario.apellidos}</p>
                            <p style="margin: 8px 0; color: #34495e;"><strong>Usuario:</strong> ${usuario.usuario}</p>
                            <p style="margin: 8px 0; color: #34495e;"><strong>Contraseña:</strong> ${contraseña}</p>
                            <p style="margin: 8px 0; color: #34495e;"><strong>Estamento:</strong> ${usuario.estamento}</p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.FRONTEND_URL || 'https://vitalmapeuti-front.vercel.app'}/login" 
                               style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                Iniciar Sesión
                            </a>
                        </div>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1; text-align: center;">
                            <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
                                Este es un correo automático del sistema VitalMape UTI.<br>
                                Si no solicitaste esta cuenta, puedes ignorar este mensaje.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        const resultado = await sgMail.send(msg);
        console.log('✅ Correo de bienvenida enviado exitosamente con SendGrid API');
        console.log('📧 Status Code:', resultado[0].statusCode);
        return { success: true, messageId: resultado[0].headers['x-message-id'] };
        
    } catch (error) {
        console.error('❌ Error al enviar correo con SendGrid API:', error.message);
        console.error('❌ Error details:', error.response?.body);
        return { success: false, error: error.message };
    }
}

// Función para enviar correo de recuperación de contraseña
async function enviarCorreoRecuperacion(usuario, token) {
    console.log('📧 Enviando correo de recuperación...');
    
    if (!process.env.SENDGRID_API_KEY) {
        console.log('❌ SendGrid no configurado - Saltando envío de recuperación');
        return { success: true, message: 'SendGrid no configurado - Usuario creado sin notificación' };
    }

    const emailDestinatario = usuario.correo || usuario.email;
    if (!emailDestinatario || !validarEmail(emailDestinatario)) {
        console.error('❌ Dirección de correo inválida:', emailDestinatario);
        return { success: false, error: `Dirección de correo inválida: ${emailDestinatario}` };
    }

    try {
        const sgMail = require('@sendgrid/mail');
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
            to: emailDestinatario,
            from: 'mcerezopr@gmail.com',
            subject: 'Recuperación de Contraseña - VitalMape UTI',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h1 style="color: #2c3e50;">Recuperación de Contraseña</h1>
                    <p>Hola ${usuario.nombres},</p>
                    <p>Has solicitado recuperar tu contraseña. Haz clic en el siguiente enlace:</p>
                    <a href="${process.env.FRONTEND_URL}/recuperar-contraseña?token=${token}" 
                       style="background-color: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Recuperar Contraseña
                    </a>
                    <p>Este enlace expirará en 1 hora.</p>
                </div>
            `
        };

        const resultado = await sgMail.send(msg);
        console.log('✅ Correo de recuperación enviado exitosamente');
        return { success: true, messageId: resultado[0].headers['x-message-id'] };
        
    } catch (error) {
        console.error('❌ Error al enviar correo de recuperación:', error.message);
        return { success: false, error: error.message };
    }
}

// Función de fallback con Gmail SMTP
async function enviarCorreoConGmail(usuario, contraseña) {
    console.log('📧 Intentando envío con Gmail SMTP como fallback...');
    
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ Configuración SMTP incompleta');
        return { success: false, error: 'Configuración SMTP incompleta' };
    }
    
    try {
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 30000,
            greetingTimeout: 30000,
            socketTimeout: 30000
        });
        
        const emailDestinatario = usuario.correo || usuario.email;
        
        const mailOptions = {
            from: process.env.SMTP_USER,
            to: emailDestinatario,
            subject: '¡Bienvenido a VitalMape UTI!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2c3e50; margin: 0; font-size: 28px;">¡Bienvenido a VitalMape UTI!</h1>
                            <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">Sistema de Gestión de Unidad de Terapia Intensiva</p>
                        </div>
                        
                        <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                            <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 20px;">Información de tu cuenta</h2>
                            <p style="margin: 8px 0; color: #34495e;"><strong>Nombre:</strong> ${usuario.nombres} ${usuario.apellidos}</p>
                            <p style="margin: 8px 0; color: #34495e;"><strong>Usuario:</strong> ${usuario.usuario}</p>
                            <p style="margin: 8px 0; color: #34495e;"><strong>Contraseña:</strong> ${contraseña}</p>
                            <p style="margin: 8px 0; color: #34495e;"><strong>Estamento:</strong> ${usuario.estamento}</p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px;">
                            <a href="${process.env.FRONTEND_URL || 'https://vitalmapeuti-front.vercel.app'}/login" 
                               style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                                Iniciar Sesión
                            </a>
                        </div>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ecf0f1; text-align: center;">
                            <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
                                Este es un correo automático del sistema VitalMape UTI.<br>
                                Si no solicitaste esta cuenta, puedes ignorar este mensaje.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };
        
        const resultado = await transporter.sendMail(mailOptions);
        console.log('✅ Correo de bienvenida enviado exitosamente con Gmail SMTP');
        console.log('📧 Message ID:', resultado.messageId);
        return { success: true, messageId: resultado.messageId };
        
    } catch (error) {
        console.error('❌ Error al enviar correo con Gmail SMTP:', error.message);
        return { success: false, error: error.message };
    }
}

module.exports = {
    enviarCorreoBienvenida,
    enviarCorreoRecuperacion
};

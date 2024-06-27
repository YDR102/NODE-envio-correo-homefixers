const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');

// Importar dotenv y cargar variables de entorno desde .env
require('dotenv').config();

// Configurar Express
const app = express();
app.use(bodyParser.json());

// Permitir solicitudes desde http://localhost:4200
app.use(cors({
    origin: 'http://localhost:4200',
    optionsSuccessStatus: 200 // Algunos navegadores antiguos (IE11, varios SmartTVs) interpretan mal los códigos de éxito de CORS.
  }));

// Ruta para enviar correo con validación y sanitización
app.post('/contacto', [
  // Sanitización y validaciones de campos
  body('nombre').notEmpty().trim().escape().withMessage('El nombre es requerido'),
  body('email').isEmail().normalizeEmail().withMessage('El correo electrónico no es válido'),
  body('asunto').notEmpty().trim().escape().withMessage('El asunto es requerido'),
  body('mensaje').notEmpty().trim().escape().withMessage('El mensaje es requerido')
], async (req, res) => {
    // Manejar errores de validación
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('Errores de validación:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    // Desestructurar datos del cuerpo de la solicitud
    const { nombre, tef, email, asunto, mensaje } = req.body;

    try {
      // Configuración del transportador para enviar correos usando nodemailer
      if (!process.env.TRANSPORTER_USER || !process.env.TRANSPORTER_PASSWORD) {
        console.error('Faltan variables de entorno para el transportador de correo.');
        return res.status(500).send('Error en el servidor');
      }
      
      let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.TRANSPORTER_USER,
          pass: process.env.TRANSPORTER_PASSWORD,
        },
      });
      
      // Detalles del correo
      let correoOptions = {
        from: email,
        to: process.env.TRANSPORTER_RECEPTOR,
        subject: asunto,
        html: `
          <h1>${nombre}</h1>
          <h2>${asunto}</h2>
          <p>Email: ${email}</p>
          <p>Teléfono: ${tef}</p>
          <p>${mensaje}</p>
        `,
      };

      // Enviar correo
      let info = await transporter.sendMail(correoOptions);
      console.log('Correo enviado: %s', info.messageId);
      res.status(200).json({ message: 'Correo enviado correctamente' });
    } catch (error) {
      console.error('Error al enviar el correo: ', error);
      res.status(500).json({ message: 'Error al enviar el correo' });
    }
});

// Puerto en el que escucha el servidor
const PORT = process.env.TRANSPORTER_PORT;
app.listen(PORT, () => {
  console.log(`Servidor backend en ejecución en http://localhost:${PORT}`);
});

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const cors = require('cors');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Defina o token de autorização MozeSMS
const MOZE_SMS_TOKEN = 'Bearer 2275:otCWXf-5G7Ys6-DdA6Kc-WLXsW6';

// Endpoint para envio de SMS
app.post('/send-sms', (req, res) => {
  const { phoneNumber, message } = req.body;

  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'Número de telefone e mensagem são obrigatórios.' });
  }

  const options = {
    method: 'POST',
    url: 'https://api.mozesms.com/message/v2',
    headers: {
      Authorization: MOZE_SMS_TOKEN,
    },
    form: {
      from: 'AGVIAGEM',
      to: phoneNumber,
      message: message,
    },
  };

  // Enviando a requisição
  request(options, (error, response, body) => {
    if (error) {
      console.error('Erro ao enviar SMS:', error);
      return res.status(500).json({ error: 'Erro ao enviar SMS.' });
    }

    // Enviar a resposta da API para o frontend
    if (response.statusCode === 200) {
      res.json({ message: 'Mensagem enviada com sucesso!', data: body });
    } else {
      res.status(response.statusCode).json({
        error: `Falha ao enviar SMS. Código de status: ${response.statusCode}`,
        data: body,
      });
    }
  });
});

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

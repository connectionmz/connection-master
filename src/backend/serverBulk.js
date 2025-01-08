const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 4000; // Porta onde o backend será executado

// Configuração do middleware
app.use(cors()); // Permite todas as origens (apenas para desenvolvimento)
app.use(express.json()); // Permite lidar com JSON no corpo da requisição

// Endpoint para enviar SMS
app.post('/send-sms', async (req, res) => {
  const apiUrl = "http://api.mozesms.com/bulk_json/v2/";

  // Lista de contatos e mensagens
  const contactsAndMessages = [
    { number: "840237100", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" },
    { number: "876773180", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" },
    { number: "871597730", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" },
    { number: "873886036", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" },
    { number: "840237102", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" },
    { number: "870535040", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" },
    { number: "846368132", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" },
    { number: "947368133", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" },
    { number: "861016155", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" },
    { number: "870476788", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" },
    { number: "871446173", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" },
    { number: "876773180", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" },
    { number: "852064674", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" },
    { number: "872576657", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" },
    { number: "860269917", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" },
    { number: "873159313", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" },
    { number: "873989367", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" },
    { number: "846048994", message: "Sua conta foi aprovada, entre no link e comece a usar: https://raspaganha.vercel.app/" }
  ];

  // Montando o payload com o sender e as mensagens
  const payload = {
    sender: "AUTHMSG", // Substitua pelo ID do remetente configurado na API
    messages: contactsAndMessages.map(contact => ({
      number: contact.number,
      text: contact.message
    })),
  };

  try {
    // Envia a requisição para a API de SMS
    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: `Bearer 2275:otCWXf-5G7Ys6-DdA6Kc-WLXsW6`, // Adiciona o token de autenticação
        "Content-Type": "application/json", // Definir o tipo de conteúdo
      },
    });

    // Retorna a resposta para o frontend
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Erro ao enviar mensagens:", error.response?.data || error.message);
    res.status(500).json({ error: "Falha ao enviar as mensagens" });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});

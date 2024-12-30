const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const port = 5000; // Porta onde o backend será executado

// Configuração do middleware
app.use(cors()); // Permite todas as origens (apenas para desenvolvimento)
app.use(express.json()); // Permite lidar com JSON no corpo da requisição

// Endpoint para enviar SMS
app.post('/send-sms', async (req, res) => {
  const apiUrl = "http://api.mozesms.com/bulk_json/v2/";

  // Mensagens que você deseja enviar
  const messages = [
    { number: "840237100", text: "Mensagem 1 para este número." },
    { number: "876773180", text: "Mensagem 2 para outro número." },
    { number: "871597730", text: "Mensagem 3 para mais um número." },
  ];

  // Montando o payload com o sender e as mensagens
  const payload = {
    sender: "AGVIAGEM", // Substitua pelo ID do remetente configurado na API
    messages: messages,
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

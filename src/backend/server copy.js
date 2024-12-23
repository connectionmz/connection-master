

const request = require('request');

// Defina o seu token de autorização MozeSMS
const MOZE_SMS_TOKEN = 'Bearer 2275:otCWXf-5G7Ys6-DdA6Kc-WLXsW6'; // Substitua pelo seu token MozeSMS

// Defina o ID do remetente (Sender ID) e o número de telefone do destinatário
const SENDER_ID = 'AGVIAGEM';  // Substitua por seu Sender ID
const RECIPIENT_PHONE = '+258876773180'; // Número de telefone do destinatário
const MESSAGE = 'Hello from MozeSMS API'; // Mensagem a ser enviada

// Opções para enviar a solicitação POST para MozeSMS API
const options = {
  method: 'POST',
  url: 'https://api.mozesms.com/message/v2', // URL da MozeSMS API
  headers: {
    'Authorization': `Bearer 2275:otCWXf-5G7Ys6-DdA6Kc-WLXsW6`, // Token de autorização
  },
  form: {
    'from': 'AGVIAGEM',  // ID do remetente
    'to': '840237100',  // Número de telefone do destinatário
    'message': 'MESSAGE', // Mensagem a ser enviada
  },
};

// Enviando a requisição
request(options, function (error, response, body) {
  if (error) {
    console.error('Erro ao enviar SMS:', error);
    return;
  }
  // Exibe a resposta da API no console
  console.log('Resposta da API:', body);

  // Verifica o status da resposta e loga o resultado
  if (response.statusCode === 200) {
    console.log('Mensagem enviada com sucesso!');
  } else {
    console.error(`Falha ao enviar SMS. Código de status: ${response.statusCode}`);
  }
});

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');

// Inicialize o Firebase Admin SDK
admin.initializeApp();

// Defina as credenciais da Twilio
const accountSid = 'ACf76472290af52e54e814946eeab76ddf'; 
const authToken = 'bc3c31c2315793e1084c408504021c48'; 
const client = twilio(accountSid, authToken);
const twilioPhoneNumber = '+18148133628';

// Função para monitorar novos pedidos de cotação
exports.sendSMSOnNewCotacao = functions.database.ref('/cotacoes/{cotacaoId}')
    .onCreate((snapshot, context) => {
        const cotacao = snapshot.val();
        const { descricao, data, empresa, contactoEmpresa } = cotacao;

        // Defina a mensagem a ser enviada
        const message = `Novo pedido de cotação de ${empresa}: ${descricao}. Data: ${data}`;

        // Enviar SMS usando Twilio
        return client.messages.create({
            body: message,
            to: contactoEmpresa, // Número de telefone do cliente
            from: twilioPhoneNumber, // Seu número Twilio
        }).then(message => {
            console.log(`SMS enviado com sucesso: ${message.sid}`);
        }).catch(error => {
            console.error('Erro ao enviar SMS:', error);
        });
    });

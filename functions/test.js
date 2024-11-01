const functions = require('firebase-functions');
const admin = require('firebase-admin');
const twilio = require('twilio');

// Inicialize o Firebase Admin SDK
admin.initializeApp();

// Defina as credenciais da Twilio
const accountSid = 'ACf76472290af52e54e814946eeab76ddf'; // Substitua pelo seu Account SID do Twilio
const authToken = 'bc3c31c2315793e1084c408504021c48'; // Substitua pelo seu Auth Token do Twilio
const client = twilio(accountSid, authToken);
const twilioPhoneNumber = '+18148133628'; // Número do Twilio (remetente)

// Função para monitorar novos pedidos de cotação
exports.sendSMSOnNewCotacao = functions.database.ref('/cotacoes/{cotacaoId}')
    .onCreate(async (snapshot, context) => {
        const cotacao = snapshot.val();
        console.log('Cotação recebida:', cotacao); // Log para verificar a entrada

        const { descricao, data, empresa, contactoEmpresa, subscription } = cotacao;

        if (subscription && subscription.status === true) {
            const message = `Novo pedido de cotação de ${empresa}: ${descricao}. Data: ${data}`;

            try {
                const messageResponse = await client.messages.create({
                    body: message,
                    to: contactoEmpresa, // Número de telefone do cliente (destinatário)
                    from: twilioPhoneNumber, // Seu número Twilio (remetente)
                });
                console.log(`SMS enviado com sucesso: ${messageResponse.sid}`);
            } catch (error) {
                console.error('Erro ao enviar SMS:', error);
            }
        } else {
            console.log(`Empresa ${empresa} não tem uma assinatura ativa. SMS não enviado.`);
        }
        return null;
    });

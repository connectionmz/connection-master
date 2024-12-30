import axios from "axios";

const sendMessage = async (contatos, message) => {
    console.log('Contatos:', contatos); 
    // Criar o array de mensagens no formato esperado pelo backend
    const messages = contatos.map(numero => ({
        number: numero,  // Número do telefone
        text: message     // Texto da mensagem
    }));

    try {
        const data = {
            messages: messages, // Envia o array de mensagens
        };

        console.log('Mensagem a ser enviada:', data); // Verifique o corpo da requisição

        // Enviar a requisição para o backend
        await axios.post('http://localhost:5000/send-sms', data)
            .then((response) => {
                console.log(`Mensagem(s) enviada(s) com sucesso:`, response.data);
            })
            .catch((error) => {
                console.error('Erro ao enviar SMS:', error.message);
            });
    } catch (error) {
        console.error('Erro inesperado ao enviar SMS:', error.message);
    }
};

export default sendMessage;

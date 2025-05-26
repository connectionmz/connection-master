import axios from 'axios';

const sendEmailProposta = async (to,emailMessage) => {

  console.log(emailMessage)

  const textContent = `
  Detalhes do pedido:
  Descrição: ${emailMessage.message}
  Clique aqui: https://connectionmozambique.com/${emailMessage.link}

  Caso tenha interesse, acesse o link acima e envie sua proposta.
  Atenciosamente,
  Equipe de Suporte
  suporte@connectionmozambique.com
`;

  const emailData = {
    to,
    subject: "Nova proposta para sua cotação",
        text:textContent, 
  };
  try {
    const response = await axios.post('https://mohvi-sendmail.vercel.app/send-email', emailData);
    console.log('E-mail enviado com sucesso:', response.data + to);
    return true; 
  } catch (error) {
    console.error('Erro ao enviar o e-mail:', error);
    return false; 
  }
};

export default sendEmailProposta;
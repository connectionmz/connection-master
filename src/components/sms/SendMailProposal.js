import axios from 'axios';

const sendEmailProposta = async (to, emailMessage) => {
  console.log('Mensagem de e-mail:', emailMessage);

  const textContent = `
${emailMessage.message}
Clique aqui: https://connectionmozambique.com${emailMessage.link}

Caso tenha interesse, acesse o link acima e envie sua proposta.

Atenciosamente,
Equipe de Suporte
suporte@connectionmozambique.com
`;

  const emailData = {
    to,
    subject: "Nova proposta para sua cotação",
    text: textContent,
  };

  try {
    const response = await axios.post('https://mohvi-sendmail.vercel.app/send-email', emailData);
    console.log('E-mail enviado com sucesso para:', to, '| Resposta:', response.data);
    return true;
  } catch (error) {
    console.error('Erro ao enviar o e-mail:', error.message);
    return false;
  }
};

export default sendEmailProposta;
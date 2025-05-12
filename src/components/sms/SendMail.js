import axios from 'axios';

const sendEmail = async (to,emailMessage) => {

  const textContent = `
  Um novo pedido de cotação foi publicado para o seu setor.

  Detalhes do pedido:
  Título: ${emailMessage.title}
  Descrição: ${emailMessage.description}
  Data Limite: ${emailMessage.deadline}
  Setor de Atividade: ${emailMessage.sector}
  Acesse: ${emailMessage.link}

  Caso tenha interesse, acesse o link acima e envie sua proposta.

  Atenciosamente,
  Equipe de Suporte
  suporte@connectionmozambique.com
`;

  const emailData = {
    to,
    subject: "Novo Pedido de Cotação Disponível",
        text:textContent, 
  };
  try {
    const response = await axios.post('https://mohvi-sendmail.vercel.app/send-email', emailData);
    console.log('E-mail enviado com sucesso:', response.data);
    return true; 
  } catch (error) {
    console.error('Erro ao enviar o e-mail:', error);
    return false; 
  }
};

export default sendEmail;
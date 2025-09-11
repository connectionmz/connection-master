import axios from 'axios';

const sendEmail = async (to, emailMessage) => {
  const textContent = `
  Um novo pedido de cotação foi publicado para o seu setor.

  Detalhes do pedido:
  Título: ${emailMessage.title}
  Data Limite: ${emailMessage.deadline}
  Setor de Atividade: ${emailMessage.sector}
  Acesse: ${emailMessage.link}
  Caso tenha interesse, acesse o link acima e envie sua proposta.
  Atenciosamente,`;

  const emailData = {
    to,
    subject: "Novo Pedido de Cotação Disponível",
    text: textContent, 
  };

  try {
    // URL corrigida com protocolo http://
    const response = await axios.post('https://mohvi-sendmail.vercel.app/send-email', emailData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('E-mail enviado com sucesso:', response.data);
    return true; 
  } catch (error) {
    console.error('Erro ao enviar o e-mail:', error);
    return false; 
  }
};

const sendEmailConcurso = async (to, emailMessage) => {
  const textContent = `
  Um novo concurso foi publicado para o seu setor.

  Detalhes do Concurso:
  Título: ${emailMessage.title}
  Data Limite: ${emailMessage.deadline}
  Setor de Atividade: ${emailMessage.sector}
  Acesse: ${emailMessage.link}

  Caso tenha interesse, acesse o link acima e envie sua proposta.

  Atenciosamente,
  `;

  const emailData = {
    to,
    subject: "Novo concurso Disponível",
    text: textContent, 
  };

  try {
    const response = await axios.post('https://mohvi-sendmail.vercel.app/send-email', emailData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('E-mail enviado com sucesso:', response.data);
    return true; 
  } catch (error) {
    console.error('Erro ao enviar o e-mail:', error);
    return false; 
  }
};

const SendMailProforma = async (to, emailMessage) => {
  const textContent = `
  Detalhes do pedido:
  ${emailMessage.message}
  `;

  const emailData = {
    to,
    subject: "Nova Proforma Criada",
    text: textContent, 
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

const sendEmailInquerito = async (to, emailMessage) => {
  const textContent = `
  Detalhes do pedido:
  ${emailMessage.message}
  `;

  const emailData = {
    to,
    subject: "Nova Proforma Criada",
    text: textContent, 
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

export {sendEmail, SendMailProforma, sendEmailConcurso, sendEmailInquerito};
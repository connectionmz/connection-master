import axios from 'axios';

const sendEmail = async (to, subject, text) => {
  const emailData = {
    to,
    subject,
    text, // Corpo do e-mail
  };

  try {
    const response = await axios.post('https://mohvi-sendmail.vercel.app/send-email', emailData);
    console.log('E-mail enviado com sucesso:', response.data);
    return true; // Retorna true se o e-mail for enviado com sucesso
  } catch (error) {
    console.error('Erro ao enviar o e-mail:', error);
    return false; // Retorna false em caso de erro
  }
};

export default sendEmail;
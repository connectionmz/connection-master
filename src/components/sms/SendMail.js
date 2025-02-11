import axios from 'axios';

const SendEmail = () => {

  const sendEmail = async () => {
    const emailData = {
      to: 'msaide@connectionmozambique.com',
      subject: 'Assunto do E-mail',
      message: 'Corpo do e-mail', // Altere para "message"
    };

    try {
      const response = await axios.post('http://localhost:5000/send-email', emailData); // Certifique-se de usar a porta 3001
      console.log(response)
    } catch (error) {
      console.error('Erro:', error);
    }
  };
};

export default SendEmail;

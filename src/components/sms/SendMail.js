import React, { useState } from 'react';
import axios from 'axios';

const SendEmail = () => {
  const [status, setStatus] = useState('');

  const sendEmail = async () => {
    const emailData = {
      to: 'msaide@connectionmozambique.com',
      subject: 'Assunto do E-mail',
      message: 'Corpo do e-mail', // Altere para "message"
    };

    try {
      const response = await axios.post('http://localhost:3001/send-email', emailData); // Certifique-se de usar a porta 3001
      setStatus('E-mail enviado com sucesso!');
    } catch (error) {
      setStatus('Erro ao enviar o e-mail.');
      console.error('Erro:', error);
    }
  };

  return (
    <div>
      <button onClick={sendEmail}>Enviar E-mail</button>
      <p>{status}</p>
    </div>
  );
};

export default SendEmail;

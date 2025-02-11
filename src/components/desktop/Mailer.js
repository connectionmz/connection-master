import React, { useState } from 'react';
import axios from 'axios';

const ContactForm = () => {
  const [status, setStatus] = useState('');

  const sendEmail = async () => {
    const emailData = {
      to: 'msaide@connectionmozambique.com',
      subject: 'Assunto do E-mail',
      text: 'Corpo do e-mail', // "message" alterado para "text"
    };

    try {
      const response = await axios.post('http://localhost:5000/send-email', emailData);
      setStatus('Email enviado com sucesso!');
      console.log(response.data);
    } catch (error) {
      setStatus('Erro ao enviar o e-mail.');
      console.error('Erro:', error);
    }
  };

  return (
    <div>
      <button onClick={sendEmail}>Enviar</button>
      {status && <p>{status}</p>}
    </div>
  );
};

export default ContactForm;

import React from 'react';

const SmsForm = () => {
  const contacts = ['840237100', '876773180'];
  const message = 'Pedido de cotação';

  const sendSMS = async (phoneNumber) => {
    const payload = { phoneNumber, message };

    try {
      const response = await fetch('http://localhost:5000/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`Mensagem enviada com sucesso para ${phoneNumber}`);
      } else {
        console.error(`Erro ao enviar mensagem para ${phoneNumber}:`, data.error);
      }
    } catch (error) {
      console.error(`Erro ao conectar ao servidor para o número ${phoneNumber}:`, error);
    }
  };

  const handleSendSMS = async () => {
    for (const contact of contacts) {
      await sendSMS(contact);
    }
    alert('Mensagens enviadas com sucesso!');
  };

  return (
    <div>
      <h1>Envio Automático de SMS</h1>
      <button onClick={handleSendSMS}>Enviar SMS para todos os contactos</button>
    </div>
  );
};

export default SmsForm;

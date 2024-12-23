const sendSMS = async (contacts, message) => {
  if (!Array.isArray(contacts) || typeof message !== 'string') {
    console.error('Os contactos devem ser um array e a mensagem deve ser uma string.');
    return;
  }

  try {
    for (const phoneNumber of contacts) {
      const payload = { phoneNumber, message };

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
      console.log(`Enviando mensagem para ${phoneNumber}`);
      console.log(payload);

      console.log(`Mensagem enviada com sucesso para ${phoneNumber}`);
    }
  } catch (error) {
    console.error('Erro ao conectar ao servidor:', error);
  }
};

export default sendSMS;
  
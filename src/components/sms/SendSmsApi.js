// sendSMS.js (Pode ser um arquivo separado para reutilização)
import axios from 'axios';

const sendSMS = async (phoneNumber, message) => {
  if (!phoneNumber || !message) {
    alert('Phone number and message cannot be empty.');
    return;
  }

  try {
    const response = await axios.post('http://localhost:3001/send-sms', {
      to: phoneNumber,
      message: message,
    });
    alert('SMS sent successfully!');
  } catch (error) {
    console.error('Error sending SMS:', error);
    alert(`Failed to send SMS: ${error.response ? error.response.data : error.message}`);
  }
};

export default sendSMS;

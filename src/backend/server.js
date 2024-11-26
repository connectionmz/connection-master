const express = require('express');
const twilio = require('twilio');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors()); 
app.use(bodyParser.json());

const accountSid = 'AC53b8d7f44f6c38a449c20aa0199da682'; 
const authToken = '1b4da83f52349275638851d48ad47bb5'; 

const client = twilio(accountSid, authToken);

app.post('/send-sms', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).send('Required parameter "message" is missing.');
  }

  const phoneNumber = '+258840237100'; 

  const phoneRegex = /^\+\d{1,15}$/;

  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).send(`Invalid phone number format: ${phoneNumber}`);
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: '+16812466142',
      to: phoneNumber, 
    });

    res.status(200).send(`Message sent: ${result.sid}`);
  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).send(`Failed to send SMS: ${error.message}`);
  }
});

app.post('/send-message', (req, res) => {
  const { message, to } = req.body;

  client.messages
  .create({
      body:message,
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+258876773180'
  })
  .then(message => res.status(200).json({ success: true, message }))
  .catch(error => res.status(500).json({ success: false, error }));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

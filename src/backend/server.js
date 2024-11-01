const express = require('express');
const twilio = require('twilio');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(cors()); 
app.use(bodyParser.json());

const accountSid = 'ACf76472290af52e54e814946eeab76ddf'; 
const authToken = 'bc3c31c2315793e1084c408504021c48'; 

const client = twilio(accountSid, authToken);

app.post('/send-sms', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).send('Required parameter "message" is missing.');
  }

  const phoneRegex = /^\+\d{1,15}$/;

  for (const phoneNumber of to) {
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).send(`Invalid phone number format: ${phoneNumber}`);
    }
  }

  try {
    const sendPromises = to.map(phoneNumber => {
      return client.messages.create({
        body: message,
        from: '+18148133628', 
        to: phoneNumber
      });
    });

    const results = await Promise.all(sendPromises);

    res.status(200).send(`Messages sent: ${results.map(msg => msg.sid).join(', ')}`);
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

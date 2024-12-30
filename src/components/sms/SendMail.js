const formData = require("form-data");
const Mailgun = require("mailgun.js");
const mailgun = new Mailgun(formData);

// Substitua pela sua API Key
const apiKey = "bda76665fa043d9334b67aea74c44ad1";

// Configuração do cliente Mailgun
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY || apiKey,
  url: "https://api.mailgun.net" // Use https://api.eu.mailgun.net para domínios europeus
});

// Envio do e-mail
mg.messages
  .create("sandbox-123.mailgun.org", {
    from: "Excited User <mailgun@sandboxf89735047d88421e9d0f73edfa049f8e.mailgun.org>",
    to: ["mohammadvicentesaide@gmail.com"], // Altere para o destinatário correto
    subject: "Hello",
    text: "Testing some Mailgun awesomeness!",
    html: "<h1>Testing some Mailgun awesomeness!</h1>",
  })
  .then((msg) => console.log("Mensagem enviada com sucesso:", msg)) // logs response data
  .catch((err) => console.error("Erro ao enviar e-mail:", err)); // logs any error



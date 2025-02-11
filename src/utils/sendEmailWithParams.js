import emailjs from "emailjs-com";

const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

const sendEmailWithParams = async ({
  to_email,
  subject,
  message,
  from_name = "Connection Mozambique",
  from_email = "mohammadvicentesaide@gmail.com",
}) => {
  if (!validateEmail(to_email)) {
    console.error("Endereço de e-mail do destinatário inválido:", to_email);
    return false;
  }

  const templateParams = {
    to_email,
    from_name, 
    from_email,
    subject,
    message_html: message,
  };

  try {
    const response = await emailjs.send(
        "service_8v2pd86", // Substitua pelo seu SERVICE_ID
        "template_98vq53o", // Substitua pelo seu TEMPLATE_ID
        templateParams,
        "0Cn-v8x5EwF_8SXYy" // Substitua pela sua PUBLIC_KEY
    );
    console.log("E-mail enviado com sucesso!", response);
    return true;
  } catch (error) {
    console.error("Erro ao enviar o e-mail:", {
      status: error.status,
      message: error.text,
      details: error,
    });
    return false;
  }
};

const sendEmailsToAll = async (emails, title, finalMessage) => {
  const emailPromises = emails.map(async (email) => {
    const subject = `Nova Cotação - ${title}`;
    const success = await sendEmailWithParams({
      to_email: email,
      subject,
      message: finalMessage,
    });
    if (!success) {
      console.error(`Falha ao enviar e-mail para ${email}`);
    }
    return success;
  });

  const results = await Promise.all(emailPromises);
  const allEmailsSent = results.every((success) => success);
  return allEmailsSent;
};

export { sendEmailWithParams, sendEmailsToAll };



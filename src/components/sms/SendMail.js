import axios from 'axios';
import { auth } from '../../fb';

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuário não autenticado. Faça login novamente.');
  }

  let token;
  try {
    token = await user.getIdToken();
  } catch (tokenError) {
    if (tokenError.code === 'auth/requests-blocked') {
      token = await user.getIdToken(false);
    } else {
      throw tokenError;
    }
  }
  
  return token;
};

const sendEmailWithAuth = async (emailData) => {
  try {
    const token = await getAuthToken();
    
    const response = await axios.post(
      'https://mohvi-sendmail.vercel.app/send-email', 
      emailData, 
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return true;
  } catch (error) {
    console.error('Erro ao enviar o e-mail:', error);
    return false;
  }
};

const sendEmail = async (to, emailMessage) => {
  const textContent = `
  Um novo pedido de cotação foi publicado para o seu setor.

  Detalhes do pedido:
  Título: ${emailMessage.title}
  Data Limite: ${emailMessage.deadline}
  Setor de Atividade: ${emailMessage.sector}
  Acesse: ${emailMessage.link}
  Caso tenha interesse, acesse o link acima e envie sua proposta.
  Atenciosamente,`;

  const emailData = {
    to,
    subject: "Novo Pedido de Cotação Disponível",
    text: textContent, 
  };

  return await sendEmailWithAuth(emailData);
};

const sendEmailCotacaoDireta = async (to, emailMessage) => {
  const textContent = `
Você recebeu um novo pedido de cotação diretamente na sua loja.

📌 Detalhes do cliente:
• Pedido: ${emailMessage.title}

💬 Mensagem do cliente:
${emailMessage.message || "Sem mensagem adicional"}

⚡ Este cliente está interessado nos seus serviços/produtos.
Responder rapidamente aumenta suas chances de fechar o negócio.

👉 Responda agora:
${emailMessage.link}

Seja rápido — outros fornecedores podem ser contactados.

—
Connection Mozambique
`;
  const emailData = {
    to,
    subject: "📩 Novo pedido de cotação para sua empresa",
    text: textContent,
  };

  return await sendEmailWithAuth(emailData);
};

const sendEmailConcurso = async (to, emailMessage) => {
  const textContent = `
  Um novo concurso foi publicado para o seu setor.

  Detalhes do Concurso:
  Título: ${emailMessage.title}
  Data Limite: ${emailMessage.deadline}
  Setor de Atividade: ${emailMessage.sector}
  Acesse: ${emailMessage.link}

  Caso tenha interesse, acesse o link acima e envie sua proposta.

  Atenciosamente,
  `;

  const emailData = {
    to,
    subject: "Novo concurso Disponível",
    text: textContent, 
  };

  return await sendEmailWithAuth(emailData);
};

const SendMailProforma = async (to, emailMessage) => {
  const textContent = `
  Detalhes do pedido:
  ${emailMessage.message}
  `;

  const emailData = {
    to,
    subject: "Nova Proforma Criada",
    text: textContent, 
  };

  return await sendEmailWithAuth(emailData);
};

const sendEmailInquerito = async (to, emailMessage) => {
  const textContent = `
  Detalhes do pedido:
  ${emailMessage.message}
  `;

  const emailData = {
    to,
    subject: "Novo Inquérito Criado", // Corrigido o assunto
    text: textContent, 
  };

  return await sendEmailWithAuth(emailData);
};

export { sendEmail, SendMailProforma, sendEmailConcurso, sendEmailInquerito, sendEmailCotacaoDireta };
import axios from 'axios';
import { auth } from '../../fb';

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuário não autenticado. Faça login novamente.');
  }

  try {
    // Forçar refresh do token
    const token = await user.getIdToken(true);
    console.log('✅ Token obtido com sucesso');
    return token;
  } catch (tokenError) {
    console.error('❌ Erro ao obter token:', tokenError);
    
    if (tokenError.code === 'auth/requests-blocked') {
      // Tentar obter token sem forçar refresh
      try {
        const token = await user.getIdToken(false);
        console.log('✅ Token obtido (sem refresh)');
        return token;
      } catch (fallbackError) {
        console.error('❌ Falha no fallback:', fallbackError);
        throw fallbackError;
      }
    }
    throw tokenError;
  }
};

// Função no frontend
const sendEmailWithAuth = async (emailData) => {
  const user = firebase.auth().currentUser;
  if (!user) {
    throw new Error('Usuário não autenticado');
  }
  
  const token = await user.getIdToken();
  
  const response = await fetch('https://seu-backend.com/send-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      to: emailData.to,
      subject: emailData.subject,
      text: emailData.text,    // Texto plano (fallback)
      html: emailData.html     // HTML completo (prioritário)
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
};

const sendEmail = async (to, emailMessage) => {
  // Validar dados
  if (!to) {
    console.error('❌ Email de destino não informado');
    return false;
  }

  const textContent = `
  Um novo pedido de cotação foi publicado para o seu setor.

  Detalhes do pedido:
  Título: ${emailMessage.title || 'Não informado'}
  Data Limite: ${emailMessage.deadline || 'Não informada'}
  Setor de Atividade: ${emailMessage.sector || 'Não informado'}
  
  Acesse: ${emailMessage.link || 'Link não disponível'}
  
  Caso tenha interesse, acesse o link acima e envie sua proposta.
  
  Atenciosamente,
  Connection Mozambique`;

  const emailData = {
    to,
    subject: "Novo Pedido de Cotação Disponível",
    text: textContent,
  };

  return await sendEmailWithAuth(emailData);
};

const sendEmailCotacaoDireta = async (to, emailMessage) => {
  console.log('📧 Enviando email de cotação direta para:', to);
  if (!to) {
    console.error('❌ Email de destino não informado');
    return false;
  }

  const link = emailMessage.link || '';
  
  // Versão em texto plano (fallback)
  const textContent = `
Você recebeu um novo pedido de cotação diretamente na sua loja.

📌 Detalhes do pedido:
• ${emailMessage.title || 'Produto/Serviço não especificado'}

💬 Mensagem do cliente:
${emailMessage.message || "Sem mensagem adicional"}

⚡ Este cliente está interessado nos seus serviços/produtos.
Responder rapidamente aumenta suas chances de fechar o negócio.

👉 Responda agora: ${link}

Seja rápido — outros fornecedores podem ser contactados.

—
Connection Mozambique
`;

  // Versão em HTML com link clicável
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">📩 Novo pedido de cotação para sua empresa</h2>
      
      <p>Olá,</p>
      
      <p>Você recebeu um novo pedido de cotação diretamente na sua loja.</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">📌 Detalhes do pedido:</h3>
        <p><strong>${emailMessage.title || 'Produto/Serviço não especificado'}</strong></p>
        
        <h3>💬 Mensagem do cliente:</h3>
        <p>${emailMessage.message || "Sem mensagem adicional"}</p>
      </div>
      
      <p>⚡ <strong>Este cliente está interessado nos seus serviços/produtos.</strong><br>
      Responder rapidamente aumenta suas chances de fechar o negócio.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" 
           style="background-color: #007bff; 
                  color: white; 
                  padding: 12px 24px; 
                  text-decoration: none; 
                  border-radius: 5px; 
                  display: inline-block;">
          👉 Responder Agora
        </a>
      </div>
      
      <p style="font-size: 12px; color: #999;">Seja rápido — outros fornecedores podem ser contactados.</p>
      
      <hr>
      <p style="font-size: 12px; color: #999;">— Connection Mozambique</p>
    </div>
  `;

  const emailData = {
    to,
    subject: "📩 Novo pedido de cotação para sua empresa",
    text: textContent,
    html: htmlContent,
  };

  return await sendEmailWithAuth(emailData);
};

const sendEmailConcurso = async (to, emailMessage) => {
  if (!to) {
    console.error('❌ Email de destino não informado');
    return false;
  }

  const textContent = `
  Um novo concurso foi publicado para o seu setor.

  Detalhes do Concurso:
  Título: ${emailMessage.title || 'Não informado'}
  Data Limite: ${emailMessage.deadline || 'Não informada'}
  Setor de Atividade: ${emailMessage.sector || 'Não informado'}
  
  Acesse: ${emailMessage.link || 'Link não disponível'}

  Caso tenha interesse, acesse o link acima e envie sua proposta.

  Atenciosamente,
  Connection Mozambique`;

  const emailData = {
    to,
    subject: "Novo concurso Disponível",
    text: textContent, 
  };

  return await sendEmailWithAuth(emailData);
};

const SendMailProforma = async (to, emailMessage) => {
  if (!to) {
    console.error('❌ Email de destino não informado');
    return false;
  }

  const textContent = `
  Detalhes do pedido:
  ${emailMessage.message || 'Sem detalhes adicionais'}
  `;

  const emailData = {
    to,
    subject: "Nova Proforma Criada",
    text: textContent, 
  };

  return await sendEmailWithAuth(emailData);
};

const sendEmailInquerito = async (to, emailMessage) => {
  if (!to) {
    console.error('❌ Email de destino não informado');
    return false;
  }

  const textContent = `
  Detalhes do inquérito:
  ${emailMessage.message || 'Sem detalhes adicionais'}
  `;

  const emailData = {
    to,
    subject: "Novo Inquérito Criado",
    text: textContent, 
  };

  return await sendEmailWithAuth(emailData);
};

// Função de teste para verificar conexão com o servidor
const testEmailService = async () => {
  try {
    const response = await axios.get('https://mohvi-sendmail.vercel.app/health');
    console.log('✅ Servidor de email online:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Servidor de email offline:', error.message);
    return false;
  }
};

export { 
  sendEmail, 
  SendMailProforma, 
  sendEmailConcurso, 
  sendEmailInquerito, 
  sendEmailCotacaoDireta,
  testEmailService 
};
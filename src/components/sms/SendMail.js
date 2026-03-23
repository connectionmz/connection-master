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

const sendEmailWithAuth = async (emailData) => {
  try {
    console.log('📧 Preparando envio de email para:', emailData.to);
    
    const token = await getAuthToken();
    
    // Validar dados antes de enviar
    if (!emailData.to || !emailData.subject || !emailData.text) {
      console.error('❌ Dados incompletos:', { 
        hasTo: !!emailData.to, 
        hasSubject: !!emailData.subject, 
        hasText: !!emailData.text 
      });
      throw new Error('Dados do email incompletos');
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailData.to)) {
      console.error('❌ Email inválido:', emailData.to);
      throw new Error('Email de destino inválido');
    }

    console.log('🔄 Enviando requisição para o servidor...');
    
    const response = await axios.post(
      'https://mohvi-sendmail.vercel.app/send-email', 
      emailData, 
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000 // 10 segundos de timeout
      }
    );
    
    console.log('✅ Email enviado com sucesso:', response.data);
    return true;
    
  } catch (error) {
    console.error('❌ Erro detalhado ao enviar email:', error);
    
    if (error.response) {
      // O servidor respondeu com um status de erro
      console.error('Status do servidor:', error.response.status);
      console.error('Dados do erro:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('🔐 Token inválido ou expirado. Faça login novamente.');
      } else if (error.response.status === 403) {
        console.error('🚫 Acesso negado. Verifique suas permissões.');
      } else if (error.response.status === 400) {
        console.error('📝 Requisição mal formatada. Verifique os dados enviados.');
      } else if (error.response.status === 429) {
        console.error('⏰ Muitas tentativas. Aguarde alguns minutos.');
      }
      
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('🌐 Servidor não respondeu. Verifique se o servidor está online.');
      console.error('URL:', error.config?.url);
      
    } else {
      // Algo aconteceu na configuração da requisição
      console.error('❌ Erro na configuração:', error.message);
    }
    
    return false;
  }
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
  
  // Validate required fields
  if (!to) {
    console.error('❌ Email de destino não informado');
    return false;
  }
  
  // Validate emailMessage structure
  if (!emailMessage || typeof emailMessage !== 'object') {
    console.error('❌ emailMessage não é um objeto válido');
    return false;
  }
  
  // Ensure link is properly formatted
  const link = emailMessage.link || '';
  if (!link) {
    console.warn('⚠️ Link não informado no email');
  }

  const textContent = `
Você recebeu um novo pedido de cotação diretamente na sua loja.

📌 Detalhes do pedido:
• ${emailMessage.title || 'Produto/Serviço não especificado'}

💬 Mensagem do cliente:
${emailMessage.message || "Sem mensagem adicional"}

⚡ Este cliente está interessado nos seus serviços/produtos.
Responder rapidamente aumenta suas chances de fechar o negócio.

👉 Responda agora:
${link}

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
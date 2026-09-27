import axios from 'axios';
import { auth } from '../../fb';

const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('Usuário não autenticado. Faça login novamente.');
  }

  // O SDK usa o token em cache e só o renova quando expira; forçar a renovação
  // em cada envio falha sempre que o pedido de renovação é bloqueado ou está offline.
  try {
    return await user.getIdToken();
  } catch (tokenError) {
    console.error('❌ Erro ao obter token:', tokenError);
    throw tokenError;
  }
};

const escapeHtml = (value = '') => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const safeLink = (value = '') => (/^https?:\/\//i.test(value) ? value : '');

// Função corrigida - usando o auth importado
const sendEmailWithAuth = async (emailData) => {
  try {
    // Usar o auth importado, não firebase.auth()
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Usuário não autenticado. Faça login novamente.');
    }
    
    // Uma falha ao obter o token não deve, por si só, impedir o envio do email.
    let token = null;
    try {
      token = await getAuthToken();
    } catch (tokenError) {
      console.warn('Envio de email sem token de autenticação:', tokenError.message);
    }

    const response = await axios.post(
      'https://mohvi-sendmail.vercel.app/send-email',
      {
        to: emailData.to,
        subject: emailData.subject,
        text: emailData.text,
        html: emailData.html
      },
      {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }
    );
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    
    // Tratamento de erros mais detalhado
    if (error.response) {
      // O servidor respondeu com um status de erro
      console.error('Resposta do servidor:', error.response.data);
      throw new Error(error.response.data.message || 'Erro no servidor');
    } else if (error.request) {
      // A requisição foi feita mas não houve resposta
      console.error('Sem resposta do servidor');
      throw new Error('Servidor de email não responde. Tente novamente mais tarde.');
    } else {
      // Algo aconteceu na configuração da requisição
      throw error;
    }
  }
};

// O resto do seu código permanece igual
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

const CONTACT_LABELS = { whatsapp: 'WhatsApp', email: 'Email' };

const sendEmailCotacaoDireta = async (to, emailMessage) => {
  if (!to) {
    console.error('❌ Email de destino não informado');
    return false;
  }

  const link = safeLink(emailMessage.link);
  const items = Array.isArray(emailMessage.items) ? emailMessage.items : [];
  const contactLabel = CONTACT_LABELS[emailMessage.contactPreference] || 'Contacto';
  const contactValue = emailMessage.contactPreference === 'email'
    ? emailMessage.customerEmail
    : emailMessage.customerContact;
  const itemLines = items.map(({ name, quantity }) => `${name || 'Item'}${quantity > 1 ? ` (x${quantity})` : ''}`);

  const textContent = [
    'Você recebeu um novo pedido de cotação diretamente na sua loja.',
    '',
    `Cliente: ${emailMessage.cliente || 'Cliente'}`,
    ...(contactValue ? [`${contactLabel}: ${contactValue}`] : []),
    '',
    'Produtos/serviços pedidos:',
    ...(itemLines.length ? itemLines.map((line) => `• ${line}`) : ['• Não especificado']),
    '',
    'Mensagem do cliente:',
    emailMessage.message || 'Sem mensagem adicional',
    '',
    'Responder rapidamente aumenta as suas chances de fechar o negócio.',
    ...(link ? ['', `Ver e responder: ${link}`] : []),
    '',
    '—',
    'Connection Mozambique',
  ].join('\n');

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">📩 Novo pedido de cotação para sua empresa</h2>

      <p>Olá,</p>

      <p>Você recebeu um novo pedido de cotação diretamente na sua loja.</p>

      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin-top: 0;"><strong>Cliente:</strong> ${escapeHtml(emailMessage.cliente || 'Cliente')}</p>
        ${contactValue ? `<p><strong>${contactLabel}:</strong> ${escapeHtml(contactValue)}</p>` : ''}

        <h3>📌 Produtos/serviços pedidos:</h3>
        <ul>
          ${itemLines.length ? itemLines.map((line) => `<li>${escapeHtml(line)}</li>`).join('') : '<li>Não especificado</li>'}
        </ul>

        <h3>💬 Mensagem do cliente:</h3>
        <p>${escapeHtml(emailMessage.message || 'Sem mensagem adicional').replace(/\n/g, '<br>')}</p>
      </div>

      <p>⚡ <strong>Este cliente está interessado nos seus serviços/produtos.</strong><br>
      Responder rapidamente aumenta suas chances de fechar o negócio.</p>

      ${link ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${escapeHtml(link)}"
           style="background-color: #007bff;
                  color: white;
                  padding: 12px 24px;
                  text-decoration: none;
                  border-radius: 5px;
                  display: inline-block;">
          👉 Responder Agora
        </a>
      </div>` : ''}

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
    return true;
  } catch (error) {
    console.error('❌ Servidor de email offline:', error.message);
    return false;
  }
};

export { 
  sendEmailWithAuth,
  sendEmail, 
  SendMailProforma, 
  sendEmailConcurso, 
  sendEmailInquerito, 
  sendEmailCotacaoDireta,
  testEmailService 
};

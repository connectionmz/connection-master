import axios from 'axios';
import { auth } from '../../fb';
import { sendEmailCotacaoDireta } from './SendMail';

jest.mock('axios', () => ({ __esModule: true, default: { post: jest.fn(), get: jest.fn() } }));
jest.mock('../../fb', () => ({ auth: { currentUser: null } }));

const payloadOf = () => axios.post.mock.calls[0][1];
const headersOf = () => axios.post.mock.calls[0][2].headers;

describe('sendEmailCotacaoDireta', () => {
  beforeEach(() => {
    axios.post.mockReset();
    axios.post.mockResolvedValue({ data: { success: true } });
    auth.currentUser = { getIdToken: jest.fn().mockResolvedValue('token-123') };
  });

  it('não envia nada sem email de destino', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(sendEmailCotacaoDireta('', {})).resolves.toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('inclui cliente, contacto, produtos pedidos e link no email', async () => {
    await sendEmailCotacaoDireta('loja@exemplo.com', {
      cliente: 'Maria',
      message: 'Preciso com urgência',
      link: 'https://www.connectionmozambique.com/cotacoes',
      items: [{ name: 'Cimento', quantity: 3 }, { name: 'Areia', quantity: 1 }],
      contactPreference: 'whatsapp',
      customerContact: '841234567',
    });

    const { to, subject, text, html } = payloadOf();
    expect(to).toBe('loja@exemplo.com');
    expect(subject).toContain('pedido de cotação');
    expect(text).toContain('Cliente: Maria');
    expect(text).toContain('WhatsApp: 841234567');
    expect(text).toContain('• Cimento (x3)');
    expect(text).toContain('• Areia');
    expect(text).toContain('https://www.connectionmozambique.com/cotacoes');
    expect(html).toContain('<li>Cimento (x3)</li>');
    expect(headersOf().Authorization).toBe('Bearer token-123');
  });

  it('escapa HTML vindo do cliente e ignora links que não sejam http(s)', async () => {
    await sendEmailCotacaoDireta('loja@exemplo.com', {
      cliente: '<b>Ana</b>',
      message: '<script>alert(1)</script>\nlinha 2 <a href="http://phishing.test">clique</a>',
      link: 'javascript:alert(1)',
      items: [{ name: '<img src=x onerror=alert(1)>', quantity: 1 }],
    });

    const { html } = payloadOf();
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('<a href="http://phishing.test">');
    expect(html).not.toContain('javascript:');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('<br>');
  });

  it('envia o email mesmo quando não consegue obter o token de autenticação', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    auth.currentUser = { getIdToken: jest.fn().mockRejectedValue(new Error('auth/requests-blocked')) };

    await expect(sendEmailCotacaoDireta('loja@exemplo.com', { cliente: 'Ana' })).resolves.toEqual({ success: true });
    expect(headersOf().Authorization).toBeUndefined();
  });

  it('propaga o erro do servidor de email para o chamador poder avisar', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    axios.post.mockRejectedValue({ request: {} });
    await expect(sendEmailCotacaoDireta('loja@exemplo.com', { cliente: 'Ana' })).rejects.toThrow('Servidor de email não responde');
  });
});

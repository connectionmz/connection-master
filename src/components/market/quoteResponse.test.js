import { buildCustomerDecisionUpdates, buildQuoteResponseUpdates, countUnseenStoreQuotes, validateQuoteResponse } from './quoteResponse';

describe('countUnseenStoreQuotes', () => {
  test('conta só pedidos pendentes que a loja ainda não abriu', () => {
    expect(countUnseenStoreQuotes({
      novo: { status: 'pending', viewed: false },
      semCampos: {},
      aberto: { status: 'pending', viewed: true },
      respondido: { status: 'answered', viewed: false },
      aceite: { status: 'accepted', viewed: false },
    })).toBe(2);
  });

  test('tolera lojas sem pedidos', () => {
    expect(countUnseenStoreQuotes(null)).toBe(0);
    expect(countUnseenStoreQuotes(undefined)).toBe(0);
    expect(countUnseenStoreQuotes({})).toBe(0);
  });
});

describe('quoteResponse', () => {
  test('rejeita resposta vazia, preço inválido e prazo fora do limite', () => {
    const result = validateQuoteResponse({ message: ' ', totalPrice: '-1', validityDays: '91' });
    expect(result.errors).toEqual(expect.objectContaining({
      message: expect.any(String), totalPrice: expect.any(String), validityDays: expect.any(String),
    }));
  });

  test('cria atualização atómica para loja e cliente autenticado', () => {
    const { updates } = buildQuoteResponseUpdates({
      quote: { id: 'q1', storeId: 'store1', customerId: 'customer1' },
      form: { message: 'Disponível', totalPrice: '1.250,50', validityDays: '7' },
      responderId: 'store1',
      now: Date.UTC(2026, 7, 28),
    });
    expect(updates['quotes/store1/q1/status']).toBe('answered');
    expect(updates['user_quotes/customer1/q1/status']).toBe('answered');
    expect(updates['quotes/store1/q1/response'].totalPrice).toBe(1250.5);
  });

  test('não cria histórico de cliente para pedido anónimo', () => {
    const { updates } = buildQuoteResponseUpdates({
      quote: { id: 'q1', storeId: 'store1', customerId: null },
      form: { message: 'Resposta', totalPrice: '', validityDays: '5' },
      responderId: 'store1',
    });
    expect(Object.keys(updates).some(path => path.startsWith('user_quotes/'))).toBe(false);
  });

  test('regista decisão do cliente nos dois históricos e notifica a loja', () => {
    const updates = buildCustomerDecisionUpdates({
      quote: { id: 'q1', storeId: 'store1', customerId: 'customer1', customerName: 'Cliente' },
      customerId: 'customer1', decision: 'accepted', notificationId: 'n1', now: Date.UTC(2026, 7, 29),
    });
    expect(updates['quotes/store1/q1/status']).toBe('accepted');
    expect(updates['user_quotes/customer1/q1/status']).toBe('accepted');
    expect(updates['notifications/store1/n1'].type).toBe('store-quote-decision');
  });
});

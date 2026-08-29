export const validateQuoteResponse = ({ message = '', totalPrice = '', validityDays = '' } = {}) => {
  const errors = {};
  const priceText = String(totalPrice).trim().replace(/\s/g, '');
  let normalizedPrice = priceText;
  if (priceText.includes(',') && priceText.includes('.')) {
    normalizedPrice = priceText.lastIndexOf(',') > priceText.lastIndexOf('.')
      ? priceText.replace(/\./g, '').replace(',', '.')
      : priceText.replace(/,/g, '');
  } else if (priceText.includes(',')) {
    normalizedPrice = priceText.replace(',', '.');
  }
  const parsedPrice = priceText === '' ? null : Number.parseFloat(normalizedPrice);
  const parsedValidityDays = Number.parseInt(validityDays, 10);

  if (!message.trim()) errors.message = 'Escreva uma resposta para o cliente.';
  if (parsedPrice !== null && (!(parsedPrice > 0) || !Number.isFinite(parsedPrice))) {
    errors.totalPrice = 'O preço total deve ser um número maior que zero.';
  }
  if (!Number.isInteger(parsedValidityDays) || parsedValidityDays < 1 || parsedValidityDays > 90) {
    errors.validityDays = 'A validade deve estar entre 1 e 90 dias.';
  }

  return { errors, parsedPrice, parsedValidityDays };
};

export const buildQuoteResponseUpdates = ({ quote, form, responderId, notificationId, now = Date.now() }) => {
  const { errors, parsedPrice, parsedValidityDays } = validateQuoteResponse(form);
  if (Object.keys(errors).length) return { errors, updates: null };

  const respondedAt = new Date(now).toISOString();
  const responseId = String(now);
  const response = {
    message: form.message.trim(),
    totalPrice: parsedPrice,
    validityDays: parsedValidityDays,
    validUntil: new Date(now + parsedValidityDays * 24 * 60 * 60 * 1000).toISOString(),
    respondedAt,
    responderId,
  };
  const updates = {};
  const paths = [`quotes/${quote.storeId}/${quote.id}`];
  if (quote.customerId) paths.push(`user_quotes/${quote.customerId}/${quote.id}`);

  paths.forEach((path) => {
    updates[`${path}/response`] = response;
    updates[`${path}/responseHistory/${responseId}`] = response;
    updates[`${path}/status`] = 'answered';
    updates[`${path}/responded`] = true;
    updates[`${path}/customerViewed`] = false;
    updates[`${path}/updatedAt`] = respondedAt;
  });

  if (quote.customerId && notificationId) {
    updates[`notifications/${quote.customerId}/${notificationId}`] = {
      fromUserId: responderId,
      fromUserName: quote.storeName || 'Loja',
      message: `A loja ${quote.storeName || ''} respondeu ao seu pedido de cotação.`.trim(),
      status: 'unread',
      timestamp: respondedAt,
      type: 'store-quote-response',
      link: '/minhas-cotacoes',
      quoteId: quote.id,
    };
  }

  return { errors: {}, updates, response };
};

export const buildCustomerDecisionUpdates = ({ quote, customerId, decision, note = '', notificationId, now = Date.now() }) => {
  const allowed = ['accepted', 'rejected', 'revision_requested'];
  if (!allowed.includes(decision)) throw new Error('Invalid quote decision');
  if (!quote || quote.customerId !== customerId || !quote.storeId) throw new Error('Unauthorized quote decision');
  if (decision === 'revision_requested' && !note.trim()) throw new Error('Revision note is required');

  const decidedAt = new Date(now).toISOString();
  const decisionData = { type: decision, note: note.trim(), decidedAt, customerId };
  const paths = [`quotes/${quote.storeId}/${quote.id}`, `user_quotes/${customerId}/${quote.id}`];
  const updates = {};
  paths.forEach((path) => {
    updates[`${path}/customerDecision`] = decisionData;
    updates[`${path}/decisionHistory/${now}`] = decisionData;
    updates[`${path}/status`] = decision;
    updates[`${path}/updatedAt`] = decidedAt;
  });
  if (notificationId) {
    updates[`notifications/${quote.storeId}/${notificationId}`] = {
      fromUserId: customerId,
      fromUserName: quote.customerName || 'Cliente',
      message: `O cliente atualizou o pedido ${quote.id}.`,
      status: 'unread', timestamp: decidedAt, type: 'store-quote-decision',
      link: '/cotacoes', quoteId: quote.id,
    };
  }
  return updates;
};

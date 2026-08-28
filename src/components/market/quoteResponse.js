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

export const buildQuoteResponseUpdates = ({ quote, form, responderId, now = Date.now() }) => {
  const { errors, parsedPrice, parsedValidityDays } = validateQuoteResponse(form);
  if (Object.keys(errors).length) return { errors, updates: null };

  const respondedAt = new Date(now).toISOString();
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
    updates[`${path}/status`] = 'answered';
    updates[`${path}/responded`] = true;
    updates[`${path}/updatedAt`] = respondedAt;
  });

  return { errors: {}, updates, response };
};

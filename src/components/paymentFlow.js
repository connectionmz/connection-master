export const getSafeReturnPath = (locationState, fallback = '/app') => {
  const from = locationState?.from;
  const candidate = typeof from === 'string'
    ? from
    : from?.pathname
      ? `${from.pathname}${from.search || ''}${from.hash || ''}`
      : '';

  return candidate.startsWith('/') && !candidate.startsWith('//')
    ? candidate
    : fallback;
};

export const validatePaymentResponse = (data, requestedModuleKey) => {
  if (!data || typeof data !== 'object') {
    return { valid: false, message: 'Resposta inválida do serviço de pagamento.' };
  }

  if (data.success === false || data.status === 'failed' || data.status === 'error') {
    return { valid: false, message: data.message || data.error || 'Pagamento não aprovado.' };
  }

  if (data.moduleKey && data.moduleKey !== requestedModuleKey) {
    return { valid: false, message: 'O pagamento foi associado a um módulo diferente.' };
  }

  if (data.moduleActivated === false || data.activated === false) {
    return { valid: false, message: 'O pagamento foi recebido, mas o módulo não foi ativado.' };
  }

  const explicitlyApproved = data.success === true
    || data.status === 'success'
    || data.moduleActivated === true
    || data.activated === true;
  if (!explicitlyApproved) {
    return { valid: false, message: 'O serviço não confirmou a aprovação do pagamento.' };
  }

  return { valid: true };
};

export const getPaymentErrorKey = (error) => {
  const status = error?.status;
  if (status === 401 || status === 403 || error?.code?.startsWith?.('auth/')) {
    return 'payment.error.authentication';
  }
  if (status === 400 || status === 422) {
    return 'payment.error.validation';
  }
  if (status === 409) {
    return 'payment.error.duplicate';
  }
  if (error?.name === 'TypeError' || error?.name === 'AbortError') {
    return 'payment.error.connection';
  }
  return 'payment.error.generic';
};

// utils/mpesaUtils.js

// Mapeamento de códigos de resposta para mensagens amigáveis
export const MPESA_RESPONSE_CODES = {
  'INS-0': { status: 'success', message: 'Pagamento processado com sucesso' },
  'INS-1': { status: 'error', message: 'Erro interno no servidor M-Pesa' },
  'INS-2': { status: 'error', message: 'Cliente inválido' },
  'INS-4': { status: 'error', message: 'Usuário não está ativo' },
  'INS-5': { status: 'error', message: 'Transação cancelada pelo cliente' },
  'INS-6': { status: 'error', message: 'Transação falhou' },
  'INS-9': { status: 'error', message: 'Tempo limite da requisição excedido' },
  'INS-10': { status: 'error', message: 'Transação duplicada' },
  'INS-13': { status: 'error', message: 'Codigo inválido' },
  'INS-14': { status: 'error', message: 'Referência inválida' },
  'INS-15': { status: 'error', message: 'Valor inválido' },
  'INS-16': { status: 'error', message: 'Serviço temporariamente indisponível' },
  'INS-17': { status: 'error', message: 'Referência de transação inválida' },
  'INS-18': { status: 'error', message: 'TransactionID inválido' },
  'INS-19': { status: 'error', message: 'ThirdPartyReference inválido' },
  'INS-20': { status: 'error', message: 'Parâmetros incompletos' },
  'INS-21': { status: 'error', message: 'Validação de parâmetros falhou' },
  'INS-22': { status: 'error', message: 'Tipo de operação inválido' },
  'INS-23': { status: 'error', message: 'Status desconhecido - Contate o suporte M-Pesa' },
  'INS-24': { status: 'error', message: 'InitiatorIdentifier inválido' },
  'INS-25': { status: 'error', message: 'SecurityCredential inválido' },
  'INS-26': { status: 'error', message: 'Não autorizado' },
  'INS-993': { status: 'error', message: 'Débito direto ausente' },
  'INS-994': { status: 'error', message: 'Débito direto já existe' },
  'INS-995': { status: 'error', message: 'Problemas no perfil do cliente' },
  'INS-996': { status: 'error', message: 'Conta do cliente não está ativa' },
  'INS-997': { status: 'error', message: 'Transação de vinculação não encontrada' },
  'INS-998': { status: 'error', message: 'Mercado inválido' },
  'INS-2001': { status: 'error', message: 'Erro de autenticação do iniciador' },
  'INS-2002': { status: 'error', message: 'Receptor inválido' },
  'INS-2006': { status: 'error', message: 'Saldo insuficiente' },
  'INS-2051': { status: 'error', message: 'Número de telefone inválido' },
  'INS-2057': { status: 'error', message: 'Código de idioma inválido' },
};

export const handleMpesaResponse = (responseData) => {
  const responseCode = responseData.output_ResponseCode;
  const statusInfo = MPESA_RESPONSE_CODES[responseCode] || {
    status: 'error',
    message: 'Erro desconhecido da M-Pesa'
  };

  return {
    ...responseData,
    status: statusInfo.status,
    statusMessage: statusInfo.message,
    isSuccess: statusInfo.status === 'success',
  };
};
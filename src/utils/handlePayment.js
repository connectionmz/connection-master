import axios from 'axios';

export const handlePayment = async ({
  phoneNumber,
  paymentMethod,
  user,
  planPrice,
  onPaymentSuccess,
  setError,
  setIsLoading,
  setPendingTransaction,
}) => {
  const validatePhoneNumber = (number) => /^8[24567]\d{7}$/.test(number);

  if (!validatePhoneNumber(phoneNumber)) {
    setError('Número de celular inválido. Formato correto: 841234567.');
    return { success: false, error: 'Número de celular inválido' };
  }

  const paymentData = {
    carteira: '1729146943643x948653281532969000',
    numero: phoneNumber,
    'quem comprou': user?.nome || 'Cliente Anônimo',
    valor: planPrice.toString(),
  };

  const endpoint =
    paymentMethod === 'mpesa'
      ? 'https://mozpayment.co.mz/api/1.1/wf/pagamentorotativompesa'
      : 'https://mozpayment.co.mz/api/1.1/wf/pagamentorotativoemola';

  try {
    const response = await axios.post(endpoint, paymentData);
    const { data } = response;
    const { status, response: apiResponse, message } = data;
    const statusCode = response.status;

    if (statusCode === 200 && status === 'success' && apiResponse.success === true) {
      onPaymentSuccess({ amount: planPrice, method: paymentMethod.toUpperCase() });
      return { success: true };
    } else if (statusCode === 200 && status === 'success' && apiResponse.success === false) {
      setError('Erro na transação. Tente novamente.');
      return { success: false, error: 'Erro na transação' };
    } else if (statusCode === 422) {
      setError('Saldo insuficiente. Verifique seu saldo e tente novamente.');
      return { success: false, error: 'Saldo insuficiente' };
    } else if (statusCode === 400) {
      setError('PIN incorreto. Tente novamente.');
      return { success: false, error: 'PIN incorreto' };
    } else {
      setError(message || 'Erro desconhecido durante o pagamento. Tente novamente');
      return { success: false, error: message || 'Erro desconhecido' };
    }
  } catch (error) {
    console.error(error);
    setError('Falha no pagamento. Tente novamente.');
    return { success: false, error: 'Falha no pagamento' };
  } finally {
    setIsLoading(false);
    setPendingTransaction(false);
  }
};
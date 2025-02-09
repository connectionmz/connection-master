import React, { useState } from 'react';
import axios from 'axios';

const PaySMSCheckout = ({ user, onPaymentSuccess }) => {

  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCount, setSmsCount] = useState(25);
  const [error, setError] = useState(null);
  const [pendingTransaction, setPendingTransaction] = useState(false);

  const calculatePrice = (smsCount) => Math.ceil(smsCount / 25) * 150;

  const validatePhoneNumber = (number) => /^8[24567]\d{7}$/.test(number);

  const handlePayment = async () => {

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Número de celular inválido. Formato correto: 841234567.');
      return;
    }

    if (pendingTransaction) {
      setError('Pagamento em andamento. Aguarde a confirmação.');
      return;
    }

    const planPrice = 1
    setIsLoading(true)
    setError(null)
    setPendingTransaction(true)

    const paymentData = {
      carteira: '1729146943643x948653281532969000',
      numero: phoneNumber,
      'quem comprou': user?.nome || 'Cliente Anônimo',
      valor: planPrice.toString(),
    }

    const endpoint = paymentMethod === 'mpesa'
      ? 'https://mozpayment.co.mz/api/1.1/wf/pagamentorotativompesa'
      : 'https://mozpayment.co.mz/api/1.1/wf/pagamentorotativoemola'

      try {
        const response = await axios.post(endpoint, paymentData);
        console.log(response); // Verifique a estrutura da resposta aqui
      
        const { data } = response;
        const { status, response: apiResponse, message } = data;
        const statusCode = response.status; // Status HTTP (200, 201, etc.)
      
        // Cenário 1: Sucesso
        if (statusCode === 200 && status === "success" && apiResponse.success === true) {
          alert(`Pagamento de ${planPrice} Mt confirmado com sucesso!`);
          onPaymentSuccess({ amount: planPrice, method: paymentMethod.toUpperCase(), smsCount });
        }
        // Cenário 2: Erro na Transação (status HTTP 200, mas sucesso false)
        else if (statusCode === 200 && status === "success" && apiResponse.success === false) {
          setError('Erro na transação. Tente novamente.');
        }
        // Cenário 3: Saldo Insuficiente (status HTTP 422)
        else if (statusCode === 422) {
          setError('Saldo insuficiente. Verifique seu saldo e tente novamente.');
        }
        // Cenário 4: PIN Incorreto (status HTTP 400)
        else if (statusCode === 400) {
          setError('PIN incorreto. Tente novamente.');
        }
        // Cenário 5: Outros Erros
        else {
          setError(message || 'Erro desconhecido durante o pagamento.');
        }
      } catch (error) {
        console.error(error); // Log do erro para depuração
        setError('Falha na comunicação com o servidor. Tente novamente.');
      } finally {
        setIsLoading(false);
        setPendingTransaction(false);
      }
  };

  return (
    <div className="checkout-modal bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold mb-4">Confirmar Pagamento de SMS</h2>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <label className="block font-semibold">Número de Celular:</label>
      <input
        type="text"
        placeholder="Ex: 841234567"
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        className="w-full border p-2 rounded mt-2"
      />

      <label className="block font-semibold mt-4">Método de Pagamento:</label>
      <select
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value)}
        className="w-full border p-2 rounded mt-2">
        <option value="mpesa">M-Pesa</option>
        <option value="emola">e-Mola</option>
      </select>

      <label className="block font-semibold mt-4">Quantidade de SMS:</label>
      <input
        type="number"
        value={smsCount}
        onChange={(e) => setSmsCount(Math.max(25, parseInt(e.target.value) || 25))}
        className="w-full border p-2 rounded mt-2"
        step={25}
        min={25}
      />
      <p className="text-gray-500 mt-1">Pacotes de 25 SMS (150 Mt por pacote)</p>

      <p className="text-lg font-bold mt-4">Preço Total: {calculatePrice(smsCount)} Mt</p>

      <button
        onClick={handlePayment}
        disabled={isLoading || pendingTransaction}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4 w-full">
        {isLoading ? 'Processando...' : 'Pagar Agora'}
      </button>
    </div>
  );
};

export default PaySMSCheckout;

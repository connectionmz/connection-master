import React, { useState } from 'react';
import axios from 'axios';

const PaySMSCheckout = ({ user, onPaymentSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa'); 
  const [phoneNumber, setPhoneNumber] = useState(''); 
  const [smsCount, setSmsCount] = useState(25);
  const [error, setError] = useState(null); // Estado para armazenar mensagens de erro

  const calculatePrice = (smsCount) => {
    return Math.ceil(smsCount / 25) * 150; 
  };

  const handlePayment = async () => {
    if (!phoneNumber) {
      setError('Por favor, insira o número de celular.');
      return;
    }

    const planPrice = calculatePrice(smsCount); 
    setIsLoading(true);
    setError(null); // Limpa o erro antes de iniciar o pagamento

    const paymentData = {
      carteira: '1729146943643x948653281532969000',
      numero: phoneNumber,
      'quem comprou': user.displayName || 'Cliente Anônimo',
      valor: '1',
    };

    const endpoint =
      paymentMethod === 'mpesa'
        ? 'https://mozpayment.co.mz/api/1.1/wf/pagamentorotativompesa'
        : 'https://mozpayment.co.mz/api/1.1/wf/pagamentorotativoemola';

    try {
      const response = await axios.post(endpoint, paymentData);

      if (response.data.status === 'success') {
        alert(`Pagamento de ${planPrice} Mt via ${paymentMethod.toUpperCase()} confirmado com sucesso!`);
        const paymentDetails = {
          amount: planPrice,
          method: paymentMethod.toUpperCase(),
          transactionId: response.data.transactionId || null,
          smsCount,
        };

        onPaymentSuccess(paymentDetails);
      } else {
        setError(response.data.message || 'Erro desconhecido durante o pagamento.');
      }
    } catch (error) {
      setError('A transação falhou. Por favor, tente novamente.');
      //console.error('Erro no pagamento:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="checkout-modal bg-white shadow-md rounded-md p-6">
      <h2 className="text-xl font-bold mb-4">Confirmar Pagamento de SMS</h2>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {/* Input para o número de celular */}
      <div className="mt-4">
        <label className="block mb-2 font-semibold">Número de Celular:</label>
        <input
          type="text"
          placeholder="Insira o número (ex: 841234567)"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="w-full border p-2 rounded"
        />
      </div>

      {/* Seleção do método de pagamento */}
      <div className="mt-4">
        <label className="block mb-2 font-semibold">Método de Pagamento:</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full border p-2 rounded">
          <option value="mpesa">M-Pesa</option>
          <option value="emola">e-Mola</option>
        </select>
      </div>

      {/* Seleção da quantidade de SMS */}
      <div className="mt-4">
        <label className="block mb-2 font-semibold">Quantidade de SMS:</label>
        <input
          type="number"
          value={smsCount}
          onChange={(e) => setSmsCount(Math.max(25, parseInt(e.target.value) || 25))} // Mínimo de 25 SMS
          className="w-full border p-2 rounded"
          step={25}
          min={25}
        />
        <p className="text-gray-500 mt-2">Pacotes de 25 SMS (150 Mt por pacote)</p>
      </div>

      {/* Exibição do preço total */}
      <div className="mt-4">
        <p className="text-lg font-bold">Preço Total: {calculatePrice(smsCount)} Mt</p>
      </div>

      {/* Botão de pagamento */}
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4 w-full">
        {isLoading ? 'Processando...' : 'Pagar Agora'}
      </button>
    </div>
  );
};

export default PaySMSCheckout;

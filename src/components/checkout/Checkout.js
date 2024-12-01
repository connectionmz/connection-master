import React, { useState } from 'react';
import axios from 'axios';

const Checkout = ({ user, planPrice, phoneNumber, onPaymentSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa'); 

  const handlePayment = async () => {
    setIsLoading(true);

    const paymentData = {
      carteira: '1729146943643x948653281532969000',
      numero: phoneNumber,
      'quem comprou': user.displayName || 'Cliente Anônimo',
      valor: planPrice.toString(),
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
        };

        // Notificar sucesso e chamar o callback para continuar
        onPaymentSuccess(paymentDetails);
      } else {
        throw new Error(response.data.message || 'Erro desconhecido.');
      }
    } catch (error) {
      alert('A transação falhou. Por favor, tente novamente.');
      console.error('Erro no pagamento:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="checkout-modal bg-white shadow-md rounded-md p-6">
      <h2 className="text-xl font-bold mb-4">Confirmar Pagamento</h2>
      <p>
        Valor total do anúncio: <strong>{planPrice} Mt</strong>
      </p>
      <p>
        Número para débito: <strong>{phoneNumber}</strong>
      </p>

      <div className="mt-4">
        <label className="block mb-2 font-semibold">Método de Pagamento:</label>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="mpesa">M-Pesa</option>
          <option value="emola">e-Mola</option>
        </select>
      </div>

      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
      >
        {isLoading ? 'Processando...' : 'Pagar Agora'}
      </button>
    </div>
  );
};

export default Checkout;

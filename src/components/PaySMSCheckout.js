import React, { useState } from 'react';
import { handlePayment } from '../utils/handlePayment';

const PaySMSCheckout = ({ user, onPaymentSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsCount, setSmsCount] = useState(25);
  const [error, setError] = useState(null);
  const [pendingTransaction, setPendingTransaction] = useState(false);

  const calculatePrice = (smsCount) => Math.ceil(smsCount / 25) * 150;

  const handlePaymentClick = async () => {
    const planPrice = 1
    setIsLoading(true);
    setError(null);
    setPendingTransaction(true);

    const result = await handlePayment({
      phoneNumber,
      paymentMethod,
      user,
      planPrice,
      onPaymentSuccess,
      setError,
      setIsLoading,
      setPendingTransaction,
    });

    if (result.success) {
      console.log('Pagamento realizado com sucesso!');
    } else {
      console.error('Erro no pagamento:', result.error);
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
        onClick={handlePaymentClick}
        disabled={isLoading || pendingTransaction}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4 w-full">
        {isLoading ? 'Processando...' : 'Pagar Agora'}
      </button>
    </div>
  );
};

export default PaySMSCheckout;
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import mpesa from '../img/mpesa.png';
import emola from '../img/emola.png';
import MpesaCheckout from './checkout/MpesaCheckout';
import CreditCardCheckout from './checkout/CreditCardCheckout';
import EmolaCheckout from './checkout/EmolaCheckout';
import { MonetizationOn } from '@mui/icons-material';

const TransferenciaCheckout = () => (
  <div className="p-4 bg-yellow-100 rounded-lg">
    <h2 className="text-lg font-semibold">Pagamento por Transferência Bancária</h2>
    <p>Fnb: 04345188210001</p>
    <p>Emola: 865964430 - Connection Mozambique</p>
    <p>Mpesa: 853433451 - Connection Mozambique</p>
    <p>Apos a transferencia, partilhe o comprovativo para <a href="mailto:connectionmozambique@gmail.com">Connectionmozambique@gmail.com</a></p>
  </div>
);

const Checkout = ({user}) => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [planPrice, setPlanPrice] = useState(0);
  const navigate = useNavigate();
  const { plan } = useParams();

  useEffect(() => {
    const planos = {
      basico: {
        name: 'Básico',
        price: 1,
      },
      pro: {
        name: 'Pro',
        price: 500,
      },
      premium: {
        name: 'Premium',
        price: 750,
      },
    };

    const selectedPlan = planos[plan?.toLowerCase()];
    console.log(selectedPlan)


    if (selectedPlan) {
      setPlanPrice(selectedPlan.price);
    }
  }, [plan, navigate]);

  const handleMethodSelection = (method) => {
    setSelectedMethod(method);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md mx-auto bg-white shadow-md rounded-lg p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">Métodos de Pagamento</h1>
        
        <p className="text-center text-lg mb-4">
          Plano Selecionado: <span className="font-semibold">{plan}</span> - Preço: {planPrice} MT
        </p>

        <div className="space-y-4">
          <button
            onClick={() => handleMethodSelection('credit-card')}
            className="flex items-center justify-between w-full p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200"
          >
            <div className="flex items-center">
              <img src="https://img.icons8.com/color/48/000000/mastercard-logo.png" alt="Credit / Debit Card" className="w-8 h-8 mr-4" />
              <span className="text-gray-800">Cartão de Débito</span>
            </div>
          </button>

          <button
            onClick={() => handleMethodSelection('mpesa')}
            className="flex items-center justify-between w-full p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200">
            <div className="flex items-center">
              <img src={mpesa} alt="M-Pesa" className="w-8 h-8 mr-4" />
              <span className="text-gray-800">M-Pesa</span>
            </div>
          </button>

          <button
            onClick={() => handleMethodSelection('emola')}
            className="flex items-center justify-between w-full p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200">
            <div className="flex items-center">
              <img src={emola} alt="Emola" className="w-8 h-8 mr-4" />
              <span className="text-gray-800">Emola</span>
            </div>
          </button>

          <button
            onClick={() => handleMethodSelection('transferencia')}
            className="flex items-center justify-between w-full p-4 bg-gray-100 rounded-lg hover:bg-gray-200 transition duration-200">
            <div className="flex items-center">
              <span className="w-8 h-8 mr-4"><MonetizationOn /></span>
              <span className="text-gray-800">Transferência</span>
            </div>
          </button>
        </div>

        <div className="mt-6">
          {selectedMethod === 'mpesa' && <MpesaCheckout planPrice={planPrice} userDb={user}/>}
          {selectedMethod === 'emola' && <EmolaCheckout planPrice={planPrice} userDb={user}/>}
          {selectedMethod === 'credit-card' && <CreditCardCheckout planPrice={planPrice} userDb={user}/>}
          {selectedMethod === 'transferencia' && <TransferenciaCheckout />}
        </div>
      </div>
    </div>
  );
};

export default Checkout;

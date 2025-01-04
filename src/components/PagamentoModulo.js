import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../fb';
import { onValue, ref } from 'firebase/database';
import PayModuleCheckout from './checkout/PayModuleCheckout';
import { UpdatePayment } from './UpdatePayment';

const PagamentoModulo = ({ user }) => {
  const { moduleKey } = useParams(); 
  const [modules, setModules] = useState([]); 
  const [currentModule, setCurrentModule] = useState(null); 
  const navigate = useNavigate();
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const modulesRef = ref(db, `modules/modulos`);

    const unsubscribe = onValue(modulesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setModules(data);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (modules.length > 0) {
      const foundModule = modules.find((mod) => mod.key === moduleKey);
      setCurrentModule(foundModule || null);
    }
  }, [modules, moduleKey]);

  if (!currentModule) {
    return (
      <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center">
        <h1 className="text-2xl text-red-500">Módulo não encontrado</h1>
      </div>
    );
  }

  const handlePaymentSuccess = (paymentDetails) => {
    console.log('Detalhes do pagamento:', paymentDetails);
    setPaymentSuccess(true);

    UpdatePayment(user, currentModule.key, {
      amount: paymentDetails.amount,
      method: paymentDetails.method,
    });

    navigate('/apx');
  };

  const cleanPrice = (price) => {
    return parseInt(price.replace(/[^\d]/g, '')); 
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center">
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Pagamento do Módulo</h1>
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">{currentModule.name}</h2>
        <p className="text-gray-600 mb-4">{currentModule.description}</p>
        <p className="text-lg font-bold text-gray-800 mb-6">
          Preço: {currentModule.price}
        </p>

        {!paymentSuccess && (
          <PayModuleCheckout
            user={user}
            planPrice={cleanPrice(currentModule.price)} 
            onPaymentSuccess={handlePaymentSuccess}
          />
        )}

        {paymentSuccess && (
          <div className="text-green-500 font-semibold mt-4">
            Pagamento concluído com sucesso!
          </div>
        )}
      </div>
    </div>
  );
};

export default PagamentoModulo;

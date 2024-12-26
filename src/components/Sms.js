import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../fb';

const Sms = ({ user }) => {
  const [smsBalance, setSmsBalance] = useState(0);
  const [smsHistory, setSmsHistory] = useState([]);

  useEffect(() => {
    const userRef = ref(db, `company/${user.id}/activeModules/moduloSMS/paymentDetails`);    
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      console.log(data)
      setSmsBalance(data.smsCount || 0)
     
    });
  }, [user.id]);

  return (
    <div className="max-w-lg mx-auto p-8 bg-white rounded-xl shadow-md mt-10">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">Módulo de SMS</h1>

      <p className="text-gray-700 text-lg mb-8 text-center leading-relaxed">
        O módulo de SMS é uma solução prática e eficiente para empresas que desejam estar sempre informadas sobre os pedidos de cotação e outras interações na plataforma.
      </p>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Saldo de SMS</h2>
        <p className="text-gray-700 text-lg">Saldo atual: <strong>{smsBalance} SMS</strong></p>
      </div>

      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Histórico de SMS</h2>
        {smsHistory.length > 0 ? (
          <ul className="text-gray-600 text-lg space-y-2">
            {smsHistory.slice(0, 5).map((sms) => (
              <li key={sms.id} className="border-b border-gray-300 pb-2">
                <p className="text-sm text-gray-800 font-semibold">{sms.date || 'Data desconhecida'}</p>
                <p>{sms.message}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-700">Nenhum SMS recebido até o momento.</p>
        )}
      </div>
      <p className="text-gray-700 text-lg mb-8 text-center leading-relaxed">
        Mantenha sua equipe informada em tempo real, aumentando a agilidade no atendimento e a chance de fechar negócios rapidamente.
      </p>
    </div>
  );
};

export default Sms;

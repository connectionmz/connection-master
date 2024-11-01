import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Sms = () => {
  const [selectedPlan, setSelectedPlan] = useState(''); 
  const navigate = useNavigate();

  const handleAssinar = () => {
    if (!selectedPlan) {
      alert("Por favor, selecione um plano.");
      return;
    }
    navigate(`/checkout?plan=${selectedPlan}`);
  };

  return (
    <div className="max-w-lg mx-auto p-8 bg-white rounded-xl shadow-md mt-10">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">Módulo de SMS</h1>
      
      <p className="text-gray-700 text-lg mb-8 text-center leading-relaxed">
        Assine o módulo de SMS e receba todos os pedidos de cotação da plataforma diretamente no seu telemóvel!
      </p>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <ul className="list-disc list-inside text-gray-600 text-lg">
          <li>Notificações instantâneas de novos pedidos de cotação</li>
          <li>SMS direto no número preferido</li>
          <li>Acesso rápido a oportunidades de negócios</li>
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Escolha o seu plano</h2>
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border-2 transition ${selectedPlan === 'basico' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
            <label className="flex justify-between items-center cursor-pointer">
              <div>
                <h3 className="text-lg font-bold text-gray-700">Plano Básico</h3>
                <p className="text-sm text-gray-600">50 SMS/mês</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-blue-600">390 MZN/mês</span>
                <input
                  type="radio"
                  value="basico"
                  checked={selectedPlan === 'basico'}
                  onChange={() => setSelectedPlan('basico')}
                  className="form-radio text-blue-600"
                />
              </div>
            </label>
          </div>

          <div className={`p-4 rounded-lg border-2 transition ${selectedPlan === 'padrao' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
            <label className="flex justify-between items-center cursor-pointer">
              <div>
                <h3 className="text-lg font-bold text-gray-700">Plano Padrão</h3>
                <p className="text-sm text-gray-600">100 SMS/mês</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-blue-600">780 MZN/mês</span>
                <input
                  type="radio"
                  value="padrao"
                  checked={selectedPlan === 'padrao'}
                  onChange={() => setSelectedPlan('padrao')}
                  className="form-radio text-blue-600"
                />
              </div>
            </label>
          </div>
          <div className={`p-4 rounded-lg border-2 transition ${selectedPlan === 'avancado' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}>
            <label className="flex justify-between items-center cursor-pointer">
              <div>
                <h3 className="text-lg font-bold text-gray-700">Plano Avançado</h3>
                <p className="text-sm text-gray-600">200 SMS/mês</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-semibold text-blue-600">1,560 MZN/mês</span>
                <input
                  type="radio"
                  value="avancado"
                  checked={selectedPlan === 'avancado'}
                  onChange={() => setSelectedPlan('avancado')}
                  className="form-radio text-blue-600"
                />
              </div>
            </label>
          </div>
        </div>
      </div>
      <div className="flex justify-center mt-6">
        <button
          onClick={handleAssinar}
          className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow hover:bg-blue-700 transition"
        >
          Continuar para o Checkout
        </button>
      </div>
    </div>
  );
};

export default Sms;

import React from 'react';

const Sms = () => {
  return (
    <div className="max-w-lg mx-auto p-8 bg-white rounded-xl shadow-md mt-10">
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-900">Módulo de SMS</h1>
      
      <p className="text-gray-700 text-lg mb-8 text-center leading-relaxed">
        O módulo de SMS é uma solução prática e eficiente para empresas que desejam estar sempre informadas sobre os pedidos de cotação e outras interações na plataforma. 
      </p>
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Como Funciona</h2>
        <ul className="list-disc list-inside text-gray-600 text-lg space-y-2">
          <li>Receba notificações instantâneas no seu telemóvel sobre novos <strong>pedidos de cotação</strong>.</li>
          <li>Seja informado sobre novos <strong>concursos disponíveis</strong> na plataforma.</li>
          <li>Receba atualizações sobre <strong>respostas aos seus pedidos de cotação</strong>.</li>
          <li>Notificações via <strong>SMS</strong> e <strong>e-mail</strong> diretamente para o responsável indicado pela empresa.</li>
        </ul>
      </div>

      <p className="text-gray-700 text-lg mb-8 text-center leading-relaxed">
        Mantenha sua equipe informada em tempo real, aumentando a agilidade no atendimento e a chance de fechar negócios rapidamente. 
      </p>

      <div className="flex justify-center mt-6">
        <button
          className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow hover:bg-blue-700 transition"
        >
         Modulo Activo
        </button>
      </div>
    </div>
  );
};

export default Sms;

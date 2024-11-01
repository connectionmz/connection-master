import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const Rfq = () => {
  const { userId } = useParams();
  const [descricao, setDescricao] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [prazo, setPrazo] = useState('');

  const handleRequestQuote = () => {
    // Aqui você pode adicionar a lógica para enviar os dados para o Firebase
    console.log("Cotação solicitada para:", userId, descricao, quantidade, prazo);
  };

  return (
    <div className="p-4 max-w-lg mx-auto bg-white shadow-md rounded">
      <h2 className="text-2xl font-bold mb-4">Solicitar Cotação</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700">Descrição:</label>
        <textarea 
          value={descricao} 
          onChange={(e) => setDescricao(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Descreva o produto ou serviço"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Quantidade:</label>
        <input 
          type="number" 
          value={quantidade} 
          onChange={(e) => setQuantidade(e.target.value)}
          className="w-full border rounded px-3 py-2"
          placeholder="Insira a quantidade"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700">Prazo:</label>
        <input 
          type="date" 
          value={prazo} 
          onChange={(e) => setPrazo(e.target.value)}
          className="w-full border rounded px-3 py-2"
        />
      </div>
      <button 
        onClick={handleRequestQuote}
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
      >
        Enviar Pedido de Cotação
      </button>
    </div>
  );
};

export default Rfq;

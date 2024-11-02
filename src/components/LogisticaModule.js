import React, { useState } from 'react';

const LogisticaModule = ({ isAvailable }) => {
  const [pedidos, setPedidos] = useState([
    { id: 1, item: 'Computador', destino: 'Centro da Cidade', status: 'Pendente' },
    { id: 2, item: 'Impressora', destino: 'Distrito Industrial', status: 'Pendente' }
  ]);

  const handleConfirmarEntrega = (id) => {
    setPedidos(pedidos.map(pedido => 
      pedido.id === id ? { ...pedido, status: 'Entregue' } : pedido
    ));
    alert(`Entrega confirmada!`);
  };

  return (
    <div className="p-4 bg-white rounded-md shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Logística - Pedidos de Entrega</h2>
      {isAvailable ? (
        <ul>
          {pedidos.map((pedido) => (
            <li key={pedido.id} className="bg-gray-100 p-2 rounded-md mb-2">
              <p><strong>Item:</strong> {pedido.item}</p>
              <p><strong>Destino:</strong> {pedido.destino}</p>
              <p><strong>Status:</strong> {pedido.status}</p>
              {pedido.status === 'Pendente' && (
                <button
                  onClick={() => handleConfirmarEntrega(pedido.id)}
                  className="bg-green-500 text-white p-1 mt-2 rounded-md hover:bg-green-600 transition"
                >
                  Confirmar Entrega
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-red-500 font-semibold text-center">Módulo Indisponível</p>
      )}
    </div>
  );
};

export default LogisticaModule;

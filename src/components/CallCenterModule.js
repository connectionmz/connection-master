import React from 'react';

const CallCenterModule = () => {
  return (
    <div className="p-4 bg-white rounded-md shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Call Center - Funcionamento</h2>
      <p className="text-gray-700 mb-4">
        O módulo de Call Center permite que as empresas recebam chamadas relacionadas a pedidos de 
        cotação, respostas a pedidos de cotação e concursos referentes ao seu setor de atividade. 
        As chamadas são registradas e podem ser atendidas diretamente pela equipe responsável. 
        Este módulo é fundamental para otimizar a comunicação com clientes e garantir um atendimento
        ágil e eficiente.
      </p>
      <p className="text-gray-700 mb-2">
        Os tipos de chamadas incluem:
      </p>
      <ul className="list-disc list-inside mb-4">
        <li className="text-gray-600"><strong>Pedido de Cotação:</strong> Solicitações feitas por clientes em busca de informações sobre preços e serviços.</li>
        <li className="text-gray-600"><strong>Resposta a Cotação:</strong> Retorno das empresas aos clientes que solicitaram cotações.</li>
        <li className="text-gray-600"><strong>Concurso:</strong> Chamadas relacionadas a concursos públicos ou ofertas de serviços.</li>
      </ul>
      <p className="text-gray-700">
        As empresas que utilizam este módulo podem gerenciar suas chamadas, garantindo que todas as
        solicitações sejam tratadas com a devida atenção.
      </p>
    </div>
  );
};

export default CallCenterModule;

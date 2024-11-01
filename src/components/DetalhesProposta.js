import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../fb';
import { saveContentToInbox } from './SaveToInbox';

const DetalhesProposta = () => {
  const { id, propostaId } = useParams();
  const [proposta, setProposta] = useState(null);
  const [nota, setNota] = useState('');
  const [confirmAccept, setConfirmAccept] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const propostaRef = ref(db, `cotacoes/${id}/proposals/${propostaId}`);
    
    onValue(propostaRef, (snapshot) => {
      setProposta(snapshot.val());
      console.log(snapshot.val().selectedProducts);
    });
  }, [id, propostaId]);

  const handleStatusUpdate = (status) => {
    const propostaRef = ref(db, `cotacoes/${id}/proposals/${propostaId}`);
    update(propostaRef, { status });

    
  };

  const handleNotaChange = (event) => {
    setNota(event.target.value);
  };

  const handleNotaSubmit = () => {
    const propostaRef = ref(db, `cotacoes/${id}/proposals/${propostaId}`);
    update(propostaRef, { nota });
    setNota('');
  };

  const handleAccept = () => {
    setConfirmAccept(true);
  };

  const handleConfirmAccept = () => {
    handleStatusUpdate('Aceite');
    
    const newProposal = proposta;
    const companyId = proposta.from.id;

    saveContentToInbox(newProposal, companyId, 'Proposta a cotação Aprovada', 'proposal-response', `/proposta/${id}`)
        .then(() => {
            console.log("Conteúdo salvo na inbox com sucesso");
            alert("Proposta enviada com sucesso!");
        })
        .catch((error) => {
            console.error("Erro ao salvar na inbox:", error);
            alert("Erro ao salvar a proposta na inbox.");
        });

    setConfirmAccept(false);
};


  const handleCancelApproval = () => {
    handleStatusUpdate('Pendente'); 
  };

  if (!proposta) return <p>Carregando detalhes da proposta...</p>;

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-semibold text-gray-800 mb-4">Detalhes da Proposta</h1>
      <div className="mb-4">
        <h2 className="text-lg font-medium text-gray-700">Empresa: {proposta.from.nome}</h2>
        <h2 className="text-lg font-medium text-gray-700">Contacto: {proposta.from.contacto}</h2>
        <div
          className="text-gray-600 mb-2"
          dangerouslySetInnerHTML={{ __html: proposta.proposal }}
        />
        {proposta.fileUrl && (
          <a
            href={proposta.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline">
            Baixar Arquivo
          </a>
        )}
        <div className="text-sm text-gray-500 mt-2">
          Status: {proposta.status || 'Pendente'}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-700">Produtos/Serviços:</h3>
        {proposta.selectedProducts && proposta.selectedProducts.length > 0 ? (
          <table className="min-w-full bg-white border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4 border-b text-left text-gray-600">Nome</th>
                <th className="py-2 px-4 border-b text-left text-gray-600">Preço (MT)</th>
                <th className="py-2 px-4 border-b text-left text-gray-600">Ação</th>
              </tr>
            </thead>
            <tbody>
              {proposta.selectedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b text-gray-600">{product.name}</td>
                  <td className="py-2 px-4 border-b text-gray-600">{product.price}</td>
                  <td className="py-2 px-4 border-b text-gray-600">
                    <a 
                      href={product.url} 
                      className="text-blue-600 underline" 
                      target="_blank" 
                      rel="noopener noreferrer">
                      Ver Detalhes
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500">Nenhum produto selecionado.</p>
        )}
      </div>

      <div className="flex space-x-4 mb-6">
        {proposta.status === 'Aceite' ? (
          <button
            onClick={handleCancelApproval}
            className="bg-yellow-600 text-white py-2 px-4 rounded-lg shadow hover:bg-yellow-700 transition">
            Cancelar Aprovação
          </button>
        ) : (
          <button
            onClick={handleAccept}
            className="bg-green-600 text-white py-2 px-4 rounded-lg shadow hover:bg-green-700 transition">
            Aprovar
          </button>
        )}
        <button
          onClick={() => handleStatusUpdate('Recusada')}
          className="bg-red-600 text-white py-2 px-4 rounded-lg shadow hover:bg-red-700 transition">
          Recusar
        </button>
      </div>

      {confirmAccept && (
        <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-100">
          <p className="text-gray-700">Tem certeza que deseja aceitar esta proposta?</p>
          <div className="flex space-x-4 mt-2">
            <button
              onClick={handleConfirmAccept}
              className="bg-green-600 text-white py-2 px-4 rounded-lg shadow hover:bg-green-700 transition">
              Sim
            </button>
            <button
              onClick={() => setConfirmAccept(false)}
              className="bg-red-600 text-white py-2 px-4 rounded-lg shadow hover:bg-red-700 transition">
              Não
            </button>
          </div>
        </div>
      )}

      <div className="mb-4">
        <textarea
          value={nota}
          onChange={handleNotaChange}
          placeholder="Adicionar uma nota"
          className="w-full p-2 border border-gray-300 rounded-lg resize-none"
        />
        <button
          onClick={handleNotaSubmit}
          className="mt-2 bg-blue-600 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-700 transition">
          Enviar Nota
        </button>
      </div>

      <button
        onClick={() => navigate(`/cotacao/${id}`)}
        className="mt-6 bg-blue-600 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-700 transition">
        Voltar para Lista de Propostas
      </button>
    </div>
  );
};

export default DetalhesProposta;

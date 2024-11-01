import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../fb'; 
import { ref, onValue, increment, update } from 'firebase/database';
import { AdsClick, Inbox, RemoveRedEye } from '@mui/icons-material';

const CotacaoDetalhes = () => {
  const { id, companyId } = useParams();
  const [cotacao, setCotacao] = useState(null);
  const [isCompanyOwner, setIsCompanyOwner] = useState(false); 
  const [propostas, setPropostas] = useState([]); 
  const navigate = useNavigate();
  
  useEffect(() => {
    const cotacaoRef = ref(db, `cotacoes/${id}`);
    
    // Increment views count
    update(cotacaoRef, {
      views: increment(1)
    });

    // Fetch the cotacao details
    onValue(cotacaoRef, (snapshot) => {
      const data = snapshot.val();
      setCotacao(data);

      if (data.proposals) {
        const propostasArray = Object.values(data.proposals);
        setPropostas(propostasArray);
      }

      if (auth.currentUser && data?.company?.id === auth.currentUser.uid) {
        setIsCompanyOwner(true);
      }
    });
  }, [id]);

  const handleEnviarProposta = () => {
    navigate(`/enviar-proposta/${id}/${companyId}`); 
  };

  const handleBaixarPedido = () => {
    navigate(`/cotacaoPDF/${id}`);
  };

  const handlePartilhar = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url)
      .then(() => alert('Link copiado! Pronto para partilhar.'))
      .catch(err => alert('Erro ao copiar o link', err));
  };

  const handleVerPropostas = () => {
    if (propostas.length > 0) {
      navigate(`/propostas/${id}/propostas`); 
    } else {
      alert("Nenhuma proposta foi recebida ainda.");
    }
  };

  if (!cotacao) {
    return <p>Carregando...</p>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <div className="flex items-center mb-8 border p-4 rounded-lg bg-gray-50 shadow-sm">
        <img
          src={cotacao.company.logoUrl || 'default-logo.png'}
          alt={cotacao.company.nome}
          className="w-16 h-16 rounded-full mr-6"
        />
        <div>
          <p className="text-sm font-semibold text-gray-700">{cotacao.company.nome}</p>
          <p className="text-sm text-gray-500">Estado: {cotacao.status}</p>
          <div className="flex justify-between text-sm text-gray-600 mb-6 space-x-4">
            <div className="flex items-center">
              <RemoveRedEye className="w-5 h-5 text-blue-500 mr-2" />
              <p>{cotacao.views || 0}</p>
            </div>
            <div className="flex items-center">
              <AdsClick className="w-5 h-5 text-green-500 mr-2" />
              <p>{cotacao.clicks || 0}</p>
            </div>
            <div className="flex items-center">
              <Inbox className="w-5 h-5 text-yellow-500 mr-2" />
              <p>{cotacao.proposals ? cotacao.proposals.length : 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-right">
        <p className="text-gray-500 text-sm mb-4">
          Data Limite: {new Date(cotacao.datalimite).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
          })}
        </p>

        <div className="flex justify-end space-x-4">
          {isCompanyOwner ? (
            <button
              onClick={handleVerPropostas}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-700 transition">
              Propostas
            </button>
          ) : (
            <button
              onClick={handleEnviarProposta}
              className="bg-blue-600 text-white py-2 px-4 rounded-lg shadow hover:bg-blue-700 transition"
            >
              Proposta
            </button>
          )}
          <button
            onClick={handleBaixarPedido}
            className="bg-green-600 text-white py-2 px-4 rounded-lg shadow hover:bg-green-700 transition"
          >
            Baixar
          </button>
          <button
            onClick={handlePartilhar}
            className="bg-gray-600 text-white py-2 px-4 rounded-lg shadow hover:bg-gray-700 transition"
          >
            Partilhar
          </button>
        </div>
      </div>

      <h4 className="font-bold text-gray-800 mb-6 border-b pb-4">{cotacao.title}</h4>
      <p className="text-gray-600 text-lg mb-6" dangerouslySetInnerHTML={{ __html: cotacao.description }}></p>

      <div>
        <h4 className="text-2xl font-semibold text-gray-800 mb-6">Itens Solicitados</h4>
        {cotacao.items && cotacao.items.length > 0 ? (
          <ul className="space-y-6">
            {cotacao.items.map((item, index) => (
              <li key={index} className="flex items-center bg-gray-50 p-4 rounded-lg shadow-sm">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-lg mr-6"
                />
                <div>
                  <h4 className="text-lg font-medium text-gray-700">{item.name}</h4>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">Nenhum item disponível.</p>
        )}
      </div>
    </div>
  );
};

export default CotacaoDetalhes;

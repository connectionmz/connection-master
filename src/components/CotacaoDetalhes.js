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
      views: increment(1),
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
      .catch((err) => alert('Erro ao copiar o link', err));
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
    <div className="max-w-6xl mx-auto p-8 bg-gray-50 shadow-lg rounded-xl">
      <div className="flex items-center gap-6 mb-10 p-6 rounded-lg bg-white shadow">
        <img
          src={cotacao.company.logoUrl || 'default-logo.png'}
          alt={cotacao.company.nome}
          className="w-20 h-20 rounded-full object-cover"
        />
        <div>
          <h2 className="text-xl font-bold text-gray-800">{cotacao.company.nome}</h2>
          <p className="text-sm text-gray-500">Estado: <span className="font-medium">{cotacao.status}</span></p>
          <div className="flex items-center gap-6 mt-4 text-gray-600">
            <div className="flex items-center gap-2">
              <RemoveRedEye className="text-blue-500" />
              <p>{cotacao.views || 0} visualizações</p>
            </div>
            <div className="flex items-center gap-2">
              <AdsClick className="text-green-500" />
              <p>{cotacao.clicks || 0} cliques</p>
            </div>
            <div className="flex items-center gap-2">
              <Inbox className="text-yellow-500" />
              <p>{cotacao.proposals ? cotacao.proposals.length : 0} propostas</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center mb-10">
        <p className="text-gray-500">
          Data Limite: <span className="font-semibold text-gray-800">{new Date(cotacao.datalimite).toLocaleDateString('pt-PT', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}</span>
        </p>
       <p>
       <div className="flex items-center">
          {isCompanyOwner ? (
            <button
              onClick={handleVerPropostas}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition"
            >
              Ver Propostas
            </button>
          ) : (
            <button
              onClick={handleEnviarProposta}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg shadow hover:bg-blue-700 transition"
            >
              Enviar Proposta
            </button>
          )}
          <button
            onClick={handleBaixarPedido}
            className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 transition"
          >
            Baixar Pedido
          </button>
          <button
            onClick={handlePartilhar}
            className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg shadow hover:bg-gray-700 transition"
          >
            Partilhar
          </button>
        </div>
       </p>
      </div>

      <h3 className="text-2xl font-semibold text-gray-800 mb-6 border-b pb-4">{cotacao.title}</h3>
      <p className="text-gray-700 leading-relaxed mb-10" dangerouslySetInnerHTML={{ __html: cotacao.description }} />

      <div>
        <h4 className="text-xl font-semibold text-gray-800 mb-6">Itens Solicitados</h4>
        {cotacao.items && cotacao.items.length > 0 ? (
          <ul className="space-y-6">
            {cotacao.items.map((item, index) => (
              <li key={index} className="flex items-center gap-6 bg-white p-4 rounded-lg shadow">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div>
                  <h5 className="text-lg font-medium text-gray-800">{item.name}</h5>
                  <p className="text-sm text-gray-600">{item.description}</p>
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

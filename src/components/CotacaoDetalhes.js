import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../fb';
import { ref, onValue, increment, update } from 'firebase/database';
import { AdsClick, Inbox, RemoveRedEye, Share, FileDownload } from '@mui/icons-material';

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
    navigator.clipboard
      .writeText(url)
      .then(() => alert('Link copiado! Pronto para partilhar.'))
      .catch((err) => alert('Erro ao copiar o link', err));
  };

  const handleVerPropostas = () => {
    if (propostas.length > 0) {
      navigate(`/propostas/${id}/propostas`);
    } else {
      alert('Nenhuma proposta foi recebida ainda.');
    }
  };

  if (!cotacao) {
    return <div className="text-center text-gray-500">Carregando...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8 bg-gray-100 shadow-lg rounded-lg">
      {/* Informações da Empresa */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-10 bg-white p-6 rounded-lg shadow">
        <img
          src={cotacao.company.logoUrl || 'default-logo.png'}
          alt={cotacao.company.nome}
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover"
        />
        <div className="text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-800">{cotacao.company.nome}</h2>
          <p className="text-sm text-gray-500">
            Estado: <span className="font-medium text-gray-800">{cotacao.status}</span>
          </p>
          <div className="flex flex-wrap justify-center sm:justify-start gap-4 mt-4 text-gray-600">
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
              <p>{cotacao.proposals ? propostas.length : 0} propostas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8 bg-white p-4 rounded-lg shadow">
        <p className="text-gray-600 text-center sm:text-left">
          Data Limite:{' '}
          <span className="font-semibold text-gray-800">
            {new Date(cotacao.datalimite).toLocaleDateString('pt-PT', {
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </p>
        <div className="flex flex-wrap gap-4 justify-center sm:justify-end">
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
            className="px-6 py-2 flex items-center gap-2 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 transition"
          >
            <FileDownload />
            Baixar Pedido
          </button>
          <button
            onClick={handlePartilhar}
            className="px-6 py-2 flex items-center gap-2 bg-gray-600 text-white font-medium rounded-lg shadow hover:bg-gray-700 transition"
          >
            <Share />
            Partilhar
          </button>
        </div>
      </div>

      {/* Descrição */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">{cotacao.title}</h3>
        <p
          className="text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: cotacao.description }}
        />
      </div>

      {/* Itens Solicitados */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h4 className="text-xl font-semibold text-gray-800 mb-4">Itens Solicitados</h4>
        {cotacao.items && cotacao.items.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cotacao.items.map((item, index) => (
              <li
                key={index}
                className="flex flex-col items-center gap-4 bg-gray-50 p-4 rounded-lg shadow hover:bg-gray-100 transition"
              >
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <div className="text-center">
                  <h5 className="text-lg font-medium text-gray-800">{item.name}</h5>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 text-center">Nenhum item disponível.</p>
        )}
      </div>
    </div>
  );
};

export default CotacaoDetalhes;

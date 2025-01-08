import React, { useEffect, useState } from 'react';
import { ref, onValue } from "firebase/database"; 
import { db } from '../../fb';
import { Link, useParams } from 'react-router-dom';

const ProposalDesk = () => {
  const { id, cotId } = useParams();
  const [activeTab, setActiveTab] = useState('Aprovada'); 
  const [cotacoes, setCotacoes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const proposalRef = ref(db, `cotacoes/${cotId}`);
    
    const unsubscribe = onValue(proposalRef, (snapshot) => {
      const propData = snapshot.val();
      if (propData && propData.proposals) {
        setCotacoes(Object.values(propData.proposals)); 
        console.log(propData);
      } else {
        setCotacoes([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [cotId, id]);

  const renderProposals = (status) => {
    const filteredProposals = cotacoes.filter(cotacao => cotacao.status === status);

    if (filteredProposals.length === 0) {
      return <p>Nenhuma proposta disponível para este status.</p>;
    }

    return filteredProposals.map(cotacao => (
      <div key={cotacao.id} className="p-4 bg-white shadow rounded mb-4">
        <h3 className="text-lg font-semibold">{cotacao.from.displayName}</h3>
        <p className="text-gray-600 text-lg mb-6" dangerouslySetInnerHTML={{ __html: cotacao.proposal }}></p>
        <Link to={cotacao.url}>Ver Cotacao</Link>

      </div>
    ));
  };

  if (loading) {
    return <p>Carregando propostas...</p>;
  }

  return (
    <div className="p-4">
      {/* Tabs */}
      <div className="flex space-x-4 border-b mb-4">
        <button
          className={`py-2 px-4 ${activeTab === 'Aprovada' ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('Aprovada')}
        >
          Aprovada
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'Recusada' ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('Recusada')}
        >
          Recusada
        </button>
        <button
          className={`py-2 px-4 ${activeTab === 'Em Espera' ? 'border-b-2 border-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('Em Espera')}
        >
          Em Espera
        </button>
      </div>

      {/* Lista de Propostas */}
      <div>
        {renderProposals(activeTab)}
      </div>
    </div>
  );
};

export default ProposalDesk;

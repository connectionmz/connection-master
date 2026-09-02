import React, { useEffect } from 'react';
import { db } from '../fb';
import { ref, update, remove } from 'firebase/database';
import AdsClick from '@mui/icons-material/AdsClick';
import HistoryEdu from '@mui/icons-material/HistoryEdu';
import VerifiedRounded from '@mui/icons-material/VerifiedRounded';
import Visibility from '@mui/icons-material/Visibility';

const CampaignCard = ({ campaign, userCompany, loggedInUser }) => {
  const imageUrl = campaign.items && campaign.items.length > 0 ? campaign.items[0].imageUrl : '';
  const { id, company, cliques = 0, visualizacoes = 0, visualizadores = [], clicadores = [], proposals = {} } = campaign;

  // Contar o número de propostas
  const numProposals = proposals ? Object.keys(proposals).length : 0;

  // Função para adicionar uma visualização única
  useEffect(() => {
    if (loggedInUser && loggedInUser.uid) {
      const validVisualizadores = Array.isArray(visualizadores) ? visualizadores : [];

      if (!validVisualizadores.includes(loggedInUser.uid)) {
        const newVisualizadores = [...validVisualizadores, loggedInUser.uid];
        const campaignRef = ref(db, `cotacoes/${id}`);
        update(campaignRef, { visualizacoes: visualizacoes + 1, visualizadores: newVisualizadores })
          .catch((error) => {
            console.error('Erro ao atualizar visualizações:', error);
          });
      }
    }
  }, [id, visualizadores, loggedInUser, visualizacoes]);

  const handleCampaignClick = () => {
    if (loggedInUser && loggedInUser.uid) {
      const validClicadores = Array.isArray(clicadores) ? clicadores : [];

      if (!validClicadores.includes(loggedInUser.uid)) {
        const newClicadores = [...validClicadores, loggedInUser.uid];
        const campaignRef = ref(db, `cotacoes/${id}`);
        update(campaignRef, { cliques: cliques + 1, clicadores: newClicadores })
          .catch((error) => {
            console.error('Erro ao atualizar cliques:', error);
          });
      }
    }
  };

  // Função para eliminar a campanha
  const handleDelete = () => {
    const campaignRef = ref(db, `cotacoes/${campaign.id}`);
    remove(campaignRef)
      .then(() => {
        console.log(`Campanha ${campaign.id} eliminada com sucesso!`);
      })
      .catch((error) => {
        console.error('Erro ao eliminar a campanha:', error);
      });
  };

  return (
    <a
      href={`/cotacao/${campaign.id}/${campaign.company.id}`}
      className="block bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
      onClick={handleCampaignClick}
    >
      <img
        src={imageUrl || 'https://via.placeholder.com/400x300'}
        alt={campaign.title}
        className="w-full h-40 object-cover"
      />
      <div className="p-4">
        <h5 className="text-lg font-semibold text-gray-800 mb-2 truncate">{campaign.title}</h5>
        <div className="flex items-center mb-4 space-x-2">
          <img
            src={campaign.company?.logoUrl || 'https://via.placeholder.com/150'}
            alt={campaign.company?.nome || 'Empresa'}
            className="w-10 h-10 border-2 border-gray-200 rounded-full"
          />
          <div className="flex items-center space-x-1">
            <small className="text-sm text-gray-700 font-medium">
              {campaign.company?.nome || 'Nome da Empresa'}
            </small>
            {campaign.company?.verified && (
              <VerifiedRounded style={{ color: 'green', marginLeft: '4px' }} />
            )}
          </div>
        </div>
        <p>Limite: <button className='btn'>{new Date(campaign.datalimite).toLocaleDateString('pt-PT', { month: 'long', day: 'numeric' })}</button></p>

        <div className="flex justify-between items-center text-sm text-gray-600">
          <p><Visibility/><span className="font-semibold">{visualizacoes}</span></p>
          <p><AdsClick/> <span className="font-semibold">{cliques}</span></p>
          <p><HistoryEdu/> <span className="font-semibold">{numProposals}</span></p>
        </div>
        {userCompany && userCompany.id === campaign.company?.id && (
          <button
            onClick={handleDelete}
            className="mt-4 text-red-500 font-medium hover:text-red-700 hover:underline"
          >
            Eliminar campanha
          </button>
        )}
      </div>
    </a>
  );
};

export default CampaignCard;

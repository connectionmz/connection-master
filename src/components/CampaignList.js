import React, { useEffect, useState } from 'react';
import CampaignCard from './CampaignCard';
import { db, auth } from '../fb'; 
import { onValue, ref } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

const CampaignList = ({ user }) => {
  const [cotacoes, setCotacao] = useState([]);
  const [loggedInUser, setLoggedInUser] = useState(null);


  const company = user

  // Verificação do estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoggedInUser(user);
      } else {
        setLoggedInUser(null); 
      }
    });

    return () => unsubscribe(); // Limpeza do listener
  }, []);

  // Busca de cotações filtradas
  useEffect(() => {
    if (company?.sector) {  // Certificar que user e sector existem
      const campaignRef = ref(db, 'cotacoes/');
      
      const unsubscribe = onValue(campaignRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const cotacoesArray = Object.keys(data)
            .map(key => ({
              id: key,
              ...data[key]
            }))
            .filter(cotacao => cotacao.company
              && cotacao.company.nome 
              && cotacao.status === 'open'
              && cotacao.sector === company.sector);
              
          setCotacao(cotacoesArray);
        }
      });

      // Limpeza do listener de Firebase
      return () => unsubscribe();
    }
  }, [user?.sector]); // Dependência no sector do usuário

  return (
    <div className="p-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1">
        {cotacoes.length > 0 ? (
          cotacoes.map(cotacao => (
            <CampaignCard key={cotacao.id} campaign={cotacao} loggedInUser={loggedInUser} /> 
          ))
        ) : (
          <p>Carregando cotações...</p>
        )}
      </div>
    </div>
  );
};

export default CampaignList;

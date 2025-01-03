import React, { useEffect, useState } from 'react';
import StorieList from './StorieList';
import Banner from './Banner';
import Header from './Header';
import CampaignList from './CampaignList';
import NotificationMessage from './NotificationMessage';
import ServicosExternos from './ServicosExternos';

import { db } from '../fb';
import { ref, get, limitToFirst, query } from 'firebase/database';
import MarqueeAnuncios from './MarqueeAnuncios';
import MarqueeParceiros from './MarqueeParceiros';

const Home = ({ user }) => {
  const [anuncios, setAnuncios] = useState([]);

  const fetchAnuncios = async () => {
    try {
      // Limita a busca aos 10 primeiros anúncios
      const anunciosQuery = query(ref(db, 'publicAnnouncements'), limitToFirst(10));
      const snapshot = await get(anunciosQuery);
  
      if (snapshot.exists()) {
        const data = snapshot.val();
  
        // Converte para array apenas se necessário
        const anunciosArray = Object.values(data);
        setAnuncios(anunciosArray);
      } else {
        setAnuncios([]); // Sem anúncios
      }
    } catch (error) {
      console.error('Erro ao buscar anúncios:', error);
    }
  };

  useEffect(() => {
    fetchAnuncios();
  }, []);
  return (
    <>
      <div className="content-container">
        <MarqueeParceiros/>
        <StorieList user={user.provincia}/> 
        <NotificationMessage /> 
        <Banner /> 
        <ServicosExternos /> 
        <MarqueeAnuncios/>
      </div>
    </>
  );
};

export default Home;

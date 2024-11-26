import React, { useEffect, useState } from 'react';
import StorieList from './StorieList';
import Banner from './Banner';
import Header from './Header';
import CampaignList from './CampaignList';
import NotificationMessage from './NotificationMessage';
import ServicosExternos from './ServicosExternos';

import { db } from '../fb';
import { ref, get } from 'firebase/database';
import MarqueeAnuncios from './MarqueeAnuncios';

const Home = ({ user }) => {
  const [anuncios, setAnuncios] = useState([]);

  const fetchAnuncios = async () => {
    try {
      const snapshot = await get(ref(db, 'publicAnnouncements'));
      if (snapshot.exists()) {
        setAnuncios(Object.values(snapshot.val()));
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

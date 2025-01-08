import React, { useEffect, useState } from 'react';
import StorieList from './StorieList';
import Banner from './Banner';
import Header from './Header';
import CampaignList from './CampaignList';
import ServicosExternos from './ServicosExternos';

import { db } from '../fb';
import { ref, get, limitToFirst, query } from 'firebase/database';
import MarqueeAnuncios from './MarqueeAnuncios';
import MarqueeParceiros from './MarqueeParceiros';

const Home = ({ user }) => {
  
  return (
    <>
      <div className="content-container">
        <MarqueeParceiros/>
        <StorieList user={user.provincia}/> 
        <Banner /> 
        <ServicosExternos /> 
        <MarqueeAnuncios user={user.provincia}/>
      </div>
    </>
  );
};

export default Home;

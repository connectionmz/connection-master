import React from 'react';
import StorieList from './StorieList';
import Banner from './Banner';
import Header from './Header';
import CampaignList from './CampaignList';
import NotificationMessage from './NotificationMessage';
import ServicosExternos from './ServicosExternos';
import '../styles/main.css';

const Home = ({ user }) => {
  return (
    <>
      <div className="content-container">
        <StorieList user={user.provincia}/> 
        <NotificationMessage /> 
        <Banner /> 
        <ServicosExternos /> 
        <div className="marquee-container">
          <p className="marquee-text">Anúncio de utilidade pública</p>
        </div>
      </div>
    </>
  );
};

export default Home;

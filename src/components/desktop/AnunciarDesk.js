// AnunciarDesk.js
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../fb';
import { ref, query, orderByChild, equalTo, onValue, remove } from 'firebase/database';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import BackButton from '../BackButton';
import MyAdsTab from '../anuncio/MyAdsTab';
import CreateAdTab from '../anuncio/CreateAdTab';


const AnunciarDesk = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [myAds, setMyAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(false);

  const loadUserAds = useCallback(async () => {
    if (!user?.id) return;
    
    setLoadingAds(true);
    try {
      const adsRef = query(ref(db, 'banners'), orderByChild('companyId'), equalTo(user.id));
      onValue(adsRef, (snapshot) => {
        const adsData = snapshot.val();

        if (adsData) {
          const adsArray = Object.keys(adsData).map((key) => ({
            id: key,
            ...adsData[key],
          }));
          
          // Ordenar por uploadedAt (do mais recente para o mais antigo)
          const sortedAds = adsArray.sort((a, b) => {
            const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
            const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
            return dateB - dateA;
          });
          
          setMyAds(sortedAds);
        } else {
          setMyAds([]);
        }
      });
    } catch (error) {
      console.error('Error loading ads:', error);
    } finally {
      setLoadingAds(false);
    }
  }, [user]);

const handleAdDeleted = (adId) => {
  const adRef = ref(db, `banners/${adId}`);

  remove(adRef)
    .then(() => {
      console.log("Anúncio removido com sucesso!");
    })
    .catch((error) => {
      console.error("Erro ao remover o anúncio:", error);
    });
};

  useEffect(() => {
    if (activeTab === 0) {
      loadUserAds();
    }
  }, [activeTab, user, loadUserAds]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box width="100%" minHeight="100vh">
      <Paper sx={{ width: '100%', padding: 3 }}>
        <BackButton sx={{ mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Gestão de Anúncios
        </Typography>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Meus Anúncios" />
          <Tab label="Criar Anúncio" />
        </Tabs>

        {activeTab === 0 ? (
          <MyAdsTab 
            myAds={myAds} 
            loading={loadingAds} 
            onAdCreated={loadUserAds} 
            onAdDeleted={handleAdDeleted}
          />
        ) : (
          <CreateAdTab 
            user={user} 
            onAdCreated={() => {
              setActiveTab(0);
              loadUserAds();
            }} 
          />
        )}
      </Paper>
    </Box>
  );
};

export default AnunciarDesk;
import React, { useEffect, useState } from 'react';
import { db } from '../fb';
import { ref, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom'; 
import { Avatar, Box, Button, Typography } from '@mui/material';
import '../styles/main.css';
import Marquee from 'react-fast-marquee'; 

export const fetchAnuncios = async () => {
  try {
    const snapshot = await get(ref(db, 'publicAnnouncements'));
    if (snapshot.exists()) {
      return Object.entries(snapshot.val()).map(([id, anuncio]) => ({ id, ...anuncio }));
    } else {
      return [];
    }
  } catch (error) {
    console.error('Erro ao buscar anúncios:', error);
    throw error; 
  }
};

const MarqueeAnuncios = ({ user }) => {
  const [anuncios, setAnuncios] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadAnuncios = async () => {
      try {
        const data = await fetchAnuncios();
        
        const anunciosFiltrados = data.filter(anuncio => 
          anuncio.company?.provincia === user?.provinciaTemp || 
          anuncio.company?.provincia === user.provincia
        );
        
        setAnuncios(anunciosFiltrados);
      } catch (error) {
        console.error('Erro ao carregar os anúncios:', error);
      }
    };

    loadAnuncios();
  }, [user]);

  const handleVerMais = () => {
    navigate('/noticiados');
  };

  const handleAnuncioClick = (id) => {
    navigate(`/anuncio/${id}`); // Redireciona para a página de detalhes do anúncio
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'primary.main',
        color: 'white',
        padding: 2,
        marginBottom: 3,
        borderRadius: 2,
      }}
    >
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Marquee pauseOnHover gradient={false}>
          {anuncios.map((anuncio, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                marginX: 4,
                cursor: 'pointer',
              }}
              onClick={() => handleAnuncioClick(anuncio.id)} 
            >
              <Avatar
                src={anuncio.company?.logo || ''}
                alt={anuncio.company?.nome || 'Logo da Empresa'}
                sx={{ width: 40, height: 40, marginRight: 1 }}
              />
              <Typography variant="body1" component="span" fontWeight="bold">
                {anuncio.company?.nome || 'Empresa Desconhecida'}:
              </Typography>
              <Typography variant="body2" component="span" sx={{ marginLeft: 1 }}>
                {anuncio.title}
              </Typography>
            </Box>
          ))}

          <Box sx={{ marginX: 4 }}>
            <Typography variant="body1" component="span" fontWeight="bold">
              Saiba tudo sobre regulamentos e notícias essenciais para empresas e cidadãos
            </Typography>
          </Box>
        </Marquee>
      </Box>

      <Box sx={{ flexShrink: 0, marginLeft: 2 }}>
        <Button
          onClick={handleVerMais}
          variant="contained"
          color="secondary"
          sx={{
            backgroundColor: 'white',
            color: 'primary.main',
            '&:hover': { backgroundColor: 'grey.200' },
          }}
        >
          Ver Mais
        </Button>
      </Box>
    </Box>
  );
};

export default MarqueeAnuncios;
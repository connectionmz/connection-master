import React, { useState, useEffect } from 'react';
import { ref, onValue } from "firebase/database";
import { db } from '../../fb';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import CircularProgress from '@mui/material/CircularProgress'; // Para o spinner de carregamento
import { Box, Typography } from "@mui/material";
import anunciar from '../../img/anunciar.gif'; // Importe a imagem anunciar.gif

const BannerDesk = ({ user }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true); // Estado para o indicador de carregamento

  useEffect(() => {
    const bannersRef = ref(db, 'banners');

    onValue(bannersRef, (snapshot) => {
      const bannersData = snapshot.val();
      if (bannersData) {
        const bannerList = Object.values(bannersData);
        // Filtra os banners com base nos segmentos do usuário
        const bannersFiltrados = bannerList.filter((banner) => {
          const matchesProvincia = banner.provincias.includes(user?.provincia);
          const matchesSetor = banner.sectores.includes(user?.sector);
          return matchesProvincia && matchesSetor;
        });
        setBanners(bannersFiltrados);
        console.log(bannersFiltrados); // Para depuração
      } else {
        setBanners([]); // Define banners como um array vazio se não houver dados
      }
      setLoading(false); // Para o carregamento após os banners serem buscados
    });
  }, [user?.provincia, user?.sector]);

  const settings = {
    dots: false,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
    pauseOnHover: true,
  };

  if (loading) {
    return (
      <Box className="flex justify-center items-center h-64">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box className="w-full max-w-screen-xl mx-auto">
      {banners.length > 0 ? (
        <Slider {...settings}>
          {banners.map((banner, index) => (
            <Box
              key={index}
              className="w-full flex overflow-hidden shadow-md"
              sx={{
                height: { xs: '250px', sm: '400px', md: '600px' }, // Ajusta dinamicamente a altura
              }}
            >
              {banner.link ? (
                <a href={banner.link} target="_blank" rel="noopener noreferrer" style={{ width: '100%', height: '100%' }}>
                  <img 
                    src={banner.imageUrl} 
                    alt={`Banner ${index + 1}`} 
                    onError={(e) => e.target.src = '/images/fallback-banner.jpg'}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain', // Mostra a imagem inteira sem cortes
                    }}
                  />
                </a>
              ) : (
                <img 
                  src={banner.imageUrl} 
                  alt={`Banner ${index + 1}`} 
                  onError={(e) => e.target.src = '/images/fallback-banner.jpg'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain', // Mostra a imagem inteira sem cortes
                  }}
                />
              )}
            </Box>
          ))}
        </Slider>
      ) : (
        <Box
          className="w-full flex overflow-hidden shadow-md"
          sx={{
            height: { xs: '250px', sm: '400px', md: '600px' }, // Ajusta dinamicamente a altura
          }}
        >
          <a href='/anunciar'>
            <img 
              src={anunciar} 
              alt="Anunciar" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />
          </a>
        </Box>
      )}
    </Box>
  );
};

export default BannerDesk;
import React, { useState, useEffect } from 'react';
import { ref, onValue } from "firebase/database"; 
import { db } from '../../fb';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import CircularProgress from '@mui/material/CircularProgress'; // For loading spinner
import { Box, Typography } from "@mui/material";

const BannerDesk = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true); // State for loading indicator

  useEffect(() => {
    const bannersRef = ref(db, 'banners');

    onValue(bannersRef, (snapshot) => {
      const bannersData = snapshot.val();
      if (bannersData) {
        const bannerList = Object.values(bannersData);
        setBanners(bannerList);
      }
      setLoading(false); // Stop loading after banners are fetched
    });
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    speed: 600,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: true,
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
              className="w-full flex rounded-lg overflow-hidden shadow-md"
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
        <Box className="flex justify-center items-center h-64">
          <Typography variant="body2" color="textSecondary">
            Nenhum banner disponível
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default BannerDesk;

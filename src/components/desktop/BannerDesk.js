import React, { useState, useEffect } from 'react';
import { ref, onValue, set } from "firebase/database";
import { db } from '../../fb';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import CircularProgress from '@mui/material/CircularProgress';
import { Box } from "@mui/material";
import anunciar from '../../img/anunciar.gif';

const BannerDesk = ({ user }) => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bannersRef = ref(db, 'banners');
    onValue(bannersRef, (snapshot) => {
      const bannersData = snapshot.val();
      if (bannersData) {
        const bannerList = Object.values(bannersData);

        // Filtrar apenas se o usuário existir
        const bannersFiltrados = user
          ? bannerList.filter((banner) => {
              return (
                banner.provincias.includes(user?.provincia) &&
                banner.sectores.includes(user?.sector)
              );
            })
          : bannerList; // Exibe todos os banners se o usuário não existir

        setBanners(bannersFiltrados);

        // Registrar visualizações apenas para usuários logados
        if (user) {
          bannersFiltrados.forEach((banner) => registrarView(banner.id));
        }
      } else {
        setBanners([]);
      }
      setLoading(false);
    });
  }, [user?.provincia, user?.sector]);

  const registrarView = (bannerId) => {
    if (!user?.id) return;
    const viewRef = ref(db, `impressoes_anuncio/views/${bannerId}/${user.id}`);
    set(viewRef, true);
  };

  const registrarClick = (bannerId) => {
    if (!user?.id) return;
    const clickRef = ref(db, `impressoes_anuncio/clicks/${bannerId}/${user.id}`);
    set(clickRef, true);
  };

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
              className="w-full flex overflow-hidden"
              sx={{
                height: { xs: '250px', sm: '400px', md: '600px' },
                border: 'none',
                boxShadow: 'none',
              }}
            >
              {banner.link ? (
                <a
                  href={banner.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ width: '100%', height: '100%' }}
                  onClick={() => registrarClick(banner.id)}
                >
                  <img
                    src={banner.imageUrl}
                    alt={`Banner ${index + 1}`}
                    onError={(e) => (e.target.src = '/images/fallback-banner.jpg')}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                </a>
              ) : (
                <img
                  src={banner.imageUrl}
                  alt={`Banner ${index + 1}`}
                  onError={(e) => (e.target.src = anunciar)}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              )}
            </Box>
          ))}
        </Slider>
      ) : (
        <Box
          className="w-full flex overflow-hidden"
          sx={{
            height: { xs: '250px', sm: '400px', md: '600px' },
            border: 'none',
            boxShadow: 'none',
          }}
        >
          <a href="/anunciar">
            <img
              src={anunciar}
              alt="Anunciar"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </a>
        </Box>
      )}
    </Box>
  );
};

export default BannerDesk;
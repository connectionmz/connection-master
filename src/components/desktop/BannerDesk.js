import React, { useState, useEffect } from 'react';
import { ref, onValue, set, update } from "firebase/database";
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
    const unsubscribe = onValue(bannersRef, (snapshot) => {
      const bannersData = snapshot.val();
      if (bannersData) {
        const bannerList = Object.entries(bannersData).map(([id, banner]) => ({
          id,
          ...banner
        }));

        // Check expiration and update status
        const currentDate = new Date();
        const updatedBanners = bannerList.map(banner => {
          const expireDate = new Date(banner.expireDate);
          if (expireDate < currentDate && banner.status !== 'expired') {
            // Update status in Firebase if expired
            update(ref(db, `banners/${banner.id}`), { status: 'expired' });
            return { ...banner, status: 'expired' };
          }
          return banner;
        });

        // Filter banners based on user profile and type
        const filteredBanners = updatedBanners.filter(banner => {
          // Only show active banners
          if (banner.status !== 'active') return false;
          
          // Filter by type (home page banners)
          if (banner.tipoAnuncio !== 'home') return false;

          // Check if banner has expired
          const expireDate = new Date(banner.expireDate);
          if (expireDate < currentDate) return false;

          // If user exists, filter by province and sector
          if (user) {
            const matchesProvincia = banner.provincias.includes(user.provincia);
            const matchesSector = banner.sectores.includes(user.sector);
            return matchesProvincia && matchesSector;
          }
          
          // Show all active banners if no user
          return true;
        });

        setBanners(filteredBanners);

        // Register views for logged-in users
        if (user) {
          filteredBanners.forEach((banner) => registrarView(banner.id));
        }
      } else {
        setBanners([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.provincia, user?.sector, user?.id]);

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

  // Get active banners (filter again in case state hasn't updated)
  const activeBanners = banners.filter(banner => {
    const expireDate = new Date(banner.expireDate);
    return banner.status === 'active' && expireDate > new Date();
  });

  return (
    <Box className="w-full max-w-screen-xl mx-auto">
      {activeBanners.length > 0 ? (
        <Slider {...settings}>
          {activeBanners.map((banner, index) => (
            <Box
              key={banner.id}
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
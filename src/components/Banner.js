import React, { useState, useEffect } from 'react';
import { ref, onValue } from "firebase/database"; 
import { db } from '../fb';
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import CircularProgress from '@mui/material/CircularProgress'; // For loading spinner

const Banner = () => {
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
      <div className="flex justify-center items-center h-64">
        <CircularProgress />
      </div>
    );
  }

  return (
    <div className="w-full max-w-screen-xl mx-auto">
      {banners.length > 0 ? (
        <Slider {...settings}>
          {banners.map((banner, index) => (
            <div key={index} className="w-full h-[350px] md:h-[500px] flex bg-gray-100 rounded-lg overflow-hidden shadow-md">
              {banner.link ? (
                <a href={banner.link} target="_blank" rel="noopener noreferrer" className="w-full h-full">
                  <img 
                    src={banner.imageUrl} 
                    alt={`Banner ${index + 1}`} 
                    onError={(e) => e.target.src = '/images/fallback-banner.jpg'}
                    className="w-full h-full object-cover"
                  />
                </a>
              ) : (
                <img 
                  src={banner.imageUrl} 
                  alt={`Banner ${index + 1}`} 
                  onError={(e) => e.target.src = '/images/fallback-banner.jpg'}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          ))}
        </Slider>
      ) : (
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Nenhum banner disponível</p>
        </div>
      )}
    </div>
  );
};

export default Banner;

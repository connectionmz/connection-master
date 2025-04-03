import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Box, Button, Typography, useMediaQuery } from "@mui/material";
import { Link } from "react-router-dom";
import anunciar from '../../img/anunciar.gif';

const AnunciosDesk = ({ campanhas }) => {
  console.log(campanhas)
  const isMobile = useMediaQuery('(max-width:600px)');
  
  const settings = {
    dots: true,
    infinite: campanhas.length > 1,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: campanhas.length > 1,
    autoplaySpeed: 5000,
    arrows: !isMobile,
    adaptiveHeight: true,
  };

  // Custom styles for different campaign types
  const getCampaignStyle = (type) => {
    const baseStyle = {
      padding: isMobile ? 2 : 4,
      borderRadius: "12px",
      minHeight: isMobile ? "250px" : "350px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      gap: 2,
      textAlign: "center",
    };

    switch(type) {
      case 'concurso':
        return {
          ...baseStyle,
          backgroundColor: '#f0f7ff',
          border: '2px solid #1976d2',
        };
      case 'promocao':
        return {
          ...baseStyle,
          backgroundColor: '#fff8e1',
          border: '2px solid #ffc107',
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: '#f5f5f5',
          border: '1px dashed #ccc',
        };
    }
  };

  return (
    <Box sx={{ 
      margin: isMobile ? 1 : 2,
      borderRadius: "12px",
      overflow: "hidden",
      boxShadow: '0px 3px 5px rgba(0,0,0,0.1)'
    }}>
      <Slider {...settings}>
        {campanhas.length > 0 ? (
          campanhas.map((anuncio) => (
            <Box
              key={anuncio.id}
              sx={getCampaignStyle(anuncio.tipo)}
            >
              {anuncio.imageUrl && (
                <img
                src={anuncio.imageUrl}
                alt={anuncio.titulo}
                style={{ 
                  maxWidth: "100%", 
                  height: "auto",
                  maxHeight: "100%",
                  objectFit: "contain",
                  borderRadius: "8px"
                }}
                onError={(e) => e.target.src = anunciar}
              />
              
              )}
              
            </Box>
          ))
        ) : (
          <Box sx={getCampaignStyle()}>
            <img
              src={anunciar}
              alt="Nenhum anúncio disponível"
              style={{ 
                width: "100%", 
                maxHeight: isMobile ? "120px" : "180px", 
                objectFit: "contain" 
              }}
            />
            <Typography variant={isMobile ? "h6" : "h5"} color="primary">
              Nenhum anúncio disponível
            </Typography>
            <Typography variant={isMobile ? "body2" : "body1"} color="text.secondary">
              Seja o primeiro a anunciar aqui!
            </Typography>
            <Button
              component={Link}
              to="/anunciar"
              variant="contained"
              color="primary"
              sx={{ 
                mt: 2,
                fontSize: isMobile ? "0.875rem" : "1rem",
                padding: "8px 16px"
              }}
            >
              Criar Anúncio
            </Button>
          </Box>
        )}
      </Slider>
    </Box>
  );
};

export default AnunciosDesk;
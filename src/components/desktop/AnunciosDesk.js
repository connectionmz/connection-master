import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Box, Button, Typography } from "@mui/material";

const AnunciosDesk = ({ campanhas }) => {

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  if (!campanhas.length) {
    return <Typography>Carregando anúncios...</Typography>;
  }

  return (
    <Box sx={{ margin: 2, textAlign: "center", borderRadius: "12px", overflow: "hidden" }}>
      <Slider {...settings}>
        {campanhas.map((anuncio) => (
          <Box
            key={anuncio.id}
            sx={{
              padding: 4,
              backgroundColor: "#f5f5f5",
              border: "1px dashed #ccc",
              borderRadius: "12px",
              minHeight: "300px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              gap: 2,
            }}
          >
            <img src={anuncio.imagem} alt={anuncio.titulo} style={{ width: "100%", maxHeight: "150px", objectFit: "cover" }} />
            <Typography variant="h5" color="primary">{anuncio.titulo}</Typography>
            <Typography variant="body1" color="text.secondary">{anuncio.descricao}</Typography>
            <Button variant="outlined" color="primary" sx={{ mt: 2, fontSize: "1rem", padding: "8px 16px" }}>Saiba Mais</Button>
          </Box>
        ))}
      </Slider>
    </Box>
  );
};

export default AnunciosDesk;

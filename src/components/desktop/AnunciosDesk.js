import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Box, Button, Typography } from "@mui/material";
import { Link } from "react-router-dom"; // Importe o Link para navegação
import anunciar from '../../img/anunciar.gif';

const AnunciosDesk = ({ campanhas }) => {
  const settings = {
    dots: true,
    infinite: campanhas.length > 1, // Infinite só se houver mais de um anúncio
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: campanhas.length > 1, // Autoplay só se houver mais de um anúncio
    autoplaySpeed: 3000,
  };

  // Placeholder para quando não houver anúncios
  const placeholderImage = "https://via.placeholder.com/600x300?text=Nenhum+Anúncio+Disponível";

  return (
    <Box sx={{ margin: 2, textAlign: "center", borderRadius: "12px", overflow: "hidden" }}>
      <Slider {...settings}>
        {campanhas.length > 0 ? (
          campanhas.map((anuncio) => (
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
              <img
                src={anuncio.imagem}
                alt={anuncio.titulo}
                style={{ width: "100%", maxHeight: "150px", objectFit: "cover" }}
              />
              <Typography variant="h5" color="primary">
                {anuncio.titulo}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {anuncio.descricao}
              </Typography>
              <Button variant="outlined" color="primary" sx={{ mt: 2, fontSize: "1rem", padding: "8px 16px" }}>
                Saiba Mais
              </Button>
            </Box>
          ))
        ) : (
          // Placeholder quando não há anúncios
          <Box
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
            <img
              src={placeholderImage}
              alt="Nenhum anúncio disponível"
              style={{ width: "100%", maxHeight: "150px", objectFit: "cover" }}
            />
            <Typography variant="h5" color="primary">
              Nenhum anúncio disponível
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Clique no botão abaixo para criar um anúncio.
            </Typography>
            <Button
              component={Link}
              to="/anunciar" // Link para a página de anúncios
              variant="contained"
              color="primary"
              sx={{ mt: 2, fontSize: "1rem", padding: "8px 16px" }}
            >
              Anunciar aqui
            </Button>
          </Box>
        )}
      </Slider>
    </Box>
  );
};

export default AnunciosDesk;
import React from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  useMediaQuery,
} from "@mui/material";

const Sobre = () => {
  const isMobile = useMediaQuery("(max-width:600px)");

  return (
    <Box
      sx={{
        backgroundColor: "#f5f7fa", // Fundo claro e suave
        padding: isMobile ? "20px 0" : "40px 0", // Padding responsivo
      }}
    >
      <Container>
        <Paper
          sx={{
            padding: isMobile ? "20px" : "40px",
            backgroundColor: "#ffffff", // Fundo branco
            borderRadius: "8px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)", // Sombra suave
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "#003366", // Azul escuro
              marginBottom: "20px",
              textAlign: "center",
            }}
          >
            Sobre Nós
          </Typography>

          {/* Seção 1: Introdução */}
          <Typography
            variant="body1"
            sx={{
              color: "#333333", // Cinza escuro
              lineHeight: "1.8",
              marginBottom: "20px",
            }}
          >
            A <strong>Connection Mozambique, Lda.</strong>A Connection Mozambique, Lda. é uma empresa privada moçambicana que actua no sector das 
Tecnologias de Informação, sedeada na cidade de Pemba, no Bairro cimento na rua do banco de 
Moçambique, sendo pioneira no desenvolvimento de soluções tecnológicas inovadoras adaptadas à 
realidade do mercado moçambicano. O nosso objectivo é gerar um impacto positivo no sector, 
oferecendo serviços que integram inovação, qualidade e eficiência, contribuindo para o crescimento 
e modernização das empresas nacionais. 
          </Typography>

          {/* Seção 2: Nossa História */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              color: "#00509e", // Azul médio
              marginBottom: "16px",
            }}
          >
            Nossa História
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#333333", // Cinza escuro
              lineHeight: "1.8",
              marginBottom: "20px",
            }}
          >
            A <strong>Connection Mozambique</strong> foi fundada em 2022, resultado de um sonho partilhado por jovens
            moçambicanos determinados a transformar desafios em oportunidades. Criada com o propósito de
            combater o desemprego juvenil e promover o empreendedorismo, a empresa conta atualmente com
            12 colaboradores e é reconhecida como símbolo de resiliência, inovação e compromisso com o
            desenvolvimento económico e tecnológico na província.
          </Typography>

          {/* Seção 3: Foco e Missão */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: "bold",
              color: "#00509e", // Azul médio
              marginBottom: "16px",
            }}
          >
            Foco e Missão
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "#333333", // Cinza escuro
              lineHeight: "1.8",
              marginBottom: "20px",
            }}
          >
            Desde a sua fundação, a <strong>Connection Mozambique</strong> tem focado os seus esforços no desenvolvimento
            de soluções tecnológicas capazes de responder às necessidades específicas das empresas
            moçambicanas, através da prestação de serviços de consultoria e assistência técnica.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Sobre;
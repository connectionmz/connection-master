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
            A <strong>Connection Mozambique, Lda.</strong> é uma empresa moçambicana de tecnologia, sediada na
            cidade de Pemba, nascida da convicção de que a tecnologia pode transformar a forma como as
            empresas moçambicanas fazem negócio. Acreditamos que ligar fornecedores, compradores e
            oportunidades num só lugar é o caminho para um mercado mais justo, mais rápido e mais
            próspero — e é isso que construímos, todos os dias, para as empresas de Moçambique.
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
            A <strong>Connection Mozambique</strong> nasceu em 2022, do sonho de um grupo de jovens moçambicanos
            que recusou aceitar o desemprego como destino e escolheu, em vez disso, construir uma solução.
            O que começou como uma ideia tornou-se uma plataforma que hoje liga empresas por todo o país —
            prova de que a determinação e a inovação moçambicanas não têm limites.
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
            A nossa missão é simples e ambiciosa: colocar a tecnologia ao serviço do crescimento económico
            de Moçambique. Trabalhamos todos os dias para que cada empresa — da mais pequena à maior —
            tenha acesso às mesmas oportunidades, ferramentas e visibilidade para crescer. Acreditamos num
            Moçambique onde a inovação nacional impulsiona negócios, cria emprego e constrói um futuro mais
            próspero para todos.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Sobre;
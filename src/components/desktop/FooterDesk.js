import React from "react";
import { Box, Container, Typography, Link, Grid, IconButton } from "@mui/material";
import { Facebook, Twitter, Instagram, LinkedIn as LinkedInIcon } from "@mui/icons-material";

const FooterDesk = () => {
  return (
    <Box sx={{ paddingTop: 4, paddingBottom: 2 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4} justifyContent="space-between">
          {/* Coluna de Links */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
              Sobre
            </Typography>
            <Box>
              <Link href="/about" sx={{ display: "block", marginBottom: 1, color: "#555", textDecoration: "none" }}>
                Sobre nós
              </Link>
              <Link href="/careers" sx={{ display: "block", marginBottom: 1, color: "#555", textDecoration: "none" }}>
                Carreiras
              </Link>
              <Link href="/help" sx={{ display: "block", marginBottom: 1, color: "#555", textDecoration: "none" }}>
                Central de ajuda
              </Link>
              <Link href="/terms" sx={{ display: "block", marginBottom: 1, color: "#555", textDecoration: "none" }}>
                Termos de uso
              </Link>
              <Link href="/privacy" sx={{ display: "block", marginBottom: 1, color: "#555", textDecoration: "none" }}>
                Política de privacidade
              </Link>
            </Box>
          </Grid>

          {/* Coluna de Redes Sociais */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
              Siga-nos
            </Typography>
            <Box>
              <IconButton href="https://facebook.com" target="_blank" sx={{ color: "#3b5998", marginRight: 2 }}>
                <Facebook />
              </IconButton>
              <IconButton href="https://twitter.com" target="_blank" sx={{ color: "#00acee", marginRight: 2 }}>
                <Twitter />
              </IconButton>
              <IconButton href="https://instagram.com" target="_blank" sx={{ color: "#C13584", marginRight: 2 }}>
                <Instagram />
              </IconButton>
              <IconButton href="https://linkedin.com" target="_blank" sx={{ color: "#0e76a8", marginRight: 2 }}>
                <LinkedInIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* Coluna de Informações Legais */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ fontWeight: "bold", marginBottom: 2 }}>
              Informações Legais
            </Typography>
            <Box>
              <Link href="/legal" sx={{ display: "block", marginBottom: 1, color: "#555", textDecoration: "none" }}>
                Aviso legal
              </Link>
              <Link href="/cookie-policy" sx={{ display: "block", marginBottom: 1, color: "#555", textDecoration: "none" }}>
                Política de cookies
              </Link>
            </Box>
          </Grid>

          {/* Coluna de Direitos Autorais */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography sx={{ color: "#555", textAlign: "center", marginTop: 4 }}>
              © {new Date().getFullYear()} Empresa. Todos os direitos reservados.
            </Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default FooterDesk;

import React from "react";
import { Box, Container, Typography, Link, Grid, IconButton } from "@mui/material";
import { Facebook, Instagram, LinkedIn as LinkedInIcon } from "@mui/icons-material";

const FooterDesk = () => {
  return (
    <Box sx={{ backgroundColor: "#f9f9f9", py: 6, borderTop: "1px solid #ddd" }}>
      <Container maxWidth="lg">
        <Box sx={{ marginTop: 4, textAlign: "center" }}>
          <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
            <Link href="/sobre" sx={{ color: "text.secondary", textDecoration: "none", mx: 1 }}>
              Sobre
            </Link>
            |
            <Link href="/cookies" sx={{ color: "text.secondary", textDecoration: "none", mx: 1 }}>
              Politicas & Termos
            </Link>
            |
            <Link href="/ajuda" sx={{ color: "text.secondary", textDecoration: "none", mx: 1 }}>
              Ajuda
            </Link>
            |
            <Link href="/verificacao" sx={{ color: "text.secondary", textDecoration: "none", mx: 1 }}>
            Verificação
            </Link>
            <Box>
              <IconButton href="https://www.facebook.com/profile.php?id=61557475474340" target="_blank" sx={{ color: "#3b5998", marginRight: 2 }}>
                <Facebook />
              </IconButton>
              <IconButton href="https://www.instagram.com/connectionmozambique/" target="_blank" sx={{ color: "#C13584", marginRight: 2 }}>
                <Instagram />
              </IconButton>
              <IconButton href="https://www.linkedin.com/company/connectionmz/" target="_blank" sx={{ color: "#0e76a8", marginRight: 2 }}>
                <LinkedInIcon />
              </IconButton>
            </Box>
          </Typography>
            <small>
              © {new Date().getFullYear()} Empresa. Todos os direitos reservados.
            </small>
        </Box>
      </Container>
    </Box>
  );
};

export default FooterDesk;

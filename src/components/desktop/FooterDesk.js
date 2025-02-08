import React from "react";
import { Box, Container, Typography, Link, IconButton } from "@mui/material";
import { Facebook, Instagram, LinkedIn as LinkedInIcon, Language } from "@mui/icons-material";

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
              Políticas & Termos
            </Link>
            |
            <Link href="/ajuda" sx={{ color: "text.secondary", textDecoration: "none", mx: 1 }}>
              Ajuda
            </Link>
            |
            <Link href="/verificacao" sx={{ color: "text.secondary", textDecoration: "none", mx: 1 }}>
              Verificação
            </Link>
          </Typography>

          <Box sx={{ mt: 2 }}>
            <IconButton href="https://www.facebook.com/profile.php?id=61557475474340" target="_blank" sx={{ color: "#3b5998", marginRight: 2 }}>
              <Facebook />
            </IconButton>
            <IconButton href="https://www.instagram.com/connectionmozambique/" target="_blank" sx={{ color: "#C13584", marginRight: 2 }}>
              <Instagram />
            </IconButton>
            <IconButton href="https://www.linkedin.com/company/connectionmz/" target="_blank" sx={{ color: "#0e76a8", marginRight: 2 }}>
              <LinkedInIcon />
            </IconButton>
            <IconButton href="https://www.connectionmozambique.com" target="_blank" sx={{ color: "#333", marginRight: 2 }}>
              <Language />
            </IconButton>
          </Box>

      

          <Typography variant="body2" sx={{ mt: 2, color: "text.secondary" }}>
            <small>© {new Date().getFullYear()} Empresa. Todos os direitos reservados.</small>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default FooterDesk;

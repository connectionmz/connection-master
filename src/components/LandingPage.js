import React from "react";
import { Container, Box, Typography, Button, Grid, Card, CardContent } from "@mui/material";

const LandingPage = () => {
  return (
    <div>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ff4081, #f50057)',
          color: 'white',
          padding: '80px 0',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h2" gutterBottom>
            Bem-vindo à plataforma Connections
          </Typography>
          <Typography variant="h6" paragraph>
            Conecte sua empresa a novas oportunidades de negócios, cotações e muito mais!
          </Typography>
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#f50057',
              color: 'white',
              '&:hover': {
                backgroundColor: '#c51162',
              },
            }}
            size="large"
          >
            Comece Agora
          </Button>
        </Container>
      </Box>

      {/* Funcionalidades Section */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Typography variant="h4" gutterBottom align="center">
          Funcionalidades Principais
        </Typography>
        <Grid container spacing={4} justifyContent="center">
          {/* Funcionalidade 1 */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                borderRadius: 2,
                padding: 3,
              }}
            >
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                  Cadastro de Empresas
                </Typography>
                <Typography sx={{ color: 'gray' }} paragraph>
                  Facilite a inscrição da sua empresa e aumente a visibilidade no mercado.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Funcionalidade 2 */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                borderRadius: 2,
                padding: 3,
              }}
            >
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                  Pedidos de Cotação
                </Typography>
                <Typography sx={{ color: 'gray' }} paragraph>
                  Solicite cotações de forma rápida e simples diretamente de várias empresas.
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Funcionalidade 3 */}
          <Grid item xs={12} md={4}>
            <Card
              sx={{
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                textAlign: 'center',
                borderRadius: 2,
                padding: 3,
              }}
            >
              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 500 }}>
                  Concursos Públicos
                </Typography>
                <Typography sx={{ color: 'gray' }} paragraph>
                  Participe de concursos públicos e encontre novas oportunidades de negócios.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Chamada à Ação */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ff4081, #f50057)',
          color: 'white',
          padding: '80px 0',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="h4" gutterBottom>
            Está pronto para começar?
          </Typography>
          <Typography variant="h6" paragraph>
            Conecte-se a empresas e comece a obter cotações agora mesmo.
          </Typography>
          <Button
            variant="contained"
            sx={{
              backgroundColor: '#f50057',
              color: 'white',
              '&:hover': {
                backgroundColor: '#c51162',
              },
            }}
            size="large"
          >
            Comece Agora
          </Button>
        </Container>
      </Box>
    </div>
  );
};

export default LandingPage;

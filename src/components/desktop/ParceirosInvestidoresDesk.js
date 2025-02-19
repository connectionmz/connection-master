import React, { useState, useEffect } from 'react';
import {
  Tab,
  Tabs,
  Box,
  Typography,
  Grid,
  Avatar,
  Card,
  CardContent,
  useMediaQuery,
} from '@mui/material';
import { ref, get } from 'firebase/database';
import { db } from '../../fb';
import { useNavigate } from 'react-router-dom';

const ParceirosInvestidoresDesk = () => {
  const [value, setValue] = useState(0);
  const [parceiros, setParceiros] = useState([]);
  const [financiadores, setFinanciadores] = useState([]);
  const [investidores, setInvestidores] = useState([]);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');

  // Buscar dados de Parceiros, Financiadores e Investidores
  useEffect(() => {
    const fetchData = async () => {
      try {
        const parceirosSnapshot = await get(ref(db, 'parceiros'));
        const financiadoresSnapshot = await get(ref(db, 'financiadores'));
        const investidoresSnapshot = await get(ref(db, 'investidores'));

        if (parceirosSnapshot.exists()) {
          setParceiros(Object.values(parceirosSnapshot.val()));
        }
        if (financiadoresSnapshot.exists()) {
          setFinanciadores(Object.values(financiadoresSnapshot.val()));
        }
        if (investidoresSnapshot.exists()) {
          setInvestidores(Object.values(investidoresSnapshot.val()));
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };

    fetchData();
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleCompanyClick = (companyId) => {
    navigate(`/vperfil/${companyId}`);
  };

  const renderCard = (item) => (
    <Grid
      item
      xs={12}
      sm={6}
      md={4}
      key={item.companyId}
    >
      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 2,
          borderRadius: 2,
          cursor: 'pointer',
          transition: '0.3s',
          boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          '&:hover': { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)' },
        }}
        onClick={() => handleCompanyClick(item.companyId)}
      >
        <Avatar
          src={item.logo}
          alt={item.nome}
          sx={{
            width: isMobile ? 60 : 80,
            height: isMobile ? 60 : 80,
            marginBottom: 2,
          }}
        />
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography
            variant="h6"
            color="primary"
            sx={{
              fontSize: isMobile ? '1rem' : '1.2rem',
              fontWeight: 'bold',
            }}
          >
            {item.nome}
          </Typography>
        </CardContent>
      </Card>
    </Grid>
  );

  return (
    <Box
      sx={{
        width: '100%',
        padding: isMobile ? 1 : 2,
      }}
    >
      {/* Legenda acima das tabs */}
      <Typography
        variant="h6"
        align="center"
        sx={{
          marginBottom: 2,
          fontSize: isMobile ? '1rem' : '1.2rem',
          fontWeight: 'bold',
        }}
      >
        Selecione uma categoria: Parceiros, Financiadores ou Patrocinadores
      </Typography>

      <Tabs
        value={value}
        onChange={handleChange}
        aria-label="parceiros, financiadores e investidores"
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        centered
        sx={{
          '& .MuiTabs-scroller': {
            overflow: 'auto',
          },
          '& .MuiTab-root': {
            fontSize: isMobile ? '0.8rem' : '1rem',
            padding: isMobile ? '6px 12px' : '8px 16px',
            minWidth: '80px',
            whiteSpace: 'nowrap',
            textTransform: 'capitalize',
          },
          '& .MuiTabs-indicator': {
            height: '3px',
            backgroundColor: 'primary.main',
          },
        }}
      >
        <Tab label={isMobile ? 'Parc.' : 'Parceiros'} />
        <Tab label={isMobile ? 'Finan.' : 'Financiadores'} />
        <Tab label={isMobile ? 'Pats.' : 'Patrocinadores'} />
      </Tabs>

      <Box
        sx={{
          padding: isMobile ? 1 : 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {value === 0 && (
          <Grid container spacing={2}>
            {parceiros.map((parceiro) => renderCard(parceiro))}
          </Grid>
        )}
        {value === 1 && (
          <Grid container spacing={2}>
            {financiadores.map((financiador) => renderCard(financiador))}
          </Grid>
        )}
        {value === 2 && (
          <Grid container spacing={2}>
            {investidores.map((investidor) => renderCard(investidor))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default ParceirosInvestidoresDesk;
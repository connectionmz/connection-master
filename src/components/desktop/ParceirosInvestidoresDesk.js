import React, { useState, useEffect } from 'react';
import { Tab, Tabs, Box, Typography, Grid, Avatar, Card, CardContent } from '@mui/material';
import { db } from '../../fb';
import { ref, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom'; // Importação do hook useNavigate

const ParceirosInvestidoresDesk = () => {
  const [value, setValue] = useState(0);
  const [parceiros, setParceiros] = useState([]);
  const [financiadores, setFinanciadores] = useState([]);
  const [investidores, setInvestidores] = useState([]);
  const navigate = useNavigate(); // Inicialização do hook de navegação

  useEffect(() => {
    // Buscar dados de Parceiros, Financiadores e Investidores
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
    navigate(`/vperfil/${companyId}`); // Redireciona para o perfil da empresa
  };

  const renderCard = (item) => (
    <Grid item xs={12} md={4} key={item.companyId}>
      <Card
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 2,
          borderRadius: 2,
          cursor: 'pointer', // Indica que o cartão é clicável
          transition: '0.3s',
          '&:hover': { boxShadow: 6 }, // Adiciona efeito de hover
        }}
        onClick={() => handleCompanyClick(item.companyId)} // Adiciona o evento de clique
      >
        <Avatar
          src={item.logo}
          alt={item.nome}
          sx={{ width: 80, height: 80, marginBottom: 2 }}
        />
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h6" color="primary">{item.nome}</Typography>
        </CardContent>
      </Card>
    </Grid>
  );

  return (
    <Box sx={{ width: '100%', padding: 2 }}>
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label="parceiros, financiadores e investidores"
        variant="fullWidth"
        centered
        sx={{ marginBottom: 3 }}
      >
        <Tab label="Parceiros" />
        <Tab label="Financiadores" />
        <Tab label="Investidores" />
      </Tabs>

      <Box sx={{ padding: 2 }}>
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

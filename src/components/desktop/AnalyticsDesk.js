import React, { useState, useEffect } from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import { Box, Grid, Typography, Paper, Tab, Tabs } from '@mui/material';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { ref, onValue } from 'firebase/database';
import { db } from '../../fb'; // Ajuste o caminho conforme necessário

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalyticsDesk = ({ user }) => {
  const [tabValue, setTabValue] = useState(0);
  const [cotacoesData, setCotacoesData] = useState([]);
  const [concursosData, setConcursosData] = useState([]);
  const [perfilData, setPerfilData] = useState(null);

  // Carregar dados do Firebase
  useEffect(() => {
    // Carregar cotações
    const cotacoesRef = ref(db, 'cotacoes');
    onValue(cotacoesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCotacoesData(Object.values(data));
      }
    });

    // Carregar concursos
    const concursosRef = ref(db, 'concursos');
    onValue(concursosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setConcursosData(Object.values(data));
      }
    });

    // Carregar perfil da empresa
    const companyRef = ref(db, `company/${user.id}`);
    onValue(companyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setPerfilData(data);
        console.log(data.visitas)
      }
    });
  }, [user]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Transformar dados de cotações em formato de gráfico
  const lineData = {
    labels: cotacoesData.map((_, index) => `Mês ${index + 1}`), // Exemplo de rótulos
    datasets: [
      {
        label: 'Cotações Realizadas',
        data: cotacoesData.map((cotacao) => cotacao.valor), // Ajuste conforme a estrutura dos dados
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
        fill: true,
      },
    ],
  };

  // Transformar dados de concursos em formato de gráfico
  const barData = {
    labels: concursosData.map((concurso) => concurso.nome), // Ajuste conforme a estrutura dos dados
    datasets: [
      {
        label: 'Participações em Concursos',
        data: concursosData.map((concurso) => concurso.participacoes), // Ajuste conforme a estrutura dos dados
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
      },
    ],
  };

  // Transformar dados do perfil em formato de gráfico
  const pieData = {
    labels: ['Setor', 'Subsector', 'Província', 'Distrito'], // Exemplo de rótulos
    datasets: [
      {
        data: [
          perfilData?.sector ? 1 : 0,
          perfilData?.subsector ? 1 : 0,
          perfilData?.provincia ? 1 : 0,
          perfilData?.distrito ? 1 : 0,
        ], // Exemplo de dados
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
      },
    ],
  };

  return (
    <Box width='100%' minHeight="100vh">
      <Typography variant="h4" gutterBottom>
        Análises de Desempenho
      </Typography>

      {/* Tabs */}
      <Tabs value={tabValue} onChange={handleTabChange} aria-label="Analytics tabs" centered>
        <Tab label="Cotações" />
        <Tab label="Concursos" />
        <Tab label="Módulos" />
        <Tab label="Impressões" />
      </Tabs>

      {/* Conteúdo das Abas */}
      <Box sx={{ paddingTop: 2 }}>
        {tabValue === 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ padding: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Cotações Realizadas (Line)
                </Typography>
                <Line data={lineData} options={{ responsive: true }} />
              </Paper>
            </Grid>
          </Grid>
        )}

        {tabValue === 1 && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ padding: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Participações em Concursos (Bar)
                </Typography>
                <Bar data={barData} options={{ responsive: true }} />
              </Paper>
            </Grid>
          </Grid>
        )}

        {tabValue === 2 && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ padding: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Informações do Perfil (Pie)
                </Typography>
                <Pie data={pieData} options={{ responsive: true }} />
              </Paper>
            </Grid>
          </Grid>
        )}

        {tabValue === 3 && (
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <Paper sx={{ padding: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Impressões (Bar)
                </Typography>
                <Bar data={barData} options={{ responsive: true }} />
              </Paper>
            </Grid>
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default AnalyticsDesk;
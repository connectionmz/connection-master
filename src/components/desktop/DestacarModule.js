import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Box,
  Alert,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

const DestacarModule = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState('15 dias');
  const [impressions, setImpressions] = useState(1023);
  const [campaigns, setCampaigns] = useState([
    { id: 1, name: 'Campanha Janeiro', status: 'Ativa' },
    { id: 2, name: 'Campanha Natal', status: 'Concluída' },
  ]);
  const [newCampaign, setNewCampaign] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChangeTab = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCreateCampaign = () => {
    if (!newCampaign) return;

    const newCampaignData = {
      id: campaigns.length + 1,
      name: newCampaign,
      status: 'Ativa',
    };

    setCampaigns([...campaigns, newCampaignData]);
    setNewCampaign('');
    setSuccessMessage('Campanha criada com sucesso!');
    setTimeout(() => setSuccessMessage(''), 3000); // Limpa a mensagem após 3 segundos
  };

  return (
    <div className="p-4">
      <Paper elevation={3} sx={{ p: 4, maxWidth: 800, margin: '0 auto' }}>
        <Typography variant="h5" gutterBottom>
          Destacar Empresa
        </Typography>
        <Typography variant="body1" gutterBottom>
          Gerencie o destaque da sua empresa na página inicial da plataforma.
        </Typography>

        <Tabs value={activeTab} onChange={handleChangeTab} sx={{ mb: 4 }}>
          <Tab label="Início" />
          <Tab label="Análises" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Tempo Restante
            </Typography>
            <Typography variant="body1">
              O seu destaque na página inicial expira em: <strong>{timeRemaining}</strong>.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 3 }}
              onClick={() => alert('Renovar destaque em breve!')}
            >
              Renovar Destaque
            </Button>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Análises de Destaque
            </Typography>
            <Typography variant="body1" gutterBottom>
              Impressões do destaque: <strong>{impressions}</strong>
            </Typography>

            <Typography variant="h6" sx={{ mt: 3 }} gutterBottom>
              Campanhas Criadas
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Nome</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {campaigns.map((campaign) => (
                    <TableRow key={campaign.id}>
                      <TableCell>{campaign.id}</TableCell>
                      <TableCell>{campaign.name}</TableCell>
                      <TableCell>{campaign.status}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6">Criar Nova Campanha</Typography>
              {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
              <TextField
                label="Nome da Campanha"
                variant="outlined"
                fullWidth
                sx={{ mb: 2 }}
                value={newCampaign}
                onChange={(e) => setNewCampaign(e.target.value)}
              />
              <Button variant="contained" color="primary" onClick={handleCreateCampaign}>
                Criar Campanha
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </div>
  );
};

export default DestacarModule;

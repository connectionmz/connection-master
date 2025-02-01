import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { ref, push, set, onValue, remove } from 'firebase/database';
import { db } from '../../fb';

const DestacarModule = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedOption, setSelectedOption] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  
  const prices = {
    cotacoes: 2500,
    empresas: 2500,
    concursos: 2500,
    home: 4000,
  };

  useEffect(() => {
    if (!user?.id) return;

    const campaignsRef = ref(db, `campanhas/${user.id}`);
    onValue(campaignsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedCampaigns = Object.values(data).map(campaign => ({
          ...campaign,
          remainingDays: calculateRemainingDays(campaign.expireDate)
        }));
        setCampaigns(loadedCampaigns);
      } else {
        setCampaigns([]);
      }
    });
  }, [user?.id]);

  const calculateRemainingDays = (expireDate) => {
    const expiration = new Date(expireDate);
    const now = new Date();
    const difference = expiration - now;
    return Math.max(0, Math.ceil(difference / (1000 * 60 * 60 * 24))); 
  };

  const handleChangeTab = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSelectChange = (event) => {
    setSelectedOption(event.target.value);
  };

  const handleCreateCampaign = async () => {
    if (!selectedOption) return;

    const startDate = new Date();
    const expireDate = new Date(startDate);
    expireDate.setMonth(startDate.getMonth() + 1);
  
    if (expireDate.getDate() !== startDate.getDate()) {
      expireDate.setDate(0);
    }

    const campaignRef = push(ref(db, `campanhas/${user.id}`));
    const campaignId = campaignRef.key;
    
    const toSave = {
      id: campaignId,
      company: {
        id: user.id,
        nome: user.nome,
        logo: user.logoUrl
      },
      component: selectedOption,
      preco: prices[selectedOption],
      status: 'ativo',
      startDate: startDate.toISOString(),
      expireDate: expireDate.toISOString(),
    };

    try {
      await set(campaignRef, toSave);
      alert('Campanha criada com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar campanha:', error);
      alert('Erro ao criar campanha.');
    }
  };

  const handleRemoveCampaign = async (id) => {
    try {
      await remove(ref(db, `campanhas/${user.id}/${id}`));
      alert('Campanha removida com sucesso!');
    } catch (error) {
      console.error('Erro ao remover campanha:', error);
      alert('Erro ao remover campanha.');
    }
  };

  return (
    <Box width="100%" height="100vh">
      <Paper elevation={3} sx={{ p: 4, margin: '0 auto' }}>
        <Typography variant="h5" gutterBottom>
          Destacar Empresa
        </Typography>
        <Typography variant="body1" gutterBottom>
          Gerencie o destaque da sua empresa na plataforma.
        </Typography>

        <Tabs value={activeTab} onChange={handleChangeTab} sx={{ mb: 4 }}>
          <Tab label="Criar Campanha" />
          <Tab label="Destaques" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Criar Campanha
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Opção</InputLabel>
              <Select value={selectedOption} onChange={handleSelectChange}>
                {Object.keys(prices).map((option) => (
                  <MenuItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)} - {prices[option]}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" color="primary" onClick={handleCreateCampaign}>
              Criar Campanha
            </Button>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Destaques Atuais
            </Typography>
            {campaigns.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Nome</TableCell>
                      <TableCell>Componente</TableCell>
                      <TableCell>Preço</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Tempo Restante</TableCell>
                      <TableCell>Ações</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id} onClick={() => alert(`Detalhes da campanha: ${JSON.stringify(campaign, null, 2)}`)} style={{ cursor: 'pointer' }}>
                        <TableCell>{campaign.company.nome}</TableCell>
                        <TableCell>{campaign.component}</TableCell>
                        <TableCell>{campaign.preco}</TableCell>
                        <TableCell>{campaign.status}</TableCell>
                        <TableCell>{campaign.remainingDays} dias</TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            color="secondary"
                            onClick={(e) => {
                              e.stopPropagation(); // Evita acionar o clique na linha
                              handleRemoveCampaign(campaign.id);
                            }}
                          >
                            Remover
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body1">Nenhuma campanha ativa.</Typography>
            )}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default DestacarModule;

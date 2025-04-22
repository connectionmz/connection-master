import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Divider,
  Tabs,
  Tab,
  CircularProgress
} from '@mui/material';
import { ArrowBack, BarChart, ListAlt, People } from '@mui/icons-material';

const VisualizarInquerito = ({ surveyId, onBack }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [surveyData, setSurveyData] = useState(null);
  const [responses, setResponses] = useState([]);

  // Aqui você implementaria a busca dos dados do inquérito e respostas
  // useEffect(() => { ... }, [surveyId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onBack} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          {surveyData?.title || 'Carregando...'}
        </Typography>
      </Box>
      
      <Paper elevation={0} sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Resumo" icon={<ListAlt />} iconPosition="start" />
          <Tab label="Respostas" icon={<People />} iconPosition="start" />
          <Tab label="Análise" icon={<BarChart />} iconPosition="start" />
        </Tabs>
      </Paper>
      
      <Paper elevation={0} sx={{ p: 3 }}>
        {activeTab === 0 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Detalhes do Inquérito</Typography>
            <Typography sx={{ mb: 2 }}>{surveyData?.description}</Typography>
            <Divider sx={{ my: 2 }} />
            <Typography>Setor: {surveyData?.sector}</Typography>
            <Typography>Criado em: {surveyData?.createdAt}</Typography>
          </Box>
        )}
        
        {activeTab === 1 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Respostas Recebidas</Typography>
            {responses.length > 0 ? (
              <Box>
                {/* Lista de respostas */}
              </Box>
            ) : (
              <Typography>Nenhuma resposta recebida ainda.</Typography>
            )}
          </Box>
        )}
        
        {activeTab === 2 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 2 }}>Análise de Respostas</Typography>
            {/* Gráficos e análises */}
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default VisualizarInquerito;
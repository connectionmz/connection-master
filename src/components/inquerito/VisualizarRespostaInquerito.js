import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Divider,
  Tabs,
  Tab,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip
} from '@mui/material';
import { ArrowBack, BarChart, ListAlt, People, CheckCircle, Cancel } from '@mui/icons-material';
import { ref, get } from 'firebase/database';
import { db } from '../../fb'; // Ajuste o caminho conforme necessário

const VisualizarRespostaInquerito = () => {
  // Obter parâmetros da URL
  const { surveyId, companyId } = useParams();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [surveyData, setSurveyData] = useState(null);
  const [companyData, setCompanyData] = useState(null);
  const [responseData, setResponseData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar dados do inquérito
        const surveyRef = ref(db, `surveys/${surveyId}`);
        const surveySnapshot = await get(surveyRef);
        
        // Buscar dados da empresa
        const companyRef = ref(db, `company/${companyId}`);
        const companySnapshot = await get(companyRef);
        
        // Buscar resposta específica
        const responseRef = ref(db, `survey_responses/${surveyId}/${companyId}`);
        const responseSnapshot = await get(responseRef);

        if (surveySnapshot.exists()) {
          setSurveyData(surveySnapshot.val());
        }

        if (companySnapshot.exists()) {
          setCompanyData(companySnapshot.val());
        }

        if (responseSnapshot.exists()) {
          setResponseData(responseSnapshot.val());
        }

      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    if (surveyId && companyId) {
      fetchData();
    }
  }, [surveyId, companyId]);

  const handleBack = () => {
    navigate(-1); // Volta para a página anterior
    // Ou navega para uma rota específica:
    // navigate(`/inqueritos/${surveyId}`);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!surveyData || !companyData) {
    return (
      <Box sx={{ textAlign: 'center', my: 4 }}>
        <Typography variant="h6">Dados não encontrados</Typography>
        <Button onClick={handleBack} variant="outlined" sx={{ mt: 2 }}>
          Voltar
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
            {surveyData.title}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Resposta de: {companyData.nome}
          </Typography>
        </Box>
      </Box>
      
      {/* Restante do componente permanece igual */}
      {/* ... */}
    </Box>
  );
};

export default VisualizarRespostaInquerito;
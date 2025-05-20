import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Button, Alert,
  CircularProgress, Snackbar
} from '@mui/material';
import { db } from "../../fb";
import { ref, set, get } from "firebase/database";
import BackButton from '../BackButton';

const SurveyResponseForm = ({ surveyData, user, surveyId }) => {
  const [response, setResponse] = useState('');
  const [hasResponded, setHasResponded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Verificar se já respondeu
  useEffect(() => {
    const checkResponse = async () => {
      const responseRef = ref(db, `survey_responses/${surveyId}/${user.id}`);
      const snapshot = await get(responseRef);
      if (snapshot.exists()) {
        setHasResponded(true);
        showSnackbar('Você já respondeu este inquérito', 'info');
      }
    };
    checkResponse();
  }, [surveyId, user.id]);

  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleSubmit = async () => {
    if (!response.trim()) {
      showSnackbar('Por favor, insira sua resposta', 'error');
      return;
    }

    setLoading(true);
    try {
      await set(ref(db, `survey_responses/${surveyId}/${user.id}`), {
        company: {
          nome: user.nome,
          id: user.id,
          logo: user.logoUrl || ''
        },
        response,
        submittedAt: Date.now()
      });
      showSnackbar('Resposta enviada com sucesso!', 'success');
      setHasResponded(true);
    } catch (error) {
      console.error("Erro ao enviar:", error);
      showSnackbar('Erro ao enviar resposta', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (hasResponded) {
    return (
      <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
        <BackButton />
        <Paper sx={{ p: 3, textAlign: 'center', mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Obrigado por participar!
          </Typography>
          <Typography sx={{ mb: 3 }}>
            Sua resposta foi registrada com sucesso.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => window.history.back()}
          >
            Voltar
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <BackButton />
      
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="h5" gutterBottom>
          {surveyData.title}
        </Typography>
        
        <Typography variant="body1" paragraph>
          {surveyData.description}
        </Typography>

        <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
          Sua resposta:
        </Typography>
        
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          style={{
            width: '100%',
            minHeight: 150,
            padding: 12,
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: 16,
            marginBottom: 20
          }}
          placeholder="Digite sua resposta aqui..."
        />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Enviar'}
          </Button>
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SurveyResponseForm;
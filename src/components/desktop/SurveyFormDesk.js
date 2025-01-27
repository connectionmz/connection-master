import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, Button, TextField, FormControl, RadioGroup, FormControlLabel, Radio, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { db } from "../../fb";
import { ref, set, get } from "firebase/database";
import { useNavigate } from 'react-router-dom';

const SurveyFormDesk = ({ surveyData, user, surveyId }) => {
  const [responses, setResponses] = useState({});
  const [hasResponded, setHasResponded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); // Controle do diálogo de confirmação
  const [isSubmitting, setIsSubmitting] = useState(false); // Para evitar múltiplos cliques durante a submissão
  const navigate = useNavigate();

  useEffect(() => {
    const responsesRef = ref(db, `survey_responses/${surveyId}/${user.id}`);
    get(responsesRef).then(snapshot => {
      if (snapshot.exists()) {
        setHasResponded(true);
      }
    });
  }, [user.id, surveyId]);

  const handleChange = useCallback((questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  }, []);

  const handleSubmit = async () => {
    if (loading || isSubmitting) return;

    setLoading(true);
    setError(null);

    try {
      const surveyRef = ref(db, `survey_responses/${surveyId}/${user.id}`);
      await set(surveyRef, {
        company: {
          nome: user.nome,
          logo: user.logoUrl,
          provincia: user.provincia,
          id: user.id
        },
        surveyId: surveyId,
        responses: responses,
        submittedAt: Date.now(),
      });

      alert("Respostas enviadas com sucesso!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Erro ao salvar as respostas:", err);
      setError("Ocorreu um erro ao enviar suas respostas. Tente novamente.");
    } finally {
      setLoading(false);
      setIsSubmitting(false); // Permitir novo envio
    }
  };

  const handleOpenConfirmDialog = () => {
    setOpenConfirmDialog(true); // Abre o diálogo de confirmação
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false); // Fecha o diálogo de confirmação
  };

  const handleConfirmSubmit = () => {
    setIsSubmitting(true); // Bloqueia envio múltiplo enquanto está processando
    handleSubmit(); // Chama a função de envio
    setOpenConfirmDialog(false); // Fecha o diálogo após confirmação
  };

  const renderQuestions = useCallback(() => {
    return surveyData.questions.map((question, index) => {
      switch (question.tipo) {
        case "aberta":
          return (
            <Box key={index} sx={{ marginBottom: 2 }}>
              <Typography variant="body1">{question.texto}</Typography>
              <TextField
                fullWidth
                variant="outlined"
                multiline
                rows={4}
                onChange={(e) => handleChange(question.texto, e.target.value)}
                value={responses[question.texto] || ""}
              />
            </Box>
          );
        
        case "multipla_escolha":
          return (
            <Box key={index} sx={{ marginBottom: 2 }}>
              <Typography variant="body1">{question.texto}</Typography>
              <FormControl fullWidth>
                <RadioGroup
                  value={responses[question.texto] || ""}
                  onChange={(e) => handleChange(question.texto, e.target.value)}
                >
                  {question.opcoes.map((option, idx) => (
                    <FormControlLabel
                      key={idx}
                      value={option}
                      control={<Radio />}
                      label={option}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Box>
          );
        
        default:
          return null;
      }
    });
  }, [surveyData.questions, responses, handleChange]);

  if (hasResponded) {
    return (
      <Box sx={{ padding: 3 }}>
        <Paper sx={{ padding: 3 }}>
          <Typography variant="h5">
            Você já respondeu a este inquérito.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Paper sx={{ padding: 3 }}>
        <Typography variant="h5" sx={{ marginBottom: 2 }}>
          {surveyData.title}
        </Typography>
        <Typography variant="body1" sx={{ marginBottom: 2 }}>
          {surveyData.description}
        </Typography>

        {renderQuestions()}

        {error && (
          <Typography color="error" sx={{ marginBottom: 2 }}>
            {error}
          </Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenConfirmDialog} // Abre o diálogo de confirmação
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Enviar Respostas"}
          </Button>
        </Box>
      </Paper>

      {/* Dialog de confirmação */}
      <Dialog
        open={openConfirmDialog}
        onClose={handleCloseConfirmDialog}
      >
        <DialogTitle>Confirmar Envio</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza de que deseja enviar suas respostas? Após o envio, não será possível editar.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog} color="primary">
            Cancelar
          </Button>
          <Button onClick={handleConfirmSubmit} color="primary">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SurveyFormDesk;

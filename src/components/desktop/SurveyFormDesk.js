import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, Typography, Button, TextField, FormControl, RadioGroup, FormControlLabel, Radio, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { db } from "../../fb";
import { ref, set, get, push } from "firebase/database";
import { useNavigate } from 'react-router-dom';
import BackButton from '../BackButton';

const SurveyFormDesk = ({ surveyData, user, surveyId }) => {
  const [responses, setResponses] = useState({});
  const [hasResponded, setHasResponded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const sendNotificationToSurveyCreator = async () => {
    if (!surveyData?.company?.id) return;
    
    const notification = {
      type: "survey_response",
      message: `A empresa ${user.nome} respondeu ao seu inquérito "${surveyData.title}"`,
      fromUserId: user.id,
      fromUserName: user.nome,
      link: `https://app.connectionmozambique.com/perfil/${user.id}`,
      timestamp: new Date().toISOString(),
      status: "unread",
      surveyId: surveyId,
      surveyTitle: surveyData.title
    };

    try {
      const notificationsRef = ref(db, `notifications/${surveyData.company.id}`);
      await push(notificationsRef, notification);
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
    }
  };

  const handleSubmit = async () => {
    if (loading || isSubmitting) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Salvar as respostas
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

      // 2. Enviar notificação para o criador do inquérito
      await sendNotificationToSurveyCreator();

      alert("Respostas enviadas com sucesso!");
      navigate("/dashboard");
    } catch (err) {
      console.error("Erro ao salvar as respostas:", err);
      setError("Ocorreu um erro ao enviar suas respostas. Tente novamente.");
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  const handleOpenConfirmDialog = () => {
    setOpenConfirmDialog(true);
  };

  const handleCloseConfirmDialog = () => {
    setOpenConfirmDialog(false);
  };

  const handleConfirmSubmit = () => {
    setIsSubmitting(true);
    handleSubmit();
    setOpenConfirmDialog(false);
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
      <Box width="100%" height="100vh"> 
        <Paper sx={{ padding: 3 }}>
          <BackButton sx={{ mb: 2 }} />
          <Typography variant="h5">
            Você já respondeu a este inquérito.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box width="100%" height="100vh">    
      <Paper sx={{ padding: 3 }}>
        <BackButton sx={{ mb: 2 }} />

        <Typography variant="h5" sx={{ marginBottom: 2 }}>
          <a href={`/perfil/${surveyData.company.id}`}>{surveyData.company.nome}</a><br/>
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
            onClick={handleOpenConfirmDialog}
            disabled={loading || isSubmitting}
          >
            {loading || isSubmitting ? <CircularProgress size={24} color="inherit" /> : "Enviar Respostas"}
          </Button>
        </Box>
      </Paper>

      <Dialog open={openConfirmDialog} onClose={handleCloseConfirmDialog}>
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
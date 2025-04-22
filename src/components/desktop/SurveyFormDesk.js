import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Paper, Typography, Button, FormControl, RadioGroup,
  FormControlLabel, Radio, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle
} from '@mui/material';
import { db } from "../../fb";
import { ref, set, get, push } from "firebase/database";
import { useNavigate } from 'react-router-dom';
import BackButton from '../BackButton';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const SurveyFormDesk = ({ surveyData, user, surveyId, isMobile, isTablet }) => {
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
      link: `inquerito/${surveyId}`,
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
            <Box key={index} sx={{ marginBottom: 4 }}>
              <Typography variant="body1" sx={{ marginBottom: 1 }}>
                {question.texto}
              </Typography>
              <ReactQuill
                theme="snow"
                value={responses[question.texto] || ""}
                onChange={(val) => handleChange(question.texto, val)}
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['link']
                  ]
                }}
                formats={['bold', 'italic', 'underline', 'list', 'bullet', 'link']}
                style={{ 
                  height: isMobile ? '150px' : '200px',
                  marginBottom: isMobile ? '20px' : '40px'
                }}
              />
            </Box>
          );

        case "multipla_escolha":
          return (
            <Box key={index} sx={{ marginBottom: 4 }}>
              <Typography variant="body1" sx={{ marginBottom: 1 }}>
                {question.texto}
              </Typography>
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
  }, [surveyData.questions, responses, handleChange, isMobile]);

  if (hasResponded) {
    return (
      <Box sx={{ width: '100%', flex: 1 }}>
        <Paper sx={{ 
          padding: isMobile ? 2 : 3,
          marginBottom: 4
        }}>
          <BackButton sx={{ mb: 2 }} />
          <Typography variant="h5">
            Você já respondeu a este inquérito.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%',
      flex: 1,
      minHeight: isMobile ? 'auto' : 'calc(100vh - 200px)'
    }}>
      <Paper sx={{ 
        padding: isMobile ? 2 : 3,
        marginBottom: 4
      }}>
        <BackButton sx={{ mb: 2 }} />

        <Typography variant="h5" color='primary' sx={{ marginBottom: 2 }}>
          <a href={`/perfil/${surveyData.company.id}`}>{surveyData.company.nome}</a>
        </Typography>
        
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

        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginTop: 3,
          marginBottom: 2
        }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenConfirmDialog}
            disabled={loading || isSubmitting}
            size={isMobile ? 'medium' : 'large'}
          >
            {loading || isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : "Enviar Respostas"}
          </Button>
        </Box>
      </Paper>

      <Dialog 
        open={openConfirmDialog} 
        onClose={handleCloseConfirmDialog}
        fullScreen={isMobile}
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
          <Button onClick={handleConfirmSubmit} color="primary" autoFocus>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SurveyFormDesk;
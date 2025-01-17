import React, { useState, useEffect } from 'react';
import { Box, Paper, Typography, Button, TextField, FormControl, FormLabel, RadioGroup, FormControlLabel, Radio } from '@mui/material';
import { db } from "../../fb";
import { ref, set, get, child } from "firebase/database";
import { useNavigate } from 'react-router-dom';

const SurveyFormDesk = ({ surveyData, user, surveyId }) => {

  console.log(surveyId);

  const [responses, setResponses] = useState({});
  const [hasResponded, setHasResponded] = useState(false); // Estado para verificar se o usuário já respondeu
  const navigate = useNavigate();

  useEffect(() => {
    // Verifica se o usuário já respondeu ao inquérito
    const responsesRef = ref(db, `survey_responses/${surveyId}/${user.id}`); // Caminho correto com surveyId e userId
    get(responsesRef).then(snapshot => {
      if (snapshot.exists()) {
        setHasResponded(true); // Se já existe uma resposta do usuário, marcamos que ele já respondeu
      }
    });
  }, [user.id, surveyId]); // A consulta será feita sempre que o ID do usuário ou surveyId mudar

  // Função para lidar com as mudanças nas respostas
  const handleChange = (questionId, value) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  // Função para lidar com a submissão do formulário
  const handleSubmit = () => {
    const surveyRef = ref(db, `survey_responses/${surveyId}/${user.id}`); // Salvar as respostas no caminho correto

    // Salva as respostas no Firebase, associadas ao ID do usuário e do inquérito
    set(surveyRef, {
     company: {
        nome: user.nome,
        logo:user.logoUrl,
        provincia:user.provincia, 
        id:user.id
      },  // Armazenando o ID do usuário
      surveyId: surveyId,  // Usando a estrutura correta do inquérito
      responses: responses,
      submittedAt: Date.now(),
    })
      .then(() => {
        // Redireciona o usuário para uma página de confirmação ou sucesso
        alert("Respostas enviadas com sucesso!");
        navigate("/dashboard");
      })
      .catch((error) => {
        console.error("Erro ao salvar as respostas:", error);
      });
  };

  // Renderiza as perguntas do inquérito com base nos dados
  const renderQuestions = () => {
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
  };

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

        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 3 }}>
          <Button variant="contained" color="primary" onClick={handleSubmit}>
            Enviar Respostas
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default SurveyFormDesk;

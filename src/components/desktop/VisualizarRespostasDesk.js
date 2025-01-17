import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../fb';
import { Box, Typography, CircularProgress, List, ListItem, ListItemText, Paper } from '@mui/material';

const VisualizarRespostasDesk = ({ surveyId }) => {
  const [responses, setResponses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const responsesRef = ref(db, `survey_responses/${surveyId}`);
    onValue(responsesRef, (snapshot) => {
      const data = snapshot.val();
      const responseList = data
        ? Object.entries(data).map(([userId, userResponses]) => ({
            userId,
            ...userResponses,
          }))
        : [];
      setResponses(responseList);
      setLoading(false);
    });
  }, [surveyId]);

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', marginBottom: 3 }}>
        Respostas do Inquérito
      </Typography>
      {loading ? (
        <CircularProgress />
      ) : responses.length === 0 ? (
        <Typography variant="body1" color="textSecondary">
          Nenhuma resposta registrada para este inquérito.
        </Typography>
      ) : (
        <List>
          {responses.map((response, index) => (
            <Paper key={index} sx={{ padding: 2, marginBottom: 2 }}>
              <Typography variant="h6" sx={{ marginBottom: 1 }}>
                Usuário: {response.userId}
              </Typography>
              {Object.entries(response.responses).map(([question, answer], idx) => (
                <ListItem key={idx} sx={{ padding: 1 }}>
                  <ListItemText
                    primary={`Pergunta: ${question}`}
                    secondary={`Resposta: ${answer}`}
                  />
                </ListItem>
              ))}
            </Paper>
          ))}
        </List>
      )}
    </Box>
  );
};

export default VisualizarRespostasDesk;

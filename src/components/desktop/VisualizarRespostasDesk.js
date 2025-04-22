import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../fb';
import {
  Box,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  CircularProgress,
  Button,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { ArrowBack, ExpandMore, Business, CalendarToday } from '@mui/icons-material';

const VisualizarRespostasDesk = ({ surveyId, onBack }) => {
  const [respostas, setRespostas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedResponse, setExpandedResponse] = useState(null);

  useEffect(() => {
    const respostasRef = ref(db, `survey_responses/${surveyId}`);
    setLoading(true);
    
    onValue(respostasRef, (snapshot) => {
      const data = snapshot.val();
      
      if (data) {
        // Transformar o objeto de respostas em array e ordenar por data
        const respostasArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value
        })).sort((a, b) => b.submittedAt - a.submittedAt);
        
        setRespostas(respostasArray);
      } else {
        setRespostas([]);
      }
      
      setLoading(false);
    });
  }, [surveyId]);

  const handleExpandResponse = (responseId) => {
    setExpandedResponse(expandedResponse === responseId ? null : responseId);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Data não disponível';
    const date = new Date(timestamp);
    return date.toLocaleDateString('pt-MZ', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (respostas.length === 0) {
    return (
      <Paper sx={{ p: 3, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <IconButton onClick={onBack} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5">Respostas ao Inquérito</Typography>
        </Box>
        
        <Typography variant="body1" sx={{ mt: 2, textAlign: 'center' }}>
          Nenhuma resposta encontrada para este inquérito.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={onBack} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5">Respostas ao Inquérito</Typography>
        <Chip 
          label={`${respostas.length} resposta${respostas.length !== 1 ? 's' : ''}`} 
          color="primary" 
          sx={{ ml: 2 }} 
        />
      </Box>

      <List sx={{ width: '100%' }}>
        {respostas.map((resposta) => (
          <Accordion 
            key={resposta.id}
            expanded={expandedResponse === resposta.id}
            onChange={() => handleExpandResponse(resposta.id)}
            elevation={2}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMore />}>
              <ListItem sx={{ p: 0 }}>
                <ListItemAvatar>
                  <Avatar 
                    src={resposta.company?.logo} 
                    alt={resposta.company?.nome}
                  >
                    {!resposta.company?.logo && <Business />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={resposta.company?.nome || 'Empresa não identificada'}
                  secondary={
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                      <CalendarToday fontSize="small" sx={{ mr: 0.5 }} />
                      <Typography variant="caption">
                        {formatDate(resposta.submittedAt)}
                      </Typography>
                      {resposta.company?.provincia && (
                        <Chip 
                          label={resposta.company.provincia} 
                          size="small" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </Box>
                  }
                />
              </ListItem>
            </AccordionSummary>
            
            <AccordionDetails>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Pergunta</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Resposta</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(resposta.responses || {}).map(([pergunta, respostaTexto]) => (
                      <TableRow key={pergunta}>
                        <TableCell>{pergunta}</TableCell>
                        <TableCell>
                          {typeof respostaTexto === 'string' && respostaTexto.startsWith('<p>') ? (
                            <div dangerouslySetInnerHTML={{ __html: respostaTexto }} />
                          ) : (
                            respostaTexto
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </AccordionDetails>
          </Accordion>
        ))}
      </List>
    </Paper>
  );
};

export default VisualizarRespostasDesk;
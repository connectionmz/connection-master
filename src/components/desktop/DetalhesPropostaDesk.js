import React, { useEffect, useState } from 'react';
import {
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Alert,
  Grid,
  Box,
  useMediaQuery,
} from '@mui/material';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../../fb';
import BackButton from '../BackButton';
import { saveContentToInbox } from '../SaveToInbox';
import { useParams } from 'react-router-dom';

const DetalhesPropostaDesk = ({ user }) => {
  const { id, propostaId } = useParams();
  const [proposta, setProposta] = useState(null);
  const [nota, setNota] = useState('');
  const [confirmAccept, setConfirmAccept] = useState(false);
  const [message, setMessage] = useState({ open: false, text: '', type: 'success' });
  const [notaEnviada, setNotaEnviada] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)'); // Detecta dispositivos móveis

  useEffect(() => {
    const propostaRef = ref(db, `cotacoes/${id}/proposals/${propostaId}`);

    onValue(propostaRef, (snapshot) => {
      setProposta(snapshot.val());
    });
  }, [id, propostaId]);

  const handleEditNota = () => {
    setNotaEnviada(false); // Permite editar a nota
  };

  const handleStatusUpdate = (status) => {
    const propostaRef = ref(db, `cotacoes/${id}/proposals/${propostaId}`);
    update(propostaRef, { status })
      .then(() => {
        setMessage({ open: true, text: `Proposta ${status} com sucesso!`, type: 'success' });

        if (status === 'Aceite') {
          const notification = {
            type: 'cotation_reply',
            message: `${user.nome} Sua Proposta foi aceita`,
            fromUserId: user.id,
            fromUserName: user.nome,
            timestamp: new Date().toISOString(),
            status: 'unread',
            url: `/cotacao/${id}/proposta/${propostaId}`,
          };
          saveContentToInbox(proposta.from.id, notification);
        }
      })
      .catch(() => {
        setMessage({ open: true, text: 'Erro ao atualizar status.', type: 'error' });
      });
  };

  const handleNotaChange = (event) => {
    setNota(event.target.value);
  };

  const handleNotaSubmit = () => {
    if (!nota.trim()) {
      setMessage({ open: true, text: 'A nota não pode estar vazia.', type: 'error' });
      return;
    }

    const propostaRef = ref(db, `cotacoes/${id}/proposals/${propostaId}`);
    update(propostaRef, { nota })
      .then(() => {
        setMessage({ open: true, text: 'Nota enviada com sucesso!', type: 'success' });
        setNota('');
        setNotaEnviada(true); // Marca a nota como enviada
      })
      .catch(() => {
        setMessage({ open: true, text: 'Erro ao enviar nota.', type: 'error' });
      });
  };

  const handleAccept = () => {
    setConfirmAccept(true);
  };

  const handleConfirmAccept = () => {
    handleStatusUpdate('Aceite');
    setConfirmAccept(false);
  };

  const handleCancelApproval = () => {
    handleStatusUpdate('Pendente');
  };

  if (!proposta) return <Typography>Carregando detalhes da proposta...</Typography>;

  return (
    <Paper
      sx={{
        width: '100%',
        maxWidth: isMobile ? '100%' : '800px', // Ajusta largura máxima para mobile
        margin: '0 auto',
        padding: isMobile ? 2 : 3,
        boxSizing: 'border-box',
      }}
    >
      <BackButton sx={{ mb: 2 }} />
      <Typography
        variant="h5"
        align="center"
        gutterBottom
        sx={{
          fontSize: isMobile ? '1.5rem' : '2rem', // Ajusta tamanho da fonte para mobile
          fontWeight: 'bold',
        }}
      >
        Detalhes da Proposta
      </Typography>

      {/* Informações da Empresa */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Empresa: {proposta.from.nome}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
          Contacto: {proposta.from.contacto}
        </Typography>

        {/* Conteúdo da Proposta */}
        <div
          dangerouslySetInnerHTML={{ __html: proposta.proposal }}
          sx={{
            fontSize: isMobile ? '0.875rem' : '1rem', // Ajusta tamanho da fonte para mobile
            mb: 2,
          }}
        />
        {proposta.fileUrl && (
          <Button
            href={proposta.fileUrl}
            target="_blank"
            sx={{
              textDecoration: 'underline',
              color: 'primary.main',
              display: 'block',
              textAlign: 'center',
              mb: 2,
            }}
          >
            Baixar Arquivo
          </Button>
        )}

        {/* Status da Proposta */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mt: 2,
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor:
                proposta.status === 'Aceite'
                  ? 'success.main'
                  : proposta.status === 'Recusada'
                  ? 'error.main'
                  : 'gray',
              mr: 1,
            }}
          />
          <Typography variant="body2">
            {proposta.status || 'Pendente'}
          </Typography>
        </Box>
      </Box>

      {/* Produtos/Serviços */}
      <Grid container spacing={3} sx={{ mt: 4 }}>
        <Grid item xs={12}>
          <Typography
            variant="h6"
            align="center"
            sx={{
              fontSize: isMobile ? '1rem' : '1.25rem', // Ajusta tamanho da fonte para mobile
              mb: 2,
            }}
          >
            Produtos/Serviços:
          </Typography>
          {proposta.selectedProducts && proposta.selectedProducts.length > 0 ? (
            <TableContainer
              component={Paper}
              sx={{
                maxHeight: isMobile ? 300 : 400, // Altura máxima da tabela para mobile
                overflowY: 'auto',
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Preço (MT)</TableCell>
                    <TableCell>Ação</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proposta.selectedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.price}</TableCell>
                      <TableCell>
                        <Button
                          href={product.url}
                          target="_blank"
                          sx={{
                            textDecoration: 'underline',
                            color: 'primary.main',
                            fontSize: isMobile ? '0.875rem' : '1rem', // Ajusta tamanho da fonte para mobile
                          }}
                        >
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography variant="body2" align="center" sx={{ color: 'text.secondary', mt: 2 }}>
              Nenhum produto selecionado.
            </Typography>
          )}
        </Grid>

        {/* Botões de Ação */}
        <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'center' }}>
          {proposta.status === 'Aceite' ? (
            <Button
              onClick={handleCancelApproval}
              variant="contained"
              color="warning"
              fullWidth={!isMobile} // Ocupa toda a largura em mobile
              sx={{
                px: isMobile ? 2 : 4, // Ajusta padding horizontal para mobile
                py: isMobile ? 1 : 2, // Ajusta padding vertical para mobile
                mb: 2,
              }}
            >
              Cancelar Aprovação
            </Button>
          ) : (
            <Button
              onClick={handleAccept}
              variant="contained"
              color="success"
              fullWidth={!isMobile} // Ocupa toda a largura em mobile
              sx={{
                px: isMobile ? 2 : 4, // Ajusta padding horizontal para mobile
                py: isMobile ? 1 : 2, // Ajusta padding vertical para mobile
                mb: 2,
              }}
            >
              Aprovar
            </Button>
          )}
        </Grid>
        <Grid item xs={12} sm={6} sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={() => handleStatusUpdate('Recusada')}
            variant="contained"
            color="error"
            fullWidth={!isMobile} // Ocupa toda a largura em mobile
            sx={{
              px: isMobile ? 2 : 4, // Ajusta padding horizontal para mobile
              py: isMobile ? 1 : 2, // Ajusta padding vertical para mobile
              mb: 2,
            }}
          >
            Recusar
          </Button>
        </Grid>

        {/* Nota */}
        <Grid item xs={12}>
          {notaEnviada ? (
            <>
              <Typography
                variant="body1"
                align="center"
                sx={{
                  fontSize: isMobile ? '0.875rem' : '1rem', // Ajusta tamanho da fonte para mobile
                  mb: 2,
                }}
              >
                Nota enviada: {nota}
              </Typography>
              <Button
                onClick={handleEditNota}
                variant="outlined"
                color="primary"
                fullWidth={!isMobile} // Ocupa toda a largura em mobile
                sx={{
                  px: isMobile ? 2 : 4, // Ajusta padding horizontal para mobile
                  py: isMobile ? 1 : 2, // Ajusta padding vertical para mobile
                }}
              >
                Editar Nota
              </Button>
            </>
          ) : (
            <>
              <TextField
                value={nota}
                onChange={handleNotaChange}
                label="Adicionar uma nota"
                multiline
                rows={isMobile ? 3 : 4} // Ajusta número de linhas para mobile
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Button
                onClick={handleNotaSubmit}
                variant="contained"
                color="primary"
                fullWidth={!isMobile} // Ocupa toda a largura em mobile
                sx={{
                  px: isMobile ? 2 : 4, // Ajusta padding horizontal para mobile
                  py: isMobile ? 1 : 2, // Ajusta padding vertical para mobile
                }}
              >
                Enviar Nota
              </Button>
            </>
          )}
        </Grid>
      </Grid>

      {/* Snackbar para mensagens */}
      <Snackbar
        open={message.open}
        autoHideDuration={4000}
        onClose={() => setMessage({ ...message, open: false })}
      >
        <Alert
          onClose={() => setMessage({ ...message, open: false })}
          severity={message.type}
          sx={{
            fontSize: isMobile ? '0.875rem' : '1rem', // Ajusta tamanho da fonte para mobile
          }}
        >
          {message.text}
        </Alert>
      </Snackbar>

      {/* Diálogo de Confirmação */}
      <Dialog open={confirmAccept} onClose={() => setConfirmAccept(false)}>
        <DialogTitle>Confirmação</DialogTitle>
        <DialogContent>
          <Typography
            sx={{
              fontSize: isMobile ? '0.875rem' : '1rem', // Ajusta tamanho da fonte para mobile
            }}
          >
            Tem certeza que deseja aceitar esta proposta?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleConfirmAccept}
            color="success"
            sx={{
              px: isMobile ? 2 : 4, // Ajusta padding horizontal para mobile
              py: isMobile ? 1 : 2, // Ajusta padding vertical para mobile
            }}
          >
            Sim
          </Button>
          <Button
            onClick={() => setConfirmAccept(false)}
            color="error"
            sx={{
              px: isMobile ? 2 : 4, // Ajusta padding horizontal para mobile
              py: isMobile ? 1 : 2, // Ajusta padding vertical para mobile
            }}
          >
            Não
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DetalhesPropostaDesk;
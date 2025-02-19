import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../../fb';
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
import BackButton from '../BackButton';
import { saveContentToInbox } from '../SaveToInbox';

const DetalhesPropostaDesk = ({ user }) => {
  const { id, propostaId } = useParams();
  const [proposta, setProposta] = useState(null);
  const [nota, setNota] = useState('');
  const [confirmAccept, setConfirmAccept] = useState(false);
  const [message, setMessage] = useState({ open: false, text: '', type: 'success' });
  const [notaEnviada, setNotaEnviada] = useState(false);

  // Verificar se é um dispositivo móvel
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const propostaRef = ref(db, `cotacoes/${id}/proposals/${propostaId}`);

    onValue(propostaRef, (snapshot) => {
      setProposta(snapshot.val());
    });
  }, [id, propostaId]);

  // Função para editar a nota
  const handleEditNota = () => {
    setNotaEnviada(false); // Permite editar a nota
  };

  const handleStatusUpdate = (status) => {
    const propostaRef = ref(db, `cotacoes/${id}/proposals/${propostaId}`);
    update(propostaRef, { status })
      .then(() => {
        setMessage({ open: true, text: `Proposta ${status} com sucesso!`, type: 'success' });

        const notification = {
          type: 'cotation_reply',
          message: `${user.nome} Sua Proposta foi aceite`,
          fromUserId: user.id,
          fromUserName: user.nome,
          timestamp: new Date().toISOString(),
          status: 'unread',
          url: `/cotacao/${id}/proposta/${propostaId}`,
        };
        saveContentToInbox(proposta.from.id, notification);
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
        margin: 'auto',
        padding: isMobile ? 2 : 3,
      }}
    >
      <BackButton sx={{ mb: 2 }} />
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        Detalhes da Proposta
      </Typography>

      <Typography variant="h6" sx={{ marginBottom: 1 }}>
        Empresa: {proposta.from.nome}
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: 2 }}>
        Contacto: {proposta.from.contacto}
      </Typography>

      <div
        className="text-gray-600 mb-2"
        dangerouslySetInnerHTML={{ __html: proposta.proposal }}
      />
      {proposta.fileUrl && (
        <Button
          href={proposta.fileUrl}
          target="_blank"
          sx={{
            textDecoration: 'underline',
            color: 'blue',
            mb: 2,
            display: 'block',
          }}
        >
          Baixar Arquivo
        </Button>
      )}

      <Typography
        variant="body2"
        sx={{
          display: 'flex',
          alignItems: 'center',
          marginTop: 2,
        }}
      >
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor:
              proposta.status === 'Aceite'
                ? 'green'
                : proposta.status === 'Recusada'
                ? 'red'
                : 'gray',
            marginRight: 1,
          }}
        />
        <span>{proposta.status || 'Pendente'}</span>
      </Typography>

      <Grid  spacing={3} sx={{ marginTop: 4 }}>
        <Grid item xs={12}>
          <Typography variant="h6">Produtos/Serviços:</Typography>
          {proposta.selectedProducts && proposta.selectedProducts.length > 0 ? (
            <TableContainer
              component={Paper}
              sx={{ maxHeight: isMobile ? 300 : 400, overflowY: 'auto' }}
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
                            color: 'blue',
                            display: 'block',
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
            <Typography variant="body2" sx={{ color: 'gray' }}>
              Nenhum produto selecionado.
            </Typography>
          )}
        </Grid>

        <Grid item xs={12} sm={6}>
          <Button
            onClick={handleAccept}
            variant="contained"
            color="success"
            fullWidth
            disabled={proposta.status === 'Aceite'}
            sx={{ marginBottom: 2 }}
          >
            Aprovar
          </Button>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            onClick={() => handleStatusUpdate('Recusada')}
            variant="contained"
            color="error"
            fullWidth
            sx={{ marginBottom: 2 }}
          >
            Recusar
          </Button>
        </Grid>
        <Grid item xs={12}>
          {notaEnviada ? (
            <>
              <Typography variant="body1" sx={{ marginBottom: 2 }}>
                Nota enviada: {nota}
              </Typography>
              <Button
                onClick={handleEditNota}
                variant="outlined"
                color="primary"
                fullWidth
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
                rows={isMobile ? 3 : 4}
                fullWidth
                variant="outlined"
                sx={{ marginBottom: 2 }}
              />
              <Button
                onClick={handleNotaSubmit}
                variant="contained"
                color="primary"
                fullWidth
              >
                Enviar Nota
              </Button>
            </>
          )}
        </Grid>
      </Grid>

      {/* Snackbar para exibir mensagens */}
      <Snackbar
        open={message.open}
        autoHideDuration={4000}
        onClose={() => setMessage({ ...message, open: false })}
      >
        <Alert
          onClose={() => setMessage({ ...message, open: false })}
          severity={message.type}
        >
          {message.text}
        </Alert>
      </Snackbar>

      <Dialog open={confirmAccept} onClose={() => setConfirmAccept(false)}>
        <DialogTitle>Confirmação</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja aceitar esta proposta?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmAccept} color="success">
            Sim
          </Button>
          <Button onClick={() => setConfirmAccept(false)} color="error">
            Não
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DetalhesPropostaDesk;
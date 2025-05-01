import React, { useEffect, useState, useCallback } from 'react';
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
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  CircularProgress
} from '@mui/material';
import { ref, onValue, update, get } from 'firebase/database';
import { db } from '../../fb';
import BackButton from '../BackButton';
import { saveContentToInbox } from '../SaveToInbox';
import { useParams } from 'react-router-dom';
import {
  CheckCircle,
  Cancel,
  Edit,
  Send,
  Business,
  Phone,
  Description,
  AttachFile,
  ArrowBack
} from '@mui/icons-material';
import sendEmail from '../sms/SendMail';

const DetalhesPropostaDesk = ({ user }) => {
  // Constants and state
  const { id, propostaId } = useParams();
  const [proposta, setProposta] = useState(null);
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ open: false, text: '', type: 'success' });
  const [notaEnviada, setNotaEnviada] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    onConfirm: () => {}
  });

  const isMobile = useMediaQuery('(max-width:600px)');
  const customUrl = 'app.connectionmozambique.com/';

  // Status colors mapping
  const statusColors = {
    'Aceite': 'success',
    'Recusada': 'error',
    'Pendente': 'warning'
  };

  // Fetch proposal data
  useEffect(() => {
    const propostaRef = ref(db, `cotacoes/${id}/proposals/${propostaId}`);
    const unsubscribe = onValue(propostaRef, (snapshot) => {
      if (snapshot.exists()) {
        setProposta(snapshot.val());
        setNota(snapshot.val().nota || '');
        setNotaEnviada(!!snapshot.val().nota);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, propostaId]);

  // Helper functions
  const showMessage = (text, type = 'success') => {
    setMessage({ open: true, text, type });
  };

  const handleError = (error, defaultMessage) => {
    console.error(error);
    showMessage(defaultMessage, 'error');
  };

  // Proposal status handlers
  const updateProposalStatus = async (status) => {
    try {
      const updates = { 
        status,
        [`${status === 'Aceite' ? 'acceptedAt' : 'rejectedAt'}`]: new Date().toISOString()
      };
      
      await update(ref(db, `cotacoes/${id}/proposals/${propostaId}`), updates);
      showMessage(`Proposta ${status} com sucesso!`, 'success');
      return true;
    } catch (error) {
      handleError(error, 'Erro ao atualizar status da proposta');
      return false;
    }
  };

  const sendNotification = async (recipientId, messageText, isAccepted = false) => {
    try {
      const notification = {
        type: 'cotation_reply',
        message: messageText,
        fromUserId: user.id,
        fromUserName: user.nome,
        timestamp: new Date().toISOString(),
        status: 'unread',
        link: `minha_proposta/cotacao/${id}/proposta/${propostaId}`,
      };
      await saveContentToInbox(recipientId, notification);
    } catch (error) {
      handleError(error, 'Erro ao enviar notificação');
    }
  };

  const sendEmailNotification = async (email, subject, messageText) => {
    try {
      const fullUrl = `https://${customUrl}cotacao/${id}/proposta/${propostaId}`;
      const emailContent = `
        Olá,

        ${messageText}

        Você pode visualizar os detalhes acessando: ${fullUrl}

        ${subject.includes('aceita') ? 
          'Por favor, entre em contato com o comprador para os próximos passos.' : 
          'Agradecemos seu interesse e esperamos contar com você em futuras cotações.'
        }

        Atenciosamente,
        Equipe Connection Mozambique
      `;
      
      await sendEmail({
        to: email,
        subject,
        text: emailContent
      });
    } catch (error) {
      handleError(error, 'Erro ao enviar e-mail de notificação');
    }
  };

  const rejectOtherProposals = async (acceptedProposalId) => {
    try {
      const proposalsRef = ref(db, `cotacoes/${id}/proposals`);
      const snapshot = await get(proposalsRef);
      
      if (!snapshot.exists()) return false;

      const updates = {};
      const proposals = snapshot.val();
      const notificationPromises = [];
      
      Object.keys(proposals).forEach(proposalId => {
        if (proposalId !== acceptedProposalId) {
          updates[`${proposalId}/status`] = 'Recusada';
          updates[`${proposalId}/rejectedAt`] = new Date().toISOString();
          
          const proposal = proposals[proposalId];
          if (proposal.from?.id) {
            notificationPromises.push(
              sendNotification(
                proposal.from.id,
                `Sua proposta para a cotação foi recusada por ${user.nome}`
              )
            );
          }
          
          if (proposal.from?.email) {
            notificationPromises.push(
              sendEmailNotification(
                proposal.from.email,
                `Sua proposta foi recusada - Cotação #${id.slice(0, 8)}`,
                `Infelizmente sua proposta para a cotação foi recusada por ${user.nome}.`
              )
            );
          }
        }
      });
      
      await update(proposalsRef, updates);
      await Promise.all(notificationPromises);
      return true;
    } catch (error) {
      handleError(error, 'Erro ao recusar outras propostas');
      return false;
    }
  };

  const handleAcceptProposal = async () => {
    try {
      // 1. Update accepted proposal
      const success = await updateProposalStatus('Aceite');
      if (!success) return;

      // 2. Reject other proposals
      await rejectOtherProposals(propostaId);

      // 3. Send acceptance notifications
      await Promise.all([
        sendNotification(
          proposta.from.id,
          `Sua proposta foi aceita por ${user.nome}`
        ),
        proposta.from?.email && sendEmailNotification(
          proposta.from.email,
          `Sua proposta foi aceita - Cotação #${id.slice(0, 8)}`,
          `Parabéns! Sua proposta para a cotação foi aceita por ${user.nome}.`
        )
      ]);
    } catch (error) {
      handleError(error, 'Erro ao processar a aceitação');
    }
  };
  const handleRejectProposal = async () => {
    try {
      await updateProposalStatus('Recusada');
      await sendNotification(
        proposta.from.id,
        `Sua proposta foi recusada por ${user.nome}`
      );
    } catch (error) {
      handleError(error, 'Erro ao recusar proposta');
    }
  };
  const handleCancelApproval = async () => {
    try {
      await updateProposalStatus('Pendente');
    } catch (error) {
      handleError(error, 'Erro ao cancelar aprovação');
    }
  };
  // Note handlers
  const handleNotaSubmit = async () => {
    if (!nota.trim()) {
      showMessage('A nota não pode estar vazia.', 'error');
      return;
    }
    try {
      await update(ref(db, `cotacoes/${id}/proposals/${propostaId}`), { nota });
      showMessage('Nota enviada com sucesso!');
      setNotaEnviada(true);
    } catch (error) {
      handleError(error, 'Erro ao enviar nota');
    }
  };

  const showAcceptConfirmation = () => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar Aceitação',
      content: 'Ao aceitar esta proposta, todas as outras serão automaticamente recusadas. Esta ação é irreversível. Deseja continuar?',
      onConfirm: handleAcceptProposal
    });
  };

  const showRejectConfirmation = () => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar Recusa',
      content: 'Tem certeza que deseja recusar esta proposta? Esta ação é irreversível.',
      onConfirm: handleRejectProposal
    });
  };

  // Loading and error states
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (!proposta) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: 2
      }}>
        <Typography variant="h6">Proposta não encontrada</Typography>
        <Button 
          startIcon={<ArrowBack />}
          onClick={() => window.history.back()}
          variant="outlined"
        >
          Voltar
        </Button>
      </Box>
    );
  }

  // Main render
  return (
    <Paper sx={{
      width: '100%',
      maxWidth: 800,
      margin: 'auto',
      p: isMobile ? 2 : 4,
      boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
      borderRadius: 3,
      backgroundColor: 'background.paper'
    }}>
      <BackButton sx={{ mb: 2 }} />

      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2,
        mb: 3,
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
            <Business fontSize="medium" />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Detalhes da Proposta
            </Typography>
          </Box>
        </Box>

        <Chip
          icon={<CheckCircle fontSize="small" />}
          label={proposta.status || 'Pendente'}
          color={statusColors[proposta.status] || 'default'}
          variant="outlined"
          sx={{ 
            px: 1,
            fontWeight: 500,
            borderWidth: 2,
            '& .MuiChip-icon': { ml: 0.5 }
          }}
        />
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* Company Information */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business color="primary" /> Informações da Empresa
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Empresa
              </Typography>
              <Typography variant="body1">
                {proposta.from.nome}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Contacto
              </Typography>
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Phone fontSize="small" /> {proposta.from.contacto}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Proposal Content */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description color="primary" /> Conteúdo da Proposta
          </Typography>
          
          <Box 
            dangerouslySetInnerHTML={{ __html: proposta.proposal }}
            sx={{
              '& p': { mb: 2 },
              '& ul, & ol': { pl: 3, mb: 2 },
              fontSize: '0.9375rem',
              lineHeight: 1.6
            }}
          />

          {proposta.fileUrl && (
            <Button
              href={proposta.fileUrl}
              target="_blank"
              startIcon={<AttachFile />}
              variant="outlined"
              sx={{ mt: 2 }}
            >
              Baixar Arquivo Anexado
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Products/Services */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description color="primary" /> Produtos/Serviços
          </Typography>
          
          {proposta.selectedProducts?.length > 0 ? (
            <TableContainer sx={{ 
              maxHeight: 400,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1
            }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Nome</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Preço (MT)</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Ação</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proposta.selectedProducts.map((product) => (
                    <TableRow key={product.id} hover>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.price}</TableCell>
                      <TableCell>
                        <Button
                          href={product.url}
                          target="_blank"
                          size="small"
                          variant="outlined"
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
            <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
              Nenhum produto/serviço selecionado nesta proposta
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description color="primary" /> Notas
          </Typography>
          
          {notaEnviada ? (
            <>
              <Typography variant="body1" sx={{ mb: 2, p: 2, backgroundColor: 'action.hover', borderRadius: 1 }}>
                {nota}
              </Typography>
              <Button
                onClick={() => setNotaEnviada(false)}
                startIcon={<Edit />}
                variant="outlined"
              >
                Editar Nota
              </Button>
            </>
          ) : (
            <>
              <TextField
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                label="Adicionar uma nota"
                multiline
                rows={4}
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <Button
                onClick={handleNotaSubmit}
                startIcon={<Send />}
                variant="contained"
              >
                Enviar Nota
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2,
        flexDirection: isMobile ? 'column' : 'row',
        mb: 2
      }}>
        {proposta.status === 'Aceite' ? (
          <Button
            onClick={handleCancelApproval}
            startIcon={<Cancel />}
            variant="contained"
            color="warning"
            fullWidth
            size="large"
          >
            Cancelar Aprovação
          </Button>
        ) : (
          <Button
            onClick={showAcceptConfirmation}
            startIcon={<CheckCircle />}
            variant="contained"
            color="success"
            fullWidth
            size="large"
          >
            Aprovar Proposta
          </Button>
        )}
        
        <Button
          onClick={showRejectConfirmation}
          startIcon={<Cancel />}
          variant="contained"
          color="error"
          fullWidth
          size="large"
          disabled={proposta.status === 'Recusada'}
        >
          Recusar Proposta
        </Button>
      </Box>

      {/* Message Snackbar */}
      <Snackbar
        open={message.open}
        autoHideDuration={4000}
        onClose={() => setMessage({ ...message, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setMessage({ ...message, open: false })}
          severity={message.type}
          sx={{ width: '100%' }}
          elevation={6}
        >
          {message.text}
        </Alert>
      </Snackbar>

      {/* Confirmation Dialog */}
      <Dialog 
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({...confirmDialog, open: false})}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
            width: isMobile ? '90%' : '400px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.content}</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setConfirmDialog({...confirmDialog, open: false})}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              confirmDialog.onConfirm();
              setConfirmDialog({...confirmDialog, open: false});
            }}
            variant="contained"
            color="primary"
            startIcon={<CheckCircle />}
            sx={{ borderRadius: 2 }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default DetalhesPropostaDesk;
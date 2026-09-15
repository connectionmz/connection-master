import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { ref, onValue, update, get } from 'firebase/database';
import { db } from '../../fb';
import BackButton from '../BackButton';
import { saveContentToInbox } from '../SaveToInbox';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Cancel,
  Edit,
  Send,
  Business,
  Phone,
  Description,
  AttachFile,
  ArrowBack,
  Email,
  Lock,
  Info,
  Share,
  AccessTime
} from '@mui/icons-material';
import Print from '@mui/icons-material/Print';
import { sendEmailWithAuth } from '../sms/SendMail';

// Status configuration
const STATUS_CONFIG = {
  'Aceite': { color: 'success', icon: <CheckCircle />, label: 'Aprovada' },
  'Recusada': { color: 'error', icon: <Cancel />, label: 'Recusada' },
  'Pendente': { color: 'warning', icon: <Info />, label: 'Pendente' },
  'default': { color: 'info', icon: <Info />, label: 'Pendente' }
};

const DetalhesPropostaDesk = ({ user }) => {
  const { id, propostaId } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');
  
  const [proposta, setProposta] = useState(null);
  const [cotacao, setCotacao] = useState(null);
  const [nota, setNota] = useState('');
  const [loading, setLoading] = useState(true);
  const [notaEnviada, setNotaEnviada] = useState(false);
  
  const [message, setMessage] = useState({ open: false, text: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    onConfirm: () => {},
    showCancelOption: true
  });

  const CUSTOM_URL = 'connectionmozambique.com/';
  const currentStatus = proposta?.status || 'Pendente';
  const statusInfo = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.default;

  const cotacaoIdShort = useMemo(() => id?.slice(0, 8), [id]);
  const proposalLink = useMemo(() => 
    `https://${CUSTOM_URL}cotacao/${id}/proposta/${propostaId}`, 
    [CUSTOM_URL, id, propostaId]
  );
  const cotacaoConcluida = useMemo(() => cotacao?.status === 'Concluída', [cotacao]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch cotação data
        const cotacaoRef = ref(db, `cotacoes/${id}`);
        const cotacaoUnsubscribe = onValue(cotacaoRef, (snapshot) => {
          setCotacao(snapshot.exists() ? snapshot.val() : null);
        });

        // Fetch proposta data
        const propostaRef = ref(db, `cotacoes/${id}/proposals/${propostaId}`);
        const propostaUnsubscribe = onValue(propostaRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setProposta(data);
            setNota(data.nota || '');
            setNotaEnviada(!!data.nota);
            checkApprovalTime(data);
          }
          setLoading(false);
        });

        return () => {
          cotacaoUnsubscribe();
          propostaUnsubscribe();
        };
      } catch (error) {
        handleError(error, 'Erro ao carregar dados');
        setLoading(false);
      }
    };

    fetchData();
  }, [id, propostaId]);

  const checkApprovalTime = useCallback((proposalData) => {
    if (proposalData.status === 'Aceite' && proposalData.acceptedAt) {
      const acceptedTime = new Date(proposalData.acceptedAt).getTime();
      const now = new Date().getTime();
      const hoursDiff = (now - acceptedTime) / (1000 * 60 * 60);
      
      setConfirmDialog(prev => ({
        ...prev,
        showCancelOption: hoursDiff <= 24
      }));
    }
  }, []);

  const showMessage = useCallback((text, type = 'success') => {
    setMessage({ open: true, text, type });
  }, []);

  const handleError = useCallback((error, defaultMessage) => {
    console.error(error);
    showMessage(defaultMessage, 'error');
  }, [showMessage]);

  const updateProposalStatus = useCallback(async (status) => {
    try {
      if (cotacaoConcluida && status !== 'Recusada') {
        showMessage('Não é possível alterar propostas de uma cotação concluída', 'error');
        return false;
      }

      const updates = { 
        status,
        updatedAt: new Date().toISOString(),
        updatedBy: user.id,
        ...(status === 'Aceite' && { acceptedAt: new Date().toISOString() }),
        ...(status === 'Recusada' && { rejectedAt: new Date().toISOString() })
      };
      
      await update(ref(db, `cotacoes/${id}/proposals/${propostaId}`), updates);
      showMessage(`Proposta ${status.toLowerCase()} com sucesso!`);
      return true;
    } catch (error) {
      handleError(error, 'Erro ao atualizar status da proposta');
      return false;
    }
  }, [id, propostaId, user.id, handleError, showMessage, cotacaoConcluida]);

  const rejectOtherProposals = useCallback(async (acceptedProposalId) => {
    try {
      const proposalsRef = ref(db, `cotacoes/${id}/proposals`);
      const snapshot = await get(proposalsRef);
      
      if (!snapshot.exists()) return;

      const updates = {};
      const proposals = snapshot.val();
      
      Object.keys(proposals).forEach(proposalId => {
        if (proposalId !== acceptedProposalId && proposals[proposalId].status !== 'Recusada') {
          updates[`${proposalId}/status`] = 'Recusada';
          updates[`${proposalId}/rejectedAt`] = new Date().toISOString();
          updates[`${proposalId}/updatedBy`] = user.id;
        }
      });
      
      if (Object.keys(updates).length > 0) {
        await update(proposalsRef, updates);
      }
    } catch (error) {
      handleError(error, 'Erro ao recusar outras propostas');
    }
  }, [id, user.id, handleError]);

  const sendNotification = useCallback(async (recipientId, messageText) => {
    try {
      const notification = {
        type: 'cotation_reply',
        message: messageText,
        fromUserId: user.id,
        fromUserName: user.nome,
        timestamp: new Date().toISOString(),
        status: 'unread',
        link: `minha_proposta/cotacao/${id}/proposta/${propostaId}`,
        isImportant: true
      };
      await saveContentToInbox(recipientId, notification);
    } catch (error) {
      handleError(error, 'Erro ao enviar notificação');
    }
  }, [id, propostaId, user.id, user.nome, handleError]);

  const sendEmailNotification = useCallback(async (email, subject, messageText) => {
    try {
      const emailContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>${subject}</h2>
          <p>${messageText}</p>
          <p>Você pode visualizar os detalhes acessando: <a href="${proposalLink}">${proposalLink}</a></p>
          ${subject.includes('aceita') ? 
            '<p><strong>Por favor, entre em contato com o comprador para os próximos passos.</strong></p>' : 
            '<p>Agradecemos seu interesse e esperamos contar com você em futuras cotações.</p>'
          }
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.9em; color: #777;">
            Atenciosamente,<br>
            Equipe Connection Mozambique
          </p>
        </div>`;  
        
      await sendEmailWithAuth({
        to: email,
        subject,
        html: emailContent
      });
    } catch (error) {
      handleError(error, 'Erro ao enviar e-mail de notificação');
    }
  }, [proposalLink, handleError]);

  const handleAcceptProposal = useCallback(async () => {
    try {
      if (cotacaoConcluida) {
        showMessage('Esta cotação já foi concluída com outra proposta', 'error');
        return;
      }

      const success = await updateProposalStatus('Aceite');
      if (!success) return;

      await rejectOtherProposals(propostaId);

      if (proposta.from?.id) {
        await sendNotification(
          proposta.from.id,
          `Sua proposta para a cotação #${cotacaoIdShort} foi aceita por ${user.nome}`
        );
      }

      if (proposta.from?.email) {
        await sendEmailNotification(
          proposta.from.email,
          `Sua proposta foi aceita - Cotação #${cotacaoIdShort}`,
          `Parabéns! Sua proposta para a cotação foi aceita por ${user.nome}.`
        );
      }

      await update(ref(db, `cotacoes/${id}`), {
        status: 'Concluída',
        selectedProposal: propostaId,
        updatedAt: new Date().toISOString()
      });

      navigate(`/cotacao/${id}`, { replace: true });
    } catch (error) {
      handleError(error, 'Erro ao processar a aceitação');
    }
  }, [
    proposta,
    updateProposalStatus,
    rejectOtherProposals,
    sendNotification,
    sendEmailNotification,
    cotacaoIdShort,
    user.nome,
    id,
    propostaId,
    navigate,
    handleError,
    cotacaoConcluida,
    showMessage
  ]);

  const handleRejectProposal = useCallback(async () => {
    try {
      if (cotacaoConcluida) {
        showMessage('Não é possível recusar propostas de uma cotação concluída', 'error');
        return;
      }

      await updateProposalStatus('Recusada');
      
      if (proposta.from?.id) {
        await sendNotification(
          proposta.from.id,
          `Sua proposta para a cotação #${cotacaoIdShort} foi recusada por ${user.nome}`
        );
      }

      if (proposta.from?.email) {
        await sendEmailNotification(
          proposta.from.email,
          `Sua proposta foi recusada - Cotação #${cotacaoIdShort}`,
          `Infelizmente sua proposta para a cotação foi recusada por ${user.nome}.`
        );
      }
    } catch (error) {
      handleError(error, 'Erro ao recusar proposta');
    }
  }, [
    proposta,
    updateProposalStatus,
    sendNotification,
    sendEmailNotification,
    cotacaoIdShort,
    user.nome,
    handleError,
    cotacaoConcluida,
    showMessage
  ]);


  const handleNotaSubmit = useCallback(async () => {
    if (!nota.trim()) {
      showMessage('A nota não pode estar vazia.', 'error');
      return;
    }
    try {
      await update(ref(db, `cotacoes/${id}/proposals/${propostaId}`), { 
        nota,
        updatedAt: new Date().toISOString(),
        updatedBy: user.id
      });
      showMessage('Nota enviada com sucesso!');
      setNotaEnviada(true);
    } catch (error) {
      handleError(error, 'Erro ao enviar nota');
    }
  }, [nota, id, propostaId, user.id, showMessage, handleError]);

  const showAcceptConfirmation = useCallback(() => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar Aceitação',
      content: 'Ao aceitar esta proposta: \n1. Todas as outras propostas serão automaticamente recusadas \n2. A cotação será marcada como concluída \n3. Esta ação não poderá ser desfeita',
      onConfirm: handleAcceptProposal,
      showCancelOption: true,
      confirmText: 'Confirmar Aceitação',
      confirmColor: 'success'
    });
  }, [handleAcceptProposal]);

  const showRejectConfirmation = useCallback(() => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar Recusa',
      content: 'Tem certeza que deseja recusar esta proposta? O fornecedor será notificado desta decisão.',
      onConfirm: handleRejectProposal,
      showCancelOption: true,
      confirmText: 'Confirmar Recusa',
      confirmColor: 'error'
    });
  }, [handleRejectProposal]);



  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: `Proposta de ${proposta.from.nome}`,
        text: `Confira esta proposta para a cotação #${cotacaoIdShort}`,
        url: proposalLink
      }).catch(err => {
        console.error('Erro ao compartilhar:', err);
        showMessage('Erro ao compartilhar', 'error');
      });
    } else {
      navigator.clipboard.writeText(proposalLink).then(() => {
        showMessage('Link copiado para a área de transferência!');
      }).catch(err => {
        console.error('Erro ao copiar:', err);
        showMessage('Erro ao copiar link', 'error');
      });
    }
  }, [proposta, cotacaoIdShort, proposalLink, showMessage]);

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
          onClick={() => navigate(-1)}
          variant="outlined"
        >
          Voltar
        </Button>
      </Box>
    );
  }

  return (
    <Paper sx={{
      width: '100%',
      maxWidth: 800,
      margin: 'auto',
      p: isMobile ? 2 : 4,
      boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
      borderRadius: 3,
      backgroundColor: 'background.paper',
      position: 'relative'
    }}>
      <BackButton sx={{ mb: 2 }} />
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
            <Typography variant="body2" color="text.secondary">
              Cotação #{cotacaoIdShort}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={statusInfo.label}
            icon={statusInfo.icon}
            color={statusInfo.color}
            variant="outlined"
            sx={{ 
              px: 1,
              fontWeight: 500,
              borderWidth: 2,
              '& .MuiChip-icon': { ml: 0.5 }
            }}
          />
          {currentStatus === 'Aceite' && !confirmDialog.showCancelOption && (
            <Tooltip title="Aprovação bloqueada após 24 horas">
              <Lock color="error" fontSize="small" />
            </Tooltip>
          )}
          {cotacaoConcluida && currentStatus !== 'Aceite' && (
            <Tooltip title="Cotação já concluída com outra proposta">
              <Lock color="error" fontSize="small" />
            </Tooltip>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <CompanyInfoSection proposta={proposta} />
      <ProposalContentSection proposta={proposta} />
      <ProductsServicesSection proposta={proposta} />
      
      <NotesSection 
        nota={nota} 
        notaEnviada={notaEnviada} 
        setNota={setNota} 
        handleNotaSubmit={handleNotaSubmit}
      />

      {proposta.acceptedAt && (
        <StatusTimeline 
          status={currentStatus}
          acceptedAt={proposta.acceptedAt}
          rejectedAt={proposta.rejectedAt}
        />
      )}

      {currentStatus !== 'Recusada' && (
        <ActionButtonsSection 
          currentStatus={currentStatus}
          confirmDialog={confirmDialog}
          showAcceptConfirmation={showAcceptConfirmation}
          showRejectConfirmation={showRejectConfirmation}
          isMobile={isMobile}
          cotacaoConcluida={cotacaoConcluida}
        />
      )}

      <MessageSnackbar 
        message={message}
        setMessage={setMessage}
      />

      <ConfirmationDialog 
        confirmDialog={confirmDialog}
        setConfirmDialog={setConfirmDialog}
        isMobile={isMobile}
      />
    </Paper>
  );
};

// Sub-components
const CompanyInfoSection = ({ proposta }) => (
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
            <Link
              to={`/perfil/${proposta.from.id}`}
              style={{ textDecoration: 'none', color: '#1976d2' }}
            >
              {proposta.from.nome}
            </Link>
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Typography variant="subtitle2" color="text.secondary">
            Contacto
          </Typography>
          <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Phone fontSize="small" />
            <a href={`tel:${proposta.from.contacto}`} style={{ textDecoration: 'none', color: '#1976d2' }}>
              {proposta.from.contacto}
            </a>
          </Typography>
          <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Email fontSize="small" />
            <a href={`mailto:${proposta.from.email}`} style={{ textDecoration: 'none', color: '#1976d2' }}>
              {proposta.from.email}
            </a>
          </Typography>
        </Grid>
      </Grid>
    </CardContent>
  </Card>
);

const ProposalContentSection = ({ proposta }) => (
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
);

const ProductsServicesSection = ({ proposta }) => (
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
              {proposta.selectedProducts.map((product, index) => (
                <TableRow key={index} hover>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{product.price.toLocaleString('pt-PT')}</TableCell>
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
);

const NotesSection = ({ nota, notaEnviada, setNota, handleNotaSubmit }) => (
  <Card sx={{ mb: 3, borderRadius: 2 }}>
    <CardContent>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Description color="primary" /> Notas
      </Typography>
      {notaEnviada ? (
        <>
          <Typography variant="body1" sx={{ 
            mb: 2, 
            p: 2, 
            backgroundColor: 'action.hover', 
            borderRadius: 1,
            whiteSpace: 'pre-wrap'
          }}>
            {nota}
          </Typography>
          <Button
            onClick={() => notaEnviada(false)}
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
            disabled={!nota.trim()}
          >
            Enviar Nota
          </Button>
        </>
      )}
    </CardContent>
  </Card>
);

const StatusTimeline = ({ status, acceptedAt, rejectedAt }) => {
  const getStatusTime = () => {
    if (status === 'Aceite' && acceptedAt) {
      return new Date(acceptedAt).toLocaleString('pt-PT');
    }
    if (status === 'Recusada' && rejectedAt) {
      return new Date(rejectedAt).toLocaleString('pt-PT');
    }
    return null;
  };

  const statusTime = getStatusTime();

  if (!statusTime) return null;

  return (
    <Card sx={{ mb: 3, borderRadius: 2 }}>
      <CardContent>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AccessTime color="primary" /> Histórico de Status
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="body1" color="text.secondary">
            {status === 'Aceite' ? 'Aprovada em:' : 'Recusada em:'}
          </Typography>
          <Typography variant="body1" fontWeight={500}>
            {statusTime}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

const ActionButtonsSection = ({ 
  currentStatus, 
  confirmDialog, 
  showAcceptConfirmation, 
  showRejectConfirmation, 
  showCancelApprovalConfirmation,
  isMobile,
  cotacaoConcluida
}) => (
  <Box sx={{ 
    display: 'flex', 
    gap: 2,
    flexDirection: isMobile ? 'column' : 'row',
    mb: 2
  }}>
    {currentStatus === 'Aceite' ? (
      <Button
        onClick={showCancelApprovalConfirmation}
        startIcon={<Cancel />}
        variant="contained"
        color="warning"
        fullWidth
        size="large"
        disabled={!confirmDialog.showCancelOption || cotacaoConcluida}
      >
        {confirmDialog.showCancelOption ? 'Cancelar Aprovação' : 'Aprovação Bloqueada'}
      </Button>
    ) : (
      <Button
        onClick={showAcceptConfirmation}
        startIcon={<CheckCircle />}
        variant="contained"
        color="success"
        fullWidth
        size="large"
        disabled={cotacaoConcluida}
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
      disabled={currentStatus === 'Recusada' || cotacaoConcluida}
    >
      Recusar Proposta
    </Button>
  </Box>
);

const MessageSnackbar = ({ message, setMessage }) => (
  <Snackbar
    open={message.open}
    autoHideDuration={6000}
    onClose={() => setMessage({ ...message, open: false })}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
  >
    <Alert
      onClose={() => setMessage({ ...message, open: false })}
      severity={message.type}
      sx={{ width: '100%' }}
      elevation={6}
      variant="filled"
    >
      {message.text}
    </Alert>
  </Snackbar>
);

const ConfirmationDialog = ({ confirmDialog, setConfirmDialog, isMobile }) => (
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
    <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
      {confirmDialog.title}
    </DialogTitle>
    <DialogContent>
      <Typography sx={{ whiteSpace: 'pre-line' }}>{confirmDialog.content}</Typography>
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      {confirmDialog.showCancelOption && (
        <Button
          onClick={() => setConfirmDialog({...confirmDialog, open: false})}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: 2 }}
        >
          Cancelar
        </Button>
      )}
      {confirmDialog.onConfirm && (
        <Button
          onClick={() => {
            confirmDialog.onConfirm();
            setConfirmDialog({...confirmDialog, open: false});
          }}
          variant="contained"
          color={confirmDialog.confirmColor || 'primary'}
          startIcon={<CheckCircle />}
          sx={{ borderRadius: 2 }}
        >
          {confirmDialog.confirmText || 'Confirmar'}
        </Button>
      )}
    </DialogActions>
  </Dialog>
);

export default DetalhesPropostaDesk;

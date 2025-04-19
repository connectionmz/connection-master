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
  IconButton
} from '@mui/material';
import { ref, onValue, remove } from 'firebase/database';
import { db } from '../../fb';
import BackButton from '../BackButton';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  Cancel,
  Edit,
  Delete,
  Business,
  Phone,
  Description,
  AttachFile,
  ArrowBack
} from '@mui/icons-material';

const MinhaPropostaDesk = ({ user }) => {
  const { id, propostaId } = useParams();
  const [proposta, setProposta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ open: false, text: '', type: 'success' });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');
  const navigate = useNavigate();

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
      } else {
        setProposta(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id, propostaId]);

  const showMessage = (text, type = 'success') => {
    setMessage({ open: true, text, type });
  };

  const handleDeleteProposal = async () => {
    try {
      await remove(ref(db, `cotacoes/${id}/proposals/${propostaId}`));
      showMessage('Proposta eliminada com sucesso!');
      navigate(`/cotacao/${id}`); // Redirect to quotation page after deletion
    } catch (error) {
      console.error('Erro ao eliminar proposta:', error);
      showMessage('Erro ao eliminar proposta', 'error');
    } finally {
      setDeleteDialog(false);
    }
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
      backgroundColor: 'background.paper'
    }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <BackButton />
        <IconButton
          color="error"
          onClick={() => setDeleteDialog(true)}
          sx={{ ml: 'auto' }}
        >
          <Delete />
        </IconButton>
      </Box>

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
              Minha Proposta
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              ID: {propostaId.slice(0, 8)}...
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
            <Description color="primary" /> Produtos/Serviços Oferecidos
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
                  </TableRow>
                </TableHead>
                <TableBody>
                  {proposta.selectedProducts.map((product, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{product.name}</TableCell>
                      <TableCell>{product.price}</TableCell>
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

      {/* Submission Info */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description color="primary" /> Informações de Envio
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Data de Envio
              </Typography>
              <Typography variant="body1">
                {new Date(proposta.submittedAt).toLocaleDateString('pt-MZ', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Typography variant="body1">
                {proposta.status || 'Pendente'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Delete Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <Button
          onClick={() => setDeleteDialog(true)}
          startIcon={<Delete />}
          variant="contained"
          color="error"
          sx={{ px: 4, py: 1.5, borderRadius: 2 }}
        >
          Eliminar Proposta
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

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialog}
        onClose={() => setDeleteDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
            width: isMobile ? '90%' : '400px'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Confirmar Eliminação</DialogTitle>
        <DialogContent>
          <Typography>Tem certeza que deseja eliminar esta proposta?</Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2, fontWeight: 500 }}>
            Atenção: Esta ação não pode ser desfeita!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setDeleteDialog(false)}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteProposal}
            variant="contained"
            color="error"
            startIcon={<Delete />}
            sx={{ borderRadius: 2 }}
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default MinhaPropostaDesk;
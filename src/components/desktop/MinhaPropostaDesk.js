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
  IconButton,
  Link
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
  Email,
  LocationOn,
  AttachMoney,
  ArrowBack,
  Description,
  AccessTime
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
    'Pendente': 'warning',
    'wait': 'warning' // Adicionando mapeamento para status 'wait'
  };

  // Status labels
  const statusLabels = {
    'Aceite': 'Aceite',
    'Recusada': 'Recusada',
    'Pendente': 'Pendente',
    'wait': 'Pendente' // Mapeando 'wait' para 'Pendente'
  };

  // Fetch proposal data
  useEffect(() => {
    const propostaRef = ref(db, `cotacoes/${id}/proposals/${propostaId}`);
    const unsubscribe = onValue(propostaRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setProposta({
          ...data,
          // Calcula o preço total se houver produtos selecionados
          totalPrice: data.selectedProducts?.reduce((sum, product) => sum + (product.price || 0), 0) || 0
        });
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

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-MZ', { 
      style: 'currency', 
      currency: 'MZN',
      minimumFractionDigits: 2
    }).format(value);
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
          <Avatar 
            src={proposta.from?.logo} 
            sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}
          >
            {!proposta.from?.logo && <Business fontSize="medium" />}
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {proposta.from?.nome || 'Minha Proposta'}
            </Typography>
          </Box>
        </Box>
        <Chip
          icon={<CheckCircle fontSize="small" />}
          label={statusLabels[proposta.status] || 'Pendente'}
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

      {/* Company Info */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Business color="primary" /> Informações da Empresa
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Nome
              </Typography>
              <Typography variant="body1">
                {proposta.from?.nome || 'Não especificado'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">
                <Link href={`mailto:${proposta.from?.email}`} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Email fontSize="small" /> {proposta.from?.email || 'Não especificado'}
                </Link>
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Localização
              </Typography>
              <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <LocationOn fontSize="small" />
                {proposta.from?.distrito && proposta.from?.provincia 
                  ? `${proposta.from.distrito}, ${proposta.from.provincia}`
                  : 'Não especificado'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Proposal Content */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description color="primary" />Minha Resposta
          </Typography>
          
          
          <Box 
            dangerouslySetInnerHTML={{ __html: proposta.proposal || '<p>Nenhum conteúdo detalhado fornecido.</p>' }}
            sx={{
              '& p': { mb: 2 },
              '& ul, & ol': { pl: 3, mb: 2 },
              fontSize: '0.9375rem',
              lineHeight: 1.6
            }}
          />
        </CardContent>
      </Card>

            {/* Proposal Content */}
            <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Description color="primary" />Nota de resposta
          </Typography>
          {proposta.nota && (
            <Typography paragraph sx={{ mb: 3,  color: 'text.secondary' }}>
              {proposta.nota}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Products/Services */}
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney color="primary" /> Produtos/Serviços Oferecidos
          </Typography>
          
          {proposta.selectedProducts?.length > 0 ? (
            <>
              <TableContainer sx={{ 
                maxHeight: 400,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                mb: 2
              }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Produto</TableCell>
                      <TableCell sx={{ fontWeight: 600 }} align="right">Preço</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {proposta.selectedProducts.map((product, index) => (
                      <TableRow key={index} hover>
                        <TableCell>
                          <Typography>{product.name}</Typography>
                          {product.url && (
                            <Link 
                              href={product.url} 
                              target="_blank" 
                              variant="body2" 
                              color="text.secondary"
                              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                            >
                              Ver detalhes
                            </Link>
                          )}
                        </TableCell>
                        <TableCell align="right">{formatCurrency(product.price)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Total: {formatCurrency(proposta.totalPrice || 0)}
                </Typography>
              </Box>
            </>
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
            <AccessTime color="primary" /> Informações de Envio
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
                {statusLabels[proposta.status] || 'Pendente'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
        <Button
          onClick={() => navigate(-1)}
          startIcon={<ArrowBack />}
          variant="outlined"
          sx={{ px: 4, py: 1.5, borderRadius: 2 }}
        >
          Voltar
        </Button>
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
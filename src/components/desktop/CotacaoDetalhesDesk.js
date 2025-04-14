import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../../fb';
import { ref, onValue, increment, update, push, set, get } from 'firebase/database';
import { AdsClick, Inbox, RemoveRedEye, Share, FileDownload, Timelapse, CalendarToday, AccessTime, Report } from '@mui/icons-material';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  Avatar,
  Box,
  Modal,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Chip,
  Divider,
  TextField,
  useMediaQuery,
  useTheme,
  Stack,
  IconButton,
} from '@mui/material';
import BackButton from '../BackButton';
import { formatPrice } from '../../utils/utils';

const CotacaoDetalhesDesk = ({ user }) => {
  const { id } = useParams();
  const [cotacao, setCotacao] = useState(null);
  const [propostas, setPropostas] = useState([]);
  const [viewsModalOpen, setViewsModalOpen] = useState(false);
  const [empresasQueVisualizaram, setEmpresasQueVisualizaram] = useState([]);
  const [hasProposal, setHasProposal] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [proposalDetails, setProposalDetails] = useState(null);
  const [denunciaModalOpen, setDenunciaModalOpen] = useState(false);
  const [motivoDenuncia, setMotivoDenuncia] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const navigate = useNavigate();

  useEffect(() => {
    const cotacaoRef = ref(db, `cotacoes/${id}`);
    const viewsRef = ref(db, `cotacoes/${id}/views/${user.id}`);
    const proposalsRef = ref(db, `cotacoes/${id}/proposals/${user.id}`);

    const fetchCotacao = () => {
      onValue(viewsRef, async (snapshot) => {
        if (!snapshot.exists()) {
          try {
            await update(cotacaoRef, {
              [`views/${user.id}`]: true,
              viewCount: increment(1),
            });
          } catch (error) {
            console.error("Erro ao atualizar visualizações:", error);
          }
        }
      }, { onlyOnce: true });

      const unsubscribeCotacao = onValue(cotacaoRef, async (snapshot) => {
        const data = snapshot.val();
        if (!data) return;

        setCotacao(data);

        console.log(data)

        if (data?.proposals) {
          const propostasIds = Object.keys(data.proposals);
          const prop = propostasIds.map((propostaId) => ({
            id: propostaId,
            ...data.proposals[propostaId],
          }));
          setPropostas(prop);
        
        }

        if (data?.views) {
          const empresasIds = Object.keys(data.views);
        
          const empresasPromises = empresasIds.map(async (empresaId) => {
            if (empresaId === user.id) {
              return null;
            }
            const companyRef = ref(db, `company/${empresaId}`);
            const companySnapshot = await get(companyRef);
        
            if (companySnapshot.exists()) {
              return {
                id: empresaId,
                ...companySnapshot.val(),
              };
            } else {
              return null;
            }
          });
        
          const empresas = (await Promise.all(empresasPromises)).filter(Boolean);
          setEmpresasQueVisualizaram(empresas);
        }
      });

      return unsubscribeCotacao;
    };

    const checkProposal = () => {
      const unsubscribeProposal = onValue(proposalsRef, (snapshot) => {
        const proposals = snapshot.val();
        if (proposals) {
          setProposalDetails(proposals);
          setHasProposal(true);
        } else {
          setHasProposal(false);
        }
      });

      return unsubscribeProposal;
    };

    const unsubscribeCotacao = fetchCotacao();
    const unsubscribeProposal = checkProposal();

    return () => {
      unsubscribeCotacao();
      unsubscribeProposal();
    };
  }, [id, user.id, db]);


  const isCotacaoExpirada = () => {
    const dataLimite = new Date(cotacao.datalimite);
    const agora = new Date();
    return dataLimite.getTime() < agora.getTime();
  };
  

  const handleEnviarProposta = (companyId) => navigate(`/enviar-proposta/${id}/${companyId}`);
  const handleBaixarPedido = () => navigate(`/cotacaoPDF/${id}`);
  const handlePartilhar = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => alert('Link copiado! Pronto para partilhar.'),
      (err) => alert('Erro ao copiar o link', err)
    );
  };
  const handleVerPropostas = () => {
    if (propostas.length > 0) {
      navigate(`/propostas/${id}/propostas`);
    } else {
      alert('Nenhuma proposta foi recebida ainda.');
    }
  };

  const handleOpenModal = () => setViewsModalOpen(true);
  const handleCloseModal = () => setViewsModalOpen(false);
  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);

  const handleFecharCotacao = () => {
    if (window.confirm("Tem certeza que deseja fechar esta cotação?")) {
      update(ref(db, `cotacoes/${id}`), {
        status: "Fechada",
      }).then(() => {
        alert("Cotação fechada com sucesso!");
      }).catch((error) => {
        alert("Erro ao fechar a cotação:", error);
      });
    }
  };

  const handleAbrirDenunciaModal = () => {
    setDenunciaModalOpen(true);
  };

  const handleFecharDenunciaModal = () => {
    setDenunciaModalOpen(false);
    setMotivoDenuncia('');
  };

  const handleDenunciar = () => {
    if (!motivoDenuncia.trim()) {
      alert("Por favor, insira um motivo para a denúncia.");
      return;
    }

    const denunciaUsuarioRef = ref(db, `denuncias/cotacao/${id}/${user.id}`);
    
    get(denunciaUsuarioRef).then((snapshot) => {
      if (snapshot.exists()) {
        alert("Você já denunciou esta cotação. Não é possível denunciar novamente.");
        handleFecharDenunciaModal();
      } else {
        const novaDenunciaRef = push(denunciaUsuarioRef);

        set(novaDenunciaRef, {
          motivo: motivoDenuncia,
          timestamp: new Date().toISOString(),
          userId: user.id,
          cotacaoId: id,
        })
          .then(() => {
            alert("Denúncia enviada com sucesso!");
            handleFecharDenunciaModal();
          })
          .catch((error) => {
            console.error("Erro ao enviar denúncia:", error);
            alert("Erro ao enviar denúncia. Tente novamente.");
          });
      }
    }).catch((error) => {
      console.error("Erro ao verificar denúncia existente:", error);
      alert("Erro ao verificar denúncia existente. Tente novamente.");
    });
  };

  if (!cotacao) {
    return <Typography align="center" color="textSecondary">Carregando...</Typography>;
  }

  return (
    <Box width="100%" mx="auto" p={isMobile ? 1 : 3}>
      <BackButton sx={{ mb: 2 }} />
      
      {/* Main Card */}
      <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Avatar
                src={cotacao.company.logoUrl || 'default-logo.png'}
                alt={cotacao.company.nome}
                sx={{ width: isMobile ? 48 : 64, height: isMobile ? 48 : 64 }}
              />
            </Grid>
            <Grid item xs>
              <Typography variant={isMobile ? "h6" : "h5"} gutterBottom fontWeight="bold">
                {cotacao.company.nome}
              </Typography>
              <Chip
                  label={
                    isCotacaoExpirada()
                      ? 'Expirada'
                      : cotacao.status === 'open'
                        ? 'Aberta'
                        : 'Fechada'
                  }
                  color={
                    isCotacaoExpirada()
                      ? 'warning'
                      : cotacao.status === 'open'
                        ? 'success'
                        : 'error'
                  }
                  size="small"
                  sx={{ mb: 1 }}
                />
              <Box mt={1}>
                <Grid container spacing={isMobile ? 1 : 2} alignItems="center">
                  <Grid item>
                    <Typography
                      color="primary"
                      sx={{ 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center',
                        fontSize: isMobile ? '0.8rem' : '1rem'
                      }}
                      onClick={handleOpenModal}
                    >
                      <RemoveRedEye color="primary" sx={{ mr: 1, fontSize: isMobile ? '1rem' : '1.25rem' }} /> 
                      {cotacao.viewCount || 0} visualizações
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      fontSize: isMobile ? '0.8rem' : '1rem'
                    }}>
                      <Inbox color="warning" sx={{ mr: 1, fontSize: isMobile ? '1rem' : '1.25rem' }} /> 
                      {propostas.length} propostas
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              
              <Box mt={2}>
                <Grid container spacing={isMobile ? 1 : 2} direction={isMobile ? 'column' : 'row'}>
                  <Grid item>
                    <Typography 
                      color="textSecondary" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontSize: isMobile ? '0.8rem' : '1rem'
                      }}
                    >
                      <CalendarToday sx={{ mr: 1, fontSize: isMobile ? '1rem' : '1.25rem' }} /> 
                      Publicado em{' '}
                      {new Date(cotacao.timestamp).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography 
                      color="error" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontSize: isMobile ? '0.8rem' : '1rem'
                      }}
                    >
                      <AccessTime sx={{ mr: 1, fontSize: isMobile ? '1rem' : '1.25rem' }} /> 
                      Limite em{' '}
                      {new Date(cotacao.datalimite).toLocaleString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
        
        {/* Actions - Responsive */}
        <CardActions sx={{ p: isMobile ? 1 : 2 }}>
  <Stack 
    direction={isMobile ? 'column' : 'row'} 
    spacing={isMobile ? 1 : 2} 
    width="100%"
  >
    <Button 
      variant="contained" 
      color="primary" 
      onClick={handleBaixarPedido} 
      startIcon={<FileDownload />}
      size={isMobile ? 'small' : 'medium'}
      fullWidth={isMobile}
    >
      {isMobile ? 'Baixar' : 'Baixar Pedido'}
    </Button>
    <Button 
      variant="outlined" 
      onClick={handlePartilhar} 
      startIcon={<Share />}
      size={isMobile ? 'small' : 'medium'}
      fullWidth={isMobile}
    >
      {isMobile ? 'Partilhar' : 'Partilhar'}
    </Button>
    <Button 
      variant="outlined" 
      color="error" 
      onClick={handleAbrirDenunciaModal} 
      startIcon={<Report />}
      size={isMobile ? 'small' : 'medium'}
      fullWidth={isMobile}
    >
      {isMobile ? 'Denunciar' : 'Denunciar'}
    </Button>
    
    {/* Owner-specific actions */}
    {user.id === cotacao.company.id ? (
      <>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={handleVerPropostas}
          size={isMobile ? 'small' : 'medium'}
          fullWidth={isMobile}
        >
          {isMobile ? 'Propostas' : 'Ver Propostas'}
        </Button>

        {cotacao.status === "Fechada" || isCotacaoExpirada() ? (
          <Typography variant="body2" color="error" align="center" sx={{ display: 'flex', alignItems: 'center' }}>
            {cotacao.status === "Fechada" ? "Cotação fechada" : "Cotação expirada"}
          </Typography>
        ) : (
          <Button
            variant="contained"
            color="error"
            onClick={handleFecharCotacao}
            size={isMobile ? 'small' : 'medium'}
            fullWidth={isMobile}
          >
            {isMobile ? 'Fechar' : 'Fechar Cotação'}
          </Button>
        )}
      </>
    ) : (
      /* Non-owner actions */
      <>
        {hasProposal ? (
          <Button 
            variant="contained" 
            color="info" 
            onClick={handleOpen}
            size={isMobile ? 'small' : 'medium'}
            fullWidth={isMobile}
          >
            {isMobile ? 'Minha Proposta' : 'Ver Minha Proposta'}
          </Button>
        ) : (
          <>
            {cotacao.status === "Fechada" || isCotacaoExpirada() ? (
              <Typography variant="body2" color="error" align="center" sx={{ display: 'flex', alignItems: 'center' }}>
                {cotacao.status === "Fechada" ? "Cotação fechada" : "Cotação expirada"}
              </Typography>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={() => handleEnviarProposta(cotacao.company.id)}
                size={isMobile ? 'small' : 'medium'}
                fullWidth={isMobile}
              >
                {isMobile ? 'Enviar' : 'Enviar Proposta'}
              </Button>
            )}
          </>
        )}
      </>
    )}
  </Stack>
</CardActions>
      </Card>

      {/* Description Card */}
      <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Descrição
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography dangerouslySetInnerHTML={{ __html: cotacao.description }} />
        </CardContent>
      </Card>
      <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
           Valor maximo de propostas: {formatPrice(cotacao?.maxProposals || "0")}MT

          </Typography>
          <Typography variant="h6" gutterBottom fontWeight="bold">
           Limite de propostas: {cotacao?.proposalLimit || 'N/A'}
          </Typography>
        </CardContent>
      </Card>
      {/* Items Card */}
      <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Itens Solicitados
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {cotacao.items && cotacao.items.length > 0 ? (
            <Grid container spacing={2}>
              {cotacao.items.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card sx={{ borderRadius: 2, boxShadow: 1 }}>
                    <CardContent>
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{ 
                          width: '100%', 
                          height: isMobile ? '100px' : '150px', 
                          objectFit: 'cover', 
                          borderRadius: 8 
                        }}
                      />
                      <Typography variant="body1" fontWeight="bold" sx={{ mt: 1 }}>
                        {item.name}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {item.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="textSecondary">Nenhum item disponível.</Typography>
          )}
        </CardContent>
      </Card>

      {/* Views Modal */}
      <Modal open={viewsModalOpen} onClose={handleCloseModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: isMobile ? 2 : 4,
            borderRadius: 2,
            width: isMobile ? '90%' : '80%',
            maxWidth: 600,
            maxHeight: '80%',
            overflowY: 'auto',
          }}
        >
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Empresas que visualizaram
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {empresasQueVisualizaram.length > 0 ? (
            <Grid container spacing={2}>
              {empresasQueVisualizaram.map((empresa) => (
                <Grid item xs={12} sm={6} key={empresa.id}>
                  <Link to={`/perfil/${empresa.id}`} style={{ textDecoration: 'none' }}>
                    <Box
                      display="flex"
                      alignItems="center"
                      p={isMobile ? 1 : 2}
                      border={1}
                      borderColor="divider"
                      borderRadius={2}
                      sx={{
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                        },
                      }}
                    >
                      <Avatar 
                        src={empresa.logoUrl || 'default-logo.png'} 
                        alt={empresa.nome} 
                        sx={{ mr: isMobile ? 1 : 2, width: isMobile ? 32 : 40, height: isMobile ? 32 : 40 }} 
                      />
                      <Typography variant={isMobile ? "body2" : "body1"}>
                        {empresa.nome || 'Empresa Desconhecida'}
                      </Typography>
                    </Box>
                  </Link>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="textSecondary">Nenhuma empresa visualizou até o momento.</Typography>
          )}
          <Box mt={3} textAlign="right">
            <Button variant="contained" onClick={handleCloseModal} size={isMobile ? 'small' : 'medium'}>
              Fechar
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Proposal Details Modal */}
      <Dialog open={openModal} onClose={handleClose} fullScreen={isMobile}>
        <DialogTitle fontWeight="bold">Detalhes da Proposta</DialogTitle>
        <DialogContent>
          {proposalDetails ? (
            <div>
              <Typography variant="h6" gutterBottom>
                Proposta:
              </Typography>
              <div dangerouslySetInnerHTML={{ __html: proposalDetails.proposal }} />
              <Typography variant="body1" sx={{ mt: 2 }}>
                Estado: {proposalDetails.status}
              </Typography>
              <Typography variant="body1">
                Nota: {proposalDetails?.nota || 'Ainda sem nota'}
              </Typography>
            </div>
          ) : (
            <Typography variant="body1">Carregando detalhes...</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Report Modal */}
      <Dialog open={denunciaModalOpen} onClose={handleFecharDenunciaModal} fullScreen={isMobile}>
        <DialogTitle>Denunciar Cotação</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={isMobile ? 3 : 4}
            label="Motivo da Denúncia"
            value={motivoDenuncia}
            onChange={(e) => setMotivoDenuncia(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleFecharDenunciaModal} size={isMobile ? 'small' : 'medium'}>
            Cancelar
          </Button>
          <Button onClick={handleDenunciar} color="error" size={isMobile ? 'small' : 'medium'}>
            Denunciar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CotacaoDetalhesDesk;
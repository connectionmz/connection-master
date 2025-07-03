import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ref, onValue, increment, update, push, set, get } from 'firebase/database';
import { db } from '../../fb';
import { 
  AdsClick, Inbox, RemoveRedEye, Share, FileDownload, 
  Timelapse, CalendarToday, AccessTime, Report, CheckCircle 
} from '@mui/icons-material';
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
import { Info } from 'lucide-react';

const CotacaoDetalhesDesk = ({ user }) => {
  // Hooks and params
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // State management
  const [cotacao, setCotacao] = useState(null);
  const [propostas, setPropostas] = useState([]);
  const [empresasQueVisualizaram, setEmpresasQueVisualizaram] = useState([]);
  const [hasProposal, setHasProposal] = useState(false);
  const [viewsModalOpen, setViewsModalOpen] = useState(false);
  const [denunciaModalOpen, setDenunciaModalOpen] = useState(false);
  const [motivoDenuncia, setMotivoDenuncia] = useState('');

  // Data fetching
  useEffect(() => {
    const cotacaoRef = ref(db, `cotacoes/${id}`);
    const viewsRef = ref(db, `cotacoes/${id}/views/${user.id}`);
    const proposalsRef = ref(db, `cotacoes/${id}/proposals/${user.id}`);

    // Track view if not the owner
    const trackView = async () => {
      try {
        if (cotacao?.company.id !== user.id) {
          const viewSnapshot = await get(viewsRef);
          if (!viewSnapshot.exists()) {
            await update(cotacaoRef, {
              [`views/${user.id}`]: true,
              viewCount: increment(1),
            });
          }
        }
      } catch (error) {
        console.error("Erro ao atualizar visualizações:", error);
      }
    };

    // Fetch cotação data
    const fetchCotacao = () => {
      const unsubscribe = onValue(cotacaoRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        console.log(data)
        setCotacao(data);
        trackView();

        // Process proposals
        if (data.proposals) {
          const propostasArray = Object.entries(data.proposals).map(([id, proposta]) => ({
            id,
            ...proposta
          }));
          setPropostas(propostasArray);
        }

        // Process views
        if (data.views) {
          const fetchViewingCompanies = async () => {
            const empresasPromises = Object.keys(data.views)
              .filter(empresaId => empresaId !== user.id)
              .map(async empresaId => {
                const companyRef = ref(db, `company/${empresaId}`);
                const companySnapshot = await get(companyRef);
                return companySnapshot.exists() 
                  ? { id: empresaId, ...companySnapshot.val() }
                  : null;
              });

            const empresas = (await Promise.all(empresasPromises)).filter(Boolean);
            setEmpresasQueVisualizaram(empresas);
          };

          fetchViewingCompanies();
        }
      });

      return unsubscribe;
    };

    // Check if user has proposal
    const checkUserProposal = () => {
      return onValue(proposalsRef, (snapshot) => {
        setHasProposal(snapshot.exists());
      });
    };

    const unsubscribeCotacao = fetchCotacao();
    const unsubscribeProposal = checkUserProposal();

    return () => {
      unsubscribeCotacao();
      unsubscribeProposal();
    };
  }, [id, user.id]);

  // Helper functions
  const isCotacaoExpirada = () => {
    if (!cotacao?.datalimite) return false;
    return new Date(cotacao.datalimite) < new Date();
  };

  const isProposalLimitReached = () => {
    return cotacao?.proposalLimit && propostas.length >= cotacao.proposalLimit;
  };

  const isDateValid = (dateString) => {
    return new Date(dateString) >= new Date();
  };

  // Action handlers
  const handleEnviarProposta = () => {
    navigate(`/enviar-proposta/${id}/${cotacao.company.id}`);
  };

  const handleBaixarPedido = () => {
    navigate(`/cotacaoPDF/${id}`);
  };

  const handlePartilhar = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Link copiado! Pronto para partilhar.');
    } catch (err) {
      alert('Erro ao copiar o link');
      console.error(err);
    }
  };

  const handleVerPropostas = () => {
    propostas.length > 0 
      ? navigate(`/propostas/${id}/propostas`)
      : alert('Nenhuma proposta foi recebida ainda.');
  };

  const handleFecharCotacao = () => {
    if (window.confirm("Tem certeza que deseja fechar esta cotação?")) {
      update(ref(db, `cotacoes/${id}`), { status: "Fechada" })
        .then(() => alert("Cotação fechada com sucesso!"))
        .catch(error => {
          alert("Erro ao fechar a cotação");
          console.error(error);
        });
    }
  };

  const handleDenunciar = async () => {
    if (!motivoDenuncia.trim()) {
      alert("Por favor, insira um motivo para a denúncia.");
      return;
    }

    try {
      const denunciaRef = ref(db, `denuncias/cotacao/${id}/${user.id}`);
      const snapshot = await get(denunciaRef);

      if (snapshot.exists()) {
        alert("Você já denunciou esta cotação.");
      } else {
        await set(push(denunciaRef), {
          motivo: motivoDenuncia,
          timestamp: new Date().toISOString(),
          userId: user.id,
          cotacaoId: id,
        });
        alert("Denúncia enviada com sucesso!");
      }
      setDenunciaModalOpen(false);
      setMotivoDenuncia('');
    } catch (error) {
      console.error("Erro ao enviar denúncia:", error);
      alert("Erro ao enviar denúncia. Tente novamente.");
    }
  };

  // Modal handlers
  const toggleViewsModal = () => setViewsModalOpen(!viewsModalOpen);
  const toggleDenunciaModal = () => setDenunciaModalOpen(!denunciaModalOpen);

  if (!cotacao) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <Typography>Carregando...</Typography>
      </Box>
    );
  }

  // Status determination
  const status = isCotacaoExpirada() 
    ? { text: 'Expirada', color: 'warning' } 
    : cotacao.status === 'open' 
      ? { text: 'Aberta', color: 'success' } 
      : { text: 'Fechada', color: 'error' };

  return (
    <Box width="100%" mx="auto" p={isMobile ? 1 : 3}>
      <BackButton sx={{ mb: 2 }} />
      
      {/* Main Cotação Card */}
      <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <Link to={`/perfil/${cotacao.company.id}`}>
                <Avatar
                  src={cotacao.company.logoUrl}
                  alt={cotacao.company.nome}
                  sx={{ width: isMobile ? 48 : 64, height: isMobile ? 48 : 64 }}
                />
              </Link>
            </Grid>
            
            <Grid item xs>
              <Link to={`/perfil/${cotacao.company.id}`} style={{ textDecoration: 'none' }}>
                <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                  {cotacao.company.nome}
                </Typography>
              </Link>

              <Chip
                label={status.text}
                color={status.color}
                size="small"
                sx={{ mb: 1 }}
              />

              <Box mt={1}>
                <Grid container spacing={isMobile ? 1 : 2} alignItems="center">
                  <Grid item>
                    <Typography
                      color="primary"
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        fontSize: isMobile ? '0.8rem' : '1rem',
                        cursor: 'pointer'
                      }}
                      onClick={toggleViewsModal}
                    >
                      <RemoveRedEye color="primary" sx={{ mr: 1 }} /> 
                      {cotacao.viewCount || 0} visualizações
                    </Typography>
                  </Grid>
                  
                  <Grid item>
                    <Typography
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: isMobile ? '0.8rem' : '1rem',
                        cursor: user?.id === cotacao?.company?.id ? 'pointer' : 'default',
                        color: 'primary.main',
                        textDecoration: 'none'
                      }}
                      component={user?.id === cotacao?.company?.id ? Link : 'div'}
                      to={user?.id === cotacao?.company?.id ? `/propostas/${id}/propostas` : undefined}
                    >
                      <Inbox color="warning" sx={{ mr: 1 }} />
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
                      sx={{ display: 'flex', alignItems: 'center' }}
                    >
                      <CalendarToday sx={{ mr: 1 }} /> 
                      Publicado em {new Date(cotacao.timestamp).toLocaleDateString('pt-PT')}
                    </Typography>
                  </Grid>
                  
                  <Grid item>
                    <Typography 
                      variant="body2"
                      color={isDateValid(cotacao.datalimite) ? 'primary.main' : 'error'}
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      {isDateValid(cotacao.datalimite) ? (
                        <CheckCircle fontSize="small" color="primary" />
                      ) : (
                        <AccessTime fontSize="small" color="error" />
                      )}
                      Data limite: {new Date(cotacao.datalimite).toLocaleDateString('pt-PT')}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
        
        {/* Action Buttons */}
        <CardActions sx={{ p: isMobile ? 1 : 2 }}>
          <Stack direction={isMobile ? 'column' : 'row'} spacing={isMobile ? 1 : 2} width="100%">
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleBaixarPedido}
              startIcon={<FileDownload />}
              fullWidth={isMobile}
            >
              {isMobile ? 'Baixar' : 'Baixar Pedido'}
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={handlePartilhar}
              startIcon={<Share />}
              fullWidth={isMobile}
            >
              Partilhar
            </Button>
            
            {cotacao.company.id != user.id && (
              <Button 
                variant="outlined" 
                color="error" 
                onClick={toggleDenunciaModal}
                startIcon={<Report />}
                fullWidth={isMobile}
              >
                Denunciar
              </Button>
            )}
            
            {/* Owner-specific actions */}
            {user.id === cotacao.company.id ? (
              <>
                <Button 
                  variant="contained" 
                  color="secondary" 
                  onClick={handleVerPropostas}
                  fullWidth={isMobile}
                >
                  {isMobile ? 'Propostas' : 'Ver Propostas'}
                </Button>

                {cotacao.status === "Fechada" || isCotacaoExpirada() ? (
                  <Typography variant="body2" color="error" sx={{ display: 'flex', alignItems: 'center' }}>
                    {cotacao.status === "Fechada" ? "Cotação fechada" : "Cotação expirada"}
                  </Typography>
                ) : (
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleFecharCotacao}
                    fullWidth={isMobile}
                  >
                    {isMobile ? 'Fechar' : 'Fechar Cotação'}
                  </Button>
                )}
              </>
            ) : (
              /* Non-owner actions */
              
              hasProposal ? (
                <Button 
                  variant="contained" 
                  color="info" 
                  component={Link}
                  to={`/minha_proposta/cotacao/${id}/proposta/${user.id}`}
                  fullWidth={isMobile}
                >
                  {isMobile ? 'Minha Proposta' : 'Ver Minha Proposta'}
                </Button>
              ) : (
                cotacao.status === "Fechada" || isCotacaoExpirada() ? (
                  <Typography variant="body2" color="error" sx={{ display: 'flex', alignItems: 'center' }}>
                    {cotacao.status === "Fechada" ? "Cotação fechada" : "Cotação expirada"}
                  </Typography>
                ) : (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleEnviarProposta}
                      fullWidth={isMobile}
                      disabled={isProposalLimitReached()}
                    >
                      {isMobile ? 'Enviar' : 'Enviar Proposta'}
                    </Button>
                    {isProposalLimitReached() && (
                      <Typography 
                        variant="body2" 
                        color="error" 
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <Info color="error" fontSize="small" />
                        Limite de {cotacao.proposalLimit} propostas atingido
                      </Typography>
                    )}
                  </>
                )
              )
            )}
          </Stack>
        </CardActions>
      </Card>

      {/* Cotação Details Cards */}
      <CotacaoDetailSection 
        title="Título"
        content={cotacao?.title || 'N/A'}
        isMobile={isMobile}
      />
      
      <CotacaoDetailSection 
        title="Descrição"
        content={
          <Typography dangerouslySetInnerHTML={{ __html: cotacao.description }} />
        }
        isMobile={isMobile}
      />
      
      <CotacaoDetailSection 
        title="Detalhes Financeiros"
        isMobile={isMobile}
        content={
          <>
            <Typography>Valor máximo: {cotacao?.valor || cotacao?.maxProposals}MT</Typography>
            <Typography>Limite de propostas: {cotacao?.proposalLimit || 'N/A'}</Typography>
          </>
        }
      />

      {/* Items Section */}
      <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Itens Solicitados
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {cotacao.items?.length > 0 ? (
            <Grid container spacing={2}>
              {cotacao.items.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <ItemCard item={item} isMobile={isMobile} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="textSecondary">Nenhum item disponível.</Typography>
          )}
        </CardContent>
      </Card>

      {/* Views Modal */}
      <ViewsModal 
        open={viewsModalOpen}
        onClose={toggleViewsModal}
        empresas={empresasQueVisualizaram}
        isMobile={isMobile}
      />

      {/* Report Modal */}
      <Dialog 
        open={denunciaModalOpen} 
        onClose={toggleDenunciaModal} 
        fullScreen={isMobile}
      >
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
          <Button onClick={toggleDenunciaModal}>
            Cancelar
          </Button>
          <Button onClick={handleDenunciar} color="error">
            Denunciar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Sub-components
const CotacaoDetailSection = ({ title, content, isMobile }) => (
  <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
    <CardContent>
      <Typography variant="h6" gutterBottom fontWeight="bold">
        {title}
      </Typography>
      <Divider sx={{ mb: 2 }} />
      {typeof content === 'string' ? (
        <Typography>{content}</Typography>
      ) : content}
    </CardContent>
  </Card>
);

const ItemCard = ({ item, isMobile }) => (
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
);

const ViewsModal = ({ open, onClose, empresas, isMobile }) => (
  <Modal open={open} onClose={onClose}>
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
      {empresas.length > 0 ? (
        <Grid container spacing={2}>
          {empresas.map((empresa) => (
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
                    '&:hover': { backgroundColor: '#f5f5f5' },
                  }}
                >
                  <Avatar 
                    src={empresa.logoUrl} 
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
        <Button variant="contained" onClick={onClose}>
          Fechar
        </Button>
      </Box>
    </Box>
  </Modal>
);

export default CotacaoDetalhesDesk;
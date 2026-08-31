import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ref, onValue, increment, update, push, set, get } from 'firebase/database';
import { db } from '../../fb';
import AdsClick from '@mui/icons-material/AdsClick';
import Inbox from '@mui/icons-material/Inbox';
import RemoveRedEye from '@mui/icons-material/RemoveRedEye';
import Share from '@mui/icons-material/Share';
import FileDownload from '@mui/icons-material/FileDownload';
import Timelapse from '@mui/icons-material/Timelapse';
import CalendarToday from '@mui/icons-material/CalendarToday';
import AccessTime from '@mui/icons-material/AccessTime';
import Report from '@mui/icons-material/Report';
import CheckCircle from '@mui/icons-material/CheckCircle';
import Business from '@mui/icons-material/Business';
import Storefront from '@mui/icons-material/Storefront';
import Description from '@mui/icons-material/Description';
import AttachMoney from '@mui/icons-material/AttachMoney';
import Inventory from '@mui/icons-material/Inventory';
import LocalShipping from '@mui/icons-material/LocalShipping';
import Schedule from '@mui/icons-material/Schedule';
import Verified from '@mui/icons-material/Verified';
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
  Paper,
  Container,
} from '@mui/material';
import BackButton from '../BackButton';
import { formatPrice } from '../../utils/utils';
import { Info, AlertCircle, Clock, Eye, MessageSquare, Award } from 'lucide-react';
import Star from 'lucide-react/icons/star';

/* ── Design Tokens (mesmos da hero) ───────────────────────────────────── */
const T = {
  navy:     '#08192E',
  navyMid:  '#0E2849',
  navyLight:'#183A63',
  gold:     '#C8903A',
  goldLight:'#E8B96A',
  goldPale: '#FDF3E3',
  cream:    '#FAFAF7',
  white:    '#FFFFFF',
  text:     '#0F1C2D',
  textMid:  '#3D5A7A',
  textSub:  '#6B89A5',
  border:   '#E0E8F0',
  borderMid:'#C5D4E3',
  surface:  '#F4F7FB',
};

/* ── Keyframes (mesmos da hero) ───────────────────────────────────────── */
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.85); }
  }
  .animate-fade-up {
    animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) both;
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease both;
  }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.22s; }
  .delay-3 { animation-delay: 0.34s; }
  .delay-4 { animation-delay: 0.46s; }
  .delay-5 { animation-delay: 0.58s; }
  
  .cotacao-card {
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .cotacao-card:hover {
    transform: translateY(-4px);
    border-color: ${T.gold} !important;
    box-shadow: 0 16px 48px rgba(8,25,46,0.1) !important;
  }
  .item-card {
    transition: all 0.25s ease;
  }
  .item-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(8,25,46,0.08) !important;
  }
  .action-btn {
    transition: all 0.2s ease;
  }
  .action-btn:hover {
    transform: translateY(-1px);
  }
  .status-chip {
    transition: all 0.2s ease;
  }
`;

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
  const [loading, setLoading] = useState(true);

  // Data fetching
  useEffect(() => {
    const cotacaoRef = ref(db, `cotacoes/${id}`);
    const viewsRef = ref(db, `cotacoes/${id}/views/${user?.id}`);
    const proposalsRef = ref(db, `cotacoes/${id}/proposals/${user?.id}`);

    // Track view if not the owner
    const trackView = async () => {
      try {
        if (cotacao?.company?.id !== user?.id) {
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
        if (!data) {
          setLoading(false);
          return;
        }
        setCotacao(data);
        setLoading(false);
        
        if (user) trackView();

        // Process proposals
        if (data.proposals) {
          const propostasArray = Object.entries(data.proposals).map(([id, proposta]) => ({
            id,
            ...proposta
          }));
          setPropostas(propostasArray);
        }

        // Process views
        if (data.views && user) {
          const fetchViewingCompanies = async () => {
            const empresasPromises = Object.keys(data.views)
              .filter(empresaId => empresaId !== user?.id)
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
      if (!user) return () => {};
      return onValue(proposalsRef, (snapshot) => {
        setHasProposal(snapshot.exists());
      });
    };

    const unsubscribeCotacao = fetchCotacao();
    const unsubscribeProposal = user ? checkUserProposal() : () => {};

    return () => {
      unsubscribeCotacao();
      unsubscribeProposal();
    };
  }, [id, user?.id]);

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

  const getTimeRemaining = () => {
    if (!cotacao?.datalimite) return null;
    const now = new Date();
    const limit = new Date(cotacao.datalimite);
    const diffTime = limit - now;
    
    if (diffTime <= 0) return 'Expirada';
    
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) return `${diffDays}d ${diffHours}h restantes`;
    if (diffHours > 0) return `${diffHours}h restantes`;
    return 'Menos de 1h';
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
        await set(push(ref(db, 'denuncias/cotacao')), {
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

  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          background: T.cream,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontFamily: '"Plus Jakarta Sans", sans-serif'
        }}
      >
        <style>{KEYFRAMES}</style>
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 48, height: 48,
              borderRadius: '50%',
              border: `3px solid ${T.border}`,
              borderTopColor: T.gold,
              animation: 'fadeUp 0.8s infinite linear',
              mx: 'auto',
              mb: 2
            }}
          />
          <Typography sx={{ color: T.textSub }}>Carregando detalhes da cotação...</Typography>
        </Box>
      </Box>
    );
  }

  if (!cotacao) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          background: T.cream,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontFamily: '"Plus Jakarta Sans", sans-serif'
        }}
      >
        <style>{KEYFRAMES}</style>
        <Paper 
          sx={{ 
            p: 6, 
            textAlign: 'center',
            borderRadius: '24px',
            border: `1px solid ${T.border}`,
            maxWidth: 400
          }}
        >
          <AlertCircle size={48} color={T.gold} />
          <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', mt: 2, color: T.text }}>
            Cotação não encontrada
          </Typography>
          <Typography sx={{ color: T.textSub, mt: 1, mb: 3 }}>
            A cotação que procura não existe ou foi removida.
          </Typography>
          <Button
            onClick={() => navigate('/cotacoes')}
            variant="contained"
            sx={{
              bgcolor: T.gold,
              color: T.white,
              '&:hover': { bgcolor: T.goldLight },
              borderRadius: '12px',
              px: 4,
              py: 1.5,
              textTransform: 'none'
            }}
          >
            Ver todas as cotações
          </Button>
        </Paper>
      </Box>
    );
  }

  // Status determination
  const status = isCotacaoExpirada() 
    ? { text: 'Expirada', color: 'warning', bg: '#FEF3C7', textColor: '#92400E' } 
    : cotacao.status === 'open' || cotacao.status === 'Aberta'
      ? { text: 'Aberta', color: 'success', bg: '#D1FAE5', textColor: '#065F46' } 
      : { text: 'Fechada', color: 'error', bg: '#FEE2E2', textColor: '#991B1B' };

  const isOwner = user?.id === cotacao.company?.id;

  return (
    <Box 
      sx={{ 
        backgroundColor: T.cream, 
        minHeight: '100vh',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
      }}
    >
      <style>{KEYFRAMES}</style>
      
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        <BackButton sx={{ mb: 2 }} />
        
        {/* Header Section com design da hero */}
        <Box
          className="animate-fade-up"
          sx={{
            background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyLight} 100%)`,
            borderRadius: '24px',
            p: { xs: 3, md: 4 },
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background decorations (mesmos da hero) */}
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 80% 60% at 90% 10%, rgba(200,144,58,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 50% 50% at 5% 90%, rgba(200,144,58,0.07) 0%, transparent 50%)
            `,
          }} />
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.035,
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
          }} />

          <Grid container spacing={2} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid item>
              <Link to={`/perfil/${cotacao.company.id}`}>
                <Avatar
                  src={cotacao.company.logoUrl}
                  alt={cotacao.company.nome}
                  sx={{ 
                    width: isMobile ? 56 : 80, 
                    height: isMobile ? 56 : 80,
                    border: `3px solid ${T.gold}`,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                  }}
                />
              </Link>
            </Grid>
            
            <Grid item xs>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                <Chip
                  label={status.text}
                  sx={{
                    bgcolor: status.bg,
                    color: status.textColor,
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                  }}
                  size="small"
                />
                {cotacao.company.verified && (
                  <Chip
                    icon={<Verified style={{ fontSize: 14, color: T.gold }} />}
                    label="Verificada"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(200,144,58,0.1)',
                      color: T.gold,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  />
                )}
              </Box>

              <Link to={`/perfil/${cotacao.company.id}`} style={{ textDecoration: 'none' }}>
                <Typography 
                  variant={isMobile ? "h6" : "h5"} 
                  sx={{ 
                    fontWeight: 700, 
                    color: T.white,
                    fontFamily: '"Playfair Display", serif',
                    mb: 1,
                  }}
                >
                  {cotacao.company.nome}
                </Typography>
              </Link>

              <Box sx={{ display: 'flex', gap: { xs: 2, md: 4 }, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Eye size={18} color={T.gold} />
                  <Typography 
                    onClick={toggleViewsModal}
                    sx={{ 
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      '&:hover': { color: T.gold }
                    }}
                  >
                    {cotacao.viewCount || 0} visualizações
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <MessageSquare size={18} color={T.gold} />
                  <Typography 
                    sx={{ 
                      color: 'rgba(255,255,255,0.8)',
                      fontSize: '0.85rem',
                      cursor: isOwner ? 'pointer' : 'default',
                      '&:hover': isOwner ? { color: T.gold } : {}
                    }}
                    onClick={isOwner ? handleVerPropostas : undefined}
                  >
                    {propostas.length} {propostas.length === 1 ? 'proposta' : 'propostas'}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Clock size={18} color={T.gold} />
                  <Typography 
                    sx={{ 
                      color: isDateValid(cotacao.datalimite) ? 'rgba(255,255,255,0.8)' : T.goldLight,
                      fontSize: '0.85rem',
                    }}
                  >
                    {getTimeRemaining()}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Action Buttons - Estilo hero */}
        <Paper
          className="animate-fade-up delay-1"
          sx={{
            p: { xs: 2, md: 3 },
            mb: 4,
            borderRadius: '20px',
            border: `1px solid ${T.border}`,
            background: T.white,
          }}
        >
          <Stack 
            direction={isMobile ? 'column' : 'row'} 
            spacing={2} 
            justifyContent="space-between"
            alignItems={isMobile ? 'stretch' : 'center'}
          >
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <Button 
                variant="contained" 
                onClick={handleBaixarPedido}
                startIcon={<FileDownload />}
                className="action-btn"
                sx={{
                  bgcolor: T.navy,
                  color: T.white,
                  '&:hover': { bgcolor: T.navyLight },
                  borderRadius: '12px',
                  px: 3,
                  py: 1.2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Baixar Pedido
              </Button>
              
              <Button 
                variant="outlined" 
                onClick={handlePartilhar}
                startIcon={<Share />}
                className="action-btn"
                sx={{
                  borderColor: T.borderMid,
                  color: T.textMid,
                  '&:hover': { borderColor: T.gold, color: T.gold },
                  borderRadius: '12px',
                  px: 3,
                  py: 1.2,
                  textTransform: 'none',
                  fontWeight: 600,
                }}
              >
                Partilhar
              </Button>
              
              {!isOwner && (
                <Button 
                  variant="outlined" 
                  onClick={toggleDenunciaModal}
                  startIcon={<Report />}
                  className="action-btn"
                  sx={{
                    borderColor: T.borderMid,
                    color: '#DC2626',
                    '&:hover': { borderColor: '#DC2626', bgcolor: '#FEE2E2' },
                    borderRadius: '12px',
                    px: 3,
                    py: 1.2,
                    textTransform: 'none',
                    fontWeight: 600,
                  }}
                >
                  Denunciar
                </Button>
              )}
            </Stack>

            {/* Owner/Non-owner actions */}
            <Stack direction={isMobile ? 'column' : 'row'} spacing={2}>
              {isOwner ? (
                <>
                  <Button 
                    variant="contained" 
                    onClick={handleVerPropostas}
                    className="action-btn"
                    sx={{
                      bgcolor: T.gold,
                      color: T.white,
                      '&:hover': { bgcolor: T.goldLight },
                      borderRadius: '12px',
                      px: 4,
                      py: 1.2,
                      textTransform: 'none',
                      fontWeight: 600,
                    }}
                  >
                    Ver Propostas ({propostas.length})
                  </Button>

                  {cotacao.status !== "Fechada" && !isCotacaoExpirada() && (
                    <Button
                      variant="contained"
                      onClick={handleFecharCotacao}
                      className="action-btn"
                      sx={{
                        bgcolor: '#DC2626',
                        color: T.white,
                        '&:hover': { bgcolor: '#B91C1C' },
                        borderRadius: '12px',
                        px: 4,
                        py: 1.2,
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Fechar Cotação
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {hasProposal ? (
                    <Button 
                      variant="contained" 
                      component={Link}
                      to={`/minha_proposta/cotacao/${id}/proposta/${user?.id}`}
                      className="action-btn"
                      sx={{
                        bgcolor: T.gold,
                        color: T.white,
                        '&:hover': { bgcolor: T.goldLight },
                        borderRadius: '12px',
                        px: 4,
                        py: 1.2,
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      Ver Minha Proposta
                    </Button>
                  ) : (
                    cotacao.status !== "Fechada" && !isCotacaoExpirada() && (
                      <Button
                        variant="contained"
                        onClick={handleEnviarProposta}
                        disabled={isProposalLimitReached()}
                        className="action-btn"
                        sx={{
                          bgcolor: T.gold,
                          color: T.white,
                          '&:hover': { bgcolor: T.goldLight },
                          '&.Mui-disabled': { bgcolor: T.borderMid },
                          borderRadius: '12px',
                          px: 4,
                          py: 1.2,
                          textTransform: 'none',
                          fontWeight: 600,
                        }}
                      >
                        Enviar Proposta
                      </Button>
                    )
                  )}
                </>
              )}
            </Stack>
          </Stack>

          {isProposalLimitReached() && !isOwner && (
            <Box 
              sx={{ 
                mt: 2, 
                p: 2, 
                bgcolor: '#FEF3C7', 
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <Info size={18} color={T.gold} />
              <Typography sx={{ color: '#92400E', fontSize: '0.9rem' }}>
                Limite de {cotacao.proposalLimit} propostas atingido para esta cotação
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Título da Cotação */}
        <CotacaoDetailSection 
          title="Título da Cotação"
          icon={<Description style={{ color: T.gold }} />}
          delay="2"
        >
          <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: T.text }}>
            {cotacao?.title || 'N/A'}
          </Typography>
        </CotacaoDetailSection>
        
        {/* Descrição */}
        <CotacaoDetailSection 
          title="Descrição Detalhada"
          icon={<Description style={{ color: T.gold }} />}
          delay="3"
        >
          <Typography 
            dangerouslySetInnerHTML={{ __html: cotacao.description }} 
            sx={{ color: T.textMid, lineHeight: 1.8 }}
          />
        </CotacaoDetailSection>
        
        {/* Detalhes Financeiros */}
        <CotacaoDetailSection 
          title="Detalhes Financeiros"
          icon={<AttachMoney style={{ color: T.gold }} />}
          delay="4"
        >
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <Box 
                sx={{ 
                  p: 3, 
                  bgcolor: T.surface, 
                  borderRadius: '16px',
                  border: `1px solid ${T.border}`,
                }}
              >
                <Typography sx={{ color: T.textSub, fontSize: '0.85rem', mb: 1 }}>
                  Valor Máximo
                </Typography>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: T.gold }}>
                  {cotacao?.valor || cotacao?.maxProposals || 0} MT
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box 
                sx={{ 
                  p: 3, 
                  bgcolor: T.surface, 
                  borderRadius: '16px',
                  border: `1px solid ${T.border}`,
                }}
              >
                <Typography sx={{ color: T.textSub, fontSize: '0.85rem', mb: 1 }}>
                  Limite de Propostas
                </Typography>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: T.navy }}>
                  {cotacao?.proposalLimit || 'Ilimitado'}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CotacaoDetailSection>

        {/* Itens Solicitados */}
        <Box className="animate-fade-up delay-5">
          <Paper
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: '20px',
              border: `1px solid ${T.border}`,
              background: T.white,
              mb: 4,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Inventory style={{ color: T.gold }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: T.text, fontFamily: '"Playfair Display", serif' }}>
                Itens Solicitados
              </Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />
            
            {cotacao.items?.length > 0 ? (
              <Grid container spacing={3}>
                {cotacao.items.map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <ItemCard item={item} isMobile={isMobile} />
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Storefront style={{ fontSize: 48, color: T.borderMid }} />
                <Typography sx={{ color: T.textSub, mt: 2 }}>
                  Nenhum item disponível para esta cotação.
                </Typography>
              </Box>
            )}
          </Paper>
        </Box>

        {/* Informações Adicionais */}
        <Paper
          className="animate-fade-up delay-5"
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: '20px',
            border: `1px solid ${T.border}`,
            background: T.white,
          }}
        >
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CalendarToday sx={{ color: T.gold }} />
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: T.textSub }}>
                    Publicado em
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: T.text }}>
                    {new Date(cotacao.timestamp).toLocaleDateString('pt-PT')}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <AccessTime sx={{ color: T.gold }} />
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: T.textSub }}>
                    Data Limite
                  </Typography>
                  <Typography 
                    sx={{ 
                      fontSize: '0.9rem', 
                      fontWeight: 600, 
                      color: isDateValid(cotacao.datalimite) ? T.text : '#DC2626' 
                    }}
                  >
                    {new Date(cotacao.datalimite).toLocaleDateString('pt-PT')}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Business sx={{ color: T.gold }} />
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: T.textSub }}>
                    Empresa
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: T.text }}>
                    {cotacao.company?.nome || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <LocalShipping sx={{ color: T.gold }} />
                <Box>
                  <Typography sx={{ fontSize: '0.75rem', color: T.textSub }}>
                    Categoria
                  </Typography>
                  <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: T.text }}>
                    {cotacao.category || 'Geral'}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>

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
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: T.text }}>
          Denunciar Cotação
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: T.textSub, mb: 2, fontSize: '0.9rem' }}>
            Por favor, indique o motivo da denúncia. A sua reclamação será analisada pela nossa equipa.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Descreva o motivo da denúncia..."
            value={motivoDenuncia}
            onChange={(e) => setMotivoDenuncia(e.target.value)}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '&:hover fieldset': {
                  borderColor: T.gold,
                },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={toggleDenunciaModal}
            sx={{
              color: T.textSub,
              '&:hover': { bgcolor: 'transparent', color: T.text },
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDenunciar} 
            variant="contained"
            sx={{
              bgcolor: '#DC2626',
              color: T.white,
              '&:hover': { bgcolor: '#B91C1C' },
              borderRadius: '10px',
              px: 4,
              py: 1,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            Enviar Denúncia
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Sub-components
const CotacaoDetailSection = ({ title, children, icon, delay = "1" }) => (
  <Box className={`animate-fade-up delay-${delay}`}>
    <Paper
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: '20px',
        border: `1px solid ${T.border}`,
        background: T.white,
        mb: 4,
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: T.gold,
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        {icon}
        <Typography variant="h6" sx={{ fontWeight: 700, color: T.text, fontFamily: '"Playfair Display", serif' }}>
          {title}
        </Typography>
      </Box>
      <Divider sx={{ mb: 3 }} />
      {children}
    </Paper>
  </Box>
);

const ItemCard = ({ item, isMobile }) => (
  <Paper
    className="item-card"
    elevation={0}
    sx={{
      borderRadius: '16px',
      border: `1px solid ${T.border}`,
      overflow: 'hidden',
      transition: 'all 0.25s ease',
    }}
  >
    <Box
      component="img"
      src={item.imageUrl || 'https://via.placeholder.com/300x200?text=Sem+Imagem'}
      alt={item.name}
      sx={{
        width: '100%',
        height: isMobile ? 140 : 180,
        objectFit: 'cover',
      }}
    />
    <Box sx={{ p: 2 }}>
      <Typography 
        variant="body1" 
        sx={{ 
          fontWeight: 700, 
          color: T.text,
          mb: 0.5,
          fontFamily: '"Plus Jakarta Sans", sans-serif',
        }}
      >
        {item.name}
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          color: T.textSub,
          fontSize: '0.8rem',
          mb: 1,
          display: '-webkit-box',
          overflow: 'hidden',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
        }}
      >
        {item.description || 'Sem descrição disponível'}
      </Typography>
      {item.quantity && (
        <Chip
          label={`Qtd: ${item.quantity}`}
          size="small"
          sx={{
            bgcolor: T.goldPale,
            color: T.gold,
            fontWeight: 600,
            fontSize: '0.7rem',
          }}
        />
      )}
    </Box>
  </Paper>
);

const ViewsModal = ({ open, onClose, empresas, isMobile }) => (
  <Modal open={open} onClose={onClose}>
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: T.white,
        boxShadow: 24,
        p: isMobile ? 3 : 4,
        borderRadius: '24px',
        width: isMobile ? '95%' : '80%',
        maxWidth: 600,
        maxHeight: '80%',
        overflowY: 'auto',
        border: `1px solid ${T.border}`,
      }}
    >
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 700, 
          color: T.text,
          fontFamily: '"Playfair Display", serif',
          mb: 2
        }}
      >
        Empresas que visualizaram
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {empresas.length > 0 ? (
        <Grid container spacing={2}>
          {empresas.map((empresa) => (
            <Grid item xs={12} sm={6} key={empresa.id}>
              <Link to={`/perfil/${empresa.id}`} style={{ textDecoration: 'none' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 2,
                    border: `1px solid ${T.border}`,
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { 
                      borderColor: T.gold,
                      bgcolor: T.goldPale,
                    },
                  }}
                >
                  <Avatar 
                    src={empresa.logoUrl} 
                    alt={empresa.nome} 
                    sx={{ 
                      mr: 2, 
                      width: 40, 
                      height: 40,
                      border: `2px solid ${T.gold}`,
                    }} 
                  />
                  <Box>
                    <Typography sx={{ fontWeight: 600, color: T.text, fontSize: '0.9rem' }}>
                      {empresa.nome || 'Empresa Desconhecida'}
                    </Typography>
                    {empresa.sector && (
                      <Typography sx={{ fontSize: '0.7rem', color: T.textSub }}>
                        {empresa.sector}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Link>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Eye size={48} color={T.borderMid} />
          <Typography sx={{ color: T.textSub, mt: 2 }}>
            Nenhuma empresa visualizou esta cotação ainda.
          </Typography>
        </Box>
      )}
      
      <Box mt={4} textAlign="right">
        <Button 
          variant="contained" 
          onClick={onClose}
          sx={{
            bgcolor: T.gold,
            color: T.white,
            '&:hover': { bgcolor: T.goldLight },
            borderRadius: '10px',
            px: 4,
            py: 1,
            textTransform: 'none',
            fontWeight: 600,
          }}
        >
          Fechar
        </Button>
      </Box>
    </Box>
  </Modal>
);

export default CotacaoDetalhesDesk;

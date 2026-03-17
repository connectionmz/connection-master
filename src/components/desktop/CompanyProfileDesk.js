import React, { useEffect, useState } from 'react';
import { 
  VerifiedRounded, MoreHoriz, Twitter, Instagram, LinkedIn, 
  Logout, Edit, CameraAlt, Language, Store, RequestQuote, 
  Message, Phone, WhatsApp, Facebook, Email, Report, Block, LockOpen,
  LinkOff, Code, Article, Info, Home, X, LocationOn, 
  Business, Work, CalendarToday, RemoveRedEye, People,
  CheckCircle, Warning, Close, Share
} from "@mui/icons-material";
import { useNavigate, useParams } from 'react-router-dom';
import { get, ref, update, push, set, onValue, remove, query, orderByChild, equalTo } from 'firebase/database';
import { auth, db } from '../../fb';
import PostGallery from '../PostGallery';
import noPhoto from '../../img/noimage.jpg';
import {
  Box,
  Button,
  Typography,
  Tabs,
  Tab,
  Avatar,
  Grid,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  useMediaQuery,
  Paper,
  Skeleton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  TextField,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  FormLabel,
  Chip,
  Divider,
  Container,
  Badge,
  Fade,
  Stack,
  ListItemText,
} from '@mui/material';
import { saveContentToInbox } from '../SaveToInbox';
import PostDetailPageDesk from './PostDetailPageDesk';
import VetrineDesk from './VetrineDesk';
import BackButton from '../BackButton';

/* ── Design tokens — consistente com StoresDesk ─────────────────────── */
const T = {
  navy:        '#08192E',
  navyMid:     '#0E2849',
  navyLight:   '#183A63',
  navyCard:    '#0D2240',
  gold:        '#C8903A',
  goldLight:   '#E8B96A',
  goldPale:    '#FDF3E3',
  white:       '#FFFFFF',
  text:        '#0F1C2D',
  textSub:     '#6B89A5',
  border:      '#E0E8F0',
  borderMid:   '#C5D4E3',
  surface:     '#F4F7FB',
  darkBorder:  'rgba(255,255,255,0.08)',
  darkBorderMid:'rgba(255,255,255,0.14)',
  darkText:    'rgba(255,255,255,0.88)',
  darkTextSub: 'rgba(255,255,255,0.52)',
  darkMuted:   'rgba(255,255,255,0.30)',
  success:     '#10b981',
  error:       '#ef4444',
  warning:     '#f59e0b',
};

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes pulse {
    0%,100% { opacity:1; transform:scale(1); }
    50% { opacity:.6; transform:scale(1.05); }
  }
  .fade-up {
    animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .profile-card {
    background: ${T.navyCard};
    border: 1px solid ${T.darkBorder};
    border-radius: 20px;
    transition: transform 0.2s ease, border-color 0.2s ease;
  }
  .profile-card:hover {
    border-color: ${T.gold} !important;
  }
  .cover-photo {
    position: relative;
    overflow: hidden;
    border-radius: 20px 20px 0 0;
  }
  .cover-photo::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: linear-gradient(to top, ${T.navyCard} 0%, transparent 100%);
    pointer-events: none;
  }
`;

const BG_GRID = {
  position:'absolute', inset:0, pointerEvents:'none', opacity:0.02,
  backgroundImage:`linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)`,
  backgroundSize:'56px 56px',
};

// Função utilitária para sanitizar paths do Firebase
const sanitizeFirebasePath = (str) => {
  if (!str || typeof str !== 'string') return '';
  
  // Substitui todos os caracteres inválidos por underscore
  // Caracteres inválidos: . # $ [ ] (espaço) vírgula ponto e vírgula apóstrofo
  return str.replace(/[.#$\[\] ,;'"]/g, '_');
};

// Exemplo de uso:
// "Ntheko Quality Multiserviços, Lda." -> "Ntheko_Quality_Multiserviços__Lda_"

const CompanyProfile = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inicio');
  const [userData, setUserData] = useState(null);
  const [mCompany, setmCompany] = useState(null);
  const [social, setSocial] = useState({ twitter: '', linkedin: '', instagram: '', website: '' });
  const [loading, setLoading] = useState(true);
  const [cotacoes, setCotacoes] = useState([]);
  const [modules, setModules] = useState({});
  const [smsLimit, setSmsLimit] = useState(0);
  const [companyId, setCompanyId] = useState(null);
  const [posts, setPosts] = useState([]);
  const [visits, setVisits] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');
  const isTablet = useMediaQuery('(max-width:900px)');
  const [error, setError] = useState(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openDisconnectDialog, setOpenDisconnectDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [openBlockDialog, setOpenBlockDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);
  const [shareAnchorEl, setShareAnchorEl] = useState(null);

  const blockReasons = [
    "Conteúdo inadequado",
    "Spam ou mensagens indesejadas",
    "Problemas pessoais",
    "Empresa desnecessária",
    "Outro motivo"
  ];

  const reportReasons = [
    "Conteúdo ofensivo",
    "Informações falsas",
    "Comportamento inadequado",
    "Violação de termos",
    "Outro motivo"
  ];

  // Check if company is blocked - com sanitização
  useEffect(() => {
    if (user && companyId) {
      const sanitizedPath = sanitizeFirebasePath(companyId);
      const blockedRef = ref(db, `blocked/${user.id}/${sanitizedPath}`);
      const unsubscribe = onValue(blockedRef, (snapshot) => {
        setIsBlocked(snapshot.exists());
      }, (error) => {
        console.error("Erro ao verificar bloqueio:", error);
      });
      return () => unsubscribe();
    }
  }, [user, companyId]);

  useEffect(() => {
    if (id) {
      if (user && user.id === id) {
        navigate('/perfil');
        return;
      }

      const fetchData = async () => {
        try {
          setLoading(true);
          
          // 1️⃣ Tentar primeiro como ID direto
          let companyId = id;
          let companyData = null;
          
          const directRef = ref(db, `company/${id}`);
          const directSnapshot = await get(directRef);
          
          if (directSnapshot.exists()) {
            companyData = directSnapshot.val();
            companyId = id;
            console.log("Empresa encontrada por ID direto:", companyId);
          } else {
            // 2️⃣ Se não encontrar como ID, procurar pelo nome
            const companyRef = ref(db, "company");
            const companyQuery = query(
              companyRef,
              orderByChild("slug"),
              equalTo(id)
            );
            const snapshot = await get(companyQuery);

            if (!snapshot.exists()) {
              setError('Empresa não encontrada.');
              setOpenSnackbar(true);
              navigate('/empresa-nao-encontrada');
              return;
            }

            const data = snapshot.val();
            companyId = Object.keys(data)[0];
            companyData = data[companyId];
          }

          setCompanyId(companyId);

          // 3️⃣ Buscar dados relacionados
          const socialRef = ref(db, `company/${companyId}/social`);
          const postsRef = ref(db, `posts`);
          const cotacoesRef = ref(db, `cotacoes`);
          const visitasRef = ref(db, `company/${companyId}/visitas`);

          const [
            socialSnapshot,
            cotacoesSnapshot,
            postsSnapshot,
            visitasSnapshot
          ] = await Promise.all([
            get(socialRef),
            get(cotacoesRef),
            get(postsRef),
            get(visitasRef)
          ]);

          setmCompany(companyData);

          setUserData({
            ...companyData,
            photoURL: companyData?.logoUrl || "https://via.placeholder.com/150",
            coverPhotoURL: companyData?.coverUrl,
            displayName: companyData.nome || 'A carregar',
            username: companyId,
            endereco: companyData.endereco || 'A carregar'
          });

          setModules(companyData.activeModules || {});
          setSmsLimit(companyData.activeModules?.moduloSMS?.limit || 0);

          // Registrar visita
          if (user) {
            const newVisitRef = push(visitasRef);
            await update(newVisitRef, {
              visitorId: user.id,
              visitorName: user.nome,
              timestamp: new Date().toISOString()
            });
          }

          if (socialSnapshot.exists()) {
            setSocial(socialSnapshot.val());
          }

          if (postsSnapshot.exists()) {
            const postsData = postsSnapshot.val();
            const filteredPosts = Object.values(postsData)
              .filter(post => post.company && post.company.id === companyId);
            setPosts(filteredPosts);
          }

          if (cotacoesSnapshot.exists()) {
            const cotacoesData = cotacoesSnapshot.val();
            const userCotacoes = Object.keys(cotacoesData)
              .filter(key =>
                cotacoesData[key].company &&
                cotacoesData[key].company.id === companyId
              );
            setCotacoes(userCotacoes.map(key => cotacoesData[key]));
          }

          if (visitasSnapshot.exists()) {
            setVisits(Object.values(visitasSnapshot.val()));
          }

        } catch (error) {
          console.error('Error fetching data: ', error);
          setError('Erro ao carregar dados.');
          setOpenSnackbar(true);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [id, navigate, user]);

  // Check connection status - com sanitização
  useEffect(() => {
    if (!user || !companyId) return;
    
    const sanitizedPath = sanitizeFirebasePath(companyId);
    const connectionRef = ref(db, `connections/${sanitizedPath}/${user.id}`);
    
    const unsubscribe = onValue(connectionRef, (snapshot) => {
      if (snapshot.exists()) {
        setConnectionStatus(snapshot.val().status);
      } else {
        setConnectionStatus(null);
      }
    }, (error) => {
      console.error("Erro ao verificar status de conexão:", error);
    });

    return () => unsubscribe();
  }, [companyId, user]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleShareOpen = (event) => {
    setShareAnchorEl(event.currentTarget);
  };

  const handleShareClose = () => {
    setShareAnchorEl(null);
  };

  const handleShare = (platform) => {
    const url = window.location.href;
    const text = `Confira o perfil de ${userData?.displayName} no Connection Mozambique`;
    
    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      setError('Link copiado!');
      setOpenSnackbar(true);
      handleShareClose();
      return;
    }

    const shareUrls = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(text + ' - ' + url)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
    };

    window.open(shareUrls[platform], '_blank', 'noopener,noreferrer');
    handleShareClose();
  };

  const handleOpenReportDialog = () => {
    setOpenReportDialog(true);
    handleMenuClose();
  };

  const handleCloseReportDialog = () => {
    setOpenReportDialog(false);
    setReportReason('');
    setCustomReason('');
  };

  const handleOpenBlockDialog = () => {
    setOpenBlockDialog(true);
    handleMenuClose();
  };

  const handleCloseBlockDialog = () => {
    setOpenBlockDialog(false);
    setBlockReason('');
    setCustomReason('');
  };

  const handleOpenDisconnectDialog = () => {
    setOpenDisconnectDialog(true);
  };

  const handleCloseDisconnectDialog = () => {
    setOpenDisconnectDialog(false);
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleConectar = async () => {
    if (!companyId || isBlocked || !user) {
      setError("Você precisa estar logado para conectar-se a empresas.");
      setOpenSnackbar(true);
      return;
    }

    const currentUserId = user.id;
    const sanitizedPath = sanitizeFirebasePath(companyId);
    const targetUserConnectionRef = ref(db, `connections/${sanitizedPath}/${currentUserId}`);

    const connectionRequest = {
      requestedBy: currentUserId,
      requestedTo: companyId,
      fromLogo: user.logoUrl,
      fromUserName: user.nome,
      status: "pending",
      requestedAt: new Date().toISOString(),
    };

    const notification = {
      type: "connection_request",
      message: `Você recebeu uma solicitação de conexão de ${user.nome}`,
      fromUserId: user.id,
      fromUserName: user.nome,
      link: `/perfil/${user.id}`,
      timestamp: new Date().toISOString(),
      status: "unread",
    };

    try {
      await set(targetUserConnectionRef, connectionRequest);
      await saveContentToInbox(companyId, notification);
      setError("Solicitação de conexão enviada com sucesso!");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      setError("Erro ao tentar enviar a solicitação. Tente novamente.");
      setOpenSnackbar(true);
    }
  };

  const handleCancelarConexao = async () => {
    if (!user || !companyId) return;
    
    const sanitizedPath = sanitizeFirebasePath(companyId);
    const targetUserConnectionRef = ref(db, `connections/${sanitizedPath}/${user.id}`);
    
    try {
      await remove(targetUserConnectionRef);
      setError("Solicitação de conexão cancelada com sucesso!");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Erro ao cancelar a solicitação:", error);
      setError("Erro ao tentar cancelar a solicitação. Tente novamente.");
      setOpenSnackbar(true);
    }
  };

  const handleDesconectar = async () => {
    if (!companyId || !user) return;

    const currentUserId = user.id;
    const sanitizedPath = sanitizeFirebasePath(companyId);
    const targetUserConnectionRef = ref(db, `connections/${sanitizedPath}/${currentUserId}`);
    const reciprocalConnectionRef = ref(db, `connections/${currentUserId}/${sanitizedPath}`);

    try {
      await remove(targetUserConnectionRef);
      await remove(reciprocalConnectionRef);
      
      setConnectionStatus(null);
      
      await saveContentToInbox(companyId, {
        type: "connection_disconnect",
        message: `${user.nome} desconectou-se da sua empresa`,
        fromUserId: currentUserId,
        fromUserName: user.nome,
        timestamp: new Date().toISOString(),
        status: "unread",
        link: `/perfil/${currentUserId}`
      });

      setError("Desconectado com sucesso!");
      setOpenSnackbar(true);
      handleCloseDisconnectDialog();
    } catch (error) {
      console.error("Erro ao desconectar:", error);
      setError("Erro ao tentar desconectar. Tente novamente.");
      setOpenSnackbar(true);
      handleCloseDisconnectDialog();
    }
  };

  const handleSubmitReport = async () => {
    if (!user) {
      setError("Você precisa estar logado para reportar uma empresa.");
      setOpenSnackbar(true);
      handleCloseReportDialog();
      return;
    }

    if (!reportReason) {
      setError("Por favor, selecione um motivo");
      setOpenSnackbar(true);
      return;
    }

    try {
      const sanitizedPath = sanitizeFirebasePath(companyId);
      const reportRef = push(ref(db, `reports/${sanitizedPath}`));
      await set(reportRef, {
        reportedBy: user.id,
        reportedByName: user.nome,
        reason: reportReason,
        customReason: customReason,
        timestamp: new Date().toISOString(),
        status: "pending",
        companyName: userData?.displayName
      });

      setError("Denúncia enviada com sucesso. Obrigado pelo feedback!");
      setOpenSnackbar(true);
      handleCloseReportDialog();
    } catch (error) {
      console.error("Erro ao enviar denúncia:", error);
      setError("Erro ao enviar denúncia. Tente novamente.");
      setOpenSnackbar(true);
    }
  };

  const handleBlockCompany = async () => {
    if (!user) {
      setError("Você precisa estar logado para bloquear uma empresa.");
      setOpenSnackbar(true);
      handleCloseBlockDialog();
      return;
    }

    if (!blockReason) {
      setError("Por favor, selecione um motivo");
      setOpenSnackbar(true);
      return;
    }

    try {
      const sanitizedPath = sanitizeFirebasePath(companyId);
      const blockRef = ref(db, `blocked/${user.id}/${sanitizedPath}`);
      
      await set(blockRef, {
        blockedAt: new Date().toISOString(),
        reason: blockReason,
        customReason: customReason,
        companyName: userData?.displayName,
        originalId: companyId
      });

      if (connectionStatus) {
        const userConnectionRef = ref(db, `connections/${user.id}/${sanitizedPath}`);
        await remove(userConnectionRef);

        const companyConnectionRef = ref(db, `connections/${sanitizedPath}/${user.id}`);
        await remove(companyConnectionRef);

        await saveContentToInbox(companyId, {
          type: "connection_disconnect",
          message: `${user.nome} bloqueou sua empresa`,
          fromUserId: user.id,
          fromUserName: user.nome,
          timestamp: new Date().toISOString(),
          status: "unread",
          link: `/perfil/${user.id}`
        });
      }

      setIsBlocked(true);
      setConnectionStatus(null);
      
      setError("Empresa bloqueada com sucesso!");
      setOpenSnackbar(true);
      handleCloseBlockDialog();
    } catch (error) {
      console.error("Erro ao bloquear empresa:", error);
      setError("Erro ao bloquear empresa. Tente novamente.");
      setOpenSnackbar(true);
    }
  };

  const getWebsiteUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `https://${url}`;
  };

  const handleUnblockCompany = async () => {
    if (!user || !companyId) return;
    
    try {
      const sanitizedPath = sanitizeFirebasePath(companyId);
      const blockRef = ref(db, `blocked/${user.id}/${sanitizedPath}`);
      await remove(blockRef);
      
      setIsBlocked(false);
      setError("Empresa desbloqueada com sucesso!");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Erro ao desbloquear empresa:", error);
      setError("Erro ao desbloquear empresa. Tente novamente.");
      setOpenSnackbar(true);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'inicio':
        return (
          <Box className="fade-up">
            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: T.navyCard, border: `1px solid ${T.darkBorder}`, borderRadius: 2, textAlign: 'center' }}>
                  <RemoveRedEye sx={{ color: T.gold, fontSize: 28 }} />
                  <Typography sx={{ color: T.white, fontWeight: 700, mt: 1 }}>{visits.length}</Typography>
                  <Typography sx={{ color: T.darkTextSub, fontSize: '0.8rem' }}>Visitas</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: T.navyCard, border: `1px solid ${T.darkBorder}`, borderRadius: 2, textAlign: 'center' }}>
                  <Article sx={{ color: T.gold, fontSize: 28 }} />
                  <Typography sx={{ color: T.white, fontWeight: 700, mt: 1 }}>{posts.length}</Typography>
                  <Typography sx={{ color: T.darkTextSub, fontSize: '0.8rem' }}>Publicações</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: T.navyCard, border: `1px solid ${T.darkBorder}`, borderRadius: 2, textAlign: 'center' }}>
                  <People sx={{ color: T.gold, fontSize: 28 }} />
                  <Typography sx={{ color: T.white, fontWeight: 700, mt: 1 }}>-</Typography>
                  <Typography sx={{ color: T.darkTextSub, fontSize: '0.8rem' }}>Conexões</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Paper sx={{ p: 2, bgcolor: T.navyCard, border: `1px solid ${T.darkBorder}`, borderRadius: 2, textAlign: 'center' }}>
                  <RequestQuote sx={{ color: T.gold, fontSize: 28 }} />
                  <Typography sx={{ color: T.white, fontWeight: 700, mt: 1 }}>{cotacoes.length}</Typography>
                  <Typography sx={{ color: T.darkTextSub, fontSize: '0.8rem' }}>Cotações</Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Company Description */}
            <Paper sx={{ p: 3, bgcolor: T.navyCard, border: `1px solid ${T.darkBorder}`, borderRadius: 2 }}>
              <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: T.white, mb: 2, fontSize: '1.2rem' }}>
                Sobre a Empresa
              </Typography>
              {userData?.missaoVisaoValores ? (
                <Typography 
                  dangerouslySetInnerHTML={{ __html: userData.missaoVisaoValores }} 
                  sx={{ color: T.darkTextSub, lineHeight: 1.8 }}
                />
              ) : (
                <Typography sx={{ color: T.darkMuted, fontStyle: 'italic' }}>
                  Nenhuma informação cadastrada.
                </Typography>
              )}
            </Paper>
          </Box>
        );
      case 'sobre':
        return (
          <Box className="fade-up">
            <Paper sx={{ p: 3, bgcolor: T.navyCard, border: `1px solid ${T.darkBorder}`, borderRadius: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Business sx={{ color: T.gold, fontSize: 20 }} />
                    <Typography sx={{ color: T.white, fontWeight: 600 }}>Informações Gerais</Typography>
                  </Box>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography sx={{ color: T.darkMuted, fontSize: '0.8rem' }}>Endereço</Typography>
                      <Typography sx={{ color: T.darkText }}>{mCompany?.endereco || 'Não informado'}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography sx={{ color: T.darkMuted, fontSize: '0.8rem' }}>Localização</Typography>
                      <Typography sx={{ color: T.darkText }}>
                        {mCompany?.provincia || ''} {mCompany?.distrito ? `, ${mCompany.distrito}` : ''}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography sx={{ color: T.darkMuted, fontSize: '0.8rem' }}>Sector de Atuação</Typography>
                      <Typography sx={{ color: T.darkText }}>{mCompany?.sector || 'Não informado'}</Typography>
                    </Box>
                  </Stack>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Work sx={{ color: T.gold, fontSize: 20 }} />
                    <Typography sx={{ color: T.white, fontWeight: 600 }}>Detalhes</Typography>
                  </Box>
                  
                  <Stack spacing={2}>
                    <Box>
                      <Typography sx={{ color: T.darkMuted, fontSize: '0.8rem' }}>Tipo de Entidade</Typography>
                      <Typography sx={{ color: T.darkText }}>{mCompany?.tipoEntidade || 'Não informado'}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography sx={{ color: T.darkMuted, fontSize: '0.8rem' }}>Capacidade de Produção</Typography>
                      <Typography sx={{ color: T.darkText }}>{mCompany?.capacidadeDeProducao || 'Não informado'}</Typography>
                    </Box>
                    
                    <Box>
                      <Typography sx={{ color: T.darkMuted, fontSize: '0.8rem' }}>Email</Typography>
                      {mCompany?.email ? (
                        <a href={`mailto:${mCompany.email}`} style={{ color: T.gold, textDecoration: 'none' }}>
                          {mCompany.email}
                        </a>
                      ) : (
                        <Typography sx={{ color: T.darkMuted }}>Não informado</Typography>
                      )}
                    </Box>
                    
                    <Box>
                      <Typography sx={{ color: T.darkMuted, fontSize: '0.8rem' }}>Contacto</Typography>
                      {mCompany?.contacto ? (
                        <a href={`tel:${mCompany.contacto}`} style={{ color: T.gold, textDecoration: 'none' }}>
                          {mCompany.contacto}
                        </a>
                      ) : (
                        <Typography sx={{ color: T.darkMuted }}>Não informado</Typography>
                      )}
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </Paper>
          </Box>
        );
      case 'Publicados':
        return <PostGallery posts={posts} />;
      case 'Repositorio':
        return <VetrineDesk id={companyId} />;
      default:
        return <Typography color="text.secondary" align="center">Nenhum conteúdo disponível.</Typography>;
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: T.navy }}>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Skeleton variant="rectangular" width="100%" height={400} sx={{ bgcolor: T.navyCard, borderRadius: 3 }} />
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <Skeleton variant="circular" width={120} height={120} sx={{ bgcolor: T.navyCard }} />
          </Box>
          <Skeleton variant="text" width="60%" height={40} sx={{ bgcolor: T.navyCard, mx: 'auto', mt: 2 }} />
          <Skeleton variant="text" width="40%" height={30} sx={{ bgcolor: T.navyCard, mx: 'auto' }} />
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ backgroundColor: T.navy, minHeight: '100vh', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <style>{KEYFRAMES}</style>
      
      {/* Background Grid */}
      <Box sx={BG_GRID} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 3 }}>
        <BackButton sx={{ color: T.darkText, mb: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }} />

        {/* Profile Card */}
        <Paper className="profile-card" sx={{ overflow: 'hidden' }}>
          {/* Cover Photo */}
          <Box className="cover-photo" sx={{ height: { xs: 150, sm: 250, md: 300 }, position: 'relative' }}>
            {userData?.coverPhotoURL ? (
              <img
                src={userData.coverPhotoURL}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                alt="Cover"
              />
            ) : (
              <Box
                sx={{
                  height: '100%',
                  bgcolor: T.navyMid,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: T.darkMuted,
                }}
              >
                <CameraAlt sx={{ fontSize: 40, mr: 1 }} />
                <Typography>Sem foto de capa</Typography>
              </Box>
            )}

            {/* Action Buttons on Cover */}
            <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
              <Tooltip title="Compartilhar perfil" arrow>
                <IconButton
                  onClick={handleShareOpen}
                  sx={{ 
                    bgcolor: 'rgba(13,34,64,0.8)', 
                    backdropFilter: 'blur(4px)',
                    border: `1px solid ${T.darkBorder}`,
                    '&:hover': { borderColor: T.gold }
                  }}
                >
                  <Share sx={{ color: T.white }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Profile Info */}
          <Box sx={{ p: 3, position: 'relative' }}>
            {/* Avatar */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' }, 
              alignItems: { xs: 'center', sm: 'flex-start' },
              gap: 3,
              mt: { xs: -8, sm: -12 }
            }}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  mCompany?.verified ? (
                    <Box sx={{ 
                      width: 24, 
                      height: 24, 
                      borderRadius: '50%', 
                      bgcolor: T.gold,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `2px solid ${T.navyCard}`
                    }}>
                      <CheckCircle sx={{ fontSize: 16, color: T.navy }} />
                    </Box>
                  ) : null
                }
              >
                <Avatar
                  src={userData?.photoURL}
                  alt={userData?.displayName}
                  sx={{
                    width: { xs: 100, sm: 120 },
                    height: { xs: 100, sm: 120 },
                    border: `4px solid ${T.navyCard}`,
                    bgcolor: T.navy,
                    fontSize: '2.5rem',
                    fontFamily: '"Playfair Display", serif',
                    fontWeight: 700,
                  }}
                >
                  {userData?.displayName?.charAt(0)}
                </Avatar>
              </Badge>

              <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: { xs: 'center', sm: 'flex-start' } }}>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontFamily: '"Playfair Display", serif',
                      fontWeight: 800,
                      color: T.white,
                      fontSize: { xs: '1.5rem', sm: '2rem' }
                    }}
                  >
                    {userData?.displayName}
                  </Typography>
                  {mCompany?.verified && (
                    <Tooltip title="Empresa verificada" arrow>
                      <VerifiedRounded sx={{ color: T.gold, fontSize: 24 }} />
                    </Tooltip>
                  )}
                </Box>

                <Typography 
                  sx={{ 
                    color: T.darkTextSub,
                    mt: 1,
                    fontSize: '0.95rem',
                    maxWidth: 600,
                    mx: { xs: 'auto', sm: 0 }
                  }}
                >
                  {mCompany?.sector || 'Setor não informado'}
                </Typography>

                {/* Location */}
                {mCompany?.provincia && (
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5, 
                    mt: 1,
                    justifyContent: { xs: 'center', sm: 'flex-start' }
                  }}>
                    <LocationOn sx={{ color: T.gold, fontSize: 16 }} />
                    <Typography sx={{ color: T.darkTextSub, fontSize: '0.85rem' }}>
                      {mCompany.provincia}{mCompany.distrito ? `, ${mCompany.distrito}` : ''}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Blocked Chip */}
              {isBlocked && user && (
                <Chip 
                  label="Empresa bloqueada" 
                  icon={<Block sx={{ fontSize: 14 }} />}
                  sx={{ 
                    bgcolor: 'rgba(239,68,68,0.12)', 
                    color: T.error,
                    border: `1px solid rgba(239,68,68,0.25)`,
                    fontWeight: 600,
                  }}
                />
              )}
            </Box>

            {/* Bio */}
            {userData?.bio && (
              <Typography 
                dangerouslySetInnerHTML={{ __html: userData.bio }} 
                sx={{ 
                  color: T.darkTextSub,
                  mt: 3,
                  p: 2,
                  bgcolor: 'rgba(255,255,255,0.02)',
                  borderRadius: 2,
                  border: `1px solid ${T.darkBorder}`,
                  lineHeight: 1.8,
                }}
              />
            )}

            {/* Action Buttons */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: { xs: 'center', sm: 'flex-start' }, 
              gap: 2, 
              mt: 3,
              flexWrap: 'wrap'
            }}>
              {user ? (
                <>
                  {isBlocked ? (
                    <Button 
                      variant="outlined"
                      startIcon={<LockOpen />}
                      onClick={handleUnblockCompany}
                      sx={{
                        borderColor: T.darkBorder,
                        color: T.darkText,
                        '&:hover': { borderColor: T.success, color: T.success }
                      }}
                    >
                      Desbloquear Empresa
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant={connectionStatus === "accepted" ? "contained" : "outlined"}
                        onClick={
                          connectionStatus === "pending"
                            ? handleCancelarConexao
                            : connectionStatus === "accepted"
                            ? handleOpenDisconnectDialog
                            : handleConectar
                        }
                        sx={connectionStatus === "accepted" ? {
                          bgcolor: T.gold,
                          color: T.navy,
                          '&:hover': { bgcolor: T.goldLight }
                        } : {
                          borderColor: T.darkBorder,
                          color: T.darkText,
                          '&:hover': { borderColor: T.gold, color: T.gold }
                        }}
                      >
                        {connectionStatus === "pending"
                          ? "Cancelar Solicitação"
                          : connectionStatus === "accepted"
                          ? "Desconectar"
                          : "Conectar"}
                      </Button>

                      <IconButton 
                        onClick={handleMenuOpen}
                        sx={{ 
                          border: `1px solid ${T.darkBorder}`,
                          borderRadius: '8px',
                          '&:hover': { borderColor: T.gold }
                        }}
                      >
                        <MoreHoriz sx={{ color: T.darkText }} />
                      </IconButton>
                    </>
                  )}
                </>
              ) : (
                <Button 
                  variant="outlined"
                  onClick={() => navigate('/auth')}
                  sx={{
                    borderColor: T.darkBorder,
                    color: T.darkText,
                    '&:hover': { borderColor: T.gold, color: T.gold }
                  }}
                >
                  Faça login para conectar
                </Button>
              )}
            </Box>

            {/* Contact Icons */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: { xs: 'center', sm: 'flex-start' }, 
              gap: 1.5, 
              mt: 3,
              flexWrap: 'wrap'
            }}>
              {/* Store */}
              {!isBlocked && (
                <Tooltip title="Ir para a Loja" arrow>
                  <IconButton 
                    onClick={() => companyId && navigate(`/loja/${companyId}`)}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${T.darkBorder}`,
                      '&:hover': { borderColor: T.gold, color: T.gold }
                    }}
                  >
                    <Store sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              )}

              {/* Phone */}
              {userData?.contacto && !isBlocked && (
                <Tooltip title="Ligar" arrow>
                  <IconButton 
                    href={`tel:${userData.contacto}`}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${T.darkBorder}`,
                      color: '#4CAF50',
                      '&:hover': { borderColor: T.gold }
                    }}
                  >
                    <Phone fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Email */}
              {userData?.email && !isBlocked && (
                <Tooltip title="Enviar e-mail" arrow>
                  <IconButton 
                    href={`mailto:${userData.email}`}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${T.darkBorder}`,
                      color: '#D44638',
                      '&:hover': { borderColor: T.gold }
                    }}
                  >
                    <Email fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Social Icons */}
              {social.facebook && !isBlocked && (
                <Tooltip title="Facebook" arrow>
                  <IconButton
                    href={getWebsiteUrl(social.facebook)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${T.darkBorder}`,
                      color: '#1877F2',
                      '&:hover': { borderColor: T.gold }
                    }}
                  >
                    <Facebook fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {social.instagram && !isBlocked && (
                <Tooltip title="Instagram" arrow>
                  <IconButton
                    href={getWebsiteUrl(social.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${T.darkBorder}`,
                      color: '#E1306C',
                      '&:hover': { borderColor: T.gold }
                    }}
                  >
                    <Instagram fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {social.x && !isBlocked && (
                <Tooltip title="X (Twitter)" arrow>
                  <IconButton
                    href={getWebsiteUrl(social.x)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${T.darkBorder}`,
                      color: '#1DA1F2',
                      '&:hover': { borderColor: T.gold }
                    }}
                  >
                    <X fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {social.linkedin && !isBlocked && (
                <Tooltip title="LinkedIn" arrow>
                  <IconButton
                    href={getWebsiteUrl(social.linkedin)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${T.darkBorder}`,
                      color: '#0077B5',
                      '&:hover': { borderColor: T.gold }
                    }}
                  >
                    <LinkedIn fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {social.whatsapp && !isBlocked && (
                <Tooltip title="WhatsApp" arrow>
                  <IconButton
                    href={getWebsiteUrl(social.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${T.darkBorder}`,
                      color: '#25D366',
                      '&:hover': { borderColor: T.gold }
                    }}
                  >
                    <WhatsApp fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {social.website && !isBlocked && (
                <Tooltip title="Website" arrow>
                  <IconButton
                    href={getWebsiteUrl(social.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: `1px solid ${T.darkBorder}`,
                      color: '#4285F4',
                      '&:hover': { borderColor: T.gold }
                    }}
                  >
                    <Language fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Tabs */}
        <Box sx={{ mt: 4, borderBottom: `1px solid ${T.darkBorder}` }}>
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: T.darkTextSub,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                minHeight: 48,
                '&.Mui-selected': { color: T.gold }
              },
              '& .MuiTabs-indicator': { bgcolor: T.gold }
            }}
          >
            <Tab label="Início" value="inicio" icon={<Home sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label="Sobre" value="sobre" icon={<Info sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label="Publicações" value="Publicados" icon={<Article sx={{ fontSize: 18 }} />} iconPosition="start" />
            <Tab label="Repositório" value="Repositorio" icon={<Code sx={{ fontSize: 18 }} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box sx={{ mt: 3 }}>
          {renderContent()}
        </Box>
      </Container>

      {/* Share Menu */}
      <Menu
        anchorEl={shareAnchorEl}
        open={Boolean(shareAnchorEl)}
        onClose={handleShareClose}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            bgcolor: T.navyCard,
            border: `1px solid ${T.darkBorder}`,
            borderRadius: '12px',
            mt: 1,
          }
        }}
      >
        {[
          { key: 'whatsapp', label: 'WhatsApp', icon: 'https://cdn-icons-png.flaticon.com/512/124/124034.png' },
          { key: 'facebook', label: 'Facebook', icon: 'https://cdn-icons-png.flaticon.com/512/124/124010.png' },
          { key: 'twitter', label: 'Twitter', icon: 'https://cdn-icons-png.flaticon.com/512/124/124021.png' },
        ].map((item) => (
          <MenuItem 
            key={item.key} 
            onClick={() => handleShare(item.key)}
            sx={{ color: T.darkText, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}
          >
            <ListItemIcon>
              <Box component="img" src={item.icon} alt={item.label} sx={{ width: 20, height: 20 }} />
            </ListItemIcon>
            <ListItemText>{item.label}</ListItemText>
          </MenuItem>
        ))}
        <MenuItem 
          onClick={() => handleShare('copy')}
          sx={{ color: T.darkText, '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}
        >
          <ListItemIcon>
            <Share sx={{ fontSize: 20, color: T.gold }} />
          </ListItemIcon>
          <ListItemText>Copiar link</ListItemText>
        </MenuItem>
      </Menu>

      {/* Options Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        TransitionComponent={Fade}
        PaperProps={{
          sx: {
            bgcolor: T.navyCard,
            border: `1px solid ${T.darkBorder}`,
            borderRadius: '12px',
            mt: 1,
          }
        }}
      >
        {user ? (
          isBlocked ? (
            <MenuItem onClick={handleUnblockCompany}>
              <ListItemIcon>
                <LockOpen sx={{ color: T.success }} />
              </ListItemIcon>
              <Typography color="success.main">Desbloquear Empresa</Typography>
            </MenuItem>
          ) : (
            <>
              <MenuItem onClick={handleOpenReportDialog}>
                <ListItemIcon>
                  <Report sx={{ color: T.warning }} />
                </ListItemIcon>
                <Typography>Denunciar Empresa</Typography>
              </MenuItem>
            </>
          )
        ) : (
          <MenuItem onClick={() => navigate('/auth')}>
            <ListItemIcon>
              <LockOpen color="primary" />
            </ListItemIcon>
            Faça login para acessar estas opções
          </MenuItem>
        )}
      </Menu>

      {/* Report Dialog */}
      <Dialog 
        open={openReportDialog} 
        onClose={handleCloseReportDialog} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: T.navyCard,
            border: `1px solid ${T.darkBorder}`,
            borderRadius: '16px',
          }
        }}
      >
        <DialogTitle sx={{ color: T.white, fontFamily: '"Playfair Display", serif' }}>
          Denunciar Empresa
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: T.darkTextSub, mb: 2 }}>
            Por favor, selecione o motivo da denúncia:
          </Typography>
          
          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <RadioGroup
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            >
              {reportReasons.map((reason) => (
                <FormControlLabel
                  key={reason}
                  value={reason}
                  control={<Radio sx={{ color: T.gold, '&.Mui-checked': { color: T.gold } }} />}
                  label={<Typography sx={{ color: T.white }}>{reason}</Typography>}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {reportReason === "Outro motivo" && (
            <TextField
              fullWidth
              margin="normal"
              label="Descreva o motivo em detalhes"
              multiline
              rows={4}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: T.white,
                  '& fieldset': { borderColor: T.darkBorder },
                  '&:hover fieldset': { borderColor: T.gold },
                },
                '& .MuiInputLabel-root': { color: T.darkTextSub }
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseReportDialog}
            sx={{ color: T.darkMuted }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmitReport} 
            variant="contained"
            disabled={!reportReason || (reportReason === "Outro motivo" && !customReason)}
            sx={{
              bgcolor: T.gold,
              color: T.navy,
              '&:hover': { bgcolor: T.goldLight },
              '&.Mui-disabled': { bgcolor: T.darkMuted }
            }}
          >
            Enviar Denúncia
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block Dialog */}
      <Dialog 
        open={openBlockDialog} 
        onClose={handleCloseBlockDialog} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: T.navyCard,
            border: `1px solid ${T.darkBorder}`,
            borderRadius: '16px',
          }
        }}
      >
        <DialogTitle sx={{ color: T.white, fontFamily: '"Playfair Display", serif' }}>
          Bloquear Empresa
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            bgcolor: 'rgba(245,158,11,0.12)', 
            p: 2, 
            borderRadius: 2,
            mb: 3,
            border: `1px solid rgba(245,158,11,0.25)`
          }}>
            <Typography sx={{ color: T.warning, fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Warning sx={{ fontSize: 18 }} />
              Ao bloquear esta empresa:
            </Typography>
            <Typography component="div" sx={{ color: T.darkTextSub, fontSize: '0.9rem', pl: 2 }}>
              • Não poderá enviar pedidos de conexão<br />
              • Não receberá pedidos de cotação<br />
              • Não verá publicações desta empresa<br />
              • Não receberá mensagens ou notificações
            </Typography>
          </Box>

          <FormControl component="fieldset" sx={{ width: '100%' }}>
            <FormLabel component="legend" sx={{ color: T.white, mb: 1 }}>
              Selecione o motivo do bloqueio:
            </FormLabel>
            <RadioGroup
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            >
              {blockReasons.map((reason) => (
                <FormControlLabel
                  key={reason}
                  value={reason}
                  control={<Radio sx={{ color: T.gold, '&.Mui-checked': { color: T.gold } }} />}
                  label={<Typography sx={{ color: T.white }}>{reason}</Typography>}
                />
              ))}
            </RadioGroup>
          </FormControl>

          {blockReason === "Outro motivo" && (
            <TextField
              fullWidth
              margin="normal"
              label="Descreva o motivo em detalhes"
              multiline
              rows={4}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: T.white,
                  '& fieldset': { borderColor: T.darkBorder },
                  '&:hover fieldset': { borderColor: T.gold },
                },
                '& .MuiInputLabel-root': { color: T.darkTextSub }
              }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseBlockDialog}
            sx={{ color: T.darkMuted }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleBlockCompany} 
            variant="contained"
            color="error"
            startIcon={<Block />}
            disabled={!blockReason || (blockReason === "Outro motivo" && !customReason)}
            sx={{
              '&.Mui-disabled': { bgcolor: T.darkMuted }
            }}
          >
            Confirmar Bloqueio
          </Button>
        </DialogActions>
      </Dialog>

      {/* Disconnect Dialog */}
      <Dialog
        open={openDisconnectDialog}
        onClose={handleCloseDisconnectDialog}
        PaperProps={{
          sx: {
            bgcolor: T.navyCard,
            border: `1px solid ${T.darkBorder}`,
            borderRadius: '16px',
          }
        }}
      >
        <DialogTitle sx={{ color: T.white, fontFamily: '"Playfair Display", serif' }}>
          Confirmar Desconexão
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: T.darkTextSub }}>
            Tem certeza que deseja desconectar-se de <strong style={{ color: T.white }}>{userData?.displayName}</strong>?
            <br /><br />
            <span style={{ color: T.warning }}>
              Esta empresa deixará de fazer parte da sua lista de clientes.
            </span>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={handleCloseDisconnectDialog}
            sx={{ color: T.darkMuted }}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleDesconectar} 
            variant="contained"
            color="error"
            startIcon={<LinkOff />}
          >
            Desconectar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={error?.includes('sucesso') || error?.includes('Obrigado') ? 'success' : 'error'}
          sx={{
            bgcolor: error?.includes('sucesso') ? T.gold : T.error,
            color: T.white,
            borderRadius: '12px',
            '& .MuiAlert-icon': { color: T.white }
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyProfile;
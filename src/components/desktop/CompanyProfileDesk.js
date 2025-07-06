import React, { useEffect, useId, useState } from 'react';
import { 
  VerifiedRounded, MoreHoriz, Twitter, Instagram, LinkedIn, 
  Logout, Edit, CameraAlt, Language, Store, RequestQuote, 
  Message, Phone, WhatsApp, Facebook, Email, Report, Block, LockOpen,
  LinkOff,
  Code,
  Article,
  Info,
  Home,
  X
} from "@mui/icons-material";
import { useNavigate, useParams } from 'react-router-dom';
import { get, ref, update, push, set, onValue, remove } from 'firebase/database';
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
  FormControlLabel,
  FormControl,
  FormLabel,
  Chip,
  Divider
} from '@mui/material';
import { saveContentToInbox } from '../SaveToInbox';
import PostDetailPageDesk from './PostDetailPageDesk';
import VetrineDesk from './VetrineDesk';
import BackButton from '../BackButton';

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
  const userId = id;
  const [posts, setPosts] = useState([]);
  const [visits, setVisits] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const isMobile = useMediaQuery('(max-width:600px)');
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

  // Check if company is blocked (only if user is logged in)
  useEffect(() => {
    if (user && userId) {
      const blockedRef = ref(db, `blocked/${user.id}/${userId}`);
      const unsubscribe = onValue(blockedRef, (snapshot) => {
        setIsBlocked(snapshot.exists());
      });
      return () => unsubscribe();
    }
  }, [user, userId]);

  // Load company data
  useEffect(() => {
    if (userId) {
      if (user && user.id === userId) {
        navigate('/perfil');
        return;
      }

      const fetchData = async () => {
        try {
          const companyRef = ref(db, `company/${userId}`);
          const socialRef = ref(db, `company/${userId}/social`);
          const postsRef = ref(db, `posts`);
          const cotacoesRef = ref(db, `cotacoes`);
          const visitasRef = ref(db, `company/${userId}/visitas`);

          const [companySnapshot, socialSnapshot, cotacoesSnapshot, postsSnapshot, visitasSnapshot] = await Promise.all([
            get(companyRef),
            get(socialRef),
            get(cotacoesRef),
            get(postsRef),
            get(visitasRef)
          ]);

          if (!companySnapshot.exists()) {
            setError('Empresa não encontrada.');
            setOpenSnackbar(true);
            navigate('/empresa-nao-encontrada');
            return;
          }

          const companyData = companySnapshot.val();
          setmCompany(companyData);
          setUserData({
            ...companyData,
            photoURL: companyData?.logoUrl || "https://via.placeholder.com/150",
            coverPhotoURL: companyData?.coverUrl,
            displayName: companyData.nome || 'A carregar',
            username: companyData.id || 'A carregar',
            endereco: companyData.endereco || 'A carregar'
          });
          setModules(companyData.activeModules || {});
          setSmsLimit(companyData.activeModules?.moduloSMS?.limit || 0);

          // Only record visit if user is logged in
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
            const filteredPosts = Object.values(postsData).filter(post => post.company.id === userId);
            setPosts(filteredPosts);
          }
          if (cotacoesSnapshot.exists()) {
            const cotacoesData = cotacoesSnapshot.val();
            const userCotacoes = Object.keys(cotacoesData).filter(key =>
              cotacoesData[key].company && cotacoesData[key].company.id === userId
            );
            setCotacoes(userCotacoes.map(key => cotacoesData[key]));
          }
          if (visitasSnapshot.exists()) {
            setVisits(Object.values(visitasSnapshot.val()));
          }
        } catch (error) {
          console.error('Error fetching data: ', error);
          setError('Erro ao carregar dados. Tente novamente mais tarde.');
          setOpenSnackbar(true);
          navigate('/auth');
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [userId, navigate, user]);

  // Check connection status (only if user is logged in)
  useEffect(() => {
    if (!user) return;
    const connectionRef = ref(db, `connections/${userId}/${user.id}`);
    const unsubscribe = onValue(connectionRef, (snapshot) => {
      if (snapshot.exists()) {
        setConnectionStatus(snapshot.val().status);
      } else {
        setConnectionStatus(null);
      }
    });

    return () => unsubscribe();
  }, [userId, user]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
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
    if (!userId || isBlocked || !user) {
      setError("Você precisa estar logado para conectar-se a empresas.");
      setOpenSnackbar(true);
      return;
    }

    const currentUserId = user.id;
    const targetUserConnectionRef = ref(db, `connections/${userId}/${currentUserId}`);

    const connectionRequest = {
      requestedBy: currentUserId,
      requestedTo: userId,
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
      await saveContentToInbox(userId, notification);
      setError("Solicitação de conexão enviada com sucesso!");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Erro ao enviar solicitação:", error);
      setError("Erro ao tentar enviar a solicitação. Tente novamente.");
      setOpenSnackbar(true);
    }
  };

  const handleCancelarConexao = async () => {
    if (!user) return;
    
    const targetUserConnectionRef = ref(db, `connections/${userId}/${user.id}`);
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
    if (!userId || !user) return;

    const currentUserId = user.id;
    const targetUserConnectionRef = ref(db, `connections/${userId}/${currentUserId}`);
    const reciprocalConnectionRef = ref(db, `connections/${currentUserId}/${userId}`);

    try {
      await remove(targetUserConnectionRef);
      await remove(reciprocalConnectionRef);
      
      setConnectionStatus(null);
      
      await saveContentToInbox(userId, {
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
      const reportRef = push(ref(db, `reports/${userId}`));
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
      const blockRef = ref(db, `blocked/${user.id}/${userId}`);
      await set(blockRef, {
        blockedAt: new Date().toISOString(),
        reason: blockReason,
        customReason: customReason,
        companyName: userData?.displayName
      });

      if (connectionStatus) {
        const userConnectionRef = ref(db, `connections/${user.id}/${userId}`);
        await remove(userConnectionRef);

        const companyConnectionRef = ref(db, `connections/${userId}/${user.id}`);
        await remove(companyConnectionRef);

        await saveContentToInbox(userId, {
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
    if (!user) return;
    
    try {
      const blockRef = ref(db, `blocked/${user.id}/${userId}`);
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
          <Box mt={3}>
            {userData?.missaoVisaoValores ? (
              <Typography dangerouslySetInnerHTML={{ __html: userData.missaoVisaoValores }} />
            ) : (
              <Typography color="text.secondary">Não informada</Typography>
            )}
          </Box>
        );
      case 'Publicados':
        return <PostGallery posts={posts} />;
      case 'Repositorio':
        return <VetrineDesk id={userId} />;
      case 'sobre':
        return (
          <Box mt={3} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body1">
              <strong>Endereço:</strong> {mCompany?.endereco || 'Não informado'}
            </Typography>
            <Typography variant="body1">
              <strong>Província:</strong> {mCompany?.provincia || 'Não informado'}
            </Typography>
            <Typography variant="body1">
              <strong>Distrito:</strong> {mCompany?.distrito || 'Não informado'}
            </Typography>
            <Typography variant="body1">
              <strong>Capacidade de Produção:</strong> {mCompany?.capacidadeDeProducao || 'Não informado'}
            </Typography>
            <Typography variant="body1">
              <strong>Email:</strong> {mCompany?.email ? (
                <a href={`mailto:${mCompany.email}`} style={{ textDecoration: 'none', color: '#1976D2' }}>
                  {mCompany.email}
                </a>
              ) : 'Não informado'}
            </Typography>
            <Typography variant="body1">
              <strong>Contacto:</strong> {mCompany?.contacto ? (
                <a href={`tel:${mCompany.contacto}`} style={{ textDecoration: 'none', color: '#1976D2' }}>
                  {mCompany.contacto}
                </a>
              ) : 'Não informado'}
            </Typography>
            <Typography variant="body1">
              <strong>Sector:</strong> {mCompany?.sector || 'Não informado'}
            </Typography>
            <Typography variant="body1">
              <strong>Tipo de Entidade:</strong> {mCompany?.tipoEntidade || 'Não informado'}
            </Typography>
          </Box>
        );
      default:
        return <Typography color="text.secondary" align="center">Nenhum conteúdo disponível.</Typography>;
    }
  };

  if (loading) {
    return (
      <Box width="100%" minHeight="100vh" sx={{ backgroundColor: 'white' }}>
        <Skeleton variant="rectangular" width="100%" height={400} />
        <Box textAlign="center" mt={8}>
          <Skeleton variant="text" width="60%" height={40} />
          <Skeleton variant="text" width="40%" height={30} />
        </Box>
      </Box>
    );
  }

  return (
    <Box width="100%" minHeight="100vh" sx={{ backgroundColor: 'white' }}>
      <BackButton sx={{ mb: 2 }} />
      <Box position="relative">
        {/* Cover Photo */}
        <Box
          height={{ xs: 150, sm: 400 }}
          sx={{
            overflow: 'hidden',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 1,
                color: '#666',
              }}
            >
              <CameraAlt sx={{ fontSize: 40 }} />
              <Typography variant="body1">Nenhuma foto de capa</Typography>
            </Box>
          )}
        </Box>

        {/* Avatar */}
        <Avatar
          src={userData?.photoURL}
          alt="Profile"
          sx={{
            width: { xs: 80, sm: 120 },
            height: { xs: 80, sm: 120 },
            position: 'absolute',
            top: { xs: 100, sm: 140 },
            left: { xs: '50%', sm: 24 },
            transform: { xs: 'translateX(-50%)', sm: 'none' },
            border: '4px solid white',
          }}
        />
      </Box>

      <Box textAlign="center" mt={8}>
        <Typography variant="h5" fontWeight="bold">{userData?.displayName}</Typography>
        <Typography
          color="text.secondary" mt={1}
          dangerouslySetInnerHTML={{ __html: userData?.bio || '' }}
        />
        
        {isBlocked && user && (
          <Chip 
            label="Empresa bloqueada" 
            color="error" 
            sx={{ mt: 2 }} 
            icon={<Block fontSize="small" />}
          />
        )}

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
          {user ? (
            <>
              {isBlocked ? (
                <Button 
                  variant="outlined" 
                  color="error" 
                  startIcon={<Block />}
                  disabled={!user}
                >
                  Empresa Bloqueada
                </Button>
              ) : (
                <Button
                  variant={
                    connectionStatus === "accepted"
                      ? "contained"
                      : connectionStatus === "pending"
                      ? "outlined"
                      : "outlined"
                  }
                  onClick={
                    connectionStatus === "pending"
                      ? handleCancelarConexao
                      : connectionStatus === "accepted"
                      ? handleOpenDisconnectDialog
                      : handleConectar
                  }
                  disabled={!user}
                >
                  {connectionStatus === "pending"
                    ? "Cancelar Solicitação"
                    : connectionStatus === "accepted"
                    ? "Desconectar"
                    : "Conectar"}
                </Button>
              )}

              <IconButton onClick={handleMenuOpen} disabled={!user}>
                <MoreHoriz />
              </IconButton>
            </>
          ) : (
            <Button 
              variant="contained" 
              color="primary"
              onClick={() => navigate('/auth')}
            >
              Faça login para conectar
            </Button>
          )}
        </Box>
        
        {/* Contact and Social Media Icons */}
        <Box display="flex" justifyContent="center" alignItems="center" mt={4} gap={2}>
          {/* Store */}
          <Tooltip title="Ir para a Loja" arrow>
            <IconButton 
              onClick={() => userId && navigate(`/loja/${userId}`)} 
              color="success"
              disabled={isBlocked}
            >
              <Store />
            </IconButton>
          </Tooltip>

          {/* Phone */}
          {userData.contacto && (
            <Tooltip title="Ligar" arrow>
              <IconButton 
                href={`tel:${userData.contacto}`} 
                sx={{ color: '#4CAF50' }}
                disabled={isBlocked}
              >
                <Phone />
              </IconButton>
            </Tooltip>
          )}

          {/* Email */}
          {userData.email && (
            <Tooltip title="E-mail" arrow>
              <IconButton 
                href={`mailto:${userData.email}`} 
                sx={{ color: '#D44638' }}
                disabled={isBlocked}
              >
                <Email />
              </IconButton>
            </Tooltip>
          )}

          {/* Social Media */}
          {social.facebook && (
            <Tooltip title="Facebook" arrow>
              <IconButton
                href={social.facebook}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: '#1877F2' }}
              >
                <Facebook />
              </IconButton>
            </Tooltip>
          )}

          {social.instagram && (
            <Tooltip title="Instagram" arrow>
              <IconButton
                href={social.instagram}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: '#E1306C' }}
              >
                <Instagram />
              </IconButton>
            </Tooltip>
          )}
           {social?.x && (
                       <Tooltip title="Instagram" arrow>
              <IconButton
                href={social.x}
                target="_blank"
                rel="noopener noreferrer" aria-label="X"
                sx={{ color: '#1DA1F2' }}
              >
                <X />
              </IconButton>
            </Tooltip>
                    )}

          {social.linkedin && (
            <Tooltip title="LinkedIn" arrow>
              <IconButton
                href={social.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: '#0077B5' }}
              >
                <LinkedIn />
              </IconButton>
            </Tooltip>
          )}

          {social.whatsapp && (
            <Tooltip title="WhatsApp" arrow>
              <IconButton
                href={social.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: '#25D366' }}
              >
                <WhatsApp />
              </IconButton>
            </Tooltip>
          )}
          {social.website && (
            <Tooltip title="Website" arrow>
              <IconButton
                href={getWebsiteUrl(social.website)}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: '#4285F4' }}
              >
                <Language />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}>
        {user ? (
          isBlocked ? (
            <MenuItem onClick={handleUnblockCompany}>
              <ListItemIcon>
                <LockOpen color="success" />
              </ListItemIcon>
              <Typography color="success.main">Desbloquear Empresa</Typography>
            </MenuItem>
          ) : (
            <>
              <MenuItem onClick={handleOpenReportDialog}>
                <ListItemIcon>
                  <Report color="warning" />
                </ListItemIcon>
                Denunciar Empresa
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

      <Dialog open={openReportDialog} onClose={handleCloseReportDialog} fullWidth maxWidth="sm">
        <DialogTitle>Denunciar Empresa</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Por favor, selecione o motivo da denúncia:
          </Typography>
          
          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
            <RadioGroup
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            >
              {reportReasons.map((reason) => (
                <FormControlLabel
                  key={reason}
                  value={reason}
                  control={<Radio />}
                  label={reason}
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
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReportDialog}>Cancelar</Button>
          <Button 
            onClick={handleSubmitReport} 
            color="primary" 
            variant="contained"
            disabled={!reportReason || (reportReason === "Outro motivo" && !customReason)}
          >
            Enviar Denúncia
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={openBlockDialog} onClose={handleCloseBlockDialog} fullWidth maxWidth="sm">
        <DialogTitle>Bloquear Empresa</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Ao bloquear esta empresa:
          </Typography>
          
          <Box sx={{ 
            backgroundColor: '#fff8e1', 
            p: 2, 
            borderRadius: 1,
            mb: 3,
            borderLeft: '4px solid #ffc107'
          }}>
            <Typography variant="body2" component="div">
              • Não poderá enviar pedidos de conexão
            </Typography>
            <Typography variant="body2" component="div">
              • Não receberá pedidos de cotação desta empresa
            </Typography>
            <Typography variant="body2" component="div">
              • Não verá publicações desta empresa
            </Typography>
            <Typography variant="body2" component="div">
              • Não receberá mensagens ou notificações
            </Typography>
          </Box>

          <FormControl component="fieldset" sx={{ mt: 2, width: '100%' }}>
            <FormLabel component="legend">Selecione o motivo do bloqueio:</FormLabel>
            <RadioGroup
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
            >
              {blockReasons.map((reason) => (
                <FormControlLabel
                  key={reason}
                  value={reason}
                  control={<Radio />}
                  label={reason}
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
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBlockDialog}>Cancelar</Button>
          <Button 
            onClick={handleBlockCompany} 
            color="error" 
            variant="contained"
            startIcon={<Block />}
            disabled={!blockReason || (blockReason === "Outro motivo" && !customReason)}
          >
            Confirmar Bloqueio
          </Button>
        </DialogActions>
      </Dialog>

      {/* Disconnect Confirmation Dialog */}
      <Dialog
        open={openDisconnectDialog}
        onClose={handleCloseDisconnectDialog}
        aria-labelledby="disconnect-dialog-title"
      >
        <DialogTitle id="disconnect-dialog-title">Confirmar Desconexão</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Tem certeza que deseja desconectar-se de {userData?.displayName}?
            <br />
            <strong>Esta empresa deixará de fazer parte da sua lista de clientes.</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDisconnectDialog} color="primary">
            Cancelar
          </Button>
          <Button 
            onClick={handleDesconectar} 
            color="error"
            variant="contained"
            startIcon={<LinkOff />}
          >
            Desconectar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tabs */}
      <Box mt={4} borderBottom={1} borderColor="divider">
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          centered
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons="auto"
        >
          <Tab 
            label="Início" 
            value="inicio" 
            icon={<Home fontSize="small" />} 
            iconPosition="start"
          />
          <Tab 
            label="Sobre" 
            value="sobre" 
            icon={<Info fontSize="small" />} 
            iconPosition="start"
          />
          <Tab 
            label="Publicações" 
            value="Publicados" 
            icon={<Article fontSize="small" />} 
            iconPosition="start"
          />
          <Tab 
            label="Repositório" 
            value="Repositorio" 
            icon={<Code fontSize="small" />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box p={3}>{renderContent()}</Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={error?.includes('sucesso') || error?.includes('Obrigado') ? 'success' : 'error'} 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CompanyProfile;
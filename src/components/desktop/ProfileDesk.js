import React, { useEffect, useState, useRef } from 'react';
import { Twitter, Instagram, LinkedIn, Language, CameraAlt, X, WhatsApp, Facebook, Email, PlayArrow } from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import { get, ref, update } from 'firebase/database';
import { auth, db, storage } from '../../fb';
import PostGallery from '../PostGallery';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AiFillSetting } from 'react-icons/ai';
import { getCompanyPosts } from '../../services/posts';
import { plainText } from '../../utils/postData';
import { Grid, Card, CardContent, Typography, Box, Link, CircularProgress, useMediaQuery, Menu, MenuItem, ListItemIcon, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, Container, Paper, Divider, Chip, Fade } from "@mui/material";
import {
  Button,
  CardMedia,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Link as MuiLink,
  Snackbar,
  Alert,
  useTheme,
} from "@mui/material";
import VetrineDesk from './VetrineDesk';
import { readAndCompressImage } from 'browser-image-resizer';
import { LinkIcon, Share, MapPin, Phone, Mail, Award, Target } from 'lucide-react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useLanguage } from '../../context/LanguageContext';
import { createProfileThemeTokens } from '../../utils/profileTheme';

/* ── Design Tokens (mesmos da hero) ───────────────────────────────────── */
const createTokens = (theme) => {
  const tokens = createProfileThemeTokens(theme);
  return {
    navy: tokens.primaryDark,
    navyMid: tokens.primary,
    navyLight: tokens.primaryLight,
    gold: tokens.primary,
    goldLight: tokens.primaryLight,
    goldPale: tokens.selected,
    cream: tokens.background,
    white: tokens.surface,
    text: tokens.text,
    textMid: tokens.textSecondary,
    textSub: tokens.textSecondary,
    border: tokens.divider,
    borderMid: tokens.divider,
    surface: tokens.surface,
  };
};

/* ── Keyframes (mesmos da hero) ───────────────────────────────────────── */
const KEYFRAMES = (T) => `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.85); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
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
  .delay-6 { animation-delay: 0.70s; }
  
  .profile-card {
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .profile-card:hover {
    transform: translateY(-4px);
    border-color: ${T.gold} !important;
    box-shadow: 0 16px 48px rgba(8,25,46,0.1) !important;
  }
  .stat-card {
    transition: all 0.2s ease;
  }
  .stat-card:hover {
    background: ${T.goldPale};
    border-color: ${T.gold} !important;
  }
  .social-icon {
    transition: all 0.2s ease;
  }
  .social-icon:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
  }
  .tab-indicator {
    background: ${T.gold} !important;
    height: 3px !important;
  }
`;

const ProfileDesk = () => {
  const theme = useTheme();
  const T = createTokens(theme);
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('inicio');
  const [userData, setUserData] = useState(null);
  const [social, setSocial] = useState({ linkedin: '', instagram: '', website: '', youtubeVideo: '' });
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [showFullText, setShowFullText] = useState(false);
  const [coverPhoto, setCoverPhoto] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const isMobile = useMediaQuery("(max-width:600px)");

  // Estados para o crop de imagem
  const [imgSrc, setImgSrc] = useState(null);
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [isCropping, setIsCropping] = useState(false);
  const [currentImageType, setCurrentImageType] = useState(null);
  const imgRef = useRef(null);

  // Configurações
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
  const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  // Configuração para redimensionamento e compressão
  const imageConfig = {
    quality: 0.7,
    maxWidth: 1024,
    maxHeight: 1024,
    autoRotate: true,
    mimeType: 'image/webp',
    debug: true
  };

  // Função para extrair ID do YouTube
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const youtubePattern = new RegExp('(?:youtube\\.com/(?:.*[?&]v=|embed/)|youtu\\.be/)([^"&?/\\s]{11})');
    const match = url.match(youtubePattern);
    return match ? match[1] : null;
  };

  const youtubeVideoId = getYouTubeVideoId(social?.youtubeVideo);

  // Funções auxiliares
  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const handleFileSizeCheck = (file) => {
    if (file.size > MAX_FILE_SIZE) {
      setSnackbar({ 
        open: true, 
        message: t('profile.imageTooLarge'),
        severity: 'warning' 
      });
      return false;
    }
    return true;
  };

  const handleFileTypeCheck = (file) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setSnackbar({
        open: true,
        message: t('profile.imageTypeError'),
        severity: 'warning'
      });
      return false;
    }
    return true;
  };

  // Funções para manipulação de imagens
  const openImageEditor = async (file, isCover) => {
    try {
      if (!handleFileSizeCheck(file)) return;
      if (!handleFileTypeCheck(file)) return;

      const quality = file.size > 10 * 1024 * 1024 ? 0.6 : 0.8;
      
      const resizedImage = await readAndCompressImage(file, {
        ...imageConfig,
        quality
      });
      
      const imageDataUrl = await readFile(resizedImage);
      setImgSrc(imageDataUrl);
      setIsCropping(true);
      setCurrentImageType(isCover ? 'cover' : 'profile');
    } catch (error) {
      console.error("Erro ao processar imagem:", error);
      let errorMessage = t('profile.imageProcessError');
      
      if (error.message.includes('size')) {
        errorMessage = t('profile.imageTooLarge');
      } else if (error.message.includes('type')) {
        errorMessage = t('profile.imageTypeError');
      }
      
      setSnackbar({ 
        open: true, 
        message: errorMessage, 
        severity: 'error' 
      });
    }
  };

  const applyCrop = async () => {
    if (!completedCrop || !imgRef.current) {
      setIsCropping(false);
      return;
    }

    try {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      canvas.width = completedCrop.width;
      canvas.height = completedCrop.height;
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        image,
        completedCrop.x * scaleX,
        completedCrop.y * scaleY,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY,
        0,
        0,
        completedCrop.width,
        completedCrop.height
      );

      await new Promise((resolve) => {
        canvas.toBlob(async (blob) => {
          const file = new File([blob], `cropped-image.webp`, { type: 'image/webp' });
          await uploadEditedImage(file, currentImageType === 'cover');
          setIsCropping(false);
          setImgSrc(null);
          resolve();
        }, 'image/webp', 0.7);
      });
    } catch (error) {
      console.error("Erro ao aplicar crop:", error);
      setSnackbar({ open: true, message: t('profile.cropError'), severity: 'error' });
      setIsCropping(false);
    }
  };

  const uploadEditedImage = async (imageFile, isCover) => {
    const uploadState = isCover ? setIsUploadingCover : setIsUploadingProfile;
    uploadState(true);

    try {
      const timestamp = new Date().getTime();
      const fileExtension = 'webp';
      const fileName = `photo_${timestamp}.${fileExtension}`;
      
      const storagePath = isCover
        ? `company/${user}/coverPhoto/${fileName}`
        : `company/${user}/profilePhoto/${fileName}`;
      
      const imageRef = storageRef(storage, storagePath);
      
      let fileToUpload;
      if (imageFile instanceof Blob) {
        fileToUpload = new File([imageFile], fileName, { type: 'image/webp' });
      } else {
        fileToUpload = imageFile;
      }
      
      await uploadBytes(imageRef, fileToUpload);
      const imageURL = await getDownloadURL(imageRef);

      if (isCover) {
        await update(ref(db, `company/${user}`), { coverUrl: imageURL });
        setCoverPhoto(imageURL);
      } else {
        await update(ref(db, `company/${user}`), { logoUrl: imageURL });
        setProfilePhoto(imageURL);
      }

      setSnackbar({ open: true, message: t('profile.photoSuccess'), severity: 'success' });
    } catch (error) {
      console.error("Erro ao fazer upload da foto: ", error);
      setSnackbar({ open: true, message: t('profile.photoError'), severity: 'error' });
    } finally {
      uploadState(false);
    }
  };

  const handleCoverPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await openImageEditor(file, true);
    } finally {
      e.target.value = ''; // Limpa o input
    }
  };

  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await openImageEditor(file, false);
    } finally {
      e.target.value = ''; // Limpa o input
    }
  };

  // Funções para compartilhamento
  const handleShareClick = (event) => {
    setShareAnchorEl(event.currentTarget);
  };

  const handleShareClose = () => {
    setShareAnchorEl(null);
  };

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/perfil/${userData?.id}`;
    navigator.clipboard.writeText(profileUrl)
      .then(() => {
        setSnackbar({ open: true, message: t('profile.copySuccess'), severity: 'success' });
        handleShareClose();
      })
      .catch(() => {
        setSnackbar({ open: true, message: t('profile.copyError'), severity: 'error' });
      });
  };

  const shareOnFacebook = () => {
    const profileUrl = encodeURIComponent(`${window.location.origin}/perfil/${userData?.id}`);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${profileUrl}`, '_blank');
    handleShareClose();
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`Visite o perfil da ${userData?.displayName}!`);
    const profileUrl = encodeURIComponent(`${window.location.origin}/perfil/${userData?.id}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${profileUrl}`, '_blank');
    handleShareClose();
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`Visite o perfil da ${userData?.displayName}: ${window.location.origin}/perfil/${userData?.id}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    handleShareClose();
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Perfil da ${userData?.displayName}`);
    const body = encodeURIComponent(`Visite o perfil da ${userData?.displayName}:\n\n${window.location.origin}/perfil/${userData?.id}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    handleShareClose();
  };

  const formatWebsiteUrl = (url) => {
    if (!url) return '';
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  };

  // Funções para o vídeo
  const handlePlayVideo = () => {
    setShowVideoModal(true);
  };

  const handleCloseVideoModal = () => {
    setShowVideoModal(false);
  };

  // Carregar dados do usuário
  const user = auth.currentUser?.uid;

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const companyRef = ref(db, `company/${user}`);
          const socialRef = ref(db, `company/${user}/social`);
          const [companySnapshot, socialSnapshot, companyPosts] = await Promise.all([
            get(companyRef),
            get(socialRef),
            getCompanyPosts(user)
          ]);

          if (companySnapshot.exists()) {
            const companyData = companySnapshot.val();
            setUserData({
              ...companyData,
              photoURL: companyData.logoUrl || "https://via.placeholder.com/150",
              coverPhotoURL: companyData.coverUrl || "https://via.placeholder.com/600x200",
              displayName: companyData.nome || 'A carregar',
              username: companyData.id || 'A carregar',
              endereco: companyData.endereco || 'A carregar'
            });
            setCoverPhoto(companyData.coverUrl || '');
            setProfilePhoto(companyData.logoUrl || '');
          }
          if (socialSnapshot.exists()) {
            setSocial(socialSnapshot.val());
          }
          setPosts(companyPosts);
        } catch (error) {
          console.error('Error fetching data: ', error);
          navigate('/auth');
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    } else {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Funções auxiliares
  const toggleShowFullText = () => setShowFullText(prevState => !prevState);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Componente para exibir o vídeo
  const VideoSection = () => {
    if (!youtubeVideoId) return null;

    return (
      <Box 
        className="animate-fade-up delay-4"
        sx={{ 
          mt: 4, 
          maxWidth: 800, 
          mx: 'auto' 
        }}
      >
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            fontWeight: 700, 
            color: T.text,
            fontFamily: '"Playfair Display", serif',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <PlayArrow sx={{ color: T.gold }} /> Vídeo em Destaque
        </Typography>
        <Card 
          className="profile-card"
          sx={{ 
            cursor: 'pointer', 
            borderRadius: '20px',
            overflow: 'hidden',
            border: `1px solid ${T.border}`,
          }}
          onClick={handlePlayVideo}
        >
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              image={`https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`}
              alt="Thumbnail do vídeo"
              sx={{ 
                width: '100%', 
                height: { xs: 200, sm: 300, md: 400 },
                objectFit: 'cover'
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                transition: 'background-color 0.3s ease',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }
              }}
            >
              <PlayArrow 
                sx={{ 
                  fontSize: 60, 
                  color: T.white,
                  filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
                }} 
              />
            </Box>
          </Box>
          <CardContent sx={{ bgcolor: T.white }}>
            <Typography variant="body2" sx={{ color: T.textSub }}>
              Clique para assistir ao vídeo de apresentação
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  };

  // Renderização condicional
  const renderContent = () => {
    switch (activeTab) {
      case "inicio":
        return (
          <Fade in={true}>
            <Box>
             {/* Stats Cards */}
    
              {/* Seção de Informações Básicas */}
              <Paper
                className="profile-card animate-fade-up delay-1"
                sx={{
                  p: 3,
                  borderRadius: '20px',
                  border: `1px solid ${T.border}`,
                  background: T.white,
                  mb: 3,
                }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700, color: T.text, fontFamily: '"Playfair Display", serif', mb: 2 }}>
                  {t('profile.companyInfo')}
                </Typography>
                <Divider sx={{ mb: 3 }} />
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                      <MapPin size={18} color={T.gold} />
                      <Box>
                        <Typography sx={{ fontSize: '0.8rem', color: T.textSub }}>{t('profile.address')}</Typography>
                        <Typography sx={{ color: T.text }}>{userData?.endereco || t('profile.notProvided')}</Typography>
                      </Box>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                      <Phone size={18} color={T.gold} />
                      <Box>
                        <Typography sx={{ fontSize: '0.8rem', color: T.textSub }}>{t('profile.contact')}</Typography>
                        {userData?.contacto ? (
                          <MuiLink href={`tel:${userData.contacto}`} sx={{ color: T.gold, textDecoration: 'none' }}>
                            {userData.contacto}
                          </MuiLink>
                        ) : (
                          <Typography sx={{ color: T.textSub }}>{t('profile.notProvided')}</Typography>
                        )}
                      </Box>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                      <Mail size={18} color={T.gold} />
                      <Box>
                        <Typography sx={{ fontSize: '0.8rem', color: T.textSub }}>{t('profile.email')}</Typography>
                        {userData?.email ? (
                          <MuiLink href={`mailto:${userData.email}`} sx={{ color: T.gold, textDecoration: 'none' }}>
                            {userData.email}
                          </MuiLink>
                        ) : (
                          <Typography sx={{ color: T.textSub }}>{t('profile.notProvided')}</Typography>
                        )}
                      </Box>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                      <Target size={18} color={T.gold} />
                      <Box>
                        <Typography sx={{ fontSize: '0.8rem', color: T.textSub }}>{t('profile.sector')}</Typography>
                        <Typography sx={{ color: T.text }}>{userData?.sector || t('profile.notProvided')}</Typography>
                      </Box>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                      <Award size={18} color={T.gold} />
                      <Box>
                        <Typography sx={{ fontSize: '0.8rem', color: T.textSub }}>{t('profile.entityType')}</Typography>
                        <Typography sx={{ color: T.text }}>{userData?.tipoEntidade || t('profile.notProvided')}</Typography>
                      </Box>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1.5} mb={2}>
                      <MapPin size={18} color={T.gold} />
                      <Box>
                        <Typography sx={{ fontSize: '0.8rem', color: T.textSub }}>{t('profile.provinceDistrict')}</Typography>
                        <Typography sx={{ color: T.text }}>
                          {userData?.provincia || t('profile.notProvided')} · {userData?.distrito || t('profile.notProvided')}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* Seção de Missão, Visão e Valores */}
              {userData?.missaoVisaoValores && (
                <Paper
                  className="profile-card animate-fade-up delay-2"
                  sx={{
                    p: 3,
                    borderRadius: '20px',
                    border: `1px solid ${T.border}`,
                    background: T.white,
                    mb: 3,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, color: T.text, fontFamily: '"Playfair Display", serif', mb: 2 }}>
                    {t('profile.mission')}
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Typography sx={{ color: T.textMid, lineHeight: 1.8 }}>
                    {plainText(userData.missaoVisaoValores)}
                  </Typography>
                </Paper>
              )}

              {/* Seção do Vídeo */}
              <VideoSection />

              {/* Seção de Bio */}
              {userData?.bio && (
                <Paper
                  className="profile-card animate-fade-up delay-3"
                  sx={{
                    p: 3,
                    borderRadius: '20px',
                    border: `1px solid ${T.border}`,
                    background: T.white,
                    mt: 3,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700, color: T.text, fontFamily: '"Playfair Display", serif', mb: 2 }}>
                    {t('profile.aboutCompany')}
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Typography sx={{ color: T.textMid, lineHeight: 1.8 }}>
                    {plainText(userData.bio)}
                  </Typography>
                </Paper>
              )}
            </Box>
          </Fade>
        );
      case "Publicados":
        return (
          <Fade in={true}>
            <Box>
              <PostGallery posts={posts} />
            </Box>
          </Fade>
        );
      case "Repositorio":
        return (
          <Fade in={true}>
            <Box>
              <VetrineDesk id={userData?.id} userId={userData?.id} />
            </Box>
          </Fade>
        );
      default:
        return (
          <Box textAlign="center" color="text.secondary" mt={3}>
            <Typography variant="body1">{t('profile.noContent')}</Typography>
          </Box>
        );
    }
  };

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
        <style>{KEYFRAMES(T)}</style>
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
          <Typography sx={{ color: T.textSub }}>{t('profile.loading')}</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        backgroundColor: T.cream, 
        minHeight: '100vh',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
      }}
    >
      <style>{KEYFRAMES(T)}</style>
      
      {/* Capa do Perfil - Estilo Hero */}
      <Box position="relative" sx={{ mb: { xs: 8, sm: 10 } }}>
        <Box
          position="relative"
          height={{ xs: 200, sm: 300, md: 400 }}
          sx={{
            background: coverPhoto || userData?.coverPhotoURL 
              ? 'none'
              : `linear-gradient(135deg, ${T.navy} 0%, ${T.navyLight} 100%)`,
            overflow: 'hidden',
          }}
        >
          {coverPhoto || userData?.coverPhotoURL ? (
            <CardMedia
              component="img"
              image={coverPhoto || userData.coverPhotoURL}
              alt="Cover"
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <>
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
              
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 1,
                  color: T.gold,
                }}
              >
                <CameraAlt sx={{ fontSize: 48, opacity: 0.5 }} />
                <Typography variant="body1" sx={{ color: T.goldLight }}>
                  Adicionar foto de capa
                </Typography>
              </Box>
            </>
          )}
          
          {/* Overlay durante upload */}
          {isUploadingCover && (
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              display="flex"
              alignItems="center"
              justifyContent="center"
              bgcolor="rgba(0,0,0,0.5)"
              zIndex={1}
            >
              <CircularProgress sx={{ color: T.gold }} />
              <Typography sx={{ color: T.white, ml: 2 }}>
                {t('profile.processingImage')}
              </Typography>
            </Box>
          )}
          
          <Box position="absolute" top={16} right={16} sx={{ display: 'flex', gap: 1 }}>
            <IconButton
              onClick={handleShareClick}
              sx={{ 
                bgcolor: T.white,
                color: T.gold,
                '&:hover': { bgcolor: T.goldPale },
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <Share size={20} />
            </IconButton>
            
            <input
              accept="image/*"
              type="file"
              id="coverPhotoInput"
              style={{ display: "none" }}
              onChange={handleCoverPhotoChange}
              disabled={isUploadingCover}
            />
            <label htmlFor="coverPhotoInput">
              <IconButton
                component="span"
                disabled={isUploadingCover}
                sx={{ 
                  bgcolor: T.white,
                  color: T.gold,
                  '&:hover': { bgcolor: T.goldPale },
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                {isUploadingCover ? <CircularProgress size={24} sx={{ color: T.gold }} /> : <CameraAlt />}
              </IconButton>
            </label>
          </Box>
        </Box>

        {/* Menu de Compartilhamento */}
        <Menu
          anchorEl={shareAnchorEl}
          open={Boolean(shareAnchorEl)}
          onClose={handleShareClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          PaperProps={{
            sx: {
              borderRadius: '12px',
              border: `1px solid ${T.border}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              mt: 1
            }
          }}
        >
          <MenuItem onClick={copyProfileLink} sx={{ py: 1.5 }}>
            <ListItemIcon>
              <LinkIcon size={20} color={T.gold} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ sx: { color: T.text } }}>
              {t('profile.copyLink')}
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={shareOnFacebook} sx={{ py: 1.5 }}>
            <ListItemIcon>
              <Facebook sx={{ color: "#1877F2", fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ sx: { color: T.text } }}>
              {t('profile.shareFacebook')}
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={shareOnTwitter} sx={{ py: 1.5 }}>
            <ListItemIcon>
              <Twitter sx={{ color: "#1DA1F2", fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ sx: { color: T.text } }}>
              {t('profile.shareTwitter')}
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={shareOnWhatsApp} sx={{ py: 1.5 }}>
            <ListItemIcon>
              <WhatsApp sx={{ color: "#25D366", fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ sx: { color: T.text } }}>
              {t('profile.shareWhatsApp')}
            </ListItemText>
          </MenuItem>
          <MenuItem onClick={shareViaEmail} sx={{ py: 1.5 }}>
            <ListItemIcon>
              <Email sx={{ color: "#EA4335", fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ sx: { color: T.text } }}>
              {t('profile.shareEmail')}
            </ListItemText>
          </MenuItem>
        </Menu>

        {/* Avatar do Perfil */}
        <Box
          position="absolute"
          bottom={{ xs: -50, sm: -60 }}
          left={{ xs: "50%", sm: 32 }}
          sx={{ transform: { xs: "translateX(-50%)", sm: "none" } }}
        >
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={profilePhoto || userData?.photoURL}
              alt="Profile"
              sx={{
                width: { xs: 100, sm: 128, md: 150 },
                height: { xs: 100, sm: 128, md: 150 },
                border: `4px solid ${T.gold}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}
            />
            <Box position="absolute" bottom={-8} right={-8}>
              <input
                accept="image/*"
                type="file"
                id="profilePhotoInput"
                style={{ display: "none" }}
                onChange={handleProfilePhotoChange}
                disabled={isUploadingProfile}
              />
              <label htmlFor="profilePhotoInput">
                <IconButton
                  component="span"
                  disabled={isUploadingProfile}
                  sx={{ 
                    bgcolor: T.gold,
                    color: T.white,
                    '&:hover': { bgcolor: T.goldLight },
                    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    width: 40,
                    height: 40,
                  }}
                >
                  {isUploadingProfile ? <CircularProgress size={20} sx={{ color: T.white }} /> : <CameraAlt sx={{ fontSize: 20 }} />}
                </IconButton>
              </label>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Modal de Crop de Imagem */}
      <Dialog 
        open={isCropping} 
        onClose={() => setIsCropping(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            border: `1px solid ${T.border}`,
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: T.text }}>
          {t('profile.cropTitle')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {imgSrc && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={currentImageType === 'cover' ? 3/1 : 1/1}
                minWidth={100}
                minHeight={100}
              >
                <img
                  ref={imgRef}
                  src={imgSrc}
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                  alt={t('profile.cropAlt')}
                  onLoad={() => {
                    if (imgRef.current) {
                      const width = imgRef.current.width;
                      const height = imgRef.current.height;
                      const initialCrop = currentImageType === 'cover' 
                        ? { unit: 'px', width: width, height: width / 3, x: 0, y: (height - (width / 3)) / 2 }
                        : { unit: 'px', width: Math.min(width, height), height: Math.min(width, height), x: (width - Math.min(width, height)) / 2, y: (height - Math.min(width, height)) / 2 };
                      setCrop(initialCrop);
                      setCompletedCrop(initialCrop);
                    }
                  }}
                />
              </ReactCrop>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setIsCropping(false)}
            sx={{
              color: T.textSub,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {t('profile.cancel')}
          </Button>
          <Button 
            onClick={applyCrop} 
            variant="contained"
            sx={{
              bgcolor: T.gold,
              color: T.white,
              '&:hover': { bgcolor: T.goldLight },
              borderRadius: '10px',
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {t('profile.applyCrop')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal do Vídeo */}
      <Dialog 
        open={showVideoModal} 
        onClose={handleCloseVideoModal} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            borderRadius: '24px',
            overflow: 'hidden',
          }
        }}
      >
        <DialogContent sx={{ p: 0, backgroundColor: 'transparent' }}>
          <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
            <iframe
              src={`https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                border: 'none',
                borderRadius: '12px'
              }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title="YouTube video player"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', mt: 2 }}>
          <Button 
            onClick={handleCloseVideoModal} 
            variant="contained"
            sx={{
              bgcolor: T.gold,
              color: T.white,
              '&:hover': { bgcolor: T.goldLight },
              borderRadius: '10px',
              px: 4,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {t('profile.close')}
          </Button>
        </DialogActions>
      </Dialog>

      <Container maxWidth="lg">
        {/* Informações do Perfil */}
        <Box 
          className="animate-fade-up delay-1"
          sx={{ 
            mt: { xs: 8, sm: 10 }, 
            textAlign: 'center',
            mb: 4
          }}
        >
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 800, 
              color: T.text,
              fontFamily: '"Playfair Display", serif',
              mb: 1
            }}
          >
            {userData?.displayName}
          </Typography>
          
          {userData?.sector && (
            <Chip
              label={userData.sector}
              sx={{
                bgcolor: T.goldPale,
                color: T.gold,
                fontWeight: 600,
                fontSize: '0.85rem',
                mb: 2
              }}
            />
          )}
          
          {userData?.bio && (
            <Box 
              maxWidth={800} 
              mx="auto" 
              mt={2}
              sx={{ 
                color: T.textMid,
                lineHeight: 1.8
              }}
            >
              <Typography>
                {plainText(userData.bio).length > 200 && !showFullText
                  ? `${plainText(userData.bio).substring(0, 200)}...`
                  : plainText(userData.bio)}
              </Typography>
              {plainText(userData.bio).length > 200 && (
                <Button
                  onClick={toggleShowFullText}
                  sx={{
                    mt: 1,
                    color: T.gold,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                  }}
                >
                  {showFullText ? t('profile.readLess') : t('profile.readMore')}
                </Button>
              )}
            </Box>
          )}

          {/* Botão de Editar Perfil */}
          <Box sx={{ mt: 3 }}>
            <Button
              component={Link}
              href="editar-perfil"
              variant="contained"
              startIcon={<AiFillSetting size={20} />}
              sx={{
                bgcolor: T.navy,
                color: T.white,
                '&:hover': { bgcolor: T.navyLight },
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              {t('profile.edit')}
            </Button>
          </Box>

          {/* Redes Sociais */}
          <Box display="flex" justifyContent="center" mt={3} gap={2}>
            {social?.linkedin && (
              <MuiLink href={social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <LinkedIn className="social-icon" sx={{ color: "#0077b5", fontSize: 32 }} />
              </MuiLink>
            )}
            {social?.instagram && (
              <MuiLink href={formatWebsiteUrl(social.instagram)} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram className="social-icon" sx={{ color: "#C13584", fontSize: 32 }} />
              </MuiLink>
            )}
            {social?.x && (
              <MuiLink href={social.x} target="_blank" rel="noopener noreferrer" aria-label="X">
                <X className="social-icon" sx={{ color: "#1DA1F2", fontSize: 32 }} />
              </MuiLink>
            )}
            {social?.whatsapp && (
              <MuiLink href={social.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                <WhatsApp className="social-icon" sx={{ color: "#25D366", fontSize: 32 }} />
              </MuiLink>
            )}
            {social?.website && (
              <MuiLink
                href={formatWebsiteUrl(social.website)}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Website">
                <Language className="social-icon" sx={{ color: "#4285F4", fontSize: 32 }} />
              </MuiLink>
            )}
            {social?.facebook && (
              <MuiLink href={formatWebsiteUrl(social.facebook)} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                <Facebook className="social-icon" sx={{ color: "#3b5998", fontSize: 32 }} />
              </MuiLink>
            )}
          </Box>
        </Box>
        
        {/* Abas com estilo refinado */}
        <Box 
          className="animate-fade-up delay-2"
          sx={{ 
            mt: 6, 
            borderBottom: `2px solid ${T.border}`,
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            centered
            variant={isMobile ? "scrollable" : "standard"}
            scrollButtons="auto"
            TabIndicatorProps={{
              sx: {
                background: T.gold,
                height: 3,
              }
            }}
            sx={{
              '& .MuiTab-root': {
                color: T.textSub,
                fontWeight: 600,
                fontSize: '0.95rem',
                textTransform: 'none',
                '&.Mui-selected': {
                  color: T.gold,
                },
              },
            }}
          >
            <Tab label={t('profile.tabs.home')} value="inicio" />
            <Tab label={t('profile.tabs.posts')} value="Publicados" />
            <Tab label={t('profile.tabs.repository')} value="Repositorio" />
          </Tabs>
        </Box>
        
        {/* Conteúdo das Abas */}
        <Box mt={4} px={isMobile ? 1 : 2} pb={6}>
          {renderContent()}
        </Box>
      </Container>
      
      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{
            borderRadius: '12px',
            fontWeight: 500,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfileDesk;

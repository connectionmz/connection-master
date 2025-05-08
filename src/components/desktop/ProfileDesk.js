import React, { useEffect, useState } from 'react';
import { Twitter, Instagram, LinkedIn, Language, Edit, CameraAlt, ExitToApp, X, WhatsApp, Facebook, Email } from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import { get, ref, update } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../../fb';
import PostGallery from '../PostGallery';
import { EditorText } from '../../utils/formUtils';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AiFillSetting } from 'react-icons/ai';
import { Grid, Card, CardContent, Typography, Box, Link, CircularProgress, useMediaQuery, Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
import {
  Button,
  CardMedia,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Link as MuiLink,
  Skeleton,
  Snackbar,
  Alert,
} from "@mui/material";
import VetrineDesk from './VetrineDesk';
import { PinturaEditor } from '@pqina/react-pintura';
import { getEditorDefaults } from '@pqina/pintura';
import '@pqina/pintura/pintura.css';
import { LinkIcon, Share } from 'lucide-react';

const ProfileDesk = ({ userI }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('Publicados');
  const [userData, setUserData] = useState(null);
  const [social, setSocial] = useState({ linkedin: '', instagram: '', website: '' });
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [cotacoes, setCotacoes] = useState([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [profileData, setProfileData] = useState({
    bio: '',
    missaoVisaoValores: '',
  });
  const [coverPhoto, setCoverPhoto] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageToEdit, setImageToEdit] = useState(null);
  const [editedImage, setEditedImage] = useState(null);
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const isMobile = useMediaQuery("(max-width:600px)");

  // Função para abrir o editor de imagem
  const openImageEditor = (file, isCover) => {
    setImageToEdit(file);
    setIsEditingCover(isCover); // Define se estamos editando a capa ou o perfil
    setShowImageEditor(true);
  };

    // Share menu handlers
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
          setSnackbar({ open: true, message: 'Link copiado para a área de transferência!', severity: 'success' });
          handleShareClose();
        })
        .catch(() => {
          setSnackbar({ open: true, message: 'Falha ao copiar o link', severity: 'error' });
        });
    };
  
    const shareOnFacebook = () => {
      const profileUrl = encodeURIComponent(`${window.location.origin}/perfil/${userData?.id}`);
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${profileUrl}`, '_blank');
      handleShareClose();
    };
  
    const shareOnTwitter = () => {
      const text = encodeURIComponent(`Confira o perfil da ${userData?.displayName} no nosso app!`);
      const profileUrl = encodeURIComponent(`${window.location.origin}/perfil/${userData?.id}`);
      window.open(`https://twitter.com/intent/tweet?text=${text}&url=${profileUrl}`, '_blank');
      handleShareClose();
    };
  
    const shareOnWhatsApp = () => {
      const text = encodeURIComponent(`Confira o perfil da ${userData?.displayName}: ${window.location.origin}/perfil/${userData?.id}`);
      window.open(`https://wa.me/?text=${text}`, '_blank');
      handleShareClose();
    };
  
    const shareViaEmail = () => {
      const subject = encodeURIComponent(`Perfil da ${userData?.displayName}`);
      const body = encodeURIComponent(`Confira o perfil da ${userData?.displayName}:\n\n${window.location.origin}/perfil/${userData?.id}`);
      window.open(`mailto:?subject=${subject}&body=${body}`);
      handleShareClose();
    };


  // Função para lidar com a conclusão da edição da imagem
  const handleImageEditComplete = (res) => {
    setEditedImage(URL.createObjectURL(res.dest));
    setShowImageEditor(false);
    uploadEditedImage(res.dest, isEditingCover);
  };

  // Função para fazer upload da imagem editada
  const uploadEditedImage = async (imageFile, isCover) => {
    const uploadState = isCover ? setIsUploadingCover : setIsUploadingProfile;
    uploadState(true);

    try {
      const storagePath = isCover
        ? `company/${user}/coverPhoto/${imageFile.name}`
        : `company/${user}/profilePhoto/${imageFile.name}`;
      const imageRef = storageRef(storage, storagePath);
      await uploadBytes(imageRef, imageFile);
      const imageURL = await getDownloadURL(imageRef);

      if (isCover) {
        await update(ref(db, `company/${user}`), { coverUrl: imageURL });
        setCoverPhoto(imageURL);
      } else {
        await update(ref(db, `company/${user}`), { logoUrl: imageURL });
        setProfilePhoto(imageURL);
      }

      setSnackbar({ open: true, message: 'Foto atualizada com sucesso!', severity: 'success' });
    } catch (error) {
      console.error("Erro ao fazer upload da foto: ", error);
      setSnackbar({ open: true, message: 'Erro ao atualizar a foto.', severity: 'error' });
    } finally {
      uploadState(false);
    }
  };

  // Função para lidar com a mudança da foto de capa
  const handleCoverPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      openImageEditor(file, true); // Abre o editor para a capa
    }
  };

  // Função para lidar com a mudança da foto de perfil
  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      openImageEditor(file, false); // Abre o editor para o perfil
    }
  };

  const user = auth.currentUser?.uid;

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const companyRef = ref(db, `company/${user}`);
          const socialRef = ref(db, `company/${user}/social`);
          const postsRef = ref(db, `posts`);
          const cotacoesRef = ref(db, `cotacoes`);
          const visitasRef = ref(db, `company/${user}/visitas`);

          const [companySnapshot, socialSnapshot, cotacoesSnapshot, postsSnapshot, visitasSnapshot] = await Promise.all([
            get(companyRef),
            get(socialRef),
            get(cotacoesRef),
            get(postsRef),
            get(visitasRef)
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
          }
          if (socialSnapshot.exists()) {
            setSocial(socialSnapshot.val());
          }
          if (postsSnapshot.exists()) {
            const postsData = postsSnapshot.val();
            const filteredPosts = Object.values(postsData).filter(post => post.company.id === user);
            setPosts(filteredPosts);
          }
          if (cotacoesSnapshot.exists()) {
            const cotacoesData = cotacoesSnapshot.val();
            const userCotacoes = Object.keys(cotacoesData).filter(key =>
              cotacoesData[key].company && cotacoesData[key].company.id === user
            );
            setCotacoes(userCotacoes.map(key => cotacoesData[key]));
          }
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

  const toggleShowFullText = () => setShowFullText(prevState => !prevState);

  const handleSaveProfile = async () => {
    if (user) {
      try {
        const companyUpdate = {
          bio: profileData.bio,
          missaoVisaoValores: profileData.missaoVisaoValores,
        };
        await update(ref(db, `company/${user}`), companyUpdate);
        setUserData(prev => ({ ...prev, ...profileData }));
        setShowProfileModal(false);
      } catch (error) {
        console.error('Erro ao atualizar perfil: ', error);
      }
    }
  };

  const handleDescriptionChange = (value) => {
    setProfileData((prevData) => ({
      ...prevData,
      missaoVisaoValores: value,
    }));
  };

  const handleDeletePost = (postToDelete) => {
    setPosts((prevPosts) => prevPosts.filter(post => post !== postToDelete));
    console.log('Post deletado:', postToDelete);
  };

  const handleEditCaption = (postToEdit, newCaption) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post === postToEdit ? { ...post, description: newCaption } : post
      )
    );
    console.log('Legenda atualizada:', newCaption);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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

  const renderContent = () => {
    switch (activeTab) {
      case "inicio":
        return (
          <Box mt={3} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Typography variant="body1">
              <strong>Endereço:</strong> {userData?.endereco || 'Não informado'}
            </Typography>
            <Typography variant="body1">
              <strong>Província:</strong> {userData?.provincia || 'Não informado'}
            </Typography>
            <Typography variant="body1">
              <strong>Distrito:</strong> {userData?.distrito || 'Não informado'}
            </Typography>
            <Typography variant="body1">
              <strong>Capacidade de Produção:</strong> {userData?.capacidadeDeProducao || 'Não informado'}
            </Typography>
            <Typography variant="body1">
              <strong>Email:</strong>{' '}
              {userData?.email ? (
                <a href={`mailto:${userData.email}`} style={{ textDecoration: 'none', color: '#1976D2' }}>
                  {userData.email}
                </a>
              ) : (
                'Não informado'
              )}
            </Typography>
            <Typography variant="body1">
              <strong>Contacto:</strong>{' '}
              {userData?.contacto ? (
                <a href={`tel:${userData.contacto}`} style={{ textDecoration: 'none', color: '#1976D2' }}>
                  {userData.contacto}
                </a>
              ) : (
                'Não informado'
              )}
            </Typography>
            <Typography variant="body1">
              <strong>Sector:</strong> {userData?.sector || 'Não informado'}
            </Typography>
            <Typography variant="body1">
              <strong>Tipo de Entidade:</strong> {userData?.tipoEntidade || 'Não informado'}
            </Typography>
          </Box>
        );
      case "Publicados":
        return <PostGallery posts={posts} onDelete={handleDeletePost} onEdit={handleEditCaption} />;
      case "Repositorio":
        return <VetrineDesk id={userData.id} userId={userData.id} />;
      case "liked":
        return <></>;
      default:
        return (
          <Box textAlign="center" color="text.secondary" mt={3}>
            <Typography variant="body1">Nenhum conteúdo disponível.</Typography>
          </Box>
        );
    }
  };

  return (
    <Box width="100%" minHeight="100vh">
      {/* Capa do Perfil */}
      <Box position="relative">
        <Box
          position="relative"
          height={{ xs: 150, sm: 400 }}
          bgcolor="grey.300"
          overflow="hidden"
        >
          {coverPhoto || userData.coverPhotoURL ? (
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
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 1,
                color: '#666',
                height: '100%',
              }}
            >
              <CameraAlt sx={{ fontSize: 40 }} />
              <Typography variant="body1">Nenhuma foto de capa</Typography>
            </Box>
          )}
          <Box position="absolute" top={8} right={8}>
          <IconButton
       color="primary"
      aria-label="share profile"
      onClick={handleShareClick}
      sx={{ bgcolor: 'background.paper' }}
    >
      <Share />
    </IconButton>
            <input
              accept="image/*"
              type="file"
              id="coverPhotoInput"
              style={{ display: "none" }}
              onChange={handleCoverPhotoChange}
              disabled={isUploadingCover}
            />
            <IconButton
              color="primary"
              aria-label="edit cover photo"
              onClick={() => document.getElementById("coverPhotoInput").click()}
              disabled={isUploadingCover}
            >
              {isUploadingCover ? <CircularProgress size={24} /> : <CameraAlt />}
            </IconButton>
          </Box>
        </Box>
               {/* Share Menu */}
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
        >
          <MenuItem onClick={copyProfileLink}>
            <ListItemIcon>
              <LinkIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Copiar link</ListItemText>
          </MenuItem>
          <MenuItem onClick={shareOnFacebook}>
            <ListItemIcon>
              <Facebook fontSize="small" />
            </ListItemIcon>
            <ListItemText>Compartilhar no Facebook</ListItemText>
          </MenuItem>
          <MenuItem onClick={shareOnTwitter}>
            <ListItemIcon>
              <Twitter fontSize="small" />
            </ListItemIcon>
            <ListItemText>Compartilhar no Twitter</ListItemText>
          </MenuItem>
          <MenuItem onClick={shareOnWhatsApp}>
            <ListItemIcon>
              <WhatsApp fontSize="small" />
            </ListItemIcon>
            <ListItemText>Compartilhar no WhatsApp</ListItemText>
          </MenuItem>
          <MenuItem onClick={shareViaEmail}>
            <ListItemIcon>
              <Email fontSize="small" />
            </ListItemIcon>
            <ListItemText>Compartilhar por e-mail</ListItemText>
          </MenuItem>
        </Menu>

        {/* Avatar do Perfil */}
        <Box
          position="absolute"
          top={{ xs: 100, sm: 140 }}
          left={{ xs: "50%", sm: 16 }}
          sx={{ transform: { xs: "translateX(-50%)", sm: "none" } }}
        >
          <Avatar
            src={profilePhoto || userData.photoURL}
            alt="Profile"
            sx={{
              width: { xs: 80, sm: 128 },
              height: { xs: 80, sm: 128 },
              border: "4px solid",
              borderColor: "background.paper",
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
            <IconButton
              color="primary"
              aria-label="edit profile photo"
              onClick={() => document.getElementById("profilePhotoInput").click()}
              disabled={isUploadingProfile}
            >
              {isUploadingProfile ? <CircularProgress size={24} /> : <CameraAlt />}
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Editor de Imagem */}
      {showImageEditor && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bgcolor="rgba(0, 0, 0, 0.8)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={9999}
        >
          <Box width="90%" maxWidth={800} height="90%" maxHeight={600}>
            <PinturaEditor
              {...getEditorDefaults()}
              src={URL.createObjectURL(imageToEdit)}
              onProcess={handleImageEditComplete}
              onClose={() => setShowImageEditor(false)}
            />
          </Box>
        </Box>
      )}

      {/* Informações do Perfil */}
      <Box mt={{ xs: 8, sm: 10 }} textAlign="center">
        <Typography variant="h5" fontWeight="bold">
          {userData?.displayName}
        </Typography>
        <Box maxWidth={600} mx="auto" mt={2}>
          {userData?.bio ? (
            <>
              <Typography
                variant="body2"
                color="text.secondary"
                noWrap={!showFullText}
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: showFullText ? "initial" : 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {userData.bio}
              </Typography>
              {userData.bio.length > 120 && (
                <Button
                  size="small"
                  onClick={toggleShowFullText}
                  sx={{ textTransform: "none", mt: 1 }}
                >
                  {showFullText ? "Ver Menos" : "Ver Mais"}
                </Button>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Sem Bio
            </Typography>
          )}
        </Box>

        {/* Botão de Editar Perfil */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
            marginTop: 2,
          }}
        >
          <Button
            component="a"
            href="editar-perfil"
            variant="outlined"
            color="primary"
            startIcon={<AiFillSetting size={24} />}
            sx={{
              display: "flex",
              alignItems: "center",
              padding: "6px 16px",
              width: { xs: "100%", sm: "20%" },
            }}
          >
            <Typography variant="body1" sx={{ marginLeft: 1 }}>
              Editar Perfil
            </Typography>
          </Button>
        </Box>

        {/* Redes Sociais */}
        <Box display="flex" justifyContent="center" mt={3} gap={2}>
          {social?.linkedin && (
            <MuiLink href={social.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <LinkedIn sx={{ color: "#0077b5", fontSize: 32 }} />
            </MuiLink>
          )}
          {social?.instagram && (
            <MuiLink href={social.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram sx={{ color: "#C13584", fontSize: 32 }} />
            </MuiLink>
          )}
          {social?.x && (
            <MuiLink href={social.x} target="_blank" rel="noopener noreferrer" aria-label="X">
              <X sx={{ color: "#1DA1F2", fontSize: 32 }} />
            </MuiLink>
          )}
          {social?.whatsapp && (
            <MuiLink href={social.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              <WhatsApp sx={{ color: "#25D366", fontSize: 32 }} />
            </MuiLink>
          )}
          {social?.website && (
            <MuiLink href={social.website} target="_blank" rel="noopener noreferrer" aria-label="Website">
              <Language sx={{ color: "#4285F4", fontSize: 32 }} />
            </MuiLink>
          )}
        </Box>
      </Box>

      {/* Abas */}
      <Box mt={6} borderBottom={1} borderColor="divider">
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          centered
          variant={isMobile ? "scrollable" : "standard"}
          scrollButtons="auto"
        >
          <Tab label="Início" value="inicio" />
          <Tab label="Publicados" value="Publicados" />
          <Tab label="Repositorio" value="Repositorio" />
        </Tabs>
      </Box>

      {/* Conteúdo das Abas */}
      <Box mt={4} px={2}>
        {renderContent()}
      </Box>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfileDesk;
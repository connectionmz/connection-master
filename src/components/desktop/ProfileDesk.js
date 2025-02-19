import React, { useEffect, useState } from 'react';
import { Twitter, Instagram, LinkedIn, Language, Edit, EditAttributes, CameraAlt, ExitToApp, X, WhatsApp } from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import { get, ref, update } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../../fb'; 
import PostGallery from '../PostGallery';
import { EditorText } from '../../utils/formUtils';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import { AiFillSetting } from 'react-icons/ai';
import { Grid, Card, CardContent, Typography, Box, Link, CircularProgress, useMediaQuery } from "@mui/material";
import {
  Button,
  CardMedia,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Link as MuiLink,
} from "@mui/material";
import VetrineDesk from './VetrineDesk';



const ProfileDesk = ({userI}) => {
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
  const isMobile = useMediaQuery("(max-width:600px)");
  

  const handleCoverPhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const coverPhotoStorageRef = storageRef(storage, `company/${user}/coverPhoto/${file.name}`);
  
        await uploadBytes(coverPhotoStorageRef, file);
  
        const coverPhotoURL = await getDownloadURL(coverPhotoStorageRef);
  
        await update(ref(db, `company/${user}`), { coverUrl: coverPhotoURL });
  
        setCoverPhoto(coverPhotoURL);
  
        console.log("Foto de capa atualizada com sucesso!");
      } catch (error) {
        console.error("Erro ao fazer upload da foto de capa: ", error);
      }
    }
  };
  
  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        const profilePhotoStorageRef = storageRef(storage, `company/${user}/profilePhoto/${file.name}`);
  
        await uploadBytes(profilePhotoStorageRef, file);
  
        const profilePhotoURL = await getDownloadURL(profilePhotoStorageRef);
  
        await update(ref(db, `company/${user}`), { logoUrl: profilePhotoURL });
  
        setProfilePhoto(profilePhotoURL);
  
        console.log("Foto de perfil atualizada com sucesso!");
      } catch (error) {
        console.error("Erro ao fazer upload da foto de perfil: ", error);
      }
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
                      })
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
  }, [user, navigate, user]);

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



    if (loading) return <div>Carregando...</div>;

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
          return (
              <></>
          );
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
            <Box position="absolute" top={8} right={8}>
              <input
                accept="image/*"
                type="file"
                id="coverPhotoInput"
                style={{ display: "none" }}
                onChange={handleCoverPhotoChange}
              />
              <IconButton
                color="primary"
                aria-label="edit cover photo"
                onClick={() => document.getElementById("coverPhotoInput").click()}
              >
                <CameraAlt />
              </IconButton>
            </Box>
          </Box>
  
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
              />
              <IconButton
                color="primary"
                aria-label="edit profile photo"
                onClick={() => document.getElementById("profilePhotoInput").click()}
              >
                <CameraAlt />
              </IconButton>
            </Box>
          </Box>
        </Box>
  
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
      </Box>
    );
  };

export default ProfileDesk;
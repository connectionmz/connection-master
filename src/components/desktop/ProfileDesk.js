import React, { useEffect, useState } from 'react';
import { Twitter, Instagram, LinkedIn, Language, Edit, EditAttributes, CameraAlt, ExitToApp } from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import { get, ref, update } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../../fb'; 
import PostGallery from '../PostGallery';
import { EditorText } from '../../utils/formUtils';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'; 
import { AiFillSetting } from 'react-icons/ai';
import { Grid, Card, CardContent, Typography, Box, Link, CircularProgress } from "@mui/material";
import {
  Button,
  CardMedia,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  Link as MuiLink,
} from "@mui/material";



const ProfileDesk = () => {
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
                    const postsRef = ref(db, `company/${user}/publishedPhotos`);
                    const cotacoesRef = ref(db, `cotacoes`);

                    const [companySnapshot, socialSnapshot, cotacoesSnapshot, postsSnapshot] = await Promise.all([
                        get(companyRef),
                        get(socialRef),
                        get(cotacoesRef),
                        get(postsRef)
                    ]);

                    if (companySnapshot.exists()) {
                        const companyData = companySnapshot.val();
                        setUserData({
                            ...companyData,
                            photoURL: companyData.logoUrl || "https://via.placeholder.com/150",
                            coverPhotoURL: companyData.coverUrl || "https://via.placeholder.com/600x200",
                            displayName: companyData.nome || 'Nome da Empresa',
                            username: companyData.id || 'ID da Empresa',
                            endereco: companyData.endereco || 'Endereço da Empresa',
                            bio: companyData.bio || '',
                        });
                       
                    } else {
                        navigate('/setup');
                    }

                    if (socialSnapshot.exists()) {
                        setSocial(socialSnapshot.val());
                    }
                    if (postsSnapshot.exists()) {
                        const posts = Object.values(postsSnapshot.val() || []);
                        setPosts(posts);
                    }
                    if (cotacoesSnapshot.exists()) {
                        const cotacoesData = cotacoesSnapshot.val();
                        if (cotacoesData) {
                            const userCotacoes = Object.keys(cotacoesData).filter(key => 
                                cotacoesData[key].company && cotacoesData[key].company.id === user
                            );
                            setCotacoes(userCotacoes.map(key => cotacoesData[key]));
                        }
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



    if (loading) return <div>Carregando...</div>;

    const renderContent = () => {
      switch (activeTab) {
        case "inicio":
          return (
            <Grid container spacing={3} mt={3} px={2}>
              <Grid item xs={12} md={6}>
                {userData?.missaoVisaoValores ? (
                  <Box dangerouslySetInnerHTML={{ __html: userData.missaoVisaoValores }} />
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    Não informada
                  </Typography>
                )}
              </Grid>
            </Grid>
          );
        case "Publicados":
          return <PostGallery posts={posts} onDelete={handleDeletePost} onEdit={handleEditCaption} />;
        case "liked":
          return (
            <Grid container spacing={3}>
              {cotacoes.length > 0 ? (
                cotacoes.map((cotacao, index) => (
                  <Grid item xs={12} md={6} lg={4} key={index}>
                    <Card sx={{ boxShadow: 3 }}>
                      <Link href={`/detalhe-cotacao/${cotacao.id}`} underline="none">
                        <CardContent>
                          <Typography variant="h6" component="h2" fontWeight="bold">
                            {cotacao.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" mt={1}>
                            {cotacao.description}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" mt={1}>
                            <strong>Data Limite:</strong> {new Date(cotacao.datalimite).toLocaleDateString()}
                          </Typography>
                          <Box mt={2}>
                            {cotacao.items.map((item, idx) => (
                              <Box key={idx} display="flex" alignItems="center" mb={2}>
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  style={{ width: 64, height: 64, borderRadius: 4, marginRight: 16 }}
                                />
                                <Box>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    {item.name}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {item.description}
                                  </Typography>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </CardContent>
                      </Link>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Typography textAlign="center" color="text.secondary">
                    Nenhuma cotação disponível.
                  </Typography>
                </Grid>
              )}
            </Grid>
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
      <Box width='100%' minHeight="100vh">
        <Box position="relative">
          <Box position="relative" height={200} bgcolor="grey.300">
            <CardMedia
              component="img"
              image={coverPhoto || userData.coverPhotoURL}
              alt="Cover"
              sx={{ width: "100%", height: "50%", objectFit: "cover" }}
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
  
          <Box position="absolute" top={140} left={16}>
            <Avatar
              src={profilePhoto || userData.photoURL}
              alt="Profile"
              sx={{
                width: 128,
                height: 128,
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
  
        <Box mt={10} textAlign="center">
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
  
          <MuiLink href="editar-perfil" aria-label="Editar Perfil">
            <AiFillSetting size={24} style={{ marginLeft: 8 }} />
          </MuiLink>
  
          <Box display="flex" justifyContent="center" mt={3} gap={2}>
            {social?.linkedin && (
              <MuiLink href={social.linkedin} aria-label="LinkedIn">
                <LinkedIn sx={{ color: "primary.main", fontSize: 32 }} />
              </MuiLink>
            )}
            {social?.instagram && (
              <MuiLink href={social.instagram} aria-label="Instagram">
                <Instagram sx={{ color: "secondary.main", fontSize: 32 }} />
              </MuiLink>
            )}
            {social?.website && (
              <MuiLink href={social.website} aria-label="Website">
                <Language sx={{ color: "text.secondary", fontSize: 32 }} />
              </MuiLink>
            )}
          </Box>
        </Box>
  
        <Box mt={6} borderBottom={1} borderColor="divider">
          <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} centered>
            <Tab label="Início" value="inicio" />
            <Tab label="Publicados" value="Publicados" />
          </Tabs>
        </Box>
  
        <Box mt={4} px={2}>
          {renderContent()}
        </Box>
      </Box>
    );
};

export default ProfileDesk;
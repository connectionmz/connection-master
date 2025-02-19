import React, { useEffect, useState } from 'react';
import { VerifiedRounded, MoreHoriz, Twitter, Instagram, LinkedIn, Logout, Edit, CameraAlt, Language, Store, RequestQuote, Message, Phone, WhatsApp, Facebook, Email } from "@mui/icons-material";
import { useNavigate, useParams } from 'react-router-dom';
import { get, ref, update, push, set, onValue, remove } from 'firebase/database'; 
import { auth, db } from '../../fb'; 
import PostGallery from '../PostGallery';
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
    const isMobile = useMediaQuery('(max-width:600px)'); // Verifica se a tela é pequena
    
    useEffect(() => {
      if (userId) {
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
  
                  if (companySnapshot.exists()) {
                      const companyData = companySnapshot.val();
  
                      setmCompany(companyData);
                      setUserData({
                          ...companyData,
                          photoURL: companyData.logoUrl || "https://via.placeholder.com/150",
                          coverPhotoURL: companyData.coverUrl || "https://via.placeholder.com/600x200",
                          displayName: companyData.nome || 'A carregar',
                          username: companyData.id || 'A carregar',
                          endereco: companyData.endereco || 'A carregar'
                      });
                      setModules(companyData.activeModules || {});
                      setSmsLimit(companyData.activeModules?.moduloSMS?.limit || 0);
                      
                      const newVisitRef = push(visitasRef);
                      await update(newVisitRef, {
                          visitorId: user.id, 
                          visitorName: user.nome || 'Visitante Anônimo', 
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
                  navigate('/auth');
              } finally {
                  setLoading(false);
              }
          };
          fetchData();
      } else {
          navigate('/auth');
      }
  }, [userId, navigate, user]);

    useEffect(() => {

      const connectionRef = ref(db, `connections/${userId}/${user.id}`);
      const unsubscribe = onValue(connectionRef, (snapshot) => {
        if (snapshot.exists()) {
          setConnectionStatus(snapshot.val().status);
          console.log(snapshot.val())
        } else {
          setConnectionStatus(null); 
        }
      });
  
      return () => unsubscribe(); 
    }, [userId, user.id, db]);
    const handleCotacaoClick = (id, companyId) => {
        console.log(id);
        console.log(companyId);
    };
    const handleConectar = () => {
      if (!userId) {
        alert("Usuário inválido. Não é possível conectar.");
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
        timestamp: new Date().toISOString(),
        status: "unread",
      };

      set(targetUserConnectionRef, connectionRequest)
        .then(() => {
          alert("Solicitação de conexão enviada!");
          saveContentToInbox(userId, notification)
        })
        .catch((error) => {
          console.error("Erro ao enviar solicitação:", error);
          alert("Erro ao tentar enviar a solicitação. Tente novamente.");
        });
    };
    const handleCancelarConexao = () => {
      const targetUserConnectionRef = ref(db, `connections/${userId}/${user.id}`);
        remove(targetUserConnectionRef)
        .then(() => {
          alert("Solicitação de conexão cancelada!");
        })
        .catch((error) => {
          console.error("Erro ao cancelar a solicitação:", error);
          alert("Erro ao tentar cancelar a solicitação. Tente novamente.");
        });
    };
    if (loading) {
        return <div>Carregando...</div>;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'inicio':
                return (
                    <Box mt={3}>
                        {userData?.missaoVisaoValores ? (
                            <Typography
                                dangerouslySetInnerHTML={{ __html: userData.missaoVisaoValores }}
                            />
                        ) : (
                            <Typography color="text.secondary">Não informada</Typography>
                        )}
                    </Box>
                );
            case 'Publicados':
                return <PostGallery posts={posts} />;
                case 'Repositorio':
                return <VetrineDesk id={userId} />;
            case 'liked':
                return (
                    <Grid container spacing={2}>
                        {cotacoes.length > 0 ? (
                            cotacoes.map((cotacao) => (
                                <Grid item xs={12} sm={6} md={4} key={cotacao.id}>
                                    <Card
                                        onClick={() => handleCotacaoClick(cotacao.id, cotacao.company.id)}
                                        sx={{ cursor: 'pointer', boxShadow: 3 }}
                                    >
                                        <CardContent>
                                            <Typography variant="h6" component="h3">
                                                {cotacao.title}
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))
                        ) : (
                            <Typography color="text.secondary">Nenhuma cotação publicada.</Typography>
                        )}
                    </Grid>
                );
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
                    <strong>Email:</strong>{' '}
                    {mCompany?.email ? (
                      <a href={`mailto:${mCompany.email}`} style={{ textDecoration: 'none', color: '#1976D2' }}>
                        {mCompany.email}
                      </a>
                    ) : (
                      'Não informado'
                    )}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Contacto:</strong>{' '}
                    {mCompany?.contacto ? (
                      <a href={`tel:${mCompany.contacto}`} style={{ textDecoration: 'none', color: '#1976D2' }}>
                        {mCompany.contacto}
                      </a>
                    ) : (
                      'Não informado'
                    )}
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

    return (
        <Box width='100%' minHeight="100vh">
                <BackButton sx={{ mb: 2 }} />

              <Box position="relative">
              <Box
                height={{ xs: 150, sm: 400 }} // Altura ajustada para telas pequenas e maiores
                sx={{ backgroundColor: 'grey.200', overflow: 'hidden' }}
              >
                {userData?.coverPhotoURL && (
                  <img
                    src={userData.coverPhotoURL}
                    alt="Cover"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                )}
              </Box>
              <Avatar
                src={userData?.photoURL}
                alt="Profile"
                sx={{
                  width: { xs: 80, sm: 120 }, // Tamanho ajustado para telas pequenas e maiores
                  height: { xs: 80, sm: 120 }, // Tamanho ajustado para telas pequenas e maiores
                  position: 'absolute',
                  top: { xs: 100, sm: 140 }, // Posição ajustada para telas pequenas e maiores
                  left: { xs: '50%', sm: 24 }, // Centralizado em telas pequenas, alinhado à esquerda em telas maiores
                  transform: { xs: 'translateX(-50%)', sm: 'none' }, // Centralizado em telas pequenas
                  border: '4px solid white',
                }}
              />
            </Box>

            <Box textAlign="center" mt={8}>
                <Typography variant="h5" fontWeight="bold">{userData?.displayName}</Typography>
                <Typography color="text.secondary" mt={1}>{userData?.bio}</Typography>
                
                
                {/* CONECTAR */}

                <Button
  variant={
    connectionStatus === "accepted"
      ? "contained"
      : connectionStatus === "pending"
      ? "outlined"
      : "outlined"
  }
  disabled={connectionStatus === "accepted"}
  onClick={
    connectionStatus === "pending" ? handleCancelarConexao : handleConectar
  }
>
  {connectionStatus === "pending"
    ? "Cancelar Solicitação"
    : connectionStatus === "accepted"
    ? "Conectado"
    : "Conectar"}
                </Button>

<Box
  display="flex"
  justifyContent="center"
  alignItems="center"
  mt={4}
  gap={2}
>
  {/* Navegação */}
  <Tooltip title="Ir para a Loja" arrow>
    <IconButton
      onClick={() => userId && navigate(`/stores/${userId}`)}
      color="success"
    >
      <Store />
    </IconButton>
  </Tooltip>

{/* Contatos */}
{userData.contacto && (
  <Tooltip title="Ligar" arrow>
    <IconButton href={`tel:${userData.contacto}`} sx={{ color: '#4CAF50' }}>
      <Phone />
    </IconButton>
  </Tooltip>
)}

{/* E-mail */}
{userData.email && (
  <Tooltip title="E-mail" arrow>
    <IconButton href={`mailto:${userData.email}`} sx={{ color: '#D44638' }}>
      <Email />
    </IconButton>
  </Tooltip>
)}

{/* Redes sociais */}
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
      href={social.website}
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
            <Box mt={4} borderBottom={1} borderColor="divider">
                <Tabs
                    value={activeTab}
                    onChange={(_, value) => setActiveTab(value)}
                    centered
                    variant={isMobile ? "scrollable" : "standard"}
                    scrollButtons="auto"
                >
                    <Tab label="Início" value="inicio" />
                    <Tab label="Sobre" value="sobre" />
                    <Tab label="Publicações" value="Publicados" />
                    <Tab label="Repositorio" value="Repositorio" />
                </Tabs>
            </Box>
            <Box p={3}>{renderContent()}</Box>
        </Box>
    );
};

export default CompanyProfile;

import React, { useEffect, useState } from 'react';
import { VerifiedRounded, MoreHoriz, Twitter, Instagram, LinkedIn, Logout, Edit, CameraAlt, Language, Store, RequestQuote, Message, Phone, WhatsApp, Facebook } from "@mui/icons-material";
import { useNavigate, useParams } from 'react-router-dom';
import { get, ref, update, push } from 'firebase/database'; 
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
} from '@mui/material';

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

    useEffect(() => {
        if (userId) {
            const fetchData = async () => {
                try {
                    const companyRef = ref(db, `company/${userId}`);
                    const socialRef = ref(db, `company/${userId}/social`);
                    const postsRef = ref(db, `company/${userId}/publishedPhotos`);
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

                        console.log(companyData)
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
                        const posts = Object.values(postsSnapshot.val() || []);
                        setPosts(posts);
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

    const handleCotacaoClick = (id, companyId) => {
        console.log(id);
        console.log(companyId);
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
                    <Box mt={3}>
                        <Typography><strong>Endereço:</strong> {mCompany?.endereco || 'Não informado'}</Typography>
                        <Typography><strong>Província:</strong> {mCompany?.provincia || 'Não informado'}</Typography>
                        <Typography><strong>Capacidade de Produção:</strong> {mCompany?.capacidadeDeProducao || 'Não informado'}</Typography>
                        <Typography><strong>Email:</strong> {mCompany?.email || 'Não informado'}</Typography>
                        <Typography><strong>Contacto:</strong> {mCompany?.contacto || 'Não informado'}</Typography>
                        <Typography><strong>Sector:</strong> {mCompany?.sector || 'Não informado'}</Typography>
                        <Typography><strong>Tipo de Entidade:</strong> {mCompany?.tipoEntidade || 'Não informado'}</Typography>
                    </Box>
                );
            default:
                return <Typography color="text.secondary" align="center">Nenhum conteúdo disponível.</Typography>;
        }
    };

    return (
        <Box bgcolor="background.default" minHeight="100vh">
            {/* Capa e Foto de Perfil */}
            <Box position="relative">
                <Box
                    height={200}
                    sx={{ backgroundColor: 'grey.200', overflow: 'hidden' }}
                >
                    {userData?.coverPhotoURL && (
                        <img
                            src={userData.coverPhotoURL}
                            alt="Cover"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    )}
                </Box>
                <Avatar
                    src={userData?.photoURL}
                    alt="Profile"
                    sx={{
                        width: 120,
                        height: 120,
                        position: 'absolute',
                        top: 140,
                        left: 24,
                        border: '4px solid white',
                    }}
                />
            </Box>

            <Box textAlign="center" mt={8}>
                <Typography variant="h5" fontWeight="bold">{userData?.displayName}</Typography>
                <Typography color="text.secondary" mt={1}>{userData?.bio}</Typography>

              {/* Botões e Contatos */}
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

  <Tooltip title="Solicitação de Cotação" arrow>
    <IconButton
      onClick={() => userId && navigate(`/rfq/${userId}`)}
      color="success"
    >
      <RequestQuote />
    </IconButton>
  </Tooltip>

  {/* Contatos */}
  {userData.contacto && (
    <Tooltip title="Ligar" arrow>
      <IconButton href={`tel:${userData.contacto}`} color="success">
        <Phone />
      </IconButton>
    </Tooltip>
  )}

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
        color="primary"
      >
        <Language />
      </IconButton>
    </Tooltip>
  )}
</Box>

            </Box>

            {/* Tabs */}
            <Box mt={4} borderBottom={1} borderColor="divider">
                <Tabs
                    value={activeTab}
                    onChange={(_, value) => setActiveTab(value)}
                    centered
                >
                    <Tab label="Início" value="inicio" />
                    <Tab label="Sobre" value="sobre" />
                    <Tab label="Publicações" value="Publicados" />
                    <Tab label="Cotações" value="liked" />
                </Tabs>
            </Box>

            {/* Conteúdo */}
            <Box p={3}>{renderContent()}</Box>
        </Box>
    );
};

export default CompanyProfile;

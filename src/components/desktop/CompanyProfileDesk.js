import React, { useEffect, useState } from 'react';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CardMedia,
    CircularProgress,
    Grid,
    Tab,
    Tabs,
    Typography,
    IconButton,
    Container,
} from '@mui/material';
import { Twitter, Instagram, LinkedIn, Phone, Store, RequestQuote } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { get, ref, update, push } from 'firebase/database';
import { auth, db } from '../../fb';
import PostGallery from '../PostGallery';

const CompanyProfileDesk = ({ user }) => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
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
                        get(visitasRef),
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
                            endereco: companyData.endereco || 'A carregar',
                        });
                        setModules(companyData.activeModules || {});
                        setSmsLimit(companyData.activeModules?.moduloSMS?.limit || 0);

                        const newVisitRef = push(visitasRef);
                        await update(newVisitRef, {
                            visitorId: user.id,
                            visitorName: user.nome || 'Visitante Anônimo',
                            timestamp: new Date().toISOString(),
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
                        const userCotacoes = Object.keys(cotacoesData).filter(
                            (key) =>
                                cotacoesData[key].company &&
                                cotacoesData[key].company.id === userId
                        );
                        setCotacoes(userCotacoes.map((key) => cotacoesData[key]));
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

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ backgroundColor: "#f3f2ef", minHeight: "100vh" }}>
      <Container maxWidth="lg" >
            <Card>
                <CardMedia
                    component="img"
                    height="200"
                    image={userData?.coverPhotoURL}
                    alt="Cover"
                />
                <Box display="flex" justifyContent="center" mt={-8}>
                    <Avatar
                        src={userData?.photoURL}
                        alt="Profile"
                        sx={{ width: 128, height: 128, border: '4px solid white' }}
                    />
                </Box>
                <CardContent>
                    <Typography variant="h5" align="center">
                        {userData?.displayName}
                    </Typography>
                    <Typography variant="body1" align="center" color="textSecondary">
                        {userData?.bio || 'Biografia não informada'}
                    </Typography>
                </CardContent>
            </Card>

            <Tabs value={activeTab} onChange={handleTabChange} centered>
                <Tab label="Início" />
                <Tab label="Sobre" />
                <Tab label="Publicações" />
                <Tab label="Cotações" />
            </Tabs>

            <Box p={3}>
                {activeTab === 0 && (
                    <Typography variant="body1">Conteúdo de Início</Typography>
                )}
                {activeTab === 1 && (
                    <Typography variant="body1">Informações Sobre a Empresa</Typography>
                )}
                {activeTab === 2 && <PostGallery posts={posts} />}
                {activeTab === 3 && (
                    <Grid container spacing={2}>
                        {cotacoes.map((cotacao) => (
                            <Grid item xs={12} md={6} key={cotacao.id}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="h6">
                                            {cotacao.title}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                )}
            </Box>
            </Container>
        </Box>
    );
};

export default CompanyProfileDesk;

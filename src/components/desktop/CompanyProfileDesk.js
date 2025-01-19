import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Avatar,
    Grid,
    Tabs,
    Tab,
    Button,
    Card,
    CardContent,
    CardMedia,
    Link,
    CircularProgress,
} from '@mui/material';
import {
    Store,
    RequestQuote,
    Phone,
    Twitter,
    Instagram,
    LinkedIn,
} from '@mui/icons-material';
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
    const [posts, setPosts] = useState([]);
    const [visits, setVisits] = useState([]);

    useEffect(() => {
        if (id) {
            const fetchData = async () => {
                try {
                    const companyRef = ref(db, `company/${id}`);
                    const socialRef = ref(db, `company/${id}/social`);
                    const postsRef = ref(db, `company/${id}/publishedPhotos`);
                    const cotacoesRef = ref(db, `cotacoes`);
                    const visitasRef = ref(db, `company/${id}/visitas`);

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
                        const userCotacoes = Object.keys(cotacoesData).filter(key =>
                            cotacoesData[key].company && cotacoesData[key].company.id === id
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
    }, [id, navigate, user]);

    const renderContent = () => {
        switch (activeTab) {
            case 0:
                return (
                    <Box>
                        {userData?.missaoVisaoValores ? (
                            <Typography variant="body1" dangerouslySetInnerHTML={{ __html: userData.missaoVisaoValores }} />
                        ) : (
                            <Typography variant="body2">Não informada</Typography>
                        )}
                    </Box>
                );
            case 1:
                return (
                    <PostGallery posts={posts} />
                );
            case 2:
                return (
                    <Grid container spacing={2}>
                        {cotacoes.length > 0 ? (
                            cotacoes.map((cotacao) => (
                                <Grid item xs={12} sm={6} md={4} key={cotacao.id}>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h6">{cotacao.title}</Typography>
                                            <Typography variant="body2">{cotacao.description}</Typography>
                                        </CardContent>
                                    </Card>
                                </Grid>
                            ))
                        ) : (
                            <Typography variant="body2" color="textSecondary">Nenhuma cotação publicada.</Typography>
                        )}
                    </Grid>
                );
            case 3:
                return (
                    <Box>
                        <Typography variant="h6">Sobre</Typography>
                        <Typography variant="body2">Endereço: {mCompany?.endereco || 'Não informado'}</Typography>
                        <Typography variant="body2">Província: {mCompany?.provincia || 'Não informado'}</Typography>
                        <Typography variant="body2">Capacidade de Produção: {mCompany?.capacidadeDeProducao || 'Não informado'}</Typography>
                        <Typography variant="body2">Email: {mCompany?.email || 'Não informado'}</Typography>
                        <Typography variant="body2">Contacto: {mCompany?.contacto || 'Não informado'}</Typography>
                    </Box>
                );
            default:
                return null;
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    return (
<Box >
  <CardMedia
    component="img"
    height="200"
    image={userData?.coverPhotoURL || 'https://via.placeholder.com/600x400.png'}
    alt="Cover"
    sx={{
      width: '100%', 
      objectFit: 'cover', 
      maxHeight: '400px', 
    }}
  />

  <Box display="flex" alignItems="center" p={2}>
    <Avatar
      src={userData?.photoURL}
      alt="Profile"
      sx={{
        width: 100,
        height: 100,
        border: '3px solid white',
        marginRight: 2,
        objectFit: 'cover', 
      }}
    />
    <Box>
      <Typography variant="h5">{userData?.displayName}</Typography>
      <Typography variant="body2">{userData?.bio}</Typography>
    </Box>
  </Box>

  <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} centered>
    <Tab label="Início" />
    <Tab label="Publicações" />
    <Tab label="Cotações" />
    <Tab label="Sobre" />
  </Tabs>

  <Box p={3}>
    {renderContent()}
  </Box>
</Box>

    );
};

export default CompanyProfileDesk;

import React, { useEffect, useState } from 'react';
import {
    Button,
    Card,
    CardContent,
    CardActions,
    Typography,
    Tabs,
    Tab,
    Avatar,
    Snackbar,
    Alert,
    Box,
    CircularProgress,
    useMediaQuery,
    Grid,
} from '@mui/material';
import { Delete, AccessTime, CheckCircle, History } from '@mui/icons-material';
import { ref, onValue, update, remove } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import PaySMSCheckout from '../PaySMSCheckout';
import { db } from '../../fb';
import AnunciarDesk from './AnunciarDesk';
import AnunciosDesk from './AnunciosDesk';

const CotacoesDesk = ({ user, onModuleActivation }) => {
    const [cotacoes, setCotacoes] = useState([]);
    const [activeTab, setActiveTab] = useState('recentes');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [isPaying, setIsPaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [campanhasAtivas, setCampanhasAtivas] = useState([]);

    const navigate = useNavigate();
    const isMobile = useMediaQuery('(max-width:600px)');

    const hasModuleSMS = user?.activeModules?.moduloSMS?.status === 'active';

    useEffect(() => {
        if (!hasModuleSMS) {
            setLoading(false);
            return;
        }
    
        const cotacoesRef = ref(db, 'cotacoes');
        const unsubscribeCotacoes = onValue(cotacoesRef, (snapshot) => {
            const cotacoesData = snapshot.val();
            if (cotacoesData) {
                const cotacoesArray = Object.values(cotacoesData);
    
                const filteredCotacoes = cotacoesArray.filter((cotacao) => 
                    Array.isArray(cotacao.provincia) && 
                    (cotacao.provincia.includes(user.provinciaTemp) || cotacao.provincia.includes(user.provincia))
                );
    
                const sortedCotacoes = filteredCotacoes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                
                setCotacoes(sortedCotacoes);
            } else {
                setCotacoes([]);
            }
    
            setLoading(false);
        });
    
        return () => unsubscribeCotacoes();
    }, [hasModuleSMS, user.provincia]); 
    
    
  useEffect(() => {
    const fetchCampanhasAtivas = async () => {
      try {
        const campanhasRef = ref(db, "campanhas");
        onValue(campanhasRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const campanhasArray = [];
    
            Object.keys(data).forEach((campanhaKey) => {
              const campanhasInternas = data[campanhaKey];
    
              Object.keys(campanhasInternas).forEach((subKey) => {
                const campanha = campanhasInternas[subKey];
                if (campanha.component === "home") {
                  campanhasArray.push({ id: subKey, ...campanha });
                }
              });
            });
            setCampanhasAtivas(campanhasArray);
            console.log(campanhasArray)
          }
        });
      } catch (error) {
        console.error("Erro ao carregar campanhas ativas:", error);
      }
    }
    fetchCampanhasAtivas()
}, [])

    const handlePublishQuotation = () => {
        if (!hasModuleSMS) {
            setSnackbar({ open: true, message: 'Ative o módulo SMS para emitir cotações.', severity: 'warning' });
            return;
        }
        navigate('/cotacao');
    };

    const deleteCotacao = (cotacaoId) => {
        if (window.confirm('Tem certeza que deseja excluir esta cotação?')) {
            const cotacaoRef = ref(db, `cotacoes/${cotacaoId}`);
            remove(cotacaoRef)
                .then(() => {
                    setSnackbar({ open: true, message: 'Cotação excluída com sucesso!', severity: 'success' });
                })
                .catch((error) => {
                    console.error('Erro ao excluir a cotação: ', error);
                    setSnackbar({ open: true, message: 'Erro ao excluir a cotação.', severity: 'error' });
                });
        }
    };

    const filteredCotacoes = () => {
        const now = new Date();
        switch (activeTab) {
            case 'recentes':
              return cotacoes.filter(
                (cotacao) => new Date(cotacao.datalimite) >= new Date() && cotacao.status !== 'Fechada'
              );
            case 'expiradas':
              return cotacoes.filter((cotacao) => new Date() > new Date(cotacao.datalimite));
            case 'fechada':
              return cotacoes.filter((cotacao) => cotacao.status === 'Fechada');
            case 'minhas':
              return cotacoes.filter((cotacao) => cotacao?.company?.id === user?.id);
            default:
              return cotacoes;
          }
    };

    const handleCotacaoClick = (id) => {
        navigate(`/cotacao/${id}`);
    };

    return (
    <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        {!hasModuleSMS && !isPaying && (
            <Alert
                severity="warning"
                action={
                    <Button color="inherit" size="small" onClick={() => setIsPaying(true)}>
                        Ativar Módulo SMS
                    </Button>
                }>
                O módulo SMS está inativo. Para usar este serviço, ative o módulo SMS.
            </Alert>
        )}
        {isPaying && (
            <PaySMSCheckout
                user={user}
                onPaymentSuccess={(details) => {
                    const userRef = ref(db, `company/${user.id}/activeModules/moduloSMS`);
                    update(userRef, {
                        status: 'active',
                        activatedAt: new Date().toISOString(),
                        paymentDetails: details,
                    }).then(() => {
                        setSnackbar({ open: true, message: 'Módulo SMS ativado com sucesso!', severity: 'success' });
                    });
                    setIsPaying(false);
                }}
            />
        )}
        {!isPaying && (
            <>
                <Box
                    sx={{
                        width:'100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 2,
                        backgroundColor: 'white',
                        boxShadow: 1,
                    }}>
                    <Typography variant={isMobile ? "h5" : "h4"} component="h1" fontWeight="bold" gutterBottom >Pedidos de Cotações</Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handlePublishQuotation}disabled={!hasModuleSMS}>
                        Fazer pedido
                    </Button>
                </Box>
                
                <AnunciosDesk  campanhas = {campanhasAtivas}/>
                <Tabs
                    value={activeTab}
                    onChange={(_, newValue) => setActiveTab(newValue)}
                    indicatorColor="primary"
                    textColor="primary"
                    sx={{ backgroundColor: 'white', boxShadow: 1 }}
                >
                    <Tab value="recentes" label={isMobile ? <AccessTime /> : "Recentes"} icon={isMobile ? null : <AccessTime />} />
                    <Tab value="expiradas" label={isMobile ? <History /> : "Expiradas"} icon={isMobile ? null : <History />} />
                    <Tab value="fechada" label={isMobile ? <CheckCircle /> : "Fechada"} icon={isMobile ? null : <CheckCircle />} />
                    <Tab value="minhas" label={isMobile ? <Avatar src={user?.logoUrl} /> : "Minhas"} icon={isMobile ? null : <Avatar src={user?.logoUrl} />} />
                </Tabs>
                <Grid container spacing={2} sx={{ flex: 1, overflowY: 'auto', padding: 2 }}>
                    {loading ? (
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                            <CircularProgress />
                        </Grid>
                    ) : filteredCotacoes().length > 0 ? (
                        filteredCotacoes().map((cotacao) => (
                            <Grid item xs={12} sm={6} md={4} key={cotacao.id}>
                                <Card
                                    sx={{ mb: 2, backgroundColor: 'white', cursor: 'pointer', boxShadow: 2 }}
                                    onClick={() => handleCotacaoClick(cotacao.id)}>
                                    <CardContent>
                                        <Box display="flex" alignItems="center" mb={2}>
                                            <Avatar src={cotacao.company?.logoUrl || ''} alt="Logo" sx={{ mr: 2 }} />
                                            <Typography variant="h6">{cotacao.company?.nome || 'Empresa'}</Typography>
                                        </Box>
                                        <Typography variant="subtitle1" sx={{ mb: 1 }}>{cotacao.title}</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Publicado em: {new Date(cotacao.timestamp).toLocaleDateString('pt-PT')}
                                        </Typography>
                                        <Typography variant="body2" color="error">
                                            Data limite: {new Date(cotacao.datalimite).toLocaleDateString('pt-PT')}
                                        </Typography>
                                        <Typography variant="body2" >
                                            Sector: {cotacao.sector}
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        {cotacao?.company?.id === user?.id && (
                                            <>
                                                <Button
                                                    color="error"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deleteCotacao(cotacao.id);
                                                    }}
                                                >
                                                    Excluir
                                                </Button>
                                                <Button
                                                    color="primary"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/editar-cotacao/${cotacao.id}`);
                                                    }}
                                                >
                                                    Editar
                                                </Button>
                                            </>
                                        )}
                                    </CardActions>
                                </Card>
                            </Grid>
                        ))
                    ) : (
                        <Grid item xs={12}>
                            <Typography textAlign="center">Nenhum pedido de cotação disponível.</Typography>
                        </Grid>
                    )}
                </Grid>
            </>
        )}

        <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
            <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
    </Box>
    );
};

export default CotacoesDesk;
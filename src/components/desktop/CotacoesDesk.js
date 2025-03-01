import React, { useEffect, useState } from 'react';
import {
    Button,
    Typography,
    Tabs,
    Tab,
    Avatar,
    Snackbar,
    Alert,
    Box,
    CircularProgress,
    useMediaQuery,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    IconButton,
    Paper,
} from '@mui/material';
import { Delete, AccessTime, CheckCircle, History, Edit } from '@mui/icons-material';
import { ref, onValue, update, remove } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import PaySMSCheckout from '../PaySMSCheckout';
import { db } from '../../fb';
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
                    }
                });
            } catch (error) {
                console.error("Erro ao carregar campanhas ativas:", error);
            }
        }
        fetchCampanhasAtivas();
    }, []);

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
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            {!hasModuleSMS && !isPaying && (
                <Alert
                    severity="warning"
                    action={
                        <Button color="inherit" size="small" onClick={() => setIsPaying(true)}>
                            Ativar Módulo SMS
                        </Button>
                    }
                    sx={{ mb: 2 }}
                >
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
                    <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: 'white' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h5" fontWeight="bold">Pedidos de Cotações</Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handlePublishQuotation}
                                disabled={!hasModuleSMS}
                            >
                                Fazer pedido
                            </Button>
                        </Box>
                    </Paper>

                    <AnunciosDesk campanhas={campanhasAtivas} />

                    <Paper elevation={1} sx={{ mb: 2, backgroundColor: 'white' }}>
                        <Tabs
                            value={activeTab}
                            onChange={(_, newValue) => setActiveTab(newValue)}
                            indicatorColor="primary"
                            textColor="primary"
                        >
                            <Tab value="recentes" label="Recentes" icon={<AccessTime />} />
                            <Tab value="expiradas" label="Expiradas" icon={<History />} />
                            <Tab value="fechada" label="Fechada" icon={<CheckCircle />} />
                            <Tab value="minhas" label="Minhas" icon={<Avatar src={user?.logoUrl} sx={{ width: 24, height: 24 }} />} />
                        </Tabs>
                    </Paper>

                    <Paper elevation={1} sx={{ flex: 1, overflowY: 'auto', p: 2, backgroundColor: 'white' }}>
                        {loading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                                <CircularProgress />
                            </Box>
                        ) : filteredCotacoes().length > 0 ? (
                            <List>
                                {filteredCotacoes().map((cotacao) => (
                                    <React.Fragment key={cotacao.id}>
                                        <ListItem
                                            alignItems="flex-start"
                                            sx={{ cursor: 'pointer', '&:hover': { backgroundColor: '#fafafa' } }}
                                            onClick={() => handleCotacaoClick(cotacao.id)}
                                        >
                                            <ListItemAvatar>
                                                <Avatar src={cotacao.company?.logoUrl || ''} alt="Logo" />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={cotacao.title}
                                                secondary={
                                                    <>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Publicado em: {new Date(cotacao.timestamp).toLocaleDateString('pt-PT')}
                                                        </Typography>
                                                        <Typography variant="body2" color="error">
                                                            Data limite: {new Date(cotacao.datalimite).toLocaleDateString('pt-PT')}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            Sector: {cotacao.sector}
                                                        </Typography>
                                                    </>
                                                }
                                            />
                                            {cotacao?.company?.id === user?.id && (
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <IconButton
                                                        color="error"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteCotacao(cotacao.id);
                                                        }}
                                                    >
                                                        <Delete />
                                                    </IconButton>
                                                    <IconButton
                                                        color="primary"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/editar-cotacao/${cotacao.id}`);
                                                        }}
                                                    >
                                                        <Edit />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </ListItem>
                                        <Divider variant="inset" component="li" />
                                    </React.Fragment>
                                ))}
                            </List>
                        ) : (
                            <Typography textAlign="center" sx={{ p: 2 }}>Nenhum pedido de cotação disponível.</Typography>
                        )}
                    </Paper>
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
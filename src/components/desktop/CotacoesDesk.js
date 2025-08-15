import React, { useEffect, useState, useContext } from 'react';
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
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    IconButton,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useMediaQuery
} from '@mui/material';
import { Delete, AccessTime, CheckCircle, History, Edit } from '@mui/icons-material';
import { ref, onValue, update, remove, set, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { db } from '../../fb';
import AnunciosDesk from './AnunciosDesk';
import EditarCotacao from './EditarCotacao'; 
import { useActiveModules } from '../../context/ActiveModulesContext';

const CotacoesDesk = ({ user, onModuleActivation }) => {
    const [cotacoes, setCotacoes] = useState([]);
    const [activeTab, setActiveTab] = useState('recentes');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [isPaying, setIsPaying] = useState(false);   
    const [loading, setLoading] = useState(true);
    const [campanhasAtivas, setCampanhasAtivas] = useState([]);
    const [clickedCotacoes, setClickedCotacoes] = useState({});
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedCotacao, setSelectedCotacao] = useState(null);
    
    const { activeModules, isLoading: modulesLoading } = useActiveModules();
    const navigate = useNavigate();
    const isMobile = useMediaQuery('(max-width:600px)');

    const isModuleActive = activeModules?.moduloSMS || !user;

    useEffect(() => {
        const bannersRef = ref(db, 'banners');
        const unsubscribe = onValue(bannersRef, (snapshot) => {
            const bannersData = snapshot.val();
            if (bannersData) {
                const bannerList = Object.entries(bannersData).map(([id, banner]) => ({
                    id,
                    ...banner
                }));

                const currentDate = new Date();
                const updatedBanners = bannerList.map(banner => {
                    const expireDate = new Date(banner.expireDate);
                    const isExpired = expireDate < currentDate;

                    if (isExpired && banner.status !== 'expired') {
                        update(ref(db, `banners/${banner.id}`), { status: 'expired' });
                        return { ...banner, status: 'expired' };
                    }

                    return banner;
                });

                const filteredBanners = updatedBanners.filter(banner => {
                    if (banner.status !== 'paid' || banner.tipoAnuncio !== 'cotacoes') return false;
                    const expireDate = new Date(banner.expireDate);
                    if (expireDate < currentDate) return false;

                    if (!user) return true;

                    const matchesProvincia = !banner.provincias || 
                        banner.provincias.includes('Todas') ||
                        (user.provincia && banner.provincias.includes(user.provincia));

                    const matchesSector = !banner.sectores || 
                        banner.sectores.includes('Todos') ||
                        (user.sector && banner.sectores.includes(user.sector));

                    return matchesProvincia && matchesSector;
                });

                setCampanhasAtivas(filteredBanners);
            } else {
                setCampanhasAtivas([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.provincia, user?.sector, user?.id]);

    useEffect(() => {
        if (!isModuleActive || !user?.id) return;

        const cotacoesRef = ref(db, 'cotacoes');
        const unsubscribeCotacoes = onValue(cotacoesRef, (snapshot) => {
            const cotacoesData = snapshot.val();
            
            if (cotacoesData) {
                const now = new Date();
                setClickedCotacoes((prevClickedCotacoes) => {
                    const cotacoesArray = Object.entries(cotacoesData).map(([id, cotacao]) => {
                        const dataLimite = new Date(cotacao.datalimite);
                        const isExpired = dataLimite < now && cotacao.status !== 'Fechada' && cotacao.status !== 'Expirada';
                        
                        if (isExpired) {
                            update(ref(db, `cotacoes/${id}`), { status: 'Expirada' });
                            return {
                                id,
                                ...cotacao,
                                status: 'Expirada',
                                isClicked: prevClickedCotacoes[id] || false
                            };
                        }
                        
                        return {
                            id,
                            ...cotacao,
                            isClicked: prevClickedCotacoes[id] || false
                        };
                    });
                    
                    const filteredCotacoes = activeTab === 'minhas' 
                        ? cotacoesArray.filter(cotacao => 
                            cotacao.company?.id === user.id || 
                            cotacao.userId === user.id ||
                            cotacao.createdBy === user.id
                          )
                        : cotacoesArray.filter(cotacao => {
                            if (cotacao.company?.id === user.id || 
                                cotacao.userId === user.id || 
                                cotacao.createdBy === user.id) {
                                return true;
                            }
                            
                            const cotacaoSector = cotacao.sector || cotacao.company?.sector;
                            const sectorMatch = !cotacaoSector || 
                                             (user?.sector && cotacaoSector === user.sector);
                        
                           const cotacaoProvincias = cotacao.provincias || [];
                const provinciaMatch = cotacaoProvincias.length === 0 || 
                                     cotacaoProvincias.includes('Todas') ||
                                     (user?.provincia && cotacaoProvincias.includes(user.provincia));
                            
                            return sectorMatch && provinciaMatch;
                        });
                    
                    setCotacoes(filteredCotacoes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
                    
                    return prevClickedCotacoes;
                });
            } else {
                setCotacoes([]);
            }
            setLoading(false);
        });
        
        return () => unsubscribeCotacoes();
    }, [user?.id, user?.provincia, user?.sector, activeTab, isModuleActive]);

    useEffect(() => {
        if (!isModuleActive || !user?.id) return;

        const loadClickedStatus = async () => {
            try {
                const clicksRef = ref(db, 'cotacoes');
                onValue(clicksRef, (snapshot) => {
                    const cotacoesData = snapshot.val();
                    const clickedStatus = {};

                    if (cotacoesData) {
                        Object.entries(cotacoesData).forEach(([cotacaoId, cotacao]) => {
                            if (cotacao.clicks && cotacao.clicks[user.id]) {
                                clickedStatus[cotacaoId] = true;
                            }
                        });
                    }

                    setClickedCotacoes(clickedStatus);
                });
            } catch (error) {
                console.error('Error loading clicked status:', error);
            }
        };

        loadClickedStatus();
    }, [user?.id, isModuleActive]);

    const isDateValid = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        return date >= now;
    };

    const handlePublishQuotation = () => {
        if (!user) {
            navigate('/login', { state: { from: '/cotacao' } });
            return;
        }
        navigate('/cotacao');
    };

    const deleteCotacao = async (cotacaoId) => {
        try {
            const propostasRef = ref(db, `cotacoes/${cotacaoId}/proposals`);
            const snapshot = await get(propostasRef);

            if (snapshot.exists()) {
                setSnackbar({ 
                    open: true, 
                    message: 'Não é possível excluir esta cotação pois já existem propostas associadas. Apenas feche o pedido de cotação.', 
                    severity: 'error' 
                });
                return;
            }
            
            if (window.confirm('Tem certeza que deseja excluir esta cotação?')) {
                const cotacaoRef = ref(db, `cotacoes/${cotacaoId}`);
                await remove(cotacaoRef);
                setSnackbar({ 
                    open: true, 
                    message: 'Cotação excluída com sucesso!', 
                    severity: 'success' 
                });
            }
        } catch (error) {
            console.error('Erro ao excluir a cotação: ', error);
            setSnackbar({ 
                open: true, 
                message: 'Erro ao excluir a cotação.', 
                severity: 'error' 
            });
        }
    };

    const filteredCotacoes = () => {
        const now = new Date();
        switch (activeTab) {
            case 'recentes':
                return cotacoes.filter(
                    (cotacao) => new Date(cotacao.datalimite) >= now && 
                                cotacao.status !== 'Fechada' &&
                                cotacao.status !== 'Expirada'&&
                                cotacao.company?.id !== user?.id 
                );
            case 'expiradas':
                return cotacoes.filter(
                    (cotacao) => (new Date(cotacao.datalimite) < now || 
                                 cotacao.status === 'Expirada') && 
                                cotacao.status !== 'Fechada'
                );
            case 'fechada':
                return cotacoes.filter(
                    (cotacao) => cotacao.status === 'Fechada'
                );
            case 'minhas':
                return user 
                    ? cotacoes.filter(cotacao => 
                        cotacao.company?.id === user.id || 
                        cotacao.userId === user.id ||
                        cotacao.createdBy === user.id
                      )
                    : [];
            default:
                return cotacoes;
        }
    };

    const handleCotacaoClick = async (id) => {
        if (user && isModuleActive) {
            try {
                await set(ref(db, `cotacoes/${id}/clicks/${user.id}`), true);
                setClickedCotacoes(prev => ({
                    ...prev,
                    [id]: true
                }));
            } catch (error) {
                console.error('Error recording click:', error);
            }
        }
        navigate(`/cotacao/${id}`);
    };

    const handleEditClick = (cotacao) => {
        if (!user || !isModuleActive) return;
        setSelectedCotacao(cotacao);
        setEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setSelectedCotacao(null);
    };

    const renderCotacoes = () => {
        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </Box>
            );
        }
    
        const cotacoesFiltradas = filteredCotacoes();
        if (cotacoesFiltradas.length === 0) {
            return (
                <Typography textAlign="center" sx={{ p: 2 }}>
                    Nenhum pedido de cotação disponível.
                </Typography>
            );
        }
    
        return (
            <List>
                {cotacoesFiltradas.map((cotacao) => (
                    <Box key={cotacao.id}>
                        <ListItem
                            alignItems="flex-start"
                            sx={{ 
                                cursor: 'pointer', 
                                '&:hover': { backgroundColor: '#fafafa' },
                                fontWeight: clickedCotacoes[cotacao.id] ? 'normal' : 'bold'
                            }}
                            onClick={() => handleCotacaoClick(cotacao.id)}
                        >
                            <ListItemAvatar>
                                <Avatar src={cotacao.company?.logoUrl || ''} alt="Logo" />
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Typography 
                                        component="span" 
                                        variant="body1" 
                                        fontWeight={!clickedCotacoes[cotacao.id] && user ? 'bold' : 'normal'}
                                    >
                                        {cotacao.title}
                                    </Typography>
                                }
                                secondary={
                                    <>
                                        <Typography variant="body2" color="text.secondary">
                                            Publicado por: {cotacao.company?.nome || 'Anônimo'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Publicado em: {new Date(cotacao.timestamp).toLocaleDateString('pt-PT')}
                                        </Typography>
                                        <Typography 
                                            variant="body2" 
                                            color={isDateValid(cotacao.datalimite) ? 'primary.main' : 'error'}
                                            sx={{ 
                                                fontWeight: isDateValid(cotacao.datalimite) ? 'bold' : 'normal',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 0.5
                                            }}
                                        >
                                            {isDateValid(cotacao.datalimite) ? (
                                                <CheckCircle fontSize="small" color="primary" />
                                            ) : (
                                                <AccessTime fontSize="small" color="error" />
                                            )}
                                            Data limite: {new Date(cotacao.datalimite).toLocaleDateString('pt-PT')}
                                        </Typography>
                                        <Typography variant="body2">
                                            Sector: {cotacao.sector || cotacao.company?.sector}
                                        </Typography>
                                        <Typography variant="body2">
                                            Província: {cotacao.company?.provincia}
                                        </Typography>
                                    </>
                                }
                            />
                            {user && isModuleActive && (
                                (cotacao?.company?.id === user.id || 
                                 cotacao?.userId === user.id || 
                                 cotacao?.createdBy === user.id) && (
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
                                                handleEditClick(cotacao);
                                            }}
                                        >
                                            <Edit />
                                        </IconButton>
                                    </Box>
                                )
                            )}
                        </ListItem>
                        <Divider variant="inset" component="li" />
                    </Box>
                ))}
            </List>
        );
    };

    if (modulesLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>          
            {!isPaying && (
                <>
                    <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: 'white' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h5" fontWeight="bold">Pedidos de Cotações</Typography>
                            {isModuleActive && user && (
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handlePublishQuotation}>
                                    Fazer pedido
                                </Button>
                            )}
                        </Box>
                    </Paper>

                    <AnunciosDesk campanhas={campanhasAtivas} user={user} local="Cotacoes"/>

                    {user && !isModuleActive && (
                        <Alert
                            severity="warning"
                            icon={false}
                            sx={{
                                mb: 2,
                                border: '1px solid rgb(0, 135, 245)',
                                backgroundColor: '#fff3e0',
                                color: '#e65100',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 2,
                                borderRadius: '1px',
                            }}
                            action={
                                <Button
                                    variant="contained"
                                    size="medium"
                                    onClick={() => window.location = '/pagamento-modulo/moduloSMS'}
                                    sx={{
                                        backgroundColor: '#f57c00',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        '&:hover': {
                                            backgroundColor: '#ef6c00',
                                        },
                                    }}>
                                    Ativar Módulo SMS
                                </Button>
                            }>
                            O módulo <strong>SMS</strong> está inativo. Ative-o agora para acessar todos os recursos!
                        </Alert>
                    )}
                    {isModuleActive && user && (
                        <>
                            <Paper elevation={1} sx={{ mb: 2, backgroundColor: 'white' }}>
                                <Tabs
                                    value={activeTab}
                                    onChange={(_, newValue) => setActiveTab(newValue)}
                                    indicatorColor="primary"
                                    textColor="primary"
                                    variant="scrollable"
                                    scrollButtons="auto"
                                    allowScrollButtonsMobile
                                >
                                    <Tab value="recentes" label="Recentes" icon={<AccessTime />} />
                                    <Tab value="expiradas" label="Expiradas" icon={<History />} />
                                    <Tab value="fechada" label="Fechada" icon={<CheckCircle />} />
                                    <Tab
                                        value="minhas"
                                        label="Minhas"
                                        icon={
                                            <Avatar
                                                src={user?.logoUrl}
                                                sx={{ width: 24, height: 24 }}
                                            />
                                        }
                                    />
                                </Tabs>
                            </Paper>
                            <Paper elevation={1} sx={{ flex: 1, overflowY: 'auto', p: 2, backgroundColor: 'white' }}>
                                {renderCotacoes()}
                            </Paper>
                        </>
                    )}
                </>
            )}

            {user && isModuleActive && (
                <Dialog
                    open={editDialogOpen}
                    onClose={handleCloseEditDialog}
                    fullWidth
                    maxWidth="md"
                >
                    <DialogTitle>Editar Cotação</DialogTitle>
                    <DialogContent>
                        {selectedCotacao && (
                            <EditarCotacao 
                                cotacao={selectedCotacao} 
                                user={user} 
                                onClose={handleCloseEditDialog}
                                onSuccess={() => {
                                    setSnackbar({ open: true, message: 'Cotação atualizada com sucesso!', severity: 'success' });
                                    handleCloseEditDialog();
                                }}
                                onError={(error) => {
                                    setSnackbar({ open: true, message: `Erro ao atualizar cotação: ${error}`, severity: 'error' });
                                }}
                            />
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseEditDialog}>Cancelar</Button>
                    </DialogActions>
                </Dialog>
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
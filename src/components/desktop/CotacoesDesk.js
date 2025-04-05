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
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { Delete, AccessTime, CheckCircle, History, Edit } from '@mui/icons-material';
import { ref, onValue, update, remove, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import PaySMSCheckout from '../PaySMSCheckout';
import { db } from '../../fb';
import AnunciosDesk from './AnunciosDesk';
import EditarCotacao from './EditarCotacao'; // Import the edit component

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

    const navigate = useNavigate();
    const isMobile = useMediaQuery('(max-width:600px)');

    const hasModuleSMS = user?.activeModules?.moduloSMS?.status === 'active';
    const hasBalance = user?.activeModules?.moduloSMS?.smsCount > 0;

    useEffect(() => {
        if (!user?.id) return;

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
    }, [user?.id]);

    useEffect(() => {
        if (!hasModuleSMS) {
            setLoading(false);
            return;
        }
        const cotacoesRef = ref(db, 'cotacoes');
        const unsubscribeCotacoes = onValue(cotacoesRef, (snapshot) => {
            const cotacoesData = snapshot.val();
            if (cotacoesData) {
                const cotacoesArray = Object.entries(cotacoesData).map(([id, cotacao]) => ({
                    id,
                    ...cotacao,
                    isClicked: clickedCotacoes[id] || false
                }));
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
    }, [hasModuleSMS, user.provincia, clickedCotacoes]);

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
              if (expireDate < currentDate && banner.status !== 'expired') {
                update(ref(db, `banners/${banner.id}`), { status: 'expired' });
                return { ...banner, status: 'expired' };
              }
              return banner;
            });
    
            const filteredBanners = updatedBanners.filter(banner => {
              if (banner.status !== 'active') return false;
              if (banner.tipoAnuncio !== 'cotacao') return false;
              const expireDate = new Date(banner.expireDate);
              if (expireDate < currentDate) return false;
    
              if (user) {
                const matchesProvincia = banner.provincias.includes(user.provincia);
                const matchesSector = banner.sectores.includes(user.sector);
                return matchesProvincia && matchesSector;
              }
              
              return true;
            });
    
            setCampanhasAtivas(filteredBanners);
          } else {
            setCampanhasAtivas([]);
          }
          setLoading(false);
        });
    
        return () => unsubscribe();
      }, [user?.provincia, user?.sector, user?.id]);

    const handlePublishQuotation = () => {
        if (!hasModuleSMS) {
            setSnackbar({ open: true, message: 'Ative o módulo SMS para emitir concursos.', severity: 'warning' });
            return;
        }
        if (!hasBalance) {
            setSnackbar({ open: true, message: 'Recarregue seu saldo de SMS para emitir concursos.', severity: 'warning' });
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

    const handleCotacaoClick = async (id) => {
        try {
            await set(ref(db, `cotacoes/${id}/clicks/${user.id}`), true);
            setClickedCotacoes(prev => ({
                ...prev,
                [id]: true
            }));
            navigate(`/cotacao/${id}`);
        } catch (error) {
            console.error('Error recording click:', error);
            navigate(`/cotacao/${id}`);
        }
    };

    const handleEditClick = (cotacao) => {
        setSelectedCotacao(cotacao);
        setEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setSelectedCotacao(null);
    };

    const handleRecarregarSaldo = () => {
        navigate('/sms');
    };

    const renderCotacoes = () => {
        if (!hasModuleSMS) {
            return (
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
            );
        }
    
        if (!hasBalance) {
            return (
                <Alert
                    severity="warning"
                    action={
                        <Button color="inherit" size="small" onClick={handleRecarregarSaldo}>
                            Recarregar Saldo de SMS
                        </Button>
                    }
                    sx={{ mb: 2 }}
                >
                    Você não possui saldo de SMS. Clique para recarregar.
                </Alert>
            );
        }
    
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
                                            handleEditClick(cotacao);
                                        }}
                                    >
                                        <Edit />
                                    </IconButton>
                                </Box>
                            )}
                        </ListItem>
                        <Divider variant="inset" component="li" />
                    </Box>
                ))}
            </List>
        );
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
                                disabled={!hasModuleSMS || !hasBalance}>
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
                        {renderCotacoes()}
                    </Paper>
                </>
            )}

            {/* Edit Dialog */}
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
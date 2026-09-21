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
    IconButton,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    useMediaQuery,
    Container,
    Stack,
} from '@mui/material';
import { Delete, AccessTime, CheckCircle, History, Edit, Add, CalendarToday, AttachMoney, Warning, Close } from '@mui/icons-material';
import { ref, onValue, update, remove, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { db } from '../../fb';
import AnunciosDesk from './AnunciosDesk';
import EditarConcurso from './EditarConcurso';
import { formatPrice } from '../../utils/utils';
import { useActiveModules } from '../../context/ActiveModulesContext';

/* ── Design tokens (mesmos de CotacoesDesk.js, para manter o visual consistente) ── */
const T = {
    navy:        '#08192E',
    navyCard:    '#0D2240',
    gold:        '#C8903A',
    goldLight:   '#E8B96A',
    white:       '#FFFFFF',
    darkBorder:  'rgba(255,255,255,0.08)',
    darkText:    'rgba(255,255,255,0.88)',
    darkTextSub: 'rgba(255,255,255,0.52)',
    darkMuted:   'rgba(255,255,255,0.30)',
    warning:     '#f59e0b',
};

const KEYFRAMES = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    @keyframes fadeUp {
        from { opacity:0; transform:translateY(20px); }
        to   { opacity:1; transform:translateY(0); }
    }
    .fade-up {
        animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .concurso-card {
        background: ${T.navyCard};
        border: 1px solid ${T.darkBorder};
        border-radius: 16px;
        transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .concurso-card:hover {
        transform: translateY(-2px);
        border-color: ${T.gold} !important;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important;
    }
    .concurso-card.unread {
        border-left: 3px solid ${T.gold};
    }
`;

const BG_GRID = {
    position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.02,
    backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)`,
    backgroundSize: '56px 56px',
};

const ConcursosDesk = ({ user, onModuleActivation }) => {
    const [concursos, setConcursos] = useState([]);
    const [activeTab, setActiveTab] = useState('recentes');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [isPaying, setIsPaying] = useState(false);   
    const [loading, setLoading] = useState(true);
    const [campanhasAtivas, setCampanhasAtivas] = useState([]);
    const [clickedConcursos, setClickedConcursos] = useState({});
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedConcurso, setSelectedConcurso] = useState(null);
    
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
                    if (banner.status !== 'paid' || banner.tipoAnuncio !== 'concurso') return false;

                    const expireDate = new Date(banner.expireDate);
                    if (expireDate < currentDate) return false;

                    // For unauthenticated users, show all active banners
                    if (!user) return true;

                    // For authenticated users, filter by province if available
                    const matchesProvincia = !banner.provincias || 
                        banner.provincias.includes('Todas') ||
                        (user.provincia && banner.provincias.includes(user.provincia));

                    return matchesProvincia;
                });

                setCampanhasAtivas(filteredBanners);
            } else {
                setCampanhasAtivas([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user?.provincia, user?.id]);

    // Load concursos only for users with active module
    useEffect(() => {
        if (!isModuleActive || !user?.id) return;

        const concursosRef = ref(db, 'concursos');
        const unsubscribeConcursos = onValue(concursosRef, (snapshot) => {
            const concursosData = snapshot.val();
            
            if (concursosData) {
                const now = new Date();
                setClickedConcursos((prevClickedConcursos) => {
                    const concursosArray = Object.entries(concursosData).map(([id, concurso]) => {
                        const dataLimite = new Date(concurso.prazo);
                        const isExpired = dataLimite < now && concurso.status !== 'Fechada';
                        
                        if (isExpired && concurso.status !== 'Expirada') {
                            update(ref(db, `concursos/${id}`), { status: 'Expirada' });
                            return {
                                id,
                                ...concurso,
                                status: 'Expirada',
                                isClicked: prevClickedConcursos[id] || false
                            };
                        }
                        
                        return {
                            id,
                            ...concurso,
                            isClicked: prevClickedConcursos[id] || false
                        };
                    });
                    
                    // Filter concursos based on user sector and province
                    const filteredConcursos = activeTab === 'minhas' 
                        ? concursosArray.filter(concurso => concurso.company?.id === user.id)
                        : concursosArray.filter(concurso => {
                            // Show user's own concursos without filtering
                            if (concurso.company?.id === user.id) return true;
                            
                            // Filter by sector
                            const sectorMatch = !concurso.setor || 
                                             (user?.sector && concurso.setor.includes(user.sector));
                        
                            // Filter by province
                            let provinciaMatch = false;
                            if (Array.isArray(concurso.provincia)) {
                                provinciaMatch = concurso.provincia.includes('Todas') || 
                                              (user?.provincia && concurso.provincia.includes(user.provincia));
                            } else {
                                provinciaMatch = concurso.provincia === 'Todas' || 
                                              (user?.provincia && concurso.provincia === user.provincia);
                            }
                            
                            return sectorMatch && provinciaMatch;
                        });
                    
                    setConcursos(filteredConcursos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
                    
                    return prevClickedConcursos;
                });
            } else {
                setConcursos([]);
            }
            setLoading(false);
        });
        
        return () => unsubscribeConcursos();
    }, [user?.id, user?.provincia, user?.sector, activeTab, isModuleActive]);

    // Load clicked status only for users with active module
    useEffect(() => {
        if (!isModuleActive || !user?.id) return;

        const loadClickedStatus = async () => {
            try {
                const clicksRef = ref(db, 'concursos');
                onValue(clicksRef, (snapshot) => {
                    const concursosData = snapshot.val();
                    const clickedStatus = {};

                    if (concursosData) {
                        Object.entries(concursosData).forEach(([concursoId, concurso]) => {
                            if (concurso.views && concurso.views[user.id]) {
                                clickedStatus[concursoId] = true;
                            }
                        });
                    }

                    setClickedConcursos(clickedStatus);
                });
            } catch (error) {
                console.error('Error loading clicked status:', error);
            }
        };

        loadClickedStatus();
    }, [user?.id, isModuleActive]);

    const isPrazoValido = (prazoString) => {
        const now = new Date();
        const prazo = new Date(prazoString);
        return prazo >= now;
    };

    const handlePublishConcurso = () => {
        if (!user) {
            navigate('/auth', { state: { from: '/concurso' } });
            return;
        }
        navigate('/concurso');
    };

    const deleteConcurso = (concursoId) => {
        if (window.confirm('Tem certeza que deseja excluir este concurso?')) {
            const concursoRef = ref(db, `concursos/${concursoId}`);
            remove(concursoRef)
                .then(() => {
                    setSnackbar({ open: true, message: 'Concurso excluído com sucesso!', severity: 'success' });
                })
                .catch((error) => {
                    console.error('Erro ao excluir o concurso: ', error);
                    setSnackbar({ open: true, message: 'Erro ao excluir o concurso.', severity: 'error' });
                });
        }
    };

    const filteredConcursos = () => {
        const now = new Date();
        switch (activeTab) {
            case 'recentes':
                return concursos.filter(
                    (concurso) => new Date(concurso.prazo) >= now && 
                                concurso.status !== 'Fechada' && 
                                (user ? concurso.company?.id !== user.id : true)
                );
            case 'expiradas':
                return concursos.filter(
                    (concurso) => new Date(concurso.prazo) < now && 
                                concurso.status !== 'Fechada'
                );
            case 'fechada':
                return concursos.filter(
                    (concurso) => concurso.status === 'Fechada'
                );
            case 'minhas':
                return user 
                    ? concursos.filter((concurso) => concurso.company?.id === user.id)
                    : [];
            default:
                return concursos;
        }
    };

    const handleConcursoClick = async (id) => {
        if (user && isModuleActive) {
            try {
                await set(ref(db, `concursos/${id}/views/${user.id}`), true);
                setClickedConcursos(prev => ({
                    ...prev,
                    [id]: true
                }));
            } catch (error) {
                console.error('Error recording view:', error);
            }
        }
        navigate(`/concurso/${id}`);
    };

    const handleEditClick = (concurso) => {
        if (!user || !isModuleActive) return;
        setSelectedConcurso(concurso);
        setEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setSelectedConcurso(null);
    };

    const renderConcursos = () => {
        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress sx={{ color: T.gold }} />
                </Box>
            );
        }

        const concursosFiltrados = filteredConcursos();
        if (concursosFiltrados.length === 0) {
            return (
                <Paper sx={{
                    p: 6,
                    textAlign: 'center',
                    bgcolor: T.navyCard,
                    border: `1px solid ${T.darkBorder}`,
                    borderRadius: 3,
                }}>
                    <Box sx={{ mb: 2 }}>
                        <Warning sx={{ fontSize: 48, color: T.darkMuted }} />
                    </Box>
                    <Typography sx={{ color: T.darkText, fontSize: '1.1rem' }}>
                        Nenhum concurso disponível.
                    </Typography>
                </Paper>
            );
        }

        return (
            <Stack spacing={2} className="fade-up">
                {concursosFiltrados.map((concurso) => (
                    <Box
                        key={concurso.id}
                        className={`concurso-card ${!clickedConcursos[concurso.id] && user ? 'unread' : ''}`}
                        sx={{ p: { xs: 2, sm: 3 }, cursor: 'pointer' }}
                        onClick={() => handleConcursoClick(concurso.id)}
                    >
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                            <Avatar src={concurso.company?.logoUrl || ''} alt="Logo" sx={{ border: `2px solid ${T.gold}` }} />
                            <Box sx={{ flex: 1 }}>
                                <Typography
                                    sx={{
                                        fontFamily: '"Playfair Display", serif',
                                        fontWeight: !concurso.isClicked && user ? 700 : 600,
                                        color: T.white,
                                        fontSize: '1.05rem',
                                        mb: 1,
                                    }}
                                >
                                    {concurso.titulo}
                                </Typography>
                                <Stack spacing={0.75}>
                                    <Typography variant="body2" sx={{ color: T.darkTextSub }}>
                                        Nº Ref: {concurso.numeroReferencia}
                                    </Typography>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <CalendarToday sx={{ fontSize: 16, color: T.gold }} />
                                        <Typography variant="body2" sx={{ color: T.darkTextSub }}>
                                            Publicado em: {new Date(concurso.timestamp).toLocaleDateString('pt-PT')}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        {isPrazoValido(concurso.prazo) ? (
                                            <CheckCircle sx={{ fontSize: 16, color: T.gold }} />
                                        ) : (
                                            <History sx={{ fontSize: 16, color: '#ef4444' }} />
                                        )}
                                        <Typography variant="body2" sx={{ color: isPrazoValido(concurso.prazo) ? T.darkTextSub : '#ef4444' }}>
                                            Prazo: {new Date(concurso.prazo).toLocaleDateString('pt-PT')}
                                        </Typography>
                                    </Stack>
                                    <Stack direction="row" alignItems="center" spacing={1}>
                                        <AttachMoney sx={{ fontSize: 16, color: T.gold }} />
                                        <Typography variant="body2" sx={{ color: T.darkTextSub }}>
                                            Valor: {concurso.valorEstimado ? formatPrice(concurso.valorEstimado) : 'N/A'}
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Box>
                            {user && isModuleActive && concurso?.company?.id === user.id && (
                                <Stack direction="row" spacing={0.5}>
                                    <IconButton
                                        size="small"
                                        sx={{ color: '#ef4444' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteConcurso(concurso.id);
                                        }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        sx={{ color: T.gold }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditClick(concurso);
                                        }}
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                </Stack>
                            )}
                        </Stack>
                    </Box>
                ))}
            </Stack>
        );
    };

    if (modulesLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: T.navy }}>
                <CircularProgress size={48} thickness={4} sx={{ color: T.gold }} />
            </Box>
        );
    }

    return (
        <Box sx={{
            backgroundColor: T.navy,
            minHeight: '100vh',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            position: 'relative',
        }}>
            <style>{KEYFRAMES}</style>
            <Box sx={BG_GRID} />

            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
                {!isPaying && (
                    <>
                        <Paper sx={{
                            p: 3,
                            mb: 3,
                            bgcolor: T.navyCard,
                            border: `1px solid ${T.darkBorder}`,
                            borderRadius: 3,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: 2,
                        }}>
                            <Typography
                                variant="h4"
                                sx={{
                                    fontFamily: '"Playfair Display", serif',
                                    fontWeight: 800,
                                    color: T.white,
                                    fontSize: { xs: '1.5rem', sm: '2rem' },
                                }}
                            >
                                Concursos entre Empresas
                            </Typography>
                            {isModuleActive && user && (
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={handlePublishConcurso}
                                    sx={{
                                        bgcolor: T.gold,
                                        color: T.navy,
                                        '&:hover': { bgcolor: T.goldLight },
                                        borderRadius: '10px',
                                        px: 3,
                                        py: 1.2,
                                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                    }}
                                >
                                    Publicar Concurso
                                </Button>
                            )}
                        </Paper>

                        <AnunciosDesk campanhas={campanhasAtivas} user={user} local="Concursos"/>

                        {user && !isModuleActive && (
                            <Alert
                                severity="warning"
                                icon={<Warning />}
                                sx={{
                                    mb: 3,
                                    mt: 2,
                                    bgcolor: 'rgba(245,158,11,0.12)',
                                    color: T.warning,
                                    border: '1px solid rgba(245,158,11,0.25)',
                                    borderRadius: '12px',
                                    '& .MuiAlert-icon': { color: T.warning },
                                }}
                                action={
                                    <Button
                                        variant="contained"
                                        size="medium"
                                        onClick={() => window.location = '/pagamento-modulo/moduloSMS'}
                                        sx={{
                                            bgcolor: T.warning,
                                            color: T.navy,
                                            fontWeight: 700,
                                            '&:hover': { bgcolor: '#e67e22' },
                                            borderRadius: '8px',
                                        }}
                                    >
                                        Ativar Módulo Alerta
                                    </Button>
                                }
                            >
                                O módulo <strong>Alerta</strong> está inativo. Ative-o agora para acessar todos os recursos!
                            </Alert>
                        )}

                        {/* Concursos tabs and list for users with active module */}
                        {isModuleActive && user && (
                            <>
                                <Paper sx={{
                                    mt: 3,
                                    mb: 3,
                                    bgcolor: T.navyCard,
                                    border: `1px solid ${T.darkBorder}`,
                                    borderRadius: 2,
                                    overflow: 'hidden',
                                }}>
                                    <Tabs
                                        value={activeTab}
                                        onChange={(_, newValue) => setActiveTab(newValue)}
                                        variant={isMobile ? 'scrollable' : 'standard'}
                                        scrollButtons="auto"
                                        allowScrollButtonsMobile
                                        sx={{
                                            '& .MuiTab-root': {
                                                color: T.darkTextSub,
                                                fontFamily: '"Plus Jakarta Sans", sans-serif',
                                                fontWeight: 600,
                                                textTransform: 'none',
                                                fontSize: '0.9rem',
                                                minHeight: 56,
                                                '&.Mui-selected': { color: T.gold },
                                            },
                                            '& .MuiTabs-indicator': { bgcolor: T.gold },
                                        }}
                                    >
                                        <Tab value="recentes" label="Recentes" icon={<AccessTime sx={{ fontSize: 18 }} />} iconPosition="start" />
                                        <Tab value="expiradas" label="Expiradas" icon={<History sx={{ fontSize: 18 }} />} iconPosition="start" />
                                        <Tab value="fechada" label="Fechada" icon={<CheckCircle sx={{ fontSize: 18 }} />} iconPosition="start" />
                                        <Tab
                                            value="minhas"
                                            label="Meus"
                                            icon={<Avatar src={user?.logoUrl} sx={{ width: 20, height: 20 }} />}
                                            iconPosition="start"
                                        />
                                    </Tabs>
                                </Paper>
                                <Paper sx={{
                                    p: { xs: 2, sm: 3 },
                                    bgcolor: T.navyCard,
                                    border: `1px solid ${T.darkBorder}`,
                                    borderRadius: 3,
                                    minHeight: '60vh',
                                }}>
                                    {renderConcursos()}
                                </Paper>
                            </>
                        )}
                    </>
                )}
            </Container>

            {/* Edit Dialog */}
            {user && isModuleActive && (
                <Dialog
                    open={editDialogOpen}
                    onClose={handleCloseEditDialog}
                    fullWidth
                    maxWidth="md"
                    PaperProps={{ sx: { bgcolor: T.navyCard, border: `1px solid ${T.darkBorder}`, borderRadius: '16px' } }}
                >
                    <DialogTitle sx={{
                        color: T.white,
                        fontFamily: '"Playfair Display", serif',
                        borderBottom: `1px solid ${T.darkBorder}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        Editar Concurso
                        <IconButton onClick={handleCloseEditDialog} sx={{ color: T.darkMuted }}>
                            <Close />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        {selectedConcurso && (
                            <EditarConcurso
                                concurso={selectedConcurso}
                                user={user}
                                onClose={handleCloseEditDialog}
                                onSuccess={() => {
                                    setSnackbar({ open: true, message: 'Concurso atualizado com sucesso!', severity: 'success' });
                                    handleCloseEditDialog();
                                }}
                                onError={(error) => {
                                    setSnackbar({ open: true, message: `Erro ao atualizar concurso: ${error}`, severity: 'error' });
                                }}
                            />
                        )}
                    </DialogContent>
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

export default ConcursosDesk;
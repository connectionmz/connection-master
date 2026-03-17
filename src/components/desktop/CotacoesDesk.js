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
    useMediaQuery,
    Container,
    Chip,
    Card,
    CardContent,
    Tooltip,
    Badge,
    Fade,
    Grid,
} from '@mui/material';
import { 
    Delete, 
    AccessTime, 
    CheckCircle, 
    History, 
    Edit,
    Add,
    Business,
    LocationOn,
    Category,
    CalendarToday,
    Visibility,
    VisibilityOff,
    Warning,
    Close,
} from '@mui/icons-material';
import { ref, onValue, update, remove, set, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { db } from '../../fb';
import EditarCotacao from './EditarCotacao'; 
import { useActiveModules } from '../../context/ActiveModulesContext';

/* ── Design tokens — consistente com StoresDesk ─────────────────────── */
const T = {
    navy:        '#08192E',
    navyMid:     '#0E2849',
    navyLight:   '#183A63',
    navyCard:    '#0D2240',
    gold:        '#C8903A',
    goldLight:   '#E8B96A',
    goldPale:    '#FDF3E3',
    white:       '#FFFFFF',
    text:        '#0F1C2D',
    textSub:     '#6B89A5',
    border:      '#E0E8F0',
    borderMid:   '#C5D4E3',
    surface:     '#F4F7FB',
    darkBorder:  'rgba(255,255,255,0.08)',
    darkBorderMid:'rgba(255,255,255,0.14)',
    darkText:    'rgba(255,255,255,0.88)',
    darkTextSub: 'rgba(255,255,255,0.52)',
    darkMuted:   'rgba(255,255,255,0.30)',
    success:     '#10b981',
    error:       '#ef4444',
    warning:     '#f59e0b',
};

const KEYFRAMES = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    @keyframes fadeUp {
        from { opacity:0; transform:translateY(20px); }
        to   { opacity:1; transform:translateY(0); }
    }
    @keyframes pulse {
        0%,100% { opacity:1; transform:scale(1); }
        50% { opacity:.6; transform:scale(1.05); }
    }
    .fade-up {
        animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .cotacao-card {
        background: ${T.navyCard};
        border: 1px solid ${T.darkBorder};
        border-radius: 16px;
        transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        margin-bottom: 12px;
    }
    .cotacao-card:hover {
        transform: translateY(-2px);
        border-color: ${T.gold} !important;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important;
    }
    .cotacao-card.unread {
        border-left: 3px solid ${T.gold};
    }
`;

const BG_GRID = {
    position:'absolute', inset:0, pointerEvents:'none', opacity:0.02,
    backgroundImage:`linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)`,
    backgroundSize:'56px 56px',
};

const CotacoesDesk = ({ user, onModuleActivation }) => {
    const [cotacoes, setCotacoes] = useState([]);
    const [activeTab, setActiveTab] = useState('recentes');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [isPaying, setIsPaying] = useState(false);   
    const [loading, setLoading] = useState(true);
    const [clickedCotacoes, setClickedCotacoes] = useState({});
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedCotacao, setSelectedCotacao] = useState(null);
    
    const { activeModules, isLoading: modulesLoading } = useActiveModules();
    const navigate = useNavigate();
    const isMobile = useMediaQuery('(max-width:600px)');
    const isTablet = useMediaQuery('(max-width:900px)');

    const isModuleActive = activeModules?.moduloSMS || !user;

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
                                cotacao.status !== 'Expirada' &&
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

    const getStatusColor = (cotacao) => {
        if (cotacao.status === 'Fechada') return T.success;
        if (cotacao.status === 'Expirada' || !isDateValid(cotacao.datalimite)) return T.error;
        return T.gold;
    };

    const getStatusLabel = (cotacao) => {
        if (cotacao.status === 'Fechada') return 'Fechada';
        if (cotacao.status === 'Expirada' || !isDateValid(cotacao.datalimite)) return 'Expirada';
        return 'Ativa';
    };

    const renderCotacoes = () => {
        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress size={48} thickness={4} sx={{ color: T.gold }} />
                </Box>
            );
        }
    
        const cotacoesFiltradas = filteredCotacoes();
        if (cotacoesFiltradas.length === 0) {
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
                    <Typography sx={{ color: T.darkText, fontSize: '1.1rem', mb: 1 }}>
                        Nenhum pedido de cotação disponível
                    </Typography>
                    <Typography sx={{ color: T.darkTextSub, fontSize: '0.9rem' }}>
                        {activeTab === 'minhas' ? 'Você ainda não publicou nenhuma cotação' : 'Não há cotações disponíveis no momento'}
                    </Typography>
                </Paper>
            );
        }
    
        return (
            <Box className="fade-up">
                {cotacoesFiltradas.map((cotacao, index) => (
                    <Card 
                        key={cotacao.id} 
                        className={`cotacao-card ${!clickedCotacoes[cotacao.id] && user ? 'unread' : ''}`}
                        sx={{ 
                            animation: `fadeUp 0.5s ease ${index * 0.05}s both`,
                        }}
                    >
                        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                            <Grid container spacing={2}>
                                {/* Left side - Company Info */}
                                <Grid item xs={12} sm={8} md={9}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                        <Avatar 
                                            src={cotacao.company?.logoUrl} 
                                            sx={{ 
                                                width: 56, 
                                                height: 56, 
                                                border: `2px solid ${T.gold}`,
                                                bgcolor: T.navy,
                                            }}
                                        >
                                            {cotacao.company?.nome?.charAt(0)}
                                        </Avatar>
                                        
                                        <Box sx={{ flex: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                                <Typography 
                                                    variant="h6" 
                                                    sx={{ 
                                                        fontFamily: '"Playfair Display", serif',
                                                        fontWeight: 700,
                                                        color: T.white,
                                                        fontSize: { xs: '1rem', sm: '1.1rem' }
                                                    }}
                                                >
                                                    {cotacao.title}
                                                </Typography>
                                                <Chip
                                                    label={getStatusLabel(cotacao)}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: `${getStatusColor(cotacao)}20`,
                                                        color: getStatusColor(cotacao),
                                                        border: `1px solid ${getStatusColor(cotacao)}40`,
                                                        fontWeight: 600,
                                                        fontSize: '0.7rem',
                                                    }}
                                                />
                                                {!clickedCotacoes[cotacao.id] && user && (
                                                    <Badge 
                                                        variant="dot" 
                                                        color="error"
                                                        sx={{ '& .MuiBadge-dot': { bgcolor: T.gold } }}
                                                    />
                                                )}
                                            </Box>

                                            <Typography sx={{ color: T.darkTextSub, mb: 2, fontSize: '0.9rem' }}>
                                                {cotacao.company?.nome || 'Anônimo'}
                                            </Typography>

                                            <Grid container spacing={2} sx={{ mb: 1 }}>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <Category sx={{ color: T.gold, fontSize: 16 }} />
                                                        <Typography sx={{ color: T.darkTextSub, fontSize: '0.8rem' }}>
                                                            Sector: <strong style={{ color: T.white }}>{cotacao.sector || cotacao.company?.sector}</strong>
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <LocationOn sx={{ color: T.gold, fontSize: 16 }} />
                                                        <Typography sx={{ color: T.darkTextSub, fontSize: '0.8rem' }}>
                                                            Província: <strong style={{ color: T.white }}>{cotacao.company?.provincia}</strong>
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </Grid>

                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <CalendarToday sx={{ color: T.darkMuted, fontSize: 14 }} />
                                                    <Typography sx={{ color: T.darkMuted, fontSize: '0.75rem' }}>
                                                        Publicado: {new Date(cotacao.timestamp).toLocaleDateString('pt-PT')}
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <AccessTime sx={{ color: isDateValid(cotacao.datalimite) ? T.gold : T.error, fontSize: 14 }} />
                                                    <Typography sx={{ color: isDateValid(cotacao.datalimite) ? T.gold : T.error, fontSize: '0.75rem', fontWeight: 600 }}>
                                                        Limite: {new Date(cotacao.datalimite).toLocaleDateString('pt-PT')}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>

                                {/* Right side - Actions */}
                                <Grid item xs={12} sm={4} md={3}>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        flexDirection: { xs: 'row', sm: 'column' }, 
                                        justifyContent: 'flex-end',
                                        alignItems: { xs: 'center', sm: 'flex-end' },
                                        gap: 1,
                                        height: '100%',
                                    }}>
                                        <Button
                                            variant="contained"
                                            onClick={() => handleCotacaoClick(cotacao.id)}
                                            sx={{
                                                bgcolor: T.gold,
                                                color: T.navy,
                                                '&:hover': { bgcolor: T.goldLight },
                                                borderRadius: '8px',
                                                px: 3,
                                                minWidth: 120,
                                            }}
                                        >
                                            Ver detalhes
                                        </Button>
                                        
                                        {user && isModuleActive && (
                                            (cotacao?.company?.id === user.id || 
                                             cotacao?.userId === user.id || 
                                             cotacao?.createdBy === user.id) && (
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    <Tooltip title="Editar cotação" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleEditClick(cotacao);
                                                            }}
                                                            sx={{ 
                                                                color: T.gold,
                                                                border: `1px solid ${T.darkBorder}`,
                                                                '&:hover': { borderColor: T.gold }
                                                            }}
                                                        >
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Excluir cotação" arrow>
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteCotacao(cotacao.id);
                                                            }}
                                                            sx={{ 
                                                                color: T.error,
                                                                border: `1px solid ${T.darkBorder}`,
                                                                '&:hover': { borderColor: T.error }
                                                            }}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            )
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                ))}
            </Box>
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
            
            {/* Background Grid */}
            <Box sx={BG_GRID} />

            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
                {/* Header */}
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
                    <Box>
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                fontFamily: '"Playfair Display", serif',
                                fontWeight: 800,
                                color: T.white,
                                fontSize: { xs: '1.5rem', sm: '2rem' }
                            }}
                        >
                            Pedidos de Cotações
                        </Typography>
                        <Typography sx={{ color: T.darkTextSub, mt: 1 }}>
                            {user ? 'Encontre oportunidades para o seu negócio' : 'Faça login para ver cotações relevantes'}
                        </Typography>
                    </Box>
                    
                    {isModuleActive && user && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handlePublishQuotation}
                            sx={{
                                bgcolor: T.gold,
                                color: T.navy,
                                '&:hover': { bgcolor: T.goldLight },
                                borderRadius: '10px',
                                px: 3,
                                py: 1.2,
                                fontFamily: '"Plus Jakarta Sans", sans-serif',
                                fontWeight: 600,
                            }}
                        >
                            Novo Pedido
                        </Button>
                    )}
                </Paper>

                {/* Module Activation Alert */}
                {user && !isModuleActive && (
                    <Alert
                        severity="warning"
                        icon={<Warning />}
                        sx={{
                            mb: 3,
                            bgcolor: 'rgba(245,158,11,0.12)',
                            color: T.warning,
                            border: `1px solid rgba(245,158,11,0.25)`,
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
                                    '&:hover': { bgcolor: '#e67e22' },
                                    borderRadius: '8px',
                                }}>
                                Ativar Módulo
                            </Button>
                        }>
                        O módulo <strong>Alerta</strong> está inativo. Ative-o agora para acessar todos os recursos!
                    </Alert>
                )}

                {isModuleActive && user && (
                    <>
                        {/* Tabs */}
                        <Paper sx={{ 
                            mb: 3, 
                            bgcolor: T.navyCard,
                            border: `1px solid ${T.darkBorder}`,
                            borderRadius: 2,
                            overflow: 'hidden',
                        }}>
                            <Tabs
                                value={activeTab}
                                onChange={(_, newValue) => setActiveTab(newValue)}
                                variant={isMobile ? "scrollable" : "standard"}
                                scrollButtons="auto"
                                sx={{
                                    '& .MuiTab-root': {
                                        color: T.darkTextSub,
                                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        fontSize: '0.9rem',
                                        minHeight: 56,
                                        '&.Mui-selected': { color: T.gold }
                                    },
                                    '& .MuiTabs-indicator': { bgcolor: T.gold }
                                }}
                            >
                                <Tab value="recentes" label="Recentes" icon={<AccessTime sx={{ fontSize: 18 }} />} iconPosition="start" />
                                <Tab value="expiradas" label="Expiradas" icon={<History sx={{ fontSize: 18 }} />} iconPosition="start" />
                                <Tab value="fechada" label="Fechadas" icon={<CheckCircle sx={{ fontSize: 18 }} />} iconPosition="start" />
                                <Tab
                                    value="minhas"
                                    label="Minhas"
                                    icon={
                                        <Avatar
                                            src={user?.logoUrl}
                                            sx={{ width: 20, height: 20 }}
                                        />
                                    }
                                    iconPosition="start"
                                />
                            </Tabs>
                        </Paper>

                        {/* Content */}
                        <Paper sx={{ 
                            p: { xs: 2, sm: 3 }, 
                            bgcolor: T.navyCard,
                            border: `1px solid ${T.darkBorder}`,
                            borderRadius: 3,
                            minHeight: '60vh',
                        }}>
                            {renderCotacoes()}
                        </Paper>
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
                    PaperProps={{
                        sx: {
                            bgcolor: T.navyCard,
                            border: `1px solid ${T.darkBorder}`,
                            borderRadius: '16px',
                        }
                    }}
                >
                    <DialogTitle sx={{ 
                        color: T.white, 
                        fontFamily: '"Playfair Display", serif',
                        borderBottom: `1px solid ${T.darkBorder}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        Editar Cotação
                        <IconButton onClick={handleCloseEditDialog} sx={{ color: T.darkMuted }}>
                            <Close />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
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
                </Dialog>
            )}

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    severity={snackbar.severity}
                    sx={{
                        bgcolor: snackbar.severity === 'success' ? T.gold : T.error,
                        color: T.white,
                        borderRadius: '12px',
                        '& .MuiAlert-icon': { color: T.white }
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CotacoesDesk;
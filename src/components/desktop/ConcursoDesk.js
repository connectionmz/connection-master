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
    useMediaQuery
} from '@mui/material';
import { Delete, AccessTime, CheckCircle, History, Edit } from '@mui/icons-material';
import { ref, onValue, update, remove, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import PaySMSCheckout from '../PaySMSCheckout';
import { db } from '../../fb';
import AnunciosDesk from './AnunciosDesk';
import EditarConcurso from './EditarConcurso'; 
import { formatPrice } from '../../utils/utils';

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

    const navigate = useNavigate();
    const isMobile = useMediaQuery('(max-width:600px)');


    useEffect(() => {
        if (!user?.id) return;

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
    }, [user?.id]);

useEffect(() => {
  
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
            
            // Aplicamos os filtros apenas se não for a aba "Meus"
            const filteredConcursos = activeTab === 'minhas' 
                ? concursosArray // Mostra todos os concursos do usuário sem filtros
                : concursosArray.filter(concurso => {
                    // Verifica se o concurso pertence ao usuário (mostra sem filtros)
                    if (concurso.company?.id === user?.id) {
                        return true;
                    }
                    
                    // Filtros normais para concursos de outros usuários
                    const sectorMatch = !concurso.setor || 
                                     (user?.sector && concurso.setor.includes(user.sector));
                
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
            
            const sortedConcursos = filteredConcursos.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setConcursos(sortedConcursos);
            
            return prevClickedConcursos;
        });
    } else {
        setConcursos([]);
    }
    setLoading(false);
});
    return () => unsubscribeConcursos();
}, [ user?.id, clickedConcursos]); // Removi as dependências de província

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
                    // ✅ Só banners ativos e do tipo 'concurso'
                    if (banner.status !== 'active' || banner.tipoAnuncio !== 'concurso') return false;
    
                    const expireDate = new Date(banner.expireDate);
                    if (expireDate < currentDate) return false;
    
                    if (user) {
                        const matchesProvincia = banner.provincias &&
                            banner.provincias.some(prov =>
                                prov.toLowerCase() === user.provincia?.toLowerCase() ||
                                prov.toLowerCase() === user.provinciaTemp?.toLowerCase()
                            );
    
                        return matchesProvincia;
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
    }, [user?.provincia, user?.id]);
    
    const isPrazoValido = (prazoString) => {
        const now = new Date();
        const prazo = new Date(prazoString);
        return prazo >= now;
      };

    const handlePublishConcurso = () => {
      
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
                                    concurso.company?.id !== user?.id
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
                    return concursos.filter(
                        (concurso) => concurso.company?.id === user?.id
                    );
                default:
                    return concursos;
            }
        };

    const handleConcursoClick = async (id) => {
        try {
            await set(ref(db, `concursos/${id}/views/${user.id}`), true);
            setClickedConcursos(prev => ({
                ...prev,
                [id]: true
            }));
            navigate(`/concurso/${id}`);
        } catch (error) {
            console.error('Error recording view:', error);
            navigate(`/concurso/${id}`);
        }
    };

    const handleEditClick = (concurso) => {
        setSelectedConcurso(concurso);
        setEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setSelectedConcurso(null);
    };

    const handleRecarregarSaldo = () => {
        navigate('/sms');
    };

    const renderConcursos = () => {
    
        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress />
                </Box>
            );
        }
    
        const concursosFiltrados = filteredConcursos();
        if (concursosFiltrados.length === 0) {
            return (
                <Typography textAlign="center" sx={{ p: 2 }}>
                    Nenhum concurso disponível.
                </Typography>
            );
        }
    
        return (
            <List>
                {concursosFiltrados.map((concurso) => (
                    <Box key={concurso.id}>
                        <ListItem
                            alignItems="flex-start"
                            sx={{ 
                                cursor: 'pointer', 
                                '&:hover': { backgroundColor: '#fafafa' },
                                fontWeight: clickedConcursos[concurso.id] ? 'normal' : 'bold'
                            }}
                            onClick={() => handleConcursoClick(concurso.id)}
                        >
                            <ListItemAvatar>
                                <Avatar src={concurso.company?.logoUrl || ''} alt="Logo" />
                            </ListItemAvatar>
                         <ListItemText
  primary={
    <Typography 
      component="span" 
      variant="body1" 
      fontWeight={!concurso.isClicked ? 'bold' : 'normal'}
    >
      {concurso.titulo}
    </Typography>
  }
  secondary={
    <>
      <Typography variant="body2" color="text.secondary">
        Nº Ref: {concurso.numeroReferencia}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Publicado em: {new Date(concurso.timestamp).toLocaleDateString('pt-PT')}
      </Typography>
      <Typography 
        variant="body2" 
        color={isPrazoValido(concurso.prazo) ? 'primary' : 'error'}
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          gap: 0.5
        }}
      >
        {isPrazoValido(concurso.prazo) ? (
          <CheckCircle fontSize="small" color="primary" />
        ) : (
          <History fontSize="small" color="error" />
        )}
        Prazo: {new Date(concurso.prazo).toLocaleDateString('pt-PT')}
      </Typography>
      <Typography variant="body2">
        Valor: {concurso.valorEstimado ? concurso.valorEstimado : 'N/A'} MT
      </Typography>
    </>
  }
/>
                            {concurso?.company?.id === user?.id && (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                    <IconButton
                                        color="error"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deleteConcurso(concurso.id);
                                        }}
                                    >
                                        <Delete />
                                    </IconButton>
                                    <IconButton
                                        color="primary"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditClick(concurso);
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
            {!isPaying && (
                <>
                    <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: 'white' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h5" fontWeight="bold">Concursos Públicos</Typography>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handlePublishConcurso}>
                                Publicar Concurso
                            </Button>
                        </Box>
                    </Paper>

                    <AnunciosDesk campanhas={campanhasAtivas} user={user} local="Concursos"/>

                   <Paper elevation={1} sx={{ mb: 2, backgroundColor: 'white' }}>
  <Tabs
    value={activeTab}
    onChange={(_, newValue) => setActiveTab(newValue)}
    indicatorColor="primary"
    textColor="primary"
    variant="scrollable"
    scrollButtons="auto"
    allowScrollButtonsMobile>
    <Tab value="recentes" label="Recentes" icon={<AccessTime />} />
    <Tab value="expiradas" label="Expiradas" icon={<History />} />
    <Tab value="fechada" label="Fechada" icon={<CheckCircle />} />
    <Tab
      value="minhas"
      label="Meus"
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
                        {renderConcursos()}
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
                <DialogTitle>Editar Concurso</DialogTitle>
                <DialogContent>
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

export default ConcursosDesk;
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
} from '@mui/material';
import { AccessTime, CheckCircle, History } from '@mui/icons-material';
import { ref, onValue, remove, update } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import PaySMSCheckout from '../PaySMSCheckout';
import { db } from '../../fb';
import AnunciosDesk from './AnunciosDesk';

const ConcursoDesk = ({ user, onModuleActivation }) => {
    const [cotacoes, setCotacoes] = useState([]);
    const [activeTab, setActiveTab] = useState('recentes');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [isPaying, setIsPaying] = useState(false);
    const [loading, setLoading] = useState(true);
    const [campanhasAtivas, setCampanhasAtivas] = useState([]);

    const navigate = useNavigate();

    const hasModuleSMS = user?.activeModules?.moduloSMS?.status === 'active';
    const hasBalance = user?.activeModules?.moduloSMS?.smsCount > 0; // Verifica se o saldo de SMS é maior que 0

    useEffect(() => {
        if (!hasModuleSMS) {
            setLoading(false);
            return;
        }

        const cotacoesRef = ref(db, 'concursos');
        const unsubscribeCotacoes = onValue(cotacoesRef, (snapshot) => {
            const cotacoesData = snapshot.val();
            if (cotacoesData) {
                const cotacoesArray = Object.values(cotacoesData);
                setCotacoes(cotacoesArray);
            } else {
                setCotacoes([]);
            }
            setLoading(false);
        });

        return () => unsubscribeCotacoes();
    }, [hasModuleSMS]);

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
        };
        fetchCampanhasAtivas();
    }, []);

    const handlePublishQuotation = () => {
        if (!hasModuleSMS) {
            setSnackbar({ open: true, message: 'Ative o módulo SMS para emitir concursos.', severity: 'warning' });
            return;
        }
        if (!hasBalance) {
            setSnackbar({ open: true, message: 'Recarregue seu saldo de SMS para emitir concursos.', severity: 'warning' });
            return;
        }
        navigate('/concurso');
    };

    const deleteCotacao = (cotacaoId) => {
        if (window.confirm('Tem certeza que deseja excluir este concurso?')) {
            const cotacaoRef = ref(db, `concursos/${cotacaoId}`);
            remove(cotacaoRef)
                .then(() => {
                    setSnackbar({ open: true, message: 'Concurso excluído com sucesso!', severity: 'success' });
                })
                .catch((error) => {
                    console.error('Erro ao excluir o concurso: ', error);
                    setSnackbar({ open: true, message: 'Erro ao excluir o concurso.', severity: 'error' });
                });
        }
    };

    const filteredCotacoes = () => {
        const now = new Date();
        switch (activeTab) {
            case 'recentes':
                return cotacoes.filter((cotacao) => {
                    const hoje = new Date();
                    hoje.setHours(0, 0, 0, 0);
                    const prazo = new Date(cotacao.prazo);
                    prazo.setHours(0, 0, 0, 0);
                    return prazo >= hoje && cotacao.status !== 'Fechada';
                });
            case 'expiradas':
                return cotacoes.filter((cotacao) => new Date() > new Date(cotacao.prazo));
            case 'fechada':
                return cotacoes.filter((cotacao) => cotacao.status === 'Fechada');
            case 'minhas':
                return cotacoes.filter((cotacao) => cotacao?.company?.id === user?.id);
            default:
                return cotacoes;
        }
    };

    const handleCotacaoClick = (id, companyId) => {
        navigate(`/concurso/${id}/${companyId}`);
    };

    const handleRecarregarSaldo = () => {
        navigate('/sms');
    };

    // Renderização condicional da lista de concursos
    const renderConcursos = () => {
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

        if (filteredCotacoes().length > 0) {
            return filteredCotacoes().map((cotacao) => (
                <Card
                    key={cotacao.id}
                    sx={{ mb: 2, backgroundColor: 'white', cursor: 'pointer', boxShadow: 2 }}
                    onClick={() => handleCotacaoClick(cotacao.id, cotacao.company?.id)}
                >
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
                            Data limite: {new Date(cotacao.prazo).toLocaleDateString('pt-PT')}
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
            ));
        } else {
            return <Typography textAlign="center">Nenhum concurso disponível.</Typography>;
        }
    };

    return (
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
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

            <Box
                sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 2,
                    backgroundColor: 'white',
                    boxShadow: 1,
                }}
            >
                <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                    Concursos
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handlePublishQuotation}
                    disabled={!hasModuleSMS || !hasBalance}
                >
                    Publicar Concurso
                </Button>
            </Box>

            {/* Espaço para "Anunciar Aqui" */}
            <AnunciosDesk campanhas={campanhasAtivas} />

            <Tabs
                value={activeTab}
                onChange={(_, newValue) => setActiveTab(newValue)}
                indicatorColor="primary"
                textColor="primary"
                sx={{ backgroundColor: 'white', boxShadow: 1 }}
            >
                <Tab value="recentes" label="Recentes" icon={<AccessTime />} />
                <Tab value="expiradas" label="Expiradas" icon={<History />} />
                <Tab value="fechada" label="Fechada" icon={<CheckCircle />} />
                <Tab value="minhas" label="Meus" icon={<Avatar src={user?.logoUrl} />} />
            </Tabs>

            {/* Lista de Concursos */}
            <Box sx={{ flex: 1, overflowY: 'auto', padding: 2 }}>
                {renderConcursos()}
            </Box>

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

export default ConcursoDesk;
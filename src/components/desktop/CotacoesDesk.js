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
import { Delete, AccessTime, CheckCircle, History } from '@mui/icons-material';
import { getDatabase, ref, onValue, update, remove } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../fb';
import { onAuthStateChanged } from 'firebase/auth';
import PaySMSCheckout from '../PaySMSCheckout';

const CotacoesDesk = ({ user, onModuleActivation }) => {
    const [cotacoes, setCotacoes] = useState([]);
    const [activeTab, setActiveTab] = useState('recentes');
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const navigate = useNavigate();

    const hasModuleSMS = user?.activeModules?.moduloSMS?.status === 'active';

    useEffect(() => {
        if (!hasModuleSMS) return;

        const cotacoesRef = ref(db, 'cotacoes');
        const unsubscribeCotacoes = onValue(cotacoesRef, (snapshot) => {
            const cotacoesData = snapshot.val() || {};
            const cotacoesList = Object.entries(cotacoesData).map(([id, data]) => ({
                id,
                ...data,
            }));

            const filteredCotacoes = cotacoesList.filter(
                (cotacao) =>
                    cotacao.userId === user.id || 
                    (cotacao.sector === user.sector &&
                        cotacao.company?.provincia === user.provincia)
            );

            setCotacoes(filteredCotacoes);
        });

        return () => unsubscribeCotacoes();
    }, [db, user, hasModuleSMS]);

    const handlePublishQuotation = () => {
        if (!hasModuleSMS) {
            alert('Você precisa ativar o módulo SMS para emitir cotações.');
            return;
        }
        navigate('/cotacao');
    };

    const deleteCotacao = (cotacaoId) => {
        if (window.confirm('Tem certeza que deseja excluir esta cotação?')) {
            const cotacaoRef = ref(db, `cotacoes/${cotacaoId}`);
            remove(cotacaoRef)
                .then(() => {
                    setSnackbarMessage('Cotação excluída com sucesso!');
                    setSnackbarOpen(true);
                })
                .catch((error) => {
                    console.error('Erro ao excluir a cotação: ', error);
                });
        }
    };

    const filteredCotacoes = () => {
        switch (activeTab) {
            case 'recentes':
                return cotacoes.filter(
                    (cotacao) => new Date(cotacao.timestamp).toDateString() === new Date().toDateString()
                );
            case 'expiradas':
                return cotacoes.filter((cotacao) => new Date() > new Date(cotacao.datalimite));
            case 'Fechada':
                return cotacoes.filter((cotacao) => cotacao.status === 'Fechada');
            case 'minhas':
                return cotacoes.filter((cotacao) => cotacao?.company?.id === user?.id);
            default:
                return cotacoes;
        }
    };

    const handleCotacaoClick = (id, companyId) => {
        navigate(`/cotacao/${id}/${companyId}`);
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
                    }
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
                            setSnackbarMessage('Módulo SMS ativado com sucesso!');
                            setSnackbarOpen(true);
                        });
                    }}
                />
            )}

            {!isPaying && (
                <>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 2,
                            backgroundColor: 'white',
                        }}
                    >
                        <Typography variant="h5">Cotações</Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handlePublishQuotation}
                            disabled={!hasModuleSMS}
                        >
                            Emitir
                        </Button>
                    </Box>

                    <Tabs
                        value={activeTab}
                        onChange={(_, newValue) => setActiveTab(newValue)}
                        indicatorColor="primary"
                        textColor="primary"
                        sx={{ backgroundColor: 'white' }}
                    >
                         <Tab value="recentes" label="Recentes" icon={<AccessTime />} />
                        <Tab value="expiradas" label="Expiradas" icon={<History />} />
                        <Tab value="fechada" label="Fechada" icon={<CheckCircle />} />
                        <Tab value="minhas" label="Minhas" icon={<Avatar src={user?.logoUrl} />} />
                    </Tabs>

                    <Box sx={{ flex: 1, overflowY: 'auto', padding: 2 }}>
                        {filteredCotacoes().length > 0 ? (
                            filteredCotacoes().map((cotacao) => (
                                <Card
                                    key={cotacao.id}
                                    sx={{ mb: 2, backgroundColor: 'white', cursor: 'pointer' }}
                                    onClick={() => handleCotacaoClick(cotacao.id, cotacao.company?.id)}
                                >
                                    <CardContent>
                                        <Box display="flex" alignItems="center" mb={2}>
                                            <Avatar src={cotacao.company?.logoUrl || ''} alt="Logo" sx={{ mr: 2 }} />
                                            <Typography variant="h6">{cotacao.company?.nome || 'Empresa'}</Typography>
                                        </Box>
                                        <Typography>{cotacao.title}</Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Button
                                            color="error"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteCotacao(cotacao.id);
                                            }}
                                        >
                                            Excluir
                                        </Button>
                                    </CardActions>
                                </Card>
                            ))
                        ) : (
                            <Typography textAlign="center">Nenhuma cotação disponível.</Typography>
                        )}
                    </Box>
                </>
            )}

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
            >
                <Alert severity="success">{snackbarMessage}</Alert>
            </Snackbar>
        </Box>
    );
};

export default CotacoesDesk;

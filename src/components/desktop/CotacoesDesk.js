import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, update, remove } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../../fb';
import { onAuthStateChanged } from 'firebase/auth';
import PaySMSCheckout from '../PaySMSCheckout';
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
} from '@mui/material';

const CotacoesDesk = ({ user, onModuleActivation }) => {

    const [cotacoes, setCotacoes] = useState([]);
    const [activeTab, setActiveTab] = useState('recentes');
    const [loggedInUser, setLoggedInUser] = useState(null);
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
  
          // Filtra as cotações por critérios adicionais
          const filteredCotacoes = cotacoesList.filter(
              (cotacao) =>
                  cotacao.userId === user.id || // Inclui cotações criadas pelo usuário
                  (cotacao.sector === user.sector &&
                      cotacao.company?.provincia === user.provincia) // Ou cotações do mesmo setor/província
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

    const handleCotacaoClick = (id, companyId) => {
        navigate(`/cotacao/${id}/${companyId}`);
    };

    const isExpired = (datalimite) => {
        const currentDate = new Date();
        const deadline = new Date(datalimite);
        return currentDate > deadline;
    };

    const isRecent = (timestamp) => {
        const currentDate = new Date();
        const cotacaoDate = new Date(timestamp);
        return currentDate.toDateString() === cotacaoDate.toDateString();
    };

    const updateStatusToExpired = (cotacaoId) => {
        const cotacaoRef = ref(db, `cotacoes/${cotacaoId}`);
        update(cotacaoRef, { status: 'expired' }).catch((error) => {
            console.error('Erro ao atualizar o status da cotação: ', error);
        });
    };

    const filteredCotacoes = () => {

  
      switch (activeTab) {
          case 'recentes':
              return cotacoes.filter((cotacao) => isRecent(cotacao.timestamp));
          case 'expiradas':
              return cotacoes.filter((cotacao) => {
                  const expired = isExpired(cotacao.datalimite);
                  if (expired && cotacao.status !== 'expired') {
                      updateStatusToExpired(cotacao.id);
                  }
                  return expired;
              });
          case 'Fechada':
              return cotacoes.filter((cotacao) => cotacao.status === 'Fechada');
          case 'minhas':
              return cotacoes.filter(
                  (cotacao) => cotacao?.company?.id === user?.id
              );
          default:
              return cotacoes;
      }
  };
  

    return (
        <Box p={2}>
            {!hasModuleSMS && !isPaying && (
                <Alert
                    severity="warning"
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={() => setIsPaying(true)}
                        >
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
                    <Box display="flex" justifyContent="space-between" mb={2}>
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
                    >
                        <Tab value="recentes" label="Recentes" />
                        <Tab value="expiradas" label="Expiradas" />
                        <Tab value="Fechada" label="Fechada" />
                        <Tab value="minhas" label="Minhas" />
                    </Tabs>

                    <Box mt={3}>
                        {filteredCotacoes().length > 0 ? (
                            filteredCotacoes().map((cotacao) => (
                                <Card
                                    key={cotacao.id}
                                    sx={{
                                        mb: 2,
                                        backgroundColor: isExpired(cotacao.datalimite)
                                            ? 'grey.100'
                                            : 'white',
                                    }}
                                    onClick={() =>
                                        handleCotacaoClick(cotacao.id, cotacao.company?.id)
                                    }
                                >
                                    <CardContent>
                                        <Box display="flex" alignItems="center" mb={2}>
                                            <Avatar
                                                src={
                                                    cotacao.company?.logoUrl ||
                                                    'https://via.placeholder.com/64'
                                                }
                                                alt={cotacao.company?.nome || 'Empresa'}
                                                sx={{ mr: 2 }}
                                            />
                                            <Typography variant="h6">
                                                {cotacao.company?.nome || 'Empresa'}
                                            </Typography>
                                        </Box>
                                        <Typography variant="body1" gutterBottom>
                                            {cotacao.title}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Prazo: {new Date(cotacao.datalimite).toLocaleDateString()}
                                        </Typography>
                                    </CardContent>
                                    {loggedInUser?.uid === cotacao.company?.id && (
                                        <CardActions>
                                            <Button
                                                size="small"
                                                color="error"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteCotacao(cotacao.id);
                                                }}
                                            >
                                                Excluir
                                            </Button>
                                        </CardActions>
                                    )}
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

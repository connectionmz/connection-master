import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../fb';
import { ref, onValue, push, set, query, orderByChild, equalTo, get } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { getApp } from 'firebase/app';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  InputAdornment,
} from '@mui/material';
import BackButton from './BackButton';
import PagamentoAccordion from '../according/PagamentoAccordion';

// Mapeamento completo de códigos de resposta M-Pesa com mensagens amigáveis
const MPESA_RESPONSE_CODES = {
  'INS-0': { status: 'success', message: 'Pagamento processado com sucesso!' },
  'INS-1': { status: 'error', message: 'Ocorreu um problema interno no sistema de pagamentos. Por favor, tente novamente mais tarde.' },
  'INS-2': { status: 'error', message: 'Problema de configuração no sistema de pagamentos. Nossa equipe já foi notificada.' },
  'INS-4': { status: 'error', message: 'Sua conta M-Pesa não está ativa. Por favor, verifique com o seu provedor de serviços móveis.' },
  'INS-5': { status: 'error', message: 'Você cancelou a transação. Nenhum valor foi debitado da sua conta.' },
  'INS-6': { status: 'error', message: 'A transação falhou. Por favor, verifique seu saldo e tente novamente.' },
  'INS-9': { status: 'error', message: 'O tempo para concluir o pagamento expirou. Por favor, tente novamente.' },
  'INS-10': { status: 'error', message: 'Esta transação já foi processada anteriormente. Verifique seu histórico de pagamentos.' },
  'INS-13': { status: 'error', message: 'Configuração inválida no sistema. Nossa equipe já foi notificada.' },
  'INS-14': { status: 'error', message: 'Referência de pagamento inválida. Por favor, recarregue a página e tente novamente.' },
  'INS-15': { status: 'error', message: 'O valor do pagamento é inválido. Entre em contato com o suporte.' },
  'INS-16': { status: 'error', message: 'O serviço M-Pesa está temporariamente indisponível. Por favor, tente mais tarde.' },
  'INS-17': { status: 'error', message: 'Referência de transação inválida. Recarregue a página e tente novamente.' },
  'INS-18': { status: 'error', message: 'Identificador de transação inválido. Nossa equipe foi notificada.' },
  'INS-19': { status: 'error', message: 'Referência externa inválida. Por favor, tente novamente.' },
  'INS-20': { status: 'error', message: 'Informações incompletas. Preencha todos os campos corretamente.' },
  'INS-21': { status: 'error', message: 'Validação falhou. Verifique os dados informados e tente novamente.' },
  'INS-22': { status: 'error', message: 'Tipo de operação inválido. Nossa equipe foi notificada.' },
  'INS-23': { status: 'error', message: 'Status desconhecido. Entre em contato com o suporte para assistência.' },
  'INS-2001': { status: 'error', message: 'Problema de autenticação no sistema. Por favor, tente novamente mais tarde.' },
  'INS-2002': { status: 'error', message: 'Destinatário inválido. Nossa equipe foi notificada.' },
  'INS-2006': { status: 'error', message: 'Saldo insuficiente na sua conta M-Pesa. Por favor, recarregue e tente novamente.' },
  'INS-2051': { status: 'error', message: 'Número de telefone inválido. Verifique o número e tente novamente.' },
  'INS-2057': { status: 'error', message: 'Configuração de idioma inválida. Nossa equipe foi notificada.' },
  'default': { status: 'error', message: 'Ocorreu um erro inesperado durante o pagamento. Por favor, tente novamente.' }
};

// Função para processar respostas da API
const processApiResponse = (apiResponse) => {
  // Se a resposta contiver details (erro estruturado)
  if (apiResponse.details) {
    const responseCode = apiResponse.details.output_ResponseCode || 'default';
    const statusInfo = MPESA_RESPONSE_CODES[responseCode] || MPESA_RESPONSE_CODES['default'];
    
    return {
      ...apiResponse.details,
      status: statusInfo.status,
      statusMessage: statusInfo.message,
      isSuccess: false,
      errorCode: responseCode
    };
  }
  
  // Se for uma resposta de sucesso direta
  if (apiResponse.output_ResponseCode === 'INS-0') {
    return {
      ...apiResponse,
      status: 'success',
      statusMessage: MPESA_RESPONSE_CODES['INS-0'].message,
      isSuccess: true
    };
  }

  // Caso de erro não estruturado
  return {
    status: 'error',
    statusMessage: apiResponse.error || MPESA_RESPONSE_CODES['default'].message,
    isSuccess: false,
    errorCode: 'unknown'
  };
};

const PagamentoModulo = ({ user }) => {
  const { moduleKey } = useParams();
  const navigate = useNavigate();
  
  const [modules, setModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState(
    user?.contacto?.startsWith('258') 
      ? user.contacto 
      : user?.contacto ? `258${user.contacto.replace(/^0/, '')}` : ''
  );
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [existingPayment, setExistingPayment] = useState(null);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [responseDialogOpen, setResponseDialogOpen] = useState(false);
  const [mpesaResponse, setMpesaResponse] = useState(null);

  const app = getApp();
  const storage = getStorage(app);

  // Carregar módulos disponíveis
  useEffect(() => {
    const modulesRef = ref(db, 'modules/modulos');
    const unsubscribe = onValue(modulesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const modulesArray = Object.keys(data).map(key => ({
          key,
          ...data[key]
        }));
        setModules(modulesArray);
      }
    });
    return () => unsubscribe();
  }, []);

  // Definir módulo atual e verificar pagamentos existentes
  useEffect(() => {
    if (modules.length > 0 && moduleKey) {
      const foundModule = modules.find((mod) => mod.key === moduleKey);
      if (foundModule) {
        setCurrentModule(foundModule);
        checkExistingPayment(user?.id, foundModule.key);
      }
    }
  }, [modules, moduleKey, user?.id]);

  const checkExistingPayment = async (userId, modKey) => {
    if (!userId || !modKey) return;
    
    try {
      const paymentsRef = query(
        ref(db, 'payments'),
        orderByChild('userId'),
        equalTo(userId)
      );
      
      const snapshot = await get(paymentsRef);
      if (snapshot.exists()) {
        const payments = [];
        snapshot.forEach((childSnapshot) => {
          const payment = childSnapshot.val();
          if (payment.moduleKey === modKey) {
            payments.push({
              key: childSnapshot.key,
              ...payment
            });
          }
        });
        
        if (payments.length > 0) {
          payments.sort((a, b) => b.timestamp - a.timestamp);
          setExistingPayment(payments[0]);
          setPaymentSuccess(payments[0].status === 'pago');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar pagamentos existentes:', error);
    }
  };

  const calculateSubscriptionEnd = (validade) => {
    const now = Date.now();
    const durationInMs = {
      Mensal: 30 * 24 * 60 * 60 * 1000, 
      Anual: 365 * 24 * 60 * 60 * 1000,
    };
    return now + (durationInMs[validade] || durationInMs.Mensal); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.id) {
      setError('Usuário não autenticado. Por favor, faça login novamente.');
      return;
    }

    if (!phoneNumber || !phoneNumber.startsWith('258') || phoneNumber.length !== 12) {
      setError('Por favor, insira um número de telefone válido no formato 258XXXXXXXXX');
      return;
    }

    setLoading(true);
    setError('');
    setMpesaResponse(null);

    try {
      const sanitizedReference = `Modulo${currentModule.name}`
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .substring(0, 20);

      const response = await fetch('https://mpesa-server-bay.vercel.app/pagar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: currentModule.price,
          phoneNumber,
          reference: sanitizedReference
        }),
      });

      const data = await response.json();

      // Processar resposta da API
      const processedResponse = processApiResponse(data);
      setMpesaResponse(processedResponse);
      setResponseDialogOpen(true);
      
      if (!processedResponse.isSuccess) {
        throw new Error(processedResponse.statusMessage);
      }

      // Se o pagamento foi bem-sucedido
      const now = Date.now();
      const subscriptionEnd = calculateSubscriptionEnd(currentModule.validade);

      const paymentData = {
        userId: user.id,
        userName: user.displayName || '',
        userEmail: user.email || '',
        nome: user.nome || '',
        telefone: user.contacto || '',
        moduleKey,
        moduleName: currentModule?.name || '',
        moduleType: currentModule?.type || 'standard',
        amount: currentModule.price,
        reference: currentModule.name,
        status: 'pago',
        timestamp: existingPayment?.timestamp || now,
        updatedAt: now,
        mpesaResponse: processedResponse,
        subscription: {
          isActive: true,
          start: now,
          end: subscriptionEnd,
          durationDays: currentModule.validade === 'Anual' ? 365 : 30,
          moduleKey,
          moduleName: currentModule?.name || '',
          subscriptionType: currentModule.validade.toLowerCase(),
        }
      };

      let paymentRef;
      if (existingPayment) {
        paymentRef = ref(db, `payments/${existingPayment.key}`);
        await set(paymentRef, paymentData);
      } else {
        const paymentsRef = ref(db, 'payments');
        paymentRef = push(paymentsRef);
        await set(paymentRef, paymentData);
      }

      const subscriptionRef = ref(db, `subscriptions/${user.id}/${moduleKey}`);
      await set(subscriptionRef, {
        isActive: true,
        start: now,
        end: subscriptionEnd,
        durationDays: currentModule.validade === 'Anual' ? 365 : 30,
        moduleKey,
        moduleName: currentModule?.name || '',
        subscriptionType: currentModule.validade.toLowerCase(),
        paymentId: paymentRef.key,
        validade: currentModule.validade,
        status: 'ativo',
      });

      setPaymentSuccess(true);
      setExistingPayment({
        ...paymentData,
        key: paymentRef.key
      });

      setSnackbar({
        open: true,
        message: processedResponse.statusMessage,
        severity: 'success',
      });

    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
      
      // Usar a mensagem da resposta processada se disponível
      const errorMessage = mpesaResponse?.statusMessage || err.message;
      
      setError(errorMessage);
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error',
      });
    } finally {
      setLoading(false);
      setShowReplaceDialog(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleCloseResponseDialog = () => {
    setResponseDialogOpen(false);
    if (mpesaResponse?.isSuccess) {
      navigate('/meus-modulos');
    }
  };

  const handlePhoneNumberChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    let formattedValue = rawValue.startsWith('258') 
      ? rawValue 
      : `258${rawValue}`;
    formattedValue = formattedValue.substring(0, 12);
    setPhoneNumber(formattedValue);
  };

  if (!currentModule) {
    return (
      <Box sx={{ p: 6, backgroundColor: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" color="error">
          Módulo não encontrado
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate('/')}>
          Voltar para a página inicial
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 4, md: 6 }, 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      width: '100%',
      maxWidth: '800px',
      mx: 'auto'
    }}>
      <BackButton sx={{ mb: 2, alignSelf: 'flex-start' }} />

      <Card sx={{ width: '100%', boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {currentModule.name}
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            {currentModule.description}
          </Typography>
          
          <Box sx={{ mt: 2, display: 'flex', gap: 3 }}>
            <Typography variant="body2">
              <strong>Validade:</strong> {currentModule.validade === 'Anual' ? '1 ano' : '1 mês'}
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              <strong>Preço:</strong> {currentModule.price} MT
            </Typography>
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <PagamentoAccordion data={currentModule} />
          </Box>
        </CardContent>
        
        <CardActions sx={{ flexDirection: 'column', alignItems: 'stretch', px: 2, pb: 2 }}>
          {!paymentSuccess ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                label="Valor do Módulo"
                value={`${currentModule.price} MT`}
                fullWidth
                margin="normal"
                InputProps={{
                  readOnly: true,
                }}
              />
              
              <TextField
                label="Referência"
                value={currentModule.name}
                fullWidth
                margin="normal"
                InputProps={{
                  readOnly: true,
                }}
              />
              
              <TextField
                label="Telefone M-Pesa"
                value={phoneNumber}
                onChange={handlePhoneNumberChange}
                fullWidth
                margin="normal"
                required
                helperText="Número de telefone registado no M-Pesa (formato 258XXXXXXXXX)"
                error={!!error}
                InputProps={{
                  startAdornment: <InputAdornment position="start">258</InputAdornment>,
                }}
              />
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mt: 3 }}
                fullWidth
                size="large"
              >
                {loading ? <CircularProgress size={24} /> : 'Pagar via M-Pesa'}
              </Button>
            </Box>
          ) : (
            <Alert severity="success" sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Pagamento processado com sucesso!
              </Typography>
              
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Módulo:</strong> {currentModule.name}
                </Typography>
                <Typography variant="body2">
                  <strong>Valor:</strong> {currentModule.price} MT
                </Typography>
                <Typography variant="body2">
                  <strong>Validade:</strong> {currentModule.validade === 'Anual' ? '1 ano' : '1 mês'}
                </Typography>
                {existingPayment?.mpesaResponse?.output_TransactionID && (
                  <Typography variant="body2">
                    <strong>ID da Transação:</strong> {existingPayment.mpesaResponse.output_TransactionID}
                  </Typography>
                )}
              </Box>
              
              <Button 
                variant="outlined" 
                sx={{ mt: 2 }}
                onClick={() => navigate('/meus-modulos')}
                fullWidth
              >
                Ver meus módulos
              </Button>
            </Alert>
          )}
        </CardActions>
      </Card>
      
      {/* Diálogo de resposta da M-Pesa */}
      <Dialog
        open={responseDialogOpen}
        onClose={handleCloseResponseDialog}
      >
        <DialogTitle>
          {mpesaResponse?.isSuccess ? 'Pagamento Bem-sucedido' : 'Erro no Pagamento'}
        </DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            {mpesaResponse?.statusMessage}
          </Typography>
          
          {mpesaResponse && (
            <Box sx={{ mt: 2 }}>
              {mpesaResponse.output_TransactionID && (
                <Typography variant="body2">
                  <strong>ID da Transação:</strong> {mpesaResponse.output_TransactionID}
                </Typography>
              )}
              {mpesaResponse.errorCode && !mpesaResponse.isSuccess && (
                <Typography variant="body2">
                  <strong>Código do Erro:</strong> {mpesaResponse.errorCode}
                </Typography>
              )}
              {mpesaResponse.output_ThirdPartyReference && (
                <Typography variant="body2">
                  <strong>Referência:</strong> {mpesaResponse.output_ThirdPartyReference}
                </Typography>
              )}
              {mpesaResponse.output_ConversationID && (
                <Typography variant="body2">
                  <strong>ID da Conversa:</strong> {mpesaResponse.output_ConversationID}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResponseDialog}>
            {mpesaResponse?.isSuccess ? 'Continuar' : 'Fechar'}
          </Button>
        {!mpesaResponse?.isSuccess && (
            <Button 
              onClick={() => {
                handleCloseResponseDialog();
                handleSubmit({ preventDefault: () => {} });
              }} 
              color="primary"
            >
              Tentar Novamente
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PagamentoModulo;
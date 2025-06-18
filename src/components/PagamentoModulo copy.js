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
} from '@mui/material';
import BackButton from './BackButton';
import PagamentoAccordion from '../according/PagamentoAccordion';

const PagamentoModulo = ({ user }) => {
  const { moduleKey } = useParams();
  const [modules, setModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const [referencia, setReferencia] = useState('');
  const [contactoOpcional, setContactoOpcional] = useState('');
  const [nomeContaPagamento, setNomeContaPagamento] = useState('');
  const [comprovativo, setComprovativo] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [existingPayment, setExistingPayment] = useState(null);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(true);
  const navigate = useNavigate();

  const app = getApp();
  const storage = getStorage(app);

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
        console.log('Módulos carregados:', modulesArray);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (modules.length > 0 && moduleKey) {
      const foundModule = modules.find((mod) => mod.key === moduleKey);
      setCurrentModule(foundModule || null);
    }
  }, [modules, moduleKey]);

  useEffect(() => {
    if (user?.id && moduleKey) {
      const checkExistingPayment = async () => {
        try {
          const paymentsRef = ref(db, 'payments');
          const queryRef = query(
            paymentsRef,
            orderByChild('userId_moduleKey'),
            equalTo(`${user.id}_${moduleKey}`)
          );
          
          const snapshot = await get(queryRef);
          if (snapshot.exists()) {
            const payments = snapshot.val();
            const paymentKey = Object.keys(payments)[0];
            const paymentData = {
              key: paymentKey,
              ...payments[paymentKey]
            };
            
            setExistingPayment(paymentData);
            setPaymentSuccess(true);
            setReferencia(paymentData.referencia || '');
            setContactoOpcional(paymentData.contactoOpcional || '');
            setNomeContaPagamento(paymentData.nomeContaPagamento || '');
          }
        } catch (err) {
          console.error('Erro ao verificar pagamentos existentes:', err);
        } finally {
          setIsCheckingPayment(false);
        }
      };
      
      checkExistingPayment();
    } else {
      setIsCheckingPayment(false);
    }
  }, [user, moduleKey]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setComprovativo(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.id) {
      setError('Usuário não autenticado. Por favor, faça login novamente.');
      return;
    }

    if (!nomeContaPagamento) {
      setError('Por favor, insira o nome da conta que fez o pagamento.');
      return;
    }

    if (existingPayment && !showReplaceDialog) {
      setShowReplaceDialog(true);
      return;
    }

    setLoading(true);
    setError('');

    try {
      let comprovativoUrl = existingPayment?.comprovativoUrl || '';
      
      if (comprovativo) {
        if (existingPayment?.comprovativoUrl) {
          try {
            const oldFileRef = storageRef(storage, existingPayment.comprovativoUrl);
            await deleteObject(oldFileRef);
          } catch (err) {
            console.warn('Não foi possível remover o comprovativo anterior:', err);
          }
        }
        
        const fileRef = storageRef(storage, `comprovativos/${user.id}/${moduleKey}/${Date.now()}_${comprovativo.name}`);
        await uploadBytes(fileRef, comprovativo);
        comprovativoUrl = await getDownloadURL(fileRef);
      }

      const paymentData = {
        userId: user.id,
        moduleKey,
        moduleName: currentModule?.name || '',
        nome: user.nome || '',
        telefone: user.contacto || '',
        contactoOpcional: contactoOpcional || '',
        nomeContaPagamento: nomeContaPagamento || '',
        referencia,
        comprovativoUrl,
        status: existingPayment?.status === 'aprovado' ? 'aprovado' : 'pendente',
        timestamp: existingPayment?.timestamp || Date.now(),
        updatedAt: Date.now(),
        userEmail: user.email || '',
        userName: user.displayName || '',
        userId_moduleKey: `${user.id}_${moduleKey}`
      };

      if (existingPayment) {
        await set(ref(db, `payments/${existingPayment.key}`), paymentData);
      } else {
        const paymentsRef = ref(db, 'payments');
        const newPaymentRef = push(paymentsRef);
        await set(newPaymentRef, paymentData);
      }

      setPaymentSuccess(true);
      setExistingPayment({
        ...(existingPayment || {}),
        ...paymentData
      });
    } catch (err) {
      console.error('Erro ao processar pagamento:', err);
      setError('Ocorreu um erro ao enviar. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
      setShowReplaceDialog(false);
    }
  };

  const handleCancelReplace = () => {
    setShowReplaceDialog(false);
    setComprovativo(null);
  };

  if (isCheckingPayment) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Verificando pagamentos anteriores...</Typography>
      </Box>
    );
  }

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
    <Box sx={{ p: { xs: 2, sm: 4, md: 6 }, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <BackButton sx={{ mb: 2, alignSelf: 'flex-start' }} />
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {existingPayment ? 'Atualizar Pagamento' : 'Pagamento do Módulo'}
      </Typography>
      
      {existingPayment && (
        <Alert 
          severity={existingPayment.status === 'aprovado' ? 'success' : 'info'} 
          sx={{ mb: 3, width: '100%', maxWidth: 600 }}
        >
          {existingPayment.status === 'aprovado' 
            ? 'Seu pagamento já foi aprovado! Você pode enviar um novo comprovativo se necessário.'
            : 'Você já enviou um comprovativo para este módulo. Status: Pendente de aprovação.'}
        </Alert>
      )}
      
      <Card sx={{ width: '100%', maxWidth: 600, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {currentModule.name}
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            {currentModule.description}
          </Typography>
          <Typography variant="h6" color="primary" fontWeight="bold">
            {currentModule.price || ''} MT
          </Typography>
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f0f0', borderRadius: 1 }}>
           <PagamentoAccordion data={currentModule} />
          </Box>
        </CardContent>
        <CardActions sx={{ flexDirection: 'column', alignItems: 'stretch', px: 2, pb: 2 }}>
          {!paymentSuccess ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                label="Telefone Principal"
                value={user.contacto || ''}
                fullWidth
                margin="normal"
                InputProps={{
                  readOnly: true,
                }}
                helperText="Como via principal de contacto contacto com a sua empresa usaremos este número."
              />
              <TextField
                label="Telefone Opcional"
                value={contactoOpcional}
                onChange={(e) => setContactoOpcional(e.target.value)}
                fullWidth
                margin="normal"
                helperText="Em caso de necessidade de contacto com a sua empresa usaremos este número."
                inputProps={{ maxLength: 15 }}
              />
              <TextField
                label="Nome da conta que fez o pagamento"
                value={nomeContaPagamento}
                onChange={(e) => setNomeContaPagamento(e.target.value)}
                fullWidth
                margin="normal"
                helperText="Nome do titular da conta que realizou o pagamento"
                required
              />
              <TextField
                label="Referência de Pagamento"
                placeholder="Após o pagamento, coloque aqui o número da referência" 
                value={referencia}
                onChange={(e) => setReferencia(e.target.value)}
                fullWidth
                margin="normal"
                helperText="Número da transação ou outro identificador"
              />
              <Button
                variant="contained"
                component="label"
                sx={{ mt: 2 }}
                color={existingPayment?.comprovativoUrl && !comprovativo ? 'secondary' : 'primary'}>
                {existingPayment?.comprovativoUrl && !comprovativo 
                  ? 'Substituir Comprovativo (JPEG, PNG ou PDF)'
                  : 'Carregar Comprovativo (JPEG, PNG ou PDF)'}
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  hidden
                  onChange={handleFileChange}
                />
              </Button>
              
              {existingPayment?.comprovativoUrl && !comprovativo && (
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  Comprovativo atual: <a href={existingPayment.comprovativoUrl} target="_blank" rel="noopener noreferrer">Visualizar</a>
                </Typography>
              )}
              
              {comprovativo && (
                <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                  Novo comprovativo selecionado: {comprovativo.name}
                </Typography>
              )}
              
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
              >
                {loading ? <CircularProgress size={24} /> : 
                  existingPayment ? 'Atualizar Pagamento' : 'Enviar Comprovativo'}
              </Button>
            </Box>
          ) : (
            <Alert severity="success" sx={{ mt: 2 }}>
              {existingPayment 
                ? `Comprovativo ${comprovativo ? 'atualizado' : 'já enviado'} com sucesso!`
                : 'Comprovativo enviado com sucesso!'}
              {existingPayment?.status === 'pendente' && ' Aguardando verificação.'}
              
              <Box sx={{ mt: 2, display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Button 
                  variant="outlined" 
                  onClick={() => navigate('/meus-modulos')}
                  fullWidth
                >
                  Voltar para Meus Módulos
                </Button>
                {(existingPayment?.status !== 'aprovado' || comprovativo) && (
                  <Button 
                    variant="contained"
                    onClick={() => {
                      setPaymentSuccess(false);
                      setComprovativo(null);
                    }}
                    fullWidth
                  >
                    Enviar Novo Comprovativo
                  </Button>
                )}
              </Box>
            </Alert>
          )}
        </CardActions>
      </Card>
      
      <Dialog
        open={showReplaceDialog}
        onClose={handleCancelReplace}
      >
        <DialogTitle>Substituir comprovativo?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você já enviou um comprovativo para este módulo. Tem certeza que deseja substituí-lo?
            {existingPayment?.status === 'aprovado' && 
              ' Seu acesso ao módulo pode ser temporariamente suspenso até a aprovação do novo comprovativo.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelReplace}>Cancelar</Button>
          <Button onClick={handleSubmit} color="primary" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Confirmar Substituição'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PagamentoModulo;
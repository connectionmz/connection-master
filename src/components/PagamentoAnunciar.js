import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../fb';
import { ref, push, set, query, orderByChild, equalTo, get } from 'firebase/database';
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
import { formatPrice } from './anuncio/adUtils';
import PagamentoAccordion from '../according/PagamentoAccordion';

const PagamentoAnunciar = ({ user, customAmount, adId, onPaymentSuccess }) => {
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

  const currentModule ={
    key:'PagamentoDeAnuncio',
    price:customAmount
  }

  useEffect(() => {
    if (user?.id) {
      const checkExistingPayment = async () => {
        try {
          const paymentsRef = ref(db, 'payments');
          const queryRef = query(
            paymentsRef,
            orderByChild('userId_moduleKey'),
            equalTo(`${user.id}}`)
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
  }, [user]);

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
        
        const fileRef = storageRef(storage, `comprovativos/${user.id}/${Date.now()}_${comprovativo.name}`);
        await uploadBytes(fileRef, comprovativo);
        comprovativoUrl = await getDownloadURL(fileRef);
      }

      const paymentData = {
        userId: user.id,
        moduleKey:'Pagamento Anuncio',
        moduleName: `Anúncio ${adId}`,
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
        userId: user.id,
        amount: customAmount || 0,
        adId: adId
      };

      if (existingPayment) {
        await set(ref(db, `paymentoAnuncios/${existingPayment.key}`), paymentData);
      } else {
        const paymentsRef = ref(db, 'paymentoAnuncios');
        const newPaymentRef = push(paymentsRef);
        await set(newPaymentRef, paymentData);
      }

      if (adId) {
        const adRef = ref(db, `banners/${adId}`);
        await set(adRef, { status: 'paid' }, { merge: true });
      }

      setPaymentSuccess(true);
      setExistingPayment({
        ...(existingPayment || {}),
        ...paymentData
      });

      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
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

  const handleBack = () => {
    if (onPaymentSuccess) {
      onPaymentSuccess();
    } else {
      navigate(-1);
    }
  };

  if (isCheckingPayment) {
    return (
      <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Verificando pagamentos anteriores...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 4, md: 6 }, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        {existingPayment ? 'Atualizar Pagamento' : 'Confirmar Pagamento do Anúncio'}
      </Typography>     
      {existingPayment && (
        <Alert 
          severity={existingPayment.status === 'aprovado' ? 'success' : 'info'} 
          sx={{ mb: 3, width: '100%', maxWidth: 600 }}
        >
          {existingPayment.status === 'aprovado' 
            ? 'Seu pagamento já foi aprovado! Você pode enviar um novo comprovativo se necessário.'
            : 'Você já enviou um comprovativo para este anúncio. Status: Pendente de aprovação.'}
        </Alert>
      )}
      <Card sx={{ width: '100%', maxWidth: 600}}>
        <CardContent>
          <Typography variant="h6" color="primary" fontWeight="bold">
            Por Pagar: {formatPrice(customAmount)} MT
          </Typography>
           <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f0f0', borderRadius: 1 }}>
              <PagamentoAccordion data={currentModule} />
            </Box>
          <Box sx={{ mt: 2, p: 2, backgroundColor: '#f0f0f0', borderRadius: 1 }}>
            <Typography>
              Por favor, efetue o pagamento conforme as instruções abaixo e envie o comprovativo.
              O seu anúncio será ativado após confirmação do pagamento.
            </Typography>
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
                helperText="Como via principal de contacto com a sua empresa usaremos este número."
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
                label="Nome da conta que fez o pagamento *"
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
                color={existingPayment?.comprovativoUrl && !comprovativo ? 'secondary' : 'primary'}
              >
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
            Você já enviou um comprovativo para este pagamento. Tem certeza que deseja substituí-lo?
            {existingPayment?.status === 'aprovado' && 
              ' Seu acesso pode ser temporariamente suspenso até a aprovação do novo comprovativo.'}
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

export default PagamentoAnunciar;
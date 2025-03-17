import React, { useEffect, useState } from 'react';
import { ref, onValue, update, push, set } from 'firebase/database'; // Importe a função `update`
import { db } from '../../fb';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Checkbox,
} from '@mui/material';
import BackButton from '../BackButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import PaymentIcon from '@mui/icons-material/Payment';
import axios from 'axios';

const SmsDesk = ({ user }) => {
  const [smsBalance, setSmsBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [smsCount, setSmsCount] = useState(25);
  const [pendingTransaction, setPendingTransaction] = useState(false);
  const [subsectores, setSubsectores] = useState([]);
  const [selectedSubsectores, setSelectedSubsectores] = useState([]);

  // Função para buscar o saldo de SMS
  const fetchSmsBalance = () => {
    setLoading(true);
    const userRef = ref(db, `company/${user.id}/activeModules/moduloSMS`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      setSmsBalance(data?.smsCount || 0);
      setSelectedSubsectores(data?.subsectores || []); // Carrega subsectores salvos
      setLoading(false);
    });
  };

// Função para carregar os subsectores do setor do usuário
const fetchSubsectores = async () => {
  if (!user?.sector) return;

  const sectorRef = ref(db, `sectores_de_atividade`);
  onValue(sectorRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const sectorData = data.find((s) => s.setor === user.sector);
      if (sectorData) {
        setSubsectores(sectorData.subsectores || []);
      }
    }
  });
};

  // Busca o saldo e subsectores ao carregar o componente
  useEffect(() => {
    fetchSmsBalance();
    fetchSubsectores();
  }, [user.id, user.sector]);

  // Função para salvar as preferências de subsectores no Firebase
  const saveSubsectoresPreference = async () => {
    if (!user?.id) return;

    const userRef = ref(db, `company/${user.id}/activeModules/moduloSMS`);
    try {
      await update(userRef, { subsectores: selectedSubsectores });
      alert('Preferências salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar preferências de subsectores:', error);
    }
  };

  // Função para abrir o modal de pagamento
  const handleOpenPaymentModal = () => {
    setPaymentModalOpen(true);
  };

  // Função para fechar o modal de pagamento
  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false);
    setError(null); // Limpa o erro ao fechar o modal
  };

  // Função para validar o número de celular
  const validatePhoneNumber = (number) => {
    return /^8[1-9]\d{7}$/.test(number); // Valida números no formato 841234567
  };

  // Função para calcular o preço total
  const calculatePrice = (count) => {
    const pricePer25SMS = 150; // 150 Mt por 25 SMS
    return (count / 25) * pricePer25SMS;
  };

// Função para atualizar o saldo de SMS no Firebase e salvar os dados no nó "subscriptions"
const updateSmsBalanceInFirebase = async (newBalance, valorPago, metodoDePagamento) => {
  const currentDate = new Date();
  const month = currentDate.getMonth() + 1; // Mês atual (1-12)
  const year = currentDate.getFullYear(); // Ano atual

  const userRef = ref(db, `company/${user.id}/activeModules/moduloSMS`);
  const subscriptionsRef = ref(db, `subscriptions/${user.id}/${year}/${month}`);

  try {
    // Atualiza o saldo de SMS no caminho "company/${user.id}/activeModules/moduloSMS"
    await update(userRef, { smsCount: newBalance });

    // Cria um objeto com os detalhes do pagamento
    const paymentData = {
      moduleKey: 'moduloSMS', // Chave do módulo de SMS
      amount: valorPago, // Valor pago
      method: metodoDePagamento, // Método de pagamento (M-Pesa, e-Mola, etc.)
      paidAt: currentDate.toISOString(), // Data e hora do pagamento
      userName: user.nome || 'Cliente Anônimo', // Nome do usuário
    };

    // Adiciona os detalhes do pagamento em "subscriptions/${user.id}/${year}/${month}"
    const newPaymentRef = push(subscriptionsRef); // Gera uma chave única para o pagamento
    await set(newPaymentRef, paymentData); // Salva os dados do pagamento
  } catch (error) {
    console.error('Erro ao atualizar o saldo de SMS ou salvar os detalhes do pagamento:', error);
    throw error; // Lança o erro para ser tratado no handlePayment
  }
};

  // Função para processar o pagamento
  const handlePayment = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setError('Número de celular inválido. Formato correto: 841234567.');
      return;
    }

    if (pendingTransaction) {
      setError('Pagamento em andamento. Aguarde a confirmação.');
      return;
    }

    //const planPrice = calculatePrice(smsCount);
    const planPrice = 1
    setPaymentLoading(true);
    setError(null);
    setPendingTransaction(true);

    const paymentData = {
      carteira: '1729146943643x948653281532969000',
      numero: phoneNumber,
      'quem comprou': user?.nome || 'Cliente Anônimo',
      valor: planPrice.toString(),
    };

    const endpoint =
      paymentMethod === 'mpesa'
        ? 'https://mozpayment.co.mz/api/1.1/wf/pagamentorotativompesa'
        : 'https://mozpayment.co.mz/api/1.1/wf/pagamentorotativoemola';

    try {
      const response = await axios.post(endpoint, paymentData);

      const { data } = response;
      const { status, response: apiResponse, message, transactionId } = data;
      const statusCode = response.status; // Status HTTP (200, 201, etc.)

      // Cenário 1: Sucesso
      if (statusCode === 200 && status === 'success' && apiResponse.success === true) {
        const newBalance = smsBalance + smsCount; // Calcula o novo saldo
        await updateSmsBalanceInFirebase(newBalance, planPrice, paymentMethod); // Atualiza o saldo no Firebase
        setSmsBalance(newBalance); // Atualiza o saldo no estado local
        alert(`Pagamento de ${planPrice} Mt confirmado com sucesso!`);
        handleClosePaymentModal(); // Fecha o modal
      }
      // Cenário 2: Erro na Transação (status HTTP 200, mas sucesso false)
      else if (statusCode === 200 && status === 'success' && apiResponse.success === false) {
        setError('Erro na transação. Tente novamente.');
      }
      // Cenário 3: Saldo Insuficiente (status HTTP 422)
      else if (statusCode === 422) {
        setError('Saldo insuficiente. Verifique seu saldo e tente novamente.');
      }
      // Cenário 4: PIN Incorreto (status HTTP 400)
      else if (statusCode === 400) {
        setError('PIN incorreto. Tente novamente.');
      }
      // Cenário 5: Outros Erros
      else {
        setError(message || 'Erro desconhecido durante o pagamento.');
      }
    } catch (error) {
      console.error(error); // Log do erro para depuração
      setError('Falha na comunicação com o servidor. Tente novamente.');
    } finally {
      setPaymentLoading(false);
      setPendingTransaction(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 'lg', margin: 'auto', padding: 4, backgroundColor: '#f5f5f5', borderRadius: 2, boxShadow: 3, marginTop: 5 }}>
      <BackButton sx={{ mb: 2 }} />

      <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', color: '#333', mb: 4 }}>
        Módulo de SMS
      </Typography>

      <Typography variant="body1" align="center" sx={{ color: '#666', marginBottom: 4, lineHeight: 1.6 }}>
        O módulo de SMS é uma solução prática e eficiente para empresas que desejam estar sempre informadas sobre os pedidos de cotação e outras interações na plataforma.
      </Typography>

      {/* Card de Saldo de SMS */}
      <Paper sx={{ backgroundColor: '#fff', padding: 3, borderRadius: 2, marginBottom: 4, boxShadow: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
            Saldo de SMS
          </Typography>
          <IconButton onClick={fetchSmsBalance} disabled={loading} sx={{ color: '#1976d2' }}>
            <RefreshIcon />
          </IconButton>
        </Box>
        {loading ? (
          <CircularProgress size={24} sx={{ color: '#1976d2' }} />
        ) : (
          <Typography variant="body1" sx={{ color: '#666' }}>
            Saldo atual: <strong>{smsBalance} SMS</strong>
          </Typography>
        )}
        <Button
          variant="contained"
          startIcon={<PaymentIcon />}
          onClick={handleOpenPaymentModal}
          sx={{ mt: 2, backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
        >
          Comprar mais SMS
        </Button>
      </Paper>

       {/* Seleção de Subsectores */}
       <Paper sx={{ backgroundColor: '#fff', padding: 3, borderRadius: 2, marginBottom: 4, boxShadow: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333', mb: 2 }}>
          Subsectores para Receber SMS
        </Typography>
        <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Subsectores para Receber SMS</InputLabel>
            <Select
              multiple
              value={selectedSubsectores}
              onChange={(e) => setSelectedSubsectores(e.target.value)}
              label="Subsectores para Receber SMS"
              renderValue={(selected) => selected.join(', ')}
            >
              {subsectores.map((subsector) => (
                <MenuItem key={subsector} value={subsector}>
                  <Checkbox checked={selectedSubsectores.includes(subsector)} />
                  <ListItemText primary={subsector} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        <Button
          variant="contained"
          onClick={saveSubsectoresPreference}
          sx={{ mt: 2, backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
        >
          Salvar Preferências
        </Button>
      </Paper>


      {/* Modal de Pagamento */}
      <Dialog open={paymentModalOpen} onClose={handleClosePaymentModal}>
        <DialogTitle>Confirmar Pagamento de SMS</DialogTitle>
        <DialogContent>
          {error && (
            <Box sx={{ backgroundColor: '#ffebee', color: '#c62828', p: 2, borderRadius: 1, mb: 2 }}>
              {error}
            </Box>
          )}
          <TextField
            label="Número de Celular"
            placeholder="Ex: 841234567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Método de Pagamento</InputLabel>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              label="Método de Pagamento"
            >
              <MenuItem value="mpesa">M-Pesa</MenuItem>
              <MenuItem value="emola">e-Mola</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Quantidade de SMS"
            type="number"
            value={smsCount}
            onChange={(e) => setSmsCount(Math.max(25, parseInt(e.target.value) || 25))}
            fullWidth
            sx={{ mt: 2 }}
            inputProps={{ step: 25, min: 25 }}
          />
          <Typography variant="body2" sx={{ color: '#666', mt: 1 }}>
            Pacotes de 25 SMS (150 Mt por pacote)
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 2 }}>
            Preço Total: {calculatePrice(smsCount)} Mt
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentModal} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handlePayment} disabled={paymentLoading || pendingTransaction} color="primary">
            {paymentLoading ? <CircularProgress size={24} /> : 'Pagar Agora'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmsDesk;
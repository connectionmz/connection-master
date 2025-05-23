import React, { useEffect, useState } from 'react';
import { ref, onValue, update, push, set } from 'firebase/database';
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
   Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
} from '@mui/material';
import BackButton from '../BackButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import PaymentIcon from '@mui/icons-material/Payment';
import axios from 'axios';
import { formatPrice } from '../../utils/utils';
import { Expand } from '@mui/icons-material';

const SmsDesk = ({ user }) => {
  const [smsBalance, setSmsBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [pendingTransaction, setPendingTransaction] = useState(false);
  const [subsectores, setSubsectores] = useState([]);
  const [selectedSubsectores, setSelectedSubsectores] = useState([]);

  // Preço da assinatura mensal
  const MONTHLY_SUBSCRIPTION_PRICE = 270;

  // Função para buscar o status da assinatura
  const fetchSmsBalance = () => {
    setLoading(true);
    const userRef = ref(db, `company/${user.id}/activeModules/moduloSMS`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      setSmsBalance(data?.smsCount || 0);
      setSelectedSubsectores(data?.subsectores || []);
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
    setError(null);
  };

  // Função para validar o número de celular
  const validatePhoneNumber = (number) => {
    return /^8[1-9]\d{7}$/.test(number);
  };

  // Função para atualizar a assinatura no Firebase
  const updateSmsBalanceInFirebase = async (newBalance, valorPago, metodoDePagamento) => {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    const userRef = ref(db, `company/${user.id}/activeModules/moduloSMS`);
    const subscriptionsRef = ref(db, `subscriptions/${user.id}/${year}/${month}`);

    try {
      await update(userRef, { smsCount: newBalance });

      const paymentData = {
        moduleKey: 'moduloSMS',
        amount: valorPago,
        method: metodoDePagamento,
        paidAt: currentDate.toISOString(),
        userName: user.nome || 'Cliente Anônimo',
      };

      const newPaymentRef = push(subscriptionsRef);
      await set(newPaymentRef, paymentData);
    } catch (error) {
      console.error('Erro ao atualizar a assinatura:', error);
      throw error;
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

    setPaymentLoading(true);
    setError(null);
    setPendingTransaction(true);

    const paymentData = {
      carteira: '1729146943643x948653281532969000',
      numero: phoneNumber,
      'quem comprou': user?.nome || 'Cliente Anônimo',
      valor: MONTHLY_SUBSCRIPTION_PRICE.toString(),
    };

    const endpoint = paymentMethod === 'mpesa'
      ? 'https://mozpayment.co.mz/api/1.1/wf/pagamentorotativompesa'
      : 'https://mozpayment.co.mz/api/1.1/wf/pagamentorotativoemola';

    try {
      const response = await axios.post(endpoint, paymentData);
      const { data } = response;
      const { status, response: apiResponse } = data;

      if (response.status === 200 && status === 'success' && apiResponse.success === true) {
        const newBalance = smsBalance + 1; // Atualiza como assinatura ativa
        await updateSmsBalanceInFirebase(newBalance, MONTHLY_SUBSCRIPTION_PRICE, paymentMethod);
        setSmsBalance(newBalance);
        alert(`Assinatura mensal de ${MONTHLY_SUBSCRIPTION_PRICE} Mt confirmada com sucesso!`);
        handleClosePaymentModal();
      } else {
        setError('Erro na transação. Tente novamente.');
      }
    } catch (error) {
      console.error(error);
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
        SMS + Email
      </Typography>

      {/* Accordion com informações explicativas */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<Expand />}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Como funciona o plano?</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            <strong>Receba notificações instantâneas</strong> dos pedidos de cotação diretamente no seu celular e email.
          </Typography>
          <Typography paragraph>
            <strong>Benefícios do plano:</strong>
          </Typography>
          <ul>
            <li><Typography>✔️ Notificações por SMS e Email</Typography></li>
            <li><Typography>✔️ Cobertura para todos os pedidos do seu setor</Typography></li>
            <li><Typography>✔️ Sem custos adicionais</Typography></li>
            <li><Typography>✔️ Renovação mensal automática</Typography></li>
          </ul>
          <Typography paragraph>
            Valor mensal: <strong>{formatPrice(270)} MT</strong>
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Accordion sx={{ mb: 4 }}>
        <AccordionSummary expandIcon={<Expand />}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Perguntas Frequentes</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography paragraph>
            <strong>Como ativo o plano?</strong><br />
            Basta clicar em "Ativar Assinatura" e seguir os passos para pagamento.
          </Typography>
          <Typography paragraph>
            <strong>Quais métodos de pagamento aceitamos?</strong><br />
            M-Pesa e e-Mola. O pagamento é rápido e seguro.
          </Typography>
          <Typography paragraph>
            <strong>Posso cancelar a qualquer momento?</strong><br />
            Sim, você pode cancelar a renovação automática quando quiser.
          </Typography>
          <Typography paragraph>
            <strong>Quando recebo as notificações?</strong><br />
            Imediatamente quando um cliente faz um pedido no seu setor.
          </Typography>
        </AccordionDetails>
      </Accordion>

      {/* Card de Status da Assinatura */}
      <Paper sx={{ backgroundColor: '#fff', padding: 3, borderRadius: 2, marginBottom: 4, boxShadow: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333' }}>
            Status da Assinatura
          </Typography>
          <IconButton onClick={fetchSmsBalance} disabled={loading} sx={{ color: '#1976d2' }}>
            <RefreshIcon />
          </IconButton>
        </Box>
        {loading ? (
          <CircularProgress size={24} sx={{ color: '#1976d2' }} />
        ) : (
          <>
            <Typography variant="body1" sx={{ color: '#666', mb: 1 }}>
              Status: <strong style={{ color: smsBalance > 0 ? '#4caf50' : '#f44336' }}>
                {smsBalance > 0 ? 'Ativa' : 'Inativa'}
              </strong>
            </Typography>
            
            <Button
              variant="contained"
              startIcon={<PaymentIcon />}
              onClick={handleOpenPaymentModal}
              sx={{ 
                mt: 2, 
                backgroundColor: smsBalance > 0 ? '#4caf50' : '#1976d2',
                '&:hover': { 
                  backgroundColor: smsBalance > 0 ? '#388e3c' : '#1565c0' 
                }
              }}
            >
              {smsBalance > 0 ? 'Renovar Assinatura' : 'Ativar Assinatura'}
            </Button>
          </>
        )}
      </Paper>

      {/* Seleção de Subsectores */}
      <Paper sx={{ backgroundColor: '#fff', padding: 3, borderRadius: 2, marginBottom: 4, boxShadow: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333', mb: 2 }}>
          Configurações de Notificação
        </Typography>
        
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<Expand />}>
            <Typography>Quais subsectores desejo receber notificações?</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography paragraph sx={{ color: '#666' }}>
              Selecione abaixo os subsectores específicos para os quais deseja receber alertas. 
              Deixe todos selecionados para receber notificações completas.
            </Typography>
            
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Subsectores para notificação</InputLabel>
              <Select
                multiple
                value={selectedSubsectores}
                onChange={(e) => setSelectedSubsectores(e.target.value)}
                label="Subsectores para notificação"
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
          </AccordionDetails>
        </Accordion>
        
        <Button
          variant="contained"
          onClick={saveSubsectoresPreference}
          sx={{ mt: 2, backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
        >
          Salvar Configurações
        </Button>
      </Paper>

      {/* Modal de Pagamento (mantido igual) */}
      <Dialog open={paymentModalOpen} onClose={handleClosePaymentModal}>
        <DialogTitle>Assinatura Mensal SMS + Email</DialogTitle>
        <DialogContent>
          {error && (
            <Box sx={{ backgroundColor: '#ffebee', color: '#c62828', p: 2, borderRadius: 1, mb: 2 }}>
              {error}
            </Box>
          )}
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            Valor mensal: <strong>{formatPrice(270)} MT</strong>
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 2, color: '#666' }}>
            Você receberá:
          </Typography>
          <ul>
            <li><Typography variant="body2">Notificações instantâneas por SMS</Typography></li>
            <li><Typography variant="body2">Cópias detalhadas por Email</Typography></li>
            <li><Typography variant="body2">Cobertura para todos os pedidos</Typography></li>
          </ul>
          
          <TextField
            label="Seu número M-Pesa/e-Mola"
            placeholder="Ex: 841234567"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            fullWidth
            sx={{ mt: 2 }}
          />
          
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Como deseja pagar?</InputLabel>
            <Select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              label="Como deseja pagar?"
            >
              <MenuItem value="mpesa">M-Pesa</MenuItem>
              <MenuItem value="emola">e-Mola</MenuItem>
            </Select>
          </FormControl>
          
          <Typography variant="body2" sx={{ color: '#666', mt: 2, fontSize: '0.8rem' }}>
            A assinatura será renovada automaticamente todo mês. Você pode cancelar a qualquer momento.
          </Typography>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClosePaymentModal} color="secondary">
            Cancelar
          </Button>
          <Button 
            onClick={handlePayment} 
            disabled={paymentLoading || pendingTransaction} 
            color="primary"
          >
            {paymentLoading ? <CircularProgress size={24} /> : 'Confirmar Pagamento'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SmsDesk;
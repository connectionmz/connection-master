import React, { useEffect, useState } from 'react';
import { ref, onValue, update, push, set, get } from 'firebase/database';
import { db } from '../../fb';
import {
  Box,
  Typography,
  Paper,
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
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tooltip,
} from '@mui/material';
import BackButton from '../BackButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import PaymentIcon from '@mui/icons-material/Payment';
import HistoryIcon from '@mui/icons-material/History';
import InfoIcon from '@mui/icons-material/Info';
import axios from 'axios';
import { formatPrice } from '../../utils/utils';

const SmsDesk = ({ user }) => {
  const [smsBalance, setSmsBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [pendingTransaction, setPendingTransaction] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const MONTHLY_SUBSCRIPTION_PRICE = 270;

  const fetchSmsBalance = () => {
    setLoading(true);
    const userRef = ref(db, `company/${user.id}/activeModules/moduloSMS`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      setSmsBalance(data?.smsCount || 0);
      setLoading(false);
    });
  };

  const fetchHistory = async () => {
    if (!user?.id) return;
    
    setHistoryLoading(true);
    setError(null);
    
    try {
      const smsRef = ref(db, 'smsEnvio');
      const snapshot = await get(smsRef);
      const historyData = [];

      if (snapshot.exists()) {
        snapshot.forEach((contactGroup) => {
          const contactos = contactGroup.val().contactos || [];
          const metadata = {
            empresaOrigemNome: contactGroup.val().empresaOrigemNome,
            mensagem: contactGroup.val().mensagem,
            timestamp: contactGroup.val().timestamp,
            tipo: contactGroup.val().tipo
          };

          contactos.forEach((contacto, index) => {
            if (contacto.empresaId === user.id && contacto.status === 'enviado') {
              historyData.push({
                id: `${contactGroup.key}-${index}`,
                contactId: contactGroup.key,
                type: 'SMS',
                date: contacto.timestamp || metadata.timestamp || new Date().toISOString(),
                recipient: contacto.empresaNome || 'Cliente não identificado',
                phone: contacto.numero || 'Número não disponível',
                message: (contacto.mensagem || metadata.mensagem || '').replace(/<[^>]*>?/gm, '').substring(0, 100),
                fullMessage: contacto.mensagem || metadata.mensagem || '',
                status: 'Enviado',
                attempts: contacto.attempts || 0,
                sector: metadata.tipo || 'Geral',
                empresaOrigemNome: metadata.empresaOrigemNome || 'Sistema'
              });
            }
          });
        });
      }

      setHistory(historyData.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
      setError('Falha ao carregar histórico. Tente novamente.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchSmsBalance();
    if (activeTab === 1) {
      fetchHistory();
    }
  }, [user.id, activeTab]);

  const handleOpenPaymentModal = () => {
    setPaymentModalOpen(true);
  };

  const handleClosePaymentModal = () => {
    setPaymentModalOpen(false);
    setError(null);
  };

  const validatePhoneNumber = (number) => {
    return /^8[1-9]\d{7}$/.test(number);
  };

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
        const newBalance = smsBalance + 1;
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const filteredHistory = history.filter(item => {
    const matchesType = filterType === 'all' || item.sector === filterType;
    const matchesSearch = item.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.empresaOrigemNome.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <Box sx={{ maxWidth: 'lg', margin: 'auto', padding: 4, backgroundColor: '#f5f5f5', borderRadius: 2, boxShadow: 3, marginTop: 5 }}>
      <BackButton sx={{ mb: 2 }} />

      <Tabs value={activeTab} onChange={handleTabChange} centered sx={{ mb: 3 }}>
        <Tab label="Assinatura" icon={<PaymentIcon />} iconPosition="start" />
        <Tab label="Histórico" icon={<HistoryIcon />} iconPosition="start" />
        <Tab label="Informações" icon={<InfoIcon />} iconPosition="start" />
      </Tabs>

      {activeTab === 0 && (
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
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 150 }} size="small">
                <InputLabel>Filtrar por tipo</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Filtrar por tipo"
                >
                  <MenuItem value="all">Todos</MenuItem>
                  <MenuItem value="cotacao">Cotações</MenuItem>
                  <MenuItem value="concurso">Concursos</MenuItem>
                  <MenuItem value="geral">Geral</MenuItem>
                </Select>
              </FormControl>
              
              <TextField
                label="Pesquisar"
                variant="outlined"
                size="small"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ minWidth: 200 }}
              />
            </Box>
            
            <Button 
              onClick={fetchHistory}
              startIcon={<RefreshIcon />}
              variant="outlined"
              color="primary"
              disabled={historyLoading}
            >
              Atualizar
            </Button>
          </Box>

          {historyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress color="secondary" />
            </Box>
          ) : filteredHistory.length === 0 ? (
            <Box sx={{ 
              textAlign: 'center', 
              py: 4,
              backgroundColor: '#fafafa',
              borderRadius: 2
            }}>
              <Typography variant="h6" color="text.secondary">
                Nenhuma comunicação encontrada
              </Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Data/Hora</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Remetente</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Mensagem</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHistory.map((item) => (
                    <TableRow key={item.id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(item.date).toLocaleDateString('pt-MZ', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight="medium">
                          {item.empresaOrigemNome}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={item.fullMessage}>
                          <Typography variant="body2" sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            cursor: 'pointer'
                          }}>
                            {item.message}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={item.sector === 'cotacao' ? 'Cotação' : item.sector === 'concurso' ? 'Concurso' : 'Geral'} 
                          size="small"
                          color={item.sector === 'cotacao' ? 'primary' : item.sector === 'concurso' ? 'secondary' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label="Enviado" 
                          size="small"
                          color="success"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!historyLoading && filteredHistory.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mt: 2,
              p: 1,
              backgroundColor: '#f5f5f5',
              borderRadius: 1
            }}>
              <Typography variant="caption">
                Última atualização: {new Date().toLocaleTimeString()}
              </Typography>
              <Typography variant="caption" fontWeight="medium">
                Mostrando {filteredHistory.length} de {history.length} registros
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper sx={{ backgroundColor: '#fff', padding: 3, borderRadius: 2, marginBottom: 4, boxShadow: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333', mb: 2 }}>
            Como funciona o plano?
          </Typography>
          
          <Typography paragraph>
            <strong>Receba notificações instantâneas</strong> dos pedidos de cotação diretamente no seu celular e email.
          </Typography>
          
          <Typography paragraph>
            <strong>Benefícios do plano:</strong>
          </Typography>
          
          <ul>
            <li><Typography>Notificações por SMS e Email</Typography></li>
            <li><Typography>Cobertura para todos os pedidos do seu setor</Typography></li>
            <li><Typography>Sem custos adicionais</Typography></li>
            <li><Typography>Renovação mensal automática</Typography></li>
          </ul>
          
          <Typography paragraph>
            Valor mensal: <strong>{formatPrice(MONTHLY_SUBSCRIPTION_PRICE)} MT</strong>
          </Typography>
          
          <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 3, mb: 1 }}>
            Perguntas Frequentes
          </Typography>
          
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
        </Paper>
      )}

      <Dialog open={paymentModalOpen} onClose={handleClosePaymentModal}>
        <DialogTitle>Assinatura Mensal SMS + Email</DialogTitle>
        <DialogContent>
          {error && (
            <Box sx={{ backgroundColor: '#ffebee', color: '#c62828', p: 2, borderRadius: 1, mb: 2 }}>
              {error}
            </Box>
          )}
          
          <Typography variant="body1" sx={{ mb: 2 }}>
            Valor mensal: <strong>{formatPrice(MONTHLY_SUBSCRIPTION_PRICE)} MT</strong>
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
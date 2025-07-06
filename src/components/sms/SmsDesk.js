import React, { useEffect, useState } from 'react';
import { ref, onValue, get } from 'firebase/database';
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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import BackButton from '../BackButton';
import RefreshIcon from '@mui/icons-material/Refresh';
import PaymentIcon from '@mui/icons-material/Payment';
import HistoryIcon from '@mui/icons-material/History';
import InfoIcon from '@mui/icons-material/Info';
import { formatPrice } from '../../utils/utils';

const SmsDesk = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [smsBalance, setSmsBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const filteredHistory = history.filter(item => {
    const matchesType = filterType === 'all' || item.sector === filterType;
    const matchesSearch = item.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         item.empresaOrigemNome.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Responsive table columns
  const tableColumns = [
    { id: 'date', label: 'Data/Hora', visible: true },
    { id: 'sender', label: 'Remetente', visible: !isMobile },
    { id: 'message', label: 'Mensagem', visible: true },
    { id: 'type', label: 'Tipo', visible: !isMobile },
    { id: 'status', label: 'Status', visible: !isMobile },
  ];

  return (
    <Box sx={{ 
      maxWidth: 'lg', 
      margin: 'auto', 
      padding: isMobile ? 2 : 4, 
      backgroundColor: '#f5f5f5', 
      borderRadius: 2, 
      boxShadow: 3, 
      marginTop: isMobile ? 3 : 5 
    }}>
      <BackButton sx={{ mb: 2 }} />

      <Tabs 
        value={activeTab} 
        onChange={handleTabChange} 
        centered 
        sx={{ mb: 3 }}
        variant={isMobile ? "fullWidth" : "standard"}
      >
        <Tab label={isMobile ? "" : "Histórico"} icon={<HistoryIcon />} iconPosition="start" />
        <Tab label={isMobile ? "" : "Informações"} icon={<InfoIcon />} iconPosition="start" />
      </Tabs>

      {activeTab === 0 && (
        <Paper sx={{ 
          p: isMobile ? 1 : 3, 
          mb: 4, 
          borderRadius: 3, 
          boxShadow: 3,
          overflowX: 'auto'
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: 'space-between', 
            alignItems: isMobile ? 'flex-start' : 'center', 
            mb: 3,
            gap: isMobile ? 2 : 0
          }}>
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              alignItems: 'center',
              flexDirection: isMobile ? 'column' : 'row',
              width: isMobile ? '100%' : 'auto'
            }}>
              <FormControl sx={{ minWidth: isMobile ? '100%' : 150 }} size="small">
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
                sx={{ minWidth: isMobile ? '100%' : 200 }}
                fullWidth={isMobile}
              />
            </Box>
            
            <Button 
              onClick={fetchHistory}
              startIcon={<RefreshIcon />}
              variant="outlined"
              color="primary"
              disabled={historyLoading}
              sx={{ mt: isMobile ? 1 : 0 }}
              fullWidth={isMobile}
            >
              {isMobile ? 'Atualizar' : 'Atualizar Histórico'}
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
            <TableContainer component={Paper} sx={{ borderRadius: 2, maxWidth: '100%', overflowX: 'auto' }}>
              <Table size={isMobile ? 'small' : 'medium'}>
                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableRow>
                    {tableColumns.map((column) => (
                      column.visible && (
                        <TableCell key={column.id} sx={{ fontWeight: 'bold' }}>
                          {column.label}
                        </TableCell>
                      )
                    ))}
                    {isMobile && (
                      <TableCell sx={{ fontWeight: 'bold' }}>Detalhes</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredHistory.map((item) => (
                    <TableRow key={item.id} hover>
                      {tableColumns[0].visible && (
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(item.date).toLocaleDateString('pt-MZ', {
                              day: '2-digit',
                              month: '2-digit',
                              year: isMobile ? '2-digit' : 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        </TableCell>
                      )}
                      {tableColumns[1].visible && (
                        <TableCell>
                          <Typography fontWeight="medium">
                            {item.empresaOrigemNome}
                          </Typography>
                        </TableCell>
                      )}
                      {tableColumns[2].visible && (
                        <TableCell>
                          <Typography variant="body2" sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            cursor: 'pointer'
                          }}>
                            {isMobile ? `${item.message.substring(0, 30)}...` : item.message}
                          </Typography>
                        </TableCell>
                      )}
                      {tableColumns[3].visible && (
                        <TableCell>
                          <Chip 
                            label={item.sector === 'cotacao' ? 'Cotação' : item.sector === 'concurso' ? 'Concurso' : 'Geral'} 
                            size="small"
                            color={item.sector === 'cotacao' ? 'primary' : item.sector === 'concurso' ? 'secondary' : 'default'}
                          />
                        </TableCell>
                      )}
                      {tableColumns[4].visible && (
                        <TableCell>
                          <Chip 
                            label="Enviado" 
                            size="small"
                            color="success"
                          />
                        </TableCell>
                      )}
                      {isMobile && (
                        <TableCell>
                          <Tooltip title="Mais detalhes">
                            <IconButton size="small">
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {!historyLoading && filteredHistory.length > 0 && (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mt: 2,
              p: 1,
              backgroundColor: '#f5f5f5',
              borderRadius: 1,
              gap: isMobile ? 1 : 0
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

      {activeTab === 1 && (
        <Paper sx={{ 
          backgroundColor: '#fff', 
          padding: isMobile ? 2 : 3, 
          borderRadius: 2, 
          marginBottom: 4, 
          boxShadow: 2 
        }}>
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold', color: '#333', mb: 2 }}>
            Como funciona o plano?
          </Typography>
          
          <Typography paragraph sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
            Receba alertas instantâneos sobre novos pedidos de cotação e concursos públicos do seu setor, diretamente no seu celular e e-mail — seja na sua província ou em todo o país. Não perca nenhuma oportunidade!
          </Typography>
          
          <Typography paragraph sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.875rem' : '1rem' }}>
            Benefícios do plano:
          </Typography>
          
          <Box component="ul" sx={{ 
            pl: isMobile ? 2 : 3,
            '& li': { 
              fontSize: isMobile ? '0.875rem' : '1rem',
              mb: 1
            }
          }}>
            <li><Typography>Notificações por SMS e Email</Typography></li>
            <li><Typography>Cobertura para todos os pedidos do seu setor</Typography></li>
            <li><Typography>Sem custos adicionais</Typography></li>
            <li><Typography>Renovação mensal automática</Typography></li>
          </Box>
          
          <Typography paragraph sx={{ fontWeight: 'bold' }}>
            Valor mensal: {formatPrice(MONTHLY_SUBSCRIPTION_PRICE)} MT
          </Typography>
          
          <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 'bold', mt: 3, mb: 1 }}>
            Perguntas Frequentes
          </Typography>
          
          <Box sx={{ 
            '& > *': { 
              mb: 2,
              fontSize: isMobile ? '0.875rem' : '1rem'
            } 
          }}>
            <Typography>
              <strong>Como ativo o plano?</strong><br />
              Basta clicar em "Ativar Assinatura" e seguir os passos para pagamento.
            </Typography>
            <Typography>
              <strong>Quais métodos de pagamento aceitamos?</strong><br />
              M-Pesa e e-Mola. O pagamento é rápido e seguro.
            </Typography>
            <Typography>
              <strong>Posso cancelar a qualquer momento?</strong><br />
              Sim, você pode cancelar a renovação automática quando quiser.
            </Typography>
            <Typography>
              <strong>Quando recebo as notificações?</strong><br />
              Imediatamente quando um cliente faz um pedido no seu setor.
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default SmsDesk;
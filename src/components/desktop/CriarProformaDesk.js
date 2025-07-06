import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, set, get, serverTimestamp } from 'firebase/database';
import {
  Snackbar,
  TextField,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  InputAdornment,
  Divider,
  Collapse,
  CircularProgress
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { db } from '../../fb';
import BackButton from '../BackButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {SendMailProforma} from '../sms/SendMail';
import { formatPrice } from '../../utils/utils';
import { saveContentToInbox } from '../SaveToInbox';
import { NumericFormat } from 'react-number-format';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const CriarProformaDesk = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [cliente, setCliente] = useState(null);
  const [dataEmissao, setDataEmissao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [itens, setItens] = useState([]);
  const [errors, setErrors] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [expandedClient, setExpandedClient] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchProdutos();
  }, []);

  const fetchClients = async () => {
    try {
      const clientsRef = ref(db, `clients/${user.id}`);
      const clientsSnapshot = await get(clientsRef);
      const clientesCadastrados = clientsSnapshot.exists() ? Object.values(clientsSnapshot.val()) : [];

      const connectionsRef = ref(db, `connections/${user.id}`);
      const connectionsSnapshot = await get(connectionsRef);
      const conexoes = connectionsSnapshot.exists() ? Object.keys(connectionsSnapshot.val()) : [];

      const empresasConectadas = [];
      for (const companyId of conexoes) {
        const companyRef = ref(db, `company/${companyId}`);
        const companySnapshot = await get(companyRef);
        if (companySnapshot.exists()) {
          const companyData = companySnapshot.val();
          empresasConectadas.push({
            id: companyId,
            nome: companyData.nome || 'Indefinido',
            nuit: companyData.nuit || '',
            contacto: companyData.contacto || '',
            morada: companyData.endereco || '',
            email: companyData.email || ''
          });
        }
      }

      setClientes([...clientesCadastrados, ...empresasConectadas]);
    } catch (err) {
      console.error('Erro ao carregar clientes: ' + err);
    }
  };

  const fetchProdutos = async () => {
    const produtosRef = ref(db, `stores/${user.id}/products`);
    const snapshot = await get(produtosRef);
    const data = snapshot.val();
    if (data) {
      setProdutos(Object.values(data));
    }
  };

  const handleAddItemFromStore = () => {
    if (!selectedProduto) {
      setSnackbarMessage('Selecione um produto para adicionar.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    const item = {
      descricao: selectedProduto.name,
      quantidade: 1,
      preco: Number(selectedProduto.price),
    };
    setItens([...itens, item]);
    setSelectedProduto(null);
  };

  const handleAddItem = () => {
    setItens([...itens, { descricao: '', quantidade: 1, preco: 0 }]);
  };

  const handleRemoveItem = (index) => {
    const newItens = itens.filter((_, i) => i !== index);
    setItens(newItens);
  };

  const handleItemChange = (index, field, value) => {
    const newItens = [...itens];
    newItens[index][field] = field === 'preco' || field === 'quantidade' ? Number(value) : value;
    setItens(newItens);
  };

  const total = itens.reduce((sum, item) => sum + (item.quantidade * item.preco), 0);

  const validateForm = () => {
    const newErrors = {};

    if (!dataEmissao) {
      newErrors.dataEmissao = 'Data de emissão é obrigatória';
    }
    if (!dataVencimento) {
      newErrors.dataVencimento = 'Data de vencimento é obrigatória';
    }
    itens.forEach((item, index) => {
      if (!item.descricao) {
        newErrors[`item-descricao-${index}`] = 'Descrição é obrigatória';
      }
      if (item.quantidade <= 0 || isNaN(item.quantidade)) {
        newErrors[`item-quantidade-${index}`] = 'Quantidade deve ser maior que 0';
      }
      if (item.preco <= 0 || isNaN(item.preco)) {
        newErrors[`item-preco-${index}`] = 'Preço deve ser maior que 0';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSalvar = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      setSnackbarMessage('Erro: Campos obrigatórios não preenchidos.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }
    setLoading(true);
    try {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const year = String(today.getFullYear()).slice(-2);

      const proformaRef = ref(db, `invoices/${user.id}`);
      const snapshot = await get(proformaRef);
      const proformas = snapshot.val();
      const proformaCount = proformas ? Object.keys(proformas).length : 0;

      const sequentialNumber = String(proformaCount + 1).padStart(2, '0');
      const numeroProforma = `PF${day}${month}${year}${sequentialNumber}`;

      const clienteLimpo = cliente
        ? {
            nome: cliente.nome || 'N/A',
            nuit: cliente.nuit || 'N/A',
            contacto: cliente.contacto || 'N/A',
            morada: cliente.morada || 'N/A',
            email: cliente.email || 'N/A',
          }
        : null;

      const emissor = {
        nome: user.nome || 'N/A',
        nuit: user.nuit || 'N/A',
        contacto: user.contacto || 'N/A',
        morada: user.morada || 'N/A',
        email: user.email || 'N/A',
      };

      const itensNumericos = itens.map(item => ({
        ...item,
        quantidade: Number(item.quantidade),
        preco: Number(item.preco)
      }));

      const totalNumerico = total;

      const newProformaRef = ref(db, `invoices/${user.id}/${numeroProforma}`);
      
      await set(newProformaRef, {
        numeroProforma,
        cliente: clienteLimpo,
        emissor: emissor,
        dataEmissao,
        dataVencimento,
        itens: itensNumericos,
        total: totalNumerico,
        status: 'POR PAGAR',
        dataCriacao: serverTimestamp()
      });

      const proformaLink = `https://connectionmozambique.com/verproforma/${numeroProforma}/sender/${user.id}`

      const notification = {
        type: 'invoice_generate',
        message: `${user.nome}, criou uma Proforma para você`,
        fromUserId: user.id,
        fromUserName: user.nome,
        timestamp: new Date().toISOString(),
        status: 'unread',
        link: `/verproforma/${numeroProforma}/sender/${user.id}`,
        proformaId: numeroProforma,
      };

      if (cliente?.id) {
        saveContentToInbox(cliente.id, notification);
      }

      if (clienteLimpo?.email) {
        const title = `Proforma ${numeroProforma}`;
        const finalMessage = `
          Olá ${clienteLimpo.nome},
          
          Uma nova proforma foi criada para você. Aqui estão os detalhes:
          
          - Número da Proforma: ${numeroProforma}
          - Data de Emissão: ${dataEmissao}
          - Data de Vencimento: ${dataVencimento} dias

          Clique em: https://connectionmozambique.com/verproforma/${numeroProforma}/sender/${user.id} para visualizar a proforma.
          
          Por favor, entre em contato conosco se tiver alguma dúvida.
          
          Atenciosamente,
          Equipe ${user.displayName || 'da '}
          Email: ${user.email || '-'}
          Contacto: ${user.contacto || '-'}
        `;

        const emailMessage = {
          message: finalMessage,
          link: `verproforma/${numeroProforma}/sender/${user.id}`,
        };

        const emailSent = await SendMailProforma(clienteLimpo.email, emailMessage);

        if (!emailSent) {
          setSnackbarMessage('Proforma criada, mas o e-mail não pôde ser enviado.');
          setSnackbarSeverity('warning');
        } else {
          setSnackbarMessage('Proforma criada e cliente notificado com sucesso!');
          setSnackbarSeverity('success');
        }
      }
      
      setCliente(null);
      setDataEmissao('');
      setDataVencimento('');
      setItens([{ descricao: '', quantidade: 1, preco: 0 }]);
      setErrors({});
      setOpenSnackbar(false);
      setSnackbarMessage('');
      setSnackbarSeverity('error');
      setLoading(false);
      setSelectedProduto(null);

    } catch (err) {
      console.error(err);
      setSnackbarMessage('Erro ao salvar a proforma. Tente novamente.');
      setSnackbarSeverity('error');
    } finally {
      setLoading(false);
      setOpenSnackbar(true);
    }
  }

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const toggleClientDetails = () => {
    setExpandedClient(!expandedClient);
  };

  return (
    <Box sx={{ p: isMobile ? 1 : 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom sx={{ fontSize: isMobile ? '1.5rem' : '2rem' }}>
        Criar Nova Proforma
      </Typography>
      <BackButton sx={{ mb: 2 }} />

      <Paper elevation={3} sx={{ p: isMobile ? 1 : 3, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
            Dados da Proforma
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, mb: 2 }}>
            <TextField
              label="Cliente (Opcional)"
              fullWidth
              select
              value={cliente ? cliente.nome : ''}
              onChange={(e) => {
                const selectedCliente = clientes.find((c) => c.nome === e.target.value);
                setCliente(selectedCliente);
                setExpandedClient(false);
              }}
              size={isMobile ? 'small' : 'medium'}
            >
              <MenuItem value="">Selecione um cliente</MenuItem>
              {clientes.map((c, index) => (
                <MenuItem key={index} value={c.nome}>
                  {c.nome}
                </MenuItem>
              ))}
            </TextField>
          </Box>
          
          {cliente && (
            <Box sx={{ 
              mt: 1, 
              p: isMobile ? 1 : 2, 
              border: '1px solid #eee', 
              borderRadius: 1,
              backgroundColor: '#f9f9f9'
            }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  cursor: 'pointer'
                }}
                onClick={toggleClientDetails}
              >
                <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                  Detalhes do Cliente
                </Typography>
                {expandedClient ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </Box>
              
              <Collapse in={expandedClient}>
                <Box sx={{ mt: 1 }}>
                  <Typography><strong>Nome:</strong> {cliente.nome}</Typography>
                  {cliente.nuit && <Typography><strong>NUIT:</strong> {cliente.nuit}</Typography>}
                  {cliente.contacto && <Typography><strong>Contacto:</strong> {cliente.contacto}</Typography>}
                  {cliente.morada && <Typography><strong>Morada:</strong> {cliente.morada}</Typography>}
                  {cliente.email && <Typography><strong>Email:</strong> {cliente.email}</Typography>}
                </Box>
              </Collapse>
            </Box>
          )}
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row', 
            gap: 2, 
            mb: 2,
            mt: 2
          }}>
            <TextField
              label="Data de Emissão"
              type="date"
              fullWidth
              value={dataEmissao}
              onChange={(e) => setDataEmissao(e.target.value)}
              error={!!errors.dataEmissao}
              helperText={errors.dataEmissao}
              InputLabelProps={{ shrink: true }}
              size={isMobile ? 'small' : 'medium'}
            />
            <TextField
              label="Válido Por (Dias)"
              type="number"
              fullWidth
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              error={!!errors.dataVencimento}
              helperText={errors.dataVencimento}
              size={isMobile ? 'small' : 'medium'}
              InputProps={{
                endAdornment: <InputAdornment position="end">dias</InputAdornment>,
              }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
            Adicionar Item da Loja
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row', 
            gap: 2, 
            mb: 2,
            alignItems: isMobile ? 'stretch' : 'center'
          }}>
            <Select
              value={selectedProduto || ''}
              onChange={(e) => setSelectedProduto(e.target.value)}
              fullWidth
              displayEmpty
              size={isMobile ? 'small' : 'medium'}
            >
              <MenuItem value="">Selecione um produto</MenuItem>
              {produtos.map((produto) => (
                <MenuItem key={produto.id} value={produto}>
                  {produto.name} - {formatPrice(produto.price)} MZN
                </MenuItem>
              ))}
            </Select>
            <Button 
              variant="contained" 
              onClick={handleAddItemFromStore}
              sx={{ minWidth: isMobile ? '100%' : 'auto' }}
            >
              Adicionar Produto
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: isMobile ? '1.1rem' : '1.25rem' }}>
            Itens
          </Typography>
          <TableContainer component={Paper} sx={{ maxWidth: '100%', overflowX: 'auto' }}>
            <Table size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ minWidth: isMobile ? 150 : 200 }}>Descrição</TableCell>
                  <TableCell align="center" sx={{ width: isMobile ? 80 : 120 }}>Quantidade</TableCell>
                  <TableCell align="right" sx={{ width: isMobile ? 100 : 150 }}>Preço Unitário</TableCell>
                  <TableCell align="right" sx={{ width: isMobile ? 100 : 150 }}>Subtotal</TableCell>
                  <TableCell align="center" sx={{ width: 60 }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {itens.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={item.descricao}
                        onChange={(e) => handleItemChange(index, 'descricao', e.target.value)}
                        error={!!errors[`item-descricao-${index}`]}
                        helperText={errors[`item-descricao-${index}`]}
                        size="small"
                        multiline
                        maxRows={3}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        fullWidth
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(index, 'quantidade', e.target.value)}
                        error={!!errors[`item-quantidade-${index}`]}
                        helperText={errors[`item-quantidade-${index}`]}
                        inputProps={{ min: 1 }}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <NumericFormat
                        value={item.preco}
                        displayType="input"
                        thousandSeparator="."
                        decimalSeparator=","
                        decimalScale={2}
                        fixedDecimalScale
                        allowNegative={false}
                        onValueChange={(values) => {
                          handleItemChange(index, 'preco', values.floatValue);
                        }}
                        customInput={TextField}
                        fullWidth
                        error={!!errors[`item-preco-${index}`]}
                        helperText={errors[`item-preco-${index}`]}
                        size="small"
                        InputProps={{
                          startAdornment: <InputAdornment position="start">MZN</InputAdornment>,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      {formatPrice(item.quantidade * item.preco)} 
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Remover item">
                        <IconButton 
                          onClick={() => handleRemoveItem(index)}
                          size="small"
                        >
                          <DeleteIcon fontSize={isMobile ? 'small' : 'medium'} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          <Button 
            variant="contained" 
            onClick={handleAddItem} 
            sx={{ mt: 2 }}
            startIcon={<AddIcon />}
            fullWidth={isMobile}
          >
            Adicionar Item Manualmente
          </Button>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" align="right" gutterBottom>
            Total: {formatPrice(total)} MZN
          </Typography>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleSalvar}
            disabled={loading}
            size={isMobile ? 'medium' : 'large'}
            sx={{ py: isMobile ? 1 : 1.5 }}
          >
            {loading ? (
              <>
                <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                Criando...
              </>
            ) : 'Criar Proforma'}
          </Button>
        </Box>
      </Paper>

      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <MuiAlert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
          elevation={6}
          variant="filled"
        >
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};

export default CriarProformaDesk;
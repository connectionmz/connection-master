import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ref, set, get } from 'firebase/database';
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
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { db } from '../../fb';
import BackButton from '../BackButton';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import sendEmail from '../sms/SendMail';

const EditarFaturaDesk = ({ user }) => {

  const { numeroProforma } = useParams();

  const [cliente, setCliente] = useState(null); // Armazenar o objeto completo do cliente
  const [dataEmissao, setDataEmissao] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [itens, setItens] = useState([{ descricao: '', quantidade: 1, preco: 0 }]);
  const [errors, setErrors] = useState({});
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('error');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([]); // Lista unificada de clientes
  const [produtos, setProdutos] = useState([]);
  const [selectedProduto, setSelectedProduto] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    nuit: '',
  });


  useEffect(() => {
    const fetchProforma = async () => {
      try {
        const proformaSnap = await get(ref(db, `invoices/${user.id}/${numeroProforma}`));
        if (proformaSnap.exists()) {
          const proformaData = proformaSnap.val();
          setCliente(proformaData.cliente || null);
          setDataEmissao(proformaData.dataEmissao || '');
          setDataVencimento(proformaData.dataVencimento || '');
          setItens(proformaData.itens || []);
        } else {
          setSnackbarMessage('Proforma não encontrada.');
          setSnackbarSeverity('error');
          setOpenSnackbar(true);
          navigate('/faturacao'); // Redireciona se a proforma não existir
        }
      } catch (err) {
        console.error('Erro ao carregar proforma:', err);
        setSnackbarMessage('Erro ao carregar a proforma.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
      }
    };
  
    if (numeroProforma) {
      fetchProforma();
    }
  }, [user, numeroProforma, navigate]);

  // Busca clientes (conexões e cadastrados manualmente)
  useEffect(() => {
    fetchClients();
    fetchProdutos();
  }, []);

  const fetchClients = async () => {
    try {
      // Busca clientes cadastrados manualmente
      const clientsRef = ref(db, `clients/${user.id}`);
      const clientsSnapshot = await get(clientsRef);
      const clientesCadastrados = clientsSnapshot.exists() ? Object.values(clientsSnapshot.val()) : [];

      // Busca conexões do usuário
      const connectionsRef = ref(db, `connections/${user.id}`);
      const connectionsSnapshot = await get(connectionsRef);
      const conexoes = connectionsSnapshot.exists() ? Object.keys(connectionsSnapshot.val()) : [];

      // Busca detalhes das empresas conectadas
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
            email:companyData.email || ''
          });
        }
      }

      // Combina as duas listas de clientes
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

  // Adiciona um item da loja
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
      preco: selectedProduto.price,
    };
    setItens([...itens, item]);
    setSelectedProduto(null);
  };

  // Adiciona um item manualmente
  const handleAddItem = () => {
    setItens([...itens, { descricao: '', quantidade: 1, preco: 0 }]);
  };

  // Remove um item
  const handleRemoveItem = (index) => {
    const newItens = itens.filter((_, i) => i !== index);
    setItens(newItens);
  };

  // Atualiza um item
  const handleItemChange = (index, field, value) => {
    const newItens = [...itens];
    newItens[index][field] = value;
    setItens(newItens);
  };

  // Calcula o total
  const total = itens.reduce((sum, item) => sum + item.quantidade * item.preco, 0);

  // Valida o formulário
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
      if (item.quantidade <= 0) {
        newErrors[`item-quantidade-${index}`] = 'Quantidade deve ser maior que 0';
      }
      if (item.preco <= 0) {
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
  
  
      // Limpar o objeto cliente para remover propriedades undefined
      const clienteLimpo = cliente
        ? {
            nome: cliente.nome || '',
            nuit: cliente.nuit || '',
            contacto: cliente.contacto || '',
            morada: cliente.morada || '',
            email: cliente.email || '',
          }
        : null;
  
        const proformaRefy = ref(db, `invoices/${user.id}/${numeroProforma}`);
        await set(proformaRefy, {
          numeroProforma,
          cliente,
          dataEmissao,
          dataVencimento,
          itens,
          total,
          status: 'POR PAGAR', // Mantenha o status ou atualize conforme necessário
        });
  

      const proformaLink = `https://app.connectionmozambique.com/proforma/${numeroProforma}`;

      // Notificar o cliente por e-mail, se houver um e-mail válido
      if (clienteLimpo && clienteLimpo.email) {
        const title = `Proforma ${numeroProforma}`;
        const finalMessage = `
          Olá ${clienteLimpo.nome},
          
          Uma nova proforma foi criada para você. Aqui estão os detalhes:
          
          - Número da Proforma: ${numeroProforma}
          - Data de Emissão: ${dataEmissao}
          - Data de Vencimento: ${dataVencimento}
          - Total: ${total} MZN
          
          Itens:
          ${itens.map((item) => `- ${item.descricao}: ${item.quantidade} x ${item.preco} MZN`).join('\n')}

          Clique em: ${proformaLink} para visualizar a proforma ${numeroProforma}
          
          Por favor, entre em contato conosco se tiver alguma dúvida.
          
          Atenciosamente,
          Equipe ${user.displayName || 'da '}
          Email ${user.email || 'da '}
          Contacto ${user.contacto || 'da '}
        `;
  
        const emailSent = await sendEmail(clienteLimpo.email, title, finalMessage);
  
        if (!emailSent) {
          setSnackbarMessage('Proforma criada, mas o e-mail não pôde ser enviado.');
          setSnackbarSeverity('warning');
        } else {
          setSnackbarMessage('Proforma criada e cliente notificado com sucesso!');
          setSnackbarSeverity('success');
        }
      } else {
        setSnackbarMessage('Proforma criada com sucesso!');
        setSnackbarSeverity('success');
      }
  
      navigate('/faturacao');
    } catch (err) {
      console.error(err);
      setSnackbarMessage('Erro ao salvar a proforma. Tente novamente.');
      setSnackbarSeverity('error');
    } finally {
      setLoading(false);
      setOpenSnackbar(true);
    }
  };

  // Fecha o Snackbar
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  // Abre o modal de adicionar cliente
  const handleOpenModal = () => {
    setOpenModal(true);
  };

  // Fecha o modal de adicionar cliente
  const handleCloseModal = () => {
    setOpenModal(false);
  };

  // Salva um novo cliente
  const handleSaveCliente = async () => {
    if (!novoCliente.nome) {
      setSnackbarMessage('O nome do cliente é obrigatório.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
      return;
    }

    try {
      const clienteRef = ref(db, `clients/${user.id}/${Date.now()}`);
      await set(clienteRef, {
        id: clienteRef.key,
        ...novoCliente,
      });

      setSnackbarMessage('Cliente adicionado com sucesso!');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
      fetchClients(); // Atualiza a lista de clientes
      handleCloseModal();
    } catch (error) {
      setSnackbarMessage('Erro ao salvar o cliente.');
      setSnackbarSeverity('error');
      setOpenSnackbar(true);
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        {numeroProforma ? `Editar Proforma ${numeroProforma}` : 'Criar Nova Proforma'}
      </Typography>
      <BackButton sx={{ mb: 2 }} />

      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Dados da Proforma
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Cliente (Opcional)"
              fullWidth
              select
              value={cliente ? cliente.nome : ''}
              onChange={(e) => {
                const selectedCliente = clientes.find((c) => c.nome === e.target.value);
                setCliente(selectedCliente);
              }}
            >
              <MenuItem value="">Selecione um cliente</MenuItem>
              {clientes.map((c, index) => (
                <MenuItem key={index} value={c.nome}>
                  {c.nome}
                </MenuItem>
              ))}
            </TextField>
            <Button variant="contained" onClick={handleOpenModal} startIcon={<AddIcon />}>
              Adicionar Cliente
            </Button>
          </Box>
          {cliente && (
            <Box sx={{ mt: 2, p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
              <Typography variant="subtitle1">Detalhes do Cliente:</Typography>
              <Typography><strong>Nome:</strong> {cliente.nome}</Typography>
              {cliente.nuit && <Typography><strong>NUIT:</strong> {cliente.nuit}</Typography>}
              {cliente.contacto && <Typography><strong>Contacto:</strong> {cliente.contacto}</Typography>}
              {cliente.morada && <Typography><strong>Morada:</strong> {cliente.morada}</Typography>}
              {cliente.email && <Typography><strong>Email:</strong> {cliente.email}</Typography>}
            </Box>
          )}
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              label="Data de Emissão"
              type="date"
              fullWidth
              value={dataEmissao}
              onChange={(e) => setDataEmissao(e.target.value)}
              error={!!errors.dataEmissao}
              helperText={errors.dataEmissao}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Válido Por (Dias)"
              type="number"
              fullWidth
              value={dataVencimento}
              onChange={(e) => setDataVencimento(e.target.value)}
              error={!!errors.dataVencimento}
              helperText={errors.dataVencimento}
            />
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Adicionar Item da Loja
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Select
              value={selectedProduto}
              onChange={(e) => setSelectedProduto(e.target.value)}
              fullWidth
              displayEmpty
            >
              <MenuItem value="">Selecione um produto</MenuItem>
              {produtos.map((produto) => (
                <MenuItem key={produto.id} value={produto}>
                  {produto.name} - {produto.price} MZN
                </MenuItem>
              ))}
            </Select>
            <Button variant="contained" onClick={handleAddItemFromStore}>
              Adicionar Produto
            </Button>
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Itens
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Descrição</TableCell>
                  <TableCell>Quantidade</TableCell>
                  <TableCell>Preço Unitário</TableCell>
                  <TableCell>Ações</TableCell>
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
                        helperText={errors[`item-descricao-${index}`]}/>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        fullWidth
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(index, 'quantidade', parseInt(e.target.value))}
                        error={!!errors[`item-quantidade-${index}`]}
                        helperText={errors[`item-quantidade-${index}`]}/>
                    </TableCell>
                    <TableCell>
                      <TextField
                        type="number"
                        fullWidth
                        value={item.preco}
                        onChange={(e) => handleItemChange(index, 'preco', parseFloat(e.target.value))}
                        error={!!errors[`item-preco-${index}`]}
                        helperText={errors[`item-preco-${index}`]}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Remover item">
                        <IconButton onClick={() => handleRemoveItem(index)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Button variant="contained" onClick={handleAddItem} sx={{ mt: 2 }}>
            Adicionar Item Manualmente
          </Button>
        </Box>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Total: {total} MZN
          </Typography>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSalvar}
              disabled={loading}>
              {loading ? (numeroProforma ? 'Atualizando...' : 'Criando...') : (numeroProforma ? 'Atualizar Proforma' : 'Criar Proforma')}
            </Button>
        </Box>
      </Paper>
      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={handleCloseSnackbar}>
        <MuiAlert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </MuiAlert>
      </Snackbar>
    </Box>
  );
};
export default EditarFaturaDesk;
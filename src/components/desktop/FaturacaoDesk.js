import React, { useEffect, useState, useCallback } from 'react';
import { ref, get, remove, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Button,
  Paper,
  Typography,
  Menu,
  MenuItem,
  IconButton,
  Box,
  Tooltip,
  Select,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import { db } from '../../fb';
import BackButton from '../BackButton';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const FaturacaoDesk = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [proformas, setProformas] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProforma, setSelectedProforma] = useState(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState({ id: '', nome: '', nuit: '', morada: '', contacto: '' });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const navigate = useNavigate();

  // Função para exibir mensagens no Snackbar
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // Fechar Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Busca as proformas e clientes
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [invoicesSnapshot, clientsSnapshot] = await Promise.all([
          get(ref(db, `invoices/${user.id}`)),
          get(ref(db, `clients/${user.id}`)),
        ]);

        setProformas(invoicesSnapshot.exists() ? Object.values(invoicesSnapshot.val()) : []);
        setClients(clientsSnapshot.exists() ? Object.values(clientsSnapshot.val()) : []);
      } catch (err) {
        setError('Erro ao carregar dados.');
        showSnackbar('Erro ao carregar dados.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Busca as conexões do usuário e adiciona as empresas à lista de clientes
  useEffect(() => {
    if (!user) return;

    const fetchConnections = async () => {
      try {
        const connectionsRef = ref(db, `connections/${user.id}`);
        const snapshot = await get(connectionsRef);
        if (snapshot.exists()) {
          const connectionIds = Object.keys(snapshot.val());

          // Busca os detalhes de cada empresa conectada
          const companies = await Promise.all(
            connectionIds.map(async (companyId) => {
              const companyRef = ref(db, `company/${companyId}`);
              const companySnapshot = await get(companyRef);
              return companySnapshot.exists()
                ? {
                    id: companyId,
                    nome: companySnapshot.val().nome || 'Indefinido',
                    nuit: companySnapshot.val().nuit || '',
                    contacto: companySnapshot.val().contacto || '',
                    morada: companySnapshot.val().endereco || '',
                    email: companySnapshot.val().email || '',
                  }
                : null;
            })
          );

          // Adiciona as empresas à lista de clientes
          setClients((prevClients) => {
            const existingClientIds = prevClients.map((client) => client.id);
            const newClients = companies.filter(
              (company) => company && !existingClientIds.includes(company.id)
            );
            return [...prevClients, ...newClients];
          });
        }
      } catch (err) {
        setError('Erro ao carregar conexões.');
        showSnackbar('Erro ao carregar conexões.', 'error');
      }
    };

    fetchConnections();
  }, [user]);

  // Funções para manipulação de proformas
  const handleMenuClick = (event, proforma) => {
    setAnchorEl(event.currentTarget);
    setSelectedProforma(proforma);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedProforma(null);
  };

  const handleProformaClick = useCallback((proformaId) => {
    navigate(`/proforma/${proformaId}`);
  }, [navigate]);

  const handleShare = () => {
    showSnackbar(`Compartilhar a proforma ${selectedProforma.numeroProforma}`, 'info');
    handleCloseMenu();
  };

  const handleEdit = () => {
    navigate(`/edit-proforma/${selectedProforma.numeroProforma}`);
    handleCloseMenu();
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza de que deseja excluir esta proforma?')) {
      try {
        const proformaRef = ref(db, `invoices/${user.id}/${selectedProforma.numeroProforma}`);
        await remove(proformaRef);
        setProformas(proformas.filter((p) => p.numeroProforma !== selectedProforma.numeroProforma));
        showSnackbar('Proforma excluída com sucesso!', 'success');
      } catch (error) {
        showSnackbar('Erro ao excluir a proforma.', 'error');
      }
      handleCloseMenu();
    }
  };

  // Funções para manipulação de clientes
  const handleAddClient = () => {
    setCurrentClient({ id: '', nome: '', nuit: '', morada: '', contacto: '' });
    setIsClientModalOpen(true);
  };

  const handleEditClient = (client) => {
    setCurrentClient(client);
    setIsClientModalOpen(true);
  };

  const handleDeleteClient = async (clientId) => {
    if (window.confirm('Tem certeza de que deseja excluir este cliente?')) {
      try {
        const clientRef = ref(db, `clients/${user.id}/${clientId}`);
        await remove(clientRef);
        setClients(clients.filter((c) => c.id !== clientId));
        showSnackbar('Cliente excluído com sucesso!', 'success');
      } catch (error) {
        showSnackbar('Erro ao excluir o cliente.', 'error');
      }
    }
  };

  const handleSaveClient = async () => {
    if (!currentClient.nome) {
      showSnackbar('O nome do cliente é obrigatório.', 'error');
      return;
    }

    try {
      const clientRef = ref(db, `clients/${user.id}/${currentClient.id || Date.now()}`);
      await set(clientRef, {
        id: clientRef.key,
        nome: currentClient.nome,
        nuit: currentClient.nuit,
        contacto: currentClient.contacto,
        email: currentClient.email,
        morada: currentClient.morada,
      });

      setIsClientModalOpen(false);
      setCurrentClient({ id: '', nome: '', nuit: '', morada: '', contacto: '' });

      // Atualiza a lista de clientes após salvar
      const clientsRef = ref(db, `clients/${user.id}`);
      const snapshot = await get(clientsRef);
      if (snapshot.exists()) {
        setClients(Object.values(snapshot.val()));
      }
      showSnackbar('Cliente salvo com sucesso!', 'success');
    } catch (error) {
      showSnackbar('Erro ao salvar o cliente.', 'error');
    }
  };

  // Filtros e renderização
  const uniqueClients = [...new Set(clients.map((client) => client.nome || 'Indefinido'))];

const filteredProformas = proformas.filter((proforma) => {
  if (!proforma.cliente) {
    console.warn("Undefined cliente in proforma:", proforma);
    return false;
  }

  const matchesSearchTerm = proforma.cliente.nome
    .toLowerCase()
    .includes(searchTerm.toLowerCase());
  const matchesClientFilter =
    !selectedClient || proforma.cliente.nome === selectedClient;

  return matchesSearchTerm && matchesClientFilter;
});
  return (
    <Box width="100%" minHeight="100vh" p={3}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Proformas
        </Typography>
        <Tabs value={tabIndex} onChange={(e, newIndex) => setTabIndex(newIndex)}>
          <Tab label="Proformas" />
          <Tab label="Clientes" />
        </Tabs>
      </Paper>

      {tabIndex === 0 && (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <TextField
              label="Pesquisar proformas"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ mr: 2 }}
            />
            <FormControl sx={{ minWidth: 200, mr: 2 }}>
              <InputLabel>Filtrar por Cliente</InputLabel>
              <Select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                <MenuItem value="">Todos</MenuItem>
                {uniqueClients.map((client, index) => (
                  <MenuItem key={index} value={client}>
                    {client}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/proforma')}
            >
              Emitir Proforma
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell align="center">Nr</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell align="center">Emitido</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredProformas.length > 0 ? (
                  filteredProformas.map((proforma, index) => (
                    <TableRow key={index} hover>
                      <TableCell align="center" onClick={() => handleProformaClick(proforma.numeroProforma)}>
                        {proforma.numeroProforma}
                      </TableCell>
                      <TableCell>{proforma.cliente.nome || "Indefinido"}</TableCell>
                      <TableCell align="center">{proforma.dataEmissao}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Opções">
                          <IconButton
                            aria-controls="simple-menu"
                            aria-haspopup="true"
                            onClick={(event) => handleMenuClick(event, proforma)}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Menu
                          anchorEl={anchorEl}
                          keepMounted
                          open={Boolean(anchorEl)}
                          onClose={handleCloseMenu}
                        >
                          <MenuItem onClick={handleShare}>Compartilhar</MenuItem>
                          <MenuItem onClick={handleEdit}>Editar</MenuItem>
                          <MenuItem onClick={handleDelete}>Excluir</MenuItem>
                        </Menu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} align="center">Nenhuma proforma encontrada</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {tabIndex === 1 && (
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAddClient}>
            Adicionar Cliente
          </Button>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={2} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : clients.length > 0 ? (
                  clients.map((client, index) => (
                    <TableRow key={index} hover>
                      <TableCell>{client.nome}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Editar">
                          <IconButton onClick={() => handleEditClient(client)}>
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton onClick={() => handleDeleteClient(client.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2} align="center">Nenhum cliente encontrado</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={isClientModalOpen} onClose={() => setIsClientModalOpen(false)}>
        <DialogTitle>{currentClient.id ? "Editar Cliente" : "Adicionar Cliente"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Nome do Cliente"
            fullWidth
            variant="outlined"
            value={currentClient.nome}
            onChange={(e) => setCurrentClient({ ...currentClient, nome: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Nuit"
            fullWidth
            variant="outlined"
            value={currentClient.nuit}
            onChange={(e) => setCurrentClient({ ...currentClient, nuit: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Contacto"
            fullWidth
            variant="outlined"
            value={currentClient.contacto}
            onChange={(e) => setCurrentClient({ ...currentClient, contacto: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Morada"
            fullWidth
            variant="outlined"
            value={currentClient.morada}
            onChange={(e) => setCurrentClient({ ...currentClient, morada: e.target.value })}
            sx={{ mt: 2 }}
          />
          <TextField
            label="Email"
            fullWidth
            variant="outlined"
            value={currentClient.email}
            onChange={(e) => setCurrentClient({ ...currentClient, email: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsClientModalOpen(false)}>Cancelar</Button>
          <Button color="primary" onClick={handleSaveClient}>
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FaturacaoDesk;
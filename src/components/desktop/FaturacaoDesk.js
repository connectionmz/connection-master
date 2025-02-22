import React, { useEffect, useState } from 'react';
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
  MenuItem as DropdownItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
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
  const navigate = useNavigate();

  // Busca as proformas e clientes
  useEffect(() => {
    if (!user) return;

    const fetchInvoices = async () => {
      try {
        const invoicesRef = ref(db, `invoices/${user.id}`);
        const snapshot = await get(invoicesRef);
        if (snapshot.exists()) {
          setProformas(Object.values(snapshot.val()));
        } else {
          setProformas([]);
        }
      } catch (err) {
        setError('Erro ao carregar proformas.');
      }
    };

    const fetchClients = async () => {
      try {
        const clientsRef = ref(db, `clients/${user.id}`);
        const snapshot = await get(clientsRef);
        if (snapshot.exists()) {
          setClients(Object.values(snapshot.val()));
        } else {
          setClients([]);
        }
      } catch (err) {
        setError('Erro ao carregar clientes.');
      }
    };

    fetchInvoices();
    fetchClients();
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
          const companies = [];
          for (const companyId of connectionIds) {
            const companyRef = ref(db, `company/${companyId}`);
            const companySnapshot = await get(companyRef);
            if (companySnapshot.exists()) {
              const companyData = companySnapshot.val();
              companies.push({
                id: companyId,
                nome: companyData.nome || 'Indefinido',
                nuit: companyData.nuit || '',
                contacto: companyData.contacto || '',
                morada: companyData.endereco || '',
                email: companyData.email || '',
              });
            }
          }

          // Adiciona as empresas à lista de clientes
          setClients((prevClients) => {
            const existingClientIds = prevClients.map((client) => client.id);
            const newClients = companies.filter(
              (company) => !existingClientIds.includes(company.id)
            );
            return [...prevClients, ...newClients];
          });
        }
      } catch (err) {
        setError('Erro ao carregar conexões.');
      }
    };

    fetchConnections();
  }, [user]);

  const handleMenuClick = (event, proforma) => {
    setAnchorEl(event.currentTarget);
    setSelectedProforma(proforma);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedProforma(null);
  };

  const handleProformaClick = (proforma) => {
    navigate(`/proforma/${proforma.numeroProforma}`);
  };

  const handleShare = () => {
    alert(`Compartilhar a proforma ${selectedProforma.numeroProforma}`);
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
        alert('Proforma excluída com sucesso!');
      } catch (error) {
        alert('Erro ao excluir a proforma.');
      }
      handleCloseMenu();
    }
  };

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
        alert('Cliente excluído com sucesso!');
      } catch (error) {
        alert('Erro ao excluir o cliente.');
      }
    }
  };

  const handleSaveClient = async () => {
    if (!currentClient.nome) {
      alert('O nome do cliente é obrigatório.');
      return;
    }

    // Verifica se o cliente já existe
    const duplicateField = await checkIfClientExists(
      currentClient.nome,
      currentClient.nuit,
      currentClient.contacto
    );

    if (duplicateField) {
      alert(`Já existe um cliente com o mesmo ${duplicateField}.`);
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
    } catch (error) {
      alert('Erro ao salvar o cliente.');
    }
  };

  const uniqueClients = [
    ...new Set(clients.map((client) => client.nome || 'Indefinido')),
  ];

  const filteredProformas = proformas.filter((proforma) => {
    const matchesSearchTerm = proforma.cliente.nome
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesClientFilter =
      !selectedClient || proforma.cliente.nome === selectedClient;
    return matchesSearchTerm && matchesClientFilter;
  });

  const checkIfClientExists = async (nome, nuit, contacto) => {
    try {
      const clientsRef = ref(db, `clients/${user.id}`);
      const snapshot = await get(clientsRef);

      if (snapshot.exists()) {
        const clients = Object.values(snapshot.val());
        const duplicateClient = clients.find(
          (client) =>
            client.nome === nome ||
            client.nuit === nuit ||
            client.contacto === contacto
        );

        if (duplicateClient) {
          if (duplicateClient.nome === nome) return 'nome';
          if (duplicateClient.nuit === nuit) return 'NUIT';
          if (duplicateClient.contacto === contacto) return 'contacto';
        }
      }
      return null;
    } catch (error) {
      console.error('Erro ao verificar cliente:', error);
      return null;
    }
  };

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
                <DropdownItem value="">Todos</DropdownItem>
                {uniqueClients.map((client, index) => (
                  <DropdownItem key={index} value={client}>
                    {client}
                  </DropdownItem>
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
                {filteredProformas.length > 0 ? (
                  filteredProformas.map((proforma, index) => (
                    <TableRow key={index} hover>
                      <TableCell align="center">{proforma.numeroProforma}</TableCell>
                      <TableCell>{proforma.cliente.nome || "Indefinido"}</TableCell>
                      <TableCell align="center">{proforma.dataEmissao}</TableCell>
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
                {clients.length > 0 ? (
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
    </Box>
  );
};

export default FaturacaoDesk;
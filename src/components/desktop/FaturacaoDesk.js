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
  useMediaQuery,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  Collapse
} from '@mui/material';
import { db } from '../../fb';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

const FaturacaoDesk = ({ user }) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [proformas, setProformas] = useState([]);
  const [tabIndex, setTabIndex] = useState(0);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProforma, setSelectedProforma] = useState(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState({ 
    id: '', 
    nome: '', 
    nuit: '', 
    morada: '', 
    contacto: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'info' 
  });
  const [expandedClient, setExpandedClient] = useState(null);
  const navigate = useNavigate();

  // Snackbar functions
  const showSnackbar = (message, severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Fetch data
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [invoicesSnapshot, clientsSnapshot] = await Promise.all([
          get(ref(db, `invoices/${user.id}`)),
          get(ref(db, `clients/${user.id}`)),
        ]);

        const proformasData = invoicesSnapshot.exists() 
          ? Object.values(invoicesSnapshot.val()) 
          : [];
        const proformasOrdenadas = proformasData.sort((a, b) => 
          b.dataCriacao - a.dataCriacao
        );
        
        setProformas(proformasOrdenadas);
        setClients(clientsSnapshot.exists() 
          ? Object.values(clientsSnapshot.val()) 
          : []);
      } catch (err) {
        setError('Erro ao carregar dados.');
        showSnackbar('Erro ao carregar dados.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Fetch connections
  useEffect(() => {
    if (!user) return;

    const fetchConnections = async () => {
      try {
        const connectionsRef = ref(db, `connections/${user.id}`);
        const snapshot = await get(connectionsRef);
        
        if (snapshot.exists()) {
          const connectionIds = Object.keys(snapshot.val());

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

  // Proforma actions
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
        setProformas(proformas.filter((p) => 
          p.numeroProforma !== selectedProforma.numeroProforma
        ));
        showSnackbar('Proforma excluída com sucesso!', 'success');
      } catch (error) {
        showSnackbar('Erro ao excluir a proforma.', 'error');
      }
      handleCloseMenu();
    }
  };

  // Client actions
  const handleAddClient = () => {
    setCurrentClient({ 
      id: '', 
      nome: '', 
      nuit: '', 
      morada: '', 
      contacto: '',
      email: ''
    });
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
      setCurrentClient({ 
        id: '', 
        nome: '', 
        nuit: '', 
        morada: '', 
        contacto: '',
        email: ''
      });

      // Refresh clients list
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

  const toggleClientExpand = (clientId) => {
    setExpandedClient(expandedClient === clientId ? null : clientId);
  };

  // Filter proformas
  const filteredProformas = proformas.filter((proforma) => {
    if (!proforma.cliente) {
      return false;
    }

    const matchesSearchTerm = proforma.cliente.nome
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesClientFilter =
      !selectedClient || proforma.cliente.nome === selectedClient;

    return matchesSearchTerm && matchesClientFilter;
  });

  const uniqueClients = [...new Set(clients.map((client) => client.nome || 'Indefinido'))];

  // Render functions
  const renderProformasDesktop = () => (
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
          {filteredProformas.map((proforma, index) => (
            <TableRow key={index} hover>
              <TableCell 
                align="center" 
                onClick={() => handleProformaClick(proforma.numeroProforma)}
                sx={{ cursor: 'pointer' }}
              >
                {proforma.numeroProforma}
              </TableCell>
              <TableCell onClick={() => handleProformaClick(proforma.numeroProforma)}
                sx={{ cursor: 'pointer' }}>
                {proforma.cliente.nome || "Indefinido"}
              </TableCell>
              <TableCell 
                align="center" 
                onClick={() => handleProformaClick(proforma.numeroProforma)}
                sx={{ cursor: 'pointer' }}
              >
                {proforma.dataEmissao}
              </TableCell>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderProformasMobile = () => (
    <Grid container spacing={2}>
      {filteredProformas.map((proforma, index) => (
        <Grid item xs={12} key={index}>
          <Card elevation={3}>
            <CardContent 
              onClick={() => handleProformaClick(proforma.numeroProforma)}
              sx={{ cursor: 'pointer' }}
            >
              <Typography variant="h6">Nr: {proforma.numeroProforma}</Typography>
              <Typography color="textSecondary">Cliente: {proforma.cliente.nome || "Indefinido"}</Typography>
              <Typography color="textSecondary">Emitido: {proforma.dataEmissao}</Typography>
            </CardContent>
            <CardActions>
              <IconButton onClick={(event) => handleMenuClick(event, proforma)}>
                <EditIcon />
              </IconButton>
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderClientsDesktop = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Nome</TableCell>
            <TableCell>Nuit</TableCell>
            <TableCell>Contacto</TableCell>
            <TableCell align="center">Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {clients.map((client, index) => (
            <TableRow key={index} hover>
              <TableCell>{client.nome}</TableCell>
              <TableCell>{client.nuit}</TableCell>
              <TableCell>{client.contacto}</TableCell>
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
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderClientsMobile = () => (
    <List>
      {clients.map((client, index) => (
        <React.Fragment key={index}>
          <ListItem button onClick={() => toggleClientExpand(client.id)}>
            <ListItemText 
              primary={client.nome} 
              secondary={client.contacto}
            />
            {expandedClient === client.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </ListItem>
          <Collapse in={expandedClient === client.id} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItem>
                <ListItemText secondary={`Nuit: ${client.nuit || 'Não informado'}`} />
              </ListItem>
              <ListItem>
                <ListItemText secondary={`Email: ${client.email || 'Não informado'}`} />
              </ListItem>
              <ListItem>
                <ListItemText secondary={`Morada: ${client.morada || 'Não informada'}`} />
              </ListItem>
              <ListItem>
                <Box display="flex" justifyContent="flex-end" width="100%">
                  <IconButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditClient(client);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClient(client.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </ListItem>
            </List>
          </Collapse>
          <Divider />
        </React.Fragment>
      ))}
    </List>
  );

  return (
    <Box width="100%" minHeight="100vh" p={isMobile ? 1 : 3}>
      <Paper elevation={3} sx={{ p: isMobile ? 1 : 3, mb: 2 }}>
        <Typography variant={isMobile ? "h6" : "h5"} gutterBottom>
          Proformas
        </Typography>
        <Tabs 
          value={tabIndex} 
          onChange={(e, newIndex) => setTabIndex(newIndex)}
          variant={isMobile ? "fullWidth" : "standard"}
          sx={{ mb: 1 }}
        >
          <Tab label="Proformas" />
          <Tab label="Clientes" />
        </Tabs>
      </Paper>

      {tabIndex === 0 && (
        <Paper elevation={3} sx={{ p: isMobile ? 1 : 3, mb: 2 }}>
          <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                label="Pesquisar proformas"
                variant="outlined"
                fullWidth
                size={isMobile ? "small" : "medium"}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FormControl fullWidth size={isMobile ? "small" : "medium"}>
                <InputLabel>Filtrar por Cliente</InputLabel>
                <Select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  label="Filtrar por Cliente"
                >
                  <MenuItem value="">Todos</MenuItem>
                  {uniqueClients.map((client, index) => (
                    <MenuItem key={index} value={client}>
                      {client}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                variant="contained"
                color="primary"
                fullWidth={isMobile}
                size={isMobile ? "medium" : "large"}
                onClick={() => navigate('/proforma')}
                sx={{ height: '100%' }}
              >
                {isMobile ? 'Nova Proforma' : 'Emitir Proforma'}
              </Button>
            </Grid>
          </Grid>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : filteredProformas.length > 0 ? (
            isMobile ? renderProformasMobile() : renderProformasDesktop()
          ) : (
            <Typography variant="body1" align="center" p={4}>
              Nenhuma proforma encontrada
            </Typography>
          )}
        </Paper>
      )}

      {tabIndex === 1 && (
        <Paper elevation={3} sx={{ p: isMobile ? 1 : 3, mb: 2 }}>
          <Box mb={2}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />} 
              fullWidth={isMobile}
              onClick={handleAddClient}
              size={isMobile ? "medium" : "large"}
            >
              Adicionar Cliente
            </Button>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : clients.length > 0 ? (
            isMobile ? renderClientsMobile() : renderClientsDesktop()
          ) : (
            <Typography variant="body1" align="center" p={4}>
              Nenhum cliente encontrado
            </Typography>
          )}
        </Paper>
      )}

      {/* Client Modal */}
      <Dialog 
        open={isClientModalOpen} 
        onClose={() => setIsClientModalOpen(false)}
        fullWidth
        maxWidth="sm"
        fullScreen={isMobile}
      >
        <DialogTitle>
          {currentClient.id ? "Editar Cliente" : "Adicionar Cliente"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Nome do Cliente *"
                fullWidth
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                value={currentClient.nome}
                onChange={(e) => setCurrentClient({ 
                  ...currentClient, 
                  nome: e.target.value 
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nuit"
                fullWidth
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                value={currentClient.nuit}
                onChange={(e) => setCurrentClient({ 
                  ...currentClient, 
                  nuit: e.target.value 
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contacto"
                fullWidth
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                value={currentClient.contacto}
                onChange={(e) => setCurrentClient({ 
                  ...currentClient, 
                  contacto: e.target.value 
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Morada"
                fullWidth
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                value={currentClient.morada}
                onChange={(e) => setCurrentClient({ 
                  ...currentClient, 
                  morada: e.target.value 
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email"
                fullWidth
                variant="outlined"
                size={isMobile ? "small" : "medium"}
                value={currentClient.email}
                onChange={(e) => setCurrentClient({ 
                  ...currentClient, 
                  email: e.target.value 
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsClientModalOpen(false)}>
            Cancelar
          </Button>
          <Button 
            color="primary" 
            onClick={handleSaveClient}
            variant="contained"
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Proforma Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleShare}>
          <ShareIcon sx={{ mr: 1 }} /> Compartilhar
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1 }} /> Editar
        </MenuItem>
        <MenuItem onClick={handleDelete}>
          <DeleteIcon sx={{ mr: 1 }} /> Excluir
        </MenuItem>
      </Menu>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FaturacaoDesk;
import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Button,
  Tabs,
  Tab,
  Paper,
  TextField,
  useMediaQuery,
  ListItem,
  Snackbar,
  Alert,
  CircularProgress,
  Badge,
  IconButton,
  Chip,
  Stack,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AlertTitle
} from "@mui/material";
import { 
  Person, 
  Check, 
  Close, 
  Notifications, 
  Search, 
  MoreVert,
  Add,
  Group,
  PendingActions,
  FilterList,
  LinkOff,
  Expand
} from "@mui/icons-material";
import { ref, onValue, update, set, remove } from "firebase/database";
import { db } from "../../fb";
import { Link } from "react-router-dom";
import { saveContentToInbox } from "../SaveToInbox";
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';
import { InfoIcon } from "lucide-react";

const ConnectionsDesk = ({ user }) => {
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [filterMenuAnchor, setFilterMenuAnchor] = useState(null);
  const [sortBy, setSortBy] = useState('Recentes');
  const [disconnectDialog, setDisconnectDialog] = useState({
    open: false,
    connectionId: null,
    connectionName: ''
  });
  const [connectionMenuAnchor, setConnectionMenuAnchor] = useState(null);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const isMobile = useMediaQuery("(max-width:600px)");

  const userId = user.id;

  // Load connections
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const targetUserConnectionRef = ref(db, `connections/${userId}`);

    const unsubscribe = onValue(targetUserConnectionRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          const data = snapshot.val();
          const accepted = [];
          const pending = [];

          Object.entries(data).forEach(([key, value]) => {
            const connection = { id: key, ...value };
            if (value.status === "accepted") {
              accepted.push(connection);
            } else if (value.status === "pending") {
              pending.push(connection);
            }
          });

          // Sort connections
          const sortedAccepted = sortConnections(accepted, sortBy);
          const sortedPending = sortConnections(pending, sortBy);

          setConnections(sortedAccepted);
          setPendingRequests(sortedPending);
        } else {
          setConnections([]);
          setPendingRequests([]);
        }
      } catch (error) {
        console.error("Error loading connections:", error);
        showSnackbar('Error loading connections', 'error');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userId, sortBy]);

  const sortConnections = (items, sortMethod) => {
    return [...items].sort((a, b) => {
      if (sortMethod === 'Recentes') {
        return new Date(b.connectedAt || b.timestamp) - new Date(a.connectedAt || a.timestamp);
      } else if (sortMethod === 'name') {
        return (a.fromUserName || '').localeCompare(b.fromUserName || '');
      }
      return 0;
    });
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const createReciprocalConnection = useCallback(async (otherUserId, otherUserData) => {
    try {
      const reciprocalConnectionRef = ref(db, `connections/${otherUserId}/${userId}`);
      
      await set(reciprocalConnectionRef, {
        ...otherUserData,
        status: "accepted",
        connectedAt: new Date().toISOString()
      });
      
      return true;
    } catch (error) {
      console.error("Error creating reciprocal connection:", error);
      return false;
    }
  }, [userId]);

  const handleAccept = useCallback(async (requestId, requestData) => {
    try {
      const requestRef = ref(db, `connections/${userId}/${requestId}`);
      
      // First update the status
      await update(requestRef, { 
        status: "accepted",
        connectedAt: new Date().toISOString()
      });
  
      // Then create the reciprocal connection (without sending another notification)
      const success = await createReciprocalConnection(requestId, {
        fromUserId: userId,
        fromUserName: user.nome,
        fromLogo: user?.logo || '',
        status: "accepted",
        connectedAt: new Date().toISOString()
      });
  
      if (!success) throw new Error("Failed to create reciprocal connection");
  
      // Update local state
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
  
      // Send just one notification to the other user
      await saveContentToInbox(requestId, {
        type: "connection_request",
        message: `${user.nome} aceitou seu pedido de conexão`,
        fromUserId: userId,
        fromUserName: user.nome,
        timestamp: new Date().toISOString(),
        status: "unread",
        link: `/perfil/${userId}`
      });
  
      showSnackbar('Pedido aceite com sucesso!', 'success');
    } catch (error) {
      console.error("Error accepting connection:", error);
      showSnackbar('Erro ao aceitar conexão', 'error');
    }
  }, [userId, user.nome, user.logo, createReciprocalConnection]);

  const handleReject = useCallback(async (requestId, requestData) => {
    try {
      const requestRef = ref(db, `connections/${userId}/${requestId}`);
      await update(requestRef, { status: "rejected" });

      setPendingRequests(prev => prev.filter(req => req.id !== requestId));

      await saveContentToInbox(requestId, {
        type: "connection_request",
        message: `${user.nome} Recusou seu pedido de conexao`,
        fromUserId: userId,
        fromUserName: user.nome,
        timestamp: new Date().toISOString(),
        status: "unread",
        link: `/perfil/${userId}`
      });

      showSnackbar('Pedido rejeitado', 'info');
    } catch (error) {
      console.error("Error rejecting connection:", error);
      showSnackbar('Error rejecting connection', 'error');
    }
  }, [userId, user.nome]);

  const handleDisconnect = useCallback(async (connectionId, connectionName) => {
    try {
      // Remove from current user
      const userConnectionRef = ref(db, `connections/${userId}/${connectionId}`);
      await remove(userConnectionRef);
  
      // Remove reciprocal connection
      const otherUserConnectionRef = ref(db, `connections/${connectionId}/${userId}`);
      await remove(otherUserConnectionRef);
  
      // Update local state
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
  
      // Notify the other company
      await saveContentToInbox(connectionId, {
        type: "connection_disconnect",
        message: `${user.nome} desconectou-se da sua empresa`,
        fromUserId: userId,
        fromUserName: user.nome,
        timestamp: new Date().toISOString(),
        status: "unread",
        link: `/perfil/${userId}`
      });
  
      showSnackbar(`Desconectado com sucesso de ${connectionName}`, 'success');
    } catch (error) {
      console.error("Error disconnecting:", error);
      showSnackbar('Erro ao desconectar', 'error');
    } finally {
      setDisconnectDialog({ open: false, connectionId: null, connectionName: '' });
      setConnectionMenuAnchor(null);
    }
  }, [userId, user.nome]);

  const openDisconnectDialog = (connectionId, connectionName) => {
    setDisconnectDialog({
      open: true,
      connectionId,
      connectionName
    });
  };

  const closeDisconnectDialog = () => {
    setDisconnectDialog({ open: false, connectionId: null, connectionName: '' });
  };

  const filterItems = useCallback((items) => {
    return items.filter(item =>
      item.fromUserName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleFilterMenuOpen = (event) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };

  const handleSortChange = (method) => {
    setSortBy(method);
    handleFilterMenuClose();
  };

  const handleConnectionMenuOpen = (event, connection) => {
    setConnectionMenuAnchor(event.currentTarget);
    setSelectedConnection(connection);
  };

  const handleConnectionMenuClose = () => {
    setConnectionMenuAnchor(null);
    setSelectedConnection(null);
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "Agora"; // Handle missing date
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) { // Check if date is invalid
        return "Agora";
      }
      return formatDistanceToNow(date, { 
        addSuffix: true, 
        locale: pt 
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Agora";
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box width="100%" minHeight="100vh" p={isMobile ? 2 : 4}>
      {/* Header with Actions */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Box>
          <Typography variant="h4" sx={{ 
            color: 'primary.main',
            fontSize: isMobile ? '1.8rem' : '2.4rem',
            fontWeight: 700
          }}>
           Conexões
          </Typography>
          <Accordion sx={{ mb: 3, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
              <AccordionSummary expandIcon={<Expand />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <InfoIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight="bold">
                    Política de Conexões
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <AlertTitle>Conectou? Então estamos ligados!</AlertTitle>
                  Na plataforma <strong>Connections</strong>, estabelecer uma conexão com outra empresa vai além do networking: é um compromisso digital com benefícios automáticos:
                  <ul>
                    <li><strong>Relacionamento Comercial Instantâneo:</strong> a empresa conectada passa a ser listada como cliente no módulo de proformas, permitindo trocas comerciais sem burocracia.</li>
                    <li><strong>Notificações em tempo real:</strong> qualquer nova publicação, campanha ou actualização feita por essa empresa será notificada diretamente a si.</li>
                    <li><strong>Facilidade e Agilidade:</strong> pedidos de orçamento, negociações e histórico de interacções tornam-se mais rápidos e organizados.</li>
                  </ul>
                  <Typography variant="body2" mt={2}>
                    💡 <strong>Importante:</strong> Ao <strong>desconectar-se</strong> de uma empresa, estas funcionalidades são automaticamente desactivadas. Nada pessoal – apenas desligamos os cabos digitais. 🔌
                  </Typography>
                </Alert>
              </AccordionDetails>
            </Accordion>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            component={Link}
            to="/empresas"
            variant="contained"
            color="primary"
            startIcon={<Add />}
            sx={{ 
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600
            }}
          >
           Nova Conexão
          </Button>

          <Tooltip title="Filter and sort">
            <IconButton
              onClick={handleFilterMenuOpen}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
              }}
            >
              <FilterList />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={handleFilterMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem dense disabled>
          <Typography variant="subtitle2" color="text.secondary">
           Ordenar por:
          </Typography>
        </MenuItem>
        <MenuItem 
          onClick={() => handleSortChange('Recentes')}
          selected={sortBy === 'Recentes'}
        >
         Recentes
        </MenuItem>
        <MenuItem 
          onClick={() => handleSortChange('name')}
          selected={sortBy === 'name'}
        >
        Order Alfabética
        </MenuItem>
      </Menu>

      {/* Search and Tabs */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row', 
        gap: 2,
        mb: 4
      }}>
        <Paper elevation={0} sx={{ 
          flex: 1,
          borderRadius: 3,
          background: 'rgba(245, 245, 245, 0.8)'
        }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Pesquisar empresa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <Search sx={{ color: 'text.secondary', mr: 1 }} />
              ),
              sx: {
                borderRadius: 3
              }
            }}
          />
        </Paper>

        <Paper elevation={0} sx={{ 
          borderRadius: 3,
          background: 'rgba(245, 245, 245, 0.8)'
        }}>
          <Tabs
            value={selectedTab}
            onChange={(e, newValue) => setSelectedTab(newValue)}
            variant={isMobile ? "fullWidth" : "standard"}
            sx={{
              '& .MuiTabs-indicator': {
                height: 4,
                borderRadius: '0 0 4px 4px',
                backgroundColor: 'primary.main'
              }
            }}
          >
            <Tab 
              icon={<PendingActions />}
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ 
                    fontWeight: 600,
                    mr: 1
                  }}>
                    Pedidos Pendentes
                  </Typography>
                  {pendingRequests.length > 0 && (
                    <Chip 
                      label={pendingRequests.length} 
                      size="small" 
                      color="primary"
                      sx={{ height: 20 }}
                    />
                  )}
                </Box>
              }
              sx={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                textTransform: 'none',
                minHeight: 60,
                minWidth: isMobile ? 0 : 180
              }}
            />
            <Tab 
              icon={<Group />}
              iconPosition="start"
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 600 }}>
                    Minhas Conexões
                  </Typography>
                  {connections.length > 0 && (
                    <Chip 
                      label={connections.length} 
                      size="small" 
                      color="primary"
                      sx={{ ml: 1, height: 20 }}
                    />
                  )}
                </Box>
              }
              sx={{
                fontSize: isMobile ? '0.9rem' : '1rem',
                textTransform: 'none',
                minHeight: 60,
                minWidth: isMobile ? 0 : 180
              }}
            />
          </Tabs>
        </Paper>
      </Box>

      {/* Content */}
      {selectedTab === 0 ? (
        <PendingRequestsTab 
          requests={filterItems(pendingRequests)}
          onAccept={handleAccept}
          onReject={handleReject}
          isMobile={isMobile}
          getTimeAgo={getTimeAgo}
        />
      ) : (
        <ConnectionsTab 
          connections={filterItems(connections)}
          isMobile={isMobile}
          getTimeAgo={getTimeAgo}
          onMenuOpen={handleConnectionMenuOpen}
        />
      )}

      {/* Connection Menu */}
      <Menu
        anchorEl={connectionMenuAnchor}
        open={Boolean(connectionMenuAnchor)}
        onClose={handleConnectionMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem 
          dense
          component={Link}
          to={`/perfil/${selectedConnection?.id}`}
          onClick={handleConnectionMenuClose}
        >
           Visitar Perfil
        </MenuItem>
        <MenuItem 
          dense
          onClick={() => {
            openDisconnectDialog(selectedConnection?.id, selectedConnection?.fromUserName);
            handleConnectionMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon>
            <LinkOff color="error" />
          </ListItemIcon>
          Desconectar
        </MenuItem>
      </Menu>

      {/* Disconnect Confirmation Dialog */}
      <Dialog
  open={disconnectDialog.open}
  onClose={closeDisconnectDialog}
  aria-labelledby="disconnect-dialog-title"
>
  <DialogTitle id="disconnect-dialog-title">
    Confirmar
  </DialogTitle>
  <DialogContent>
    <DialogContentText>
      Tem a certeza de que deseja desconectar-se de {disconnectDialog.connectionName}?
      <br />
      <strong>Esta empresa deixará de fazer parte da sua lista de clientes.</strong>
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={closeDisconnectDialog} color="primary">
      Cancelar
    </Button>
    <Button 
      onClick={() => handleDisconnect(
        disconnectDialog.connectionId, 
        disconnectDialog.connectionName
      )} 
      color="error"
      variant="contained"
      startIcon={<LinkOff />}
    >
      Desconectar
    </Button>
  </DialogActions>
</Dialog>

      {/* Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ 
            width: '100%',
            borderRadius: 2,
            boxShadow: 3,
            alignItems: 'center'
          }}
          iconMapping={{
            success: <Check fontSize="inherit" sx={{ color: 'success.main' }} />,
            error: <Close fontSize="inherit" sx={{ color: 'error.main' }} />,
            info: <Notifications fontSize="inherit" sx={{ color: 'info.main' }} />
          }}
        >
          <Typography fontWeight={600}>
            {snackbar.message}
          </Typography>
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Subcomponent for Pending Requests
const PendingRequestsTab = ({ requests, onAccept, onReject, isMobile, getTimeAgo }) => {
  if (requests.length === 0) {
    return (
      <EmptyState
      icon={<PendingActions sx={{ fontSize: 48 }} />}
      title="Nenhum pedido de conexão"
      description="Assim que uma empresa solicitar conexão com a sua, o pedido será exibido aqui."
      actionText="Explorar empresas"
      actionLink="/empresas"
    />

    );
  }

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <List disablePadding>
        {requests.map((request, index) => (
          <React.Fragment key={request.id}>
            <ListItem disablePadding>
              <ListItemButton
                component={Link}
                to={`/perfil/${request.id}`}
                sx={{ 
                  py: 2,
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.03)'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar 
                    src={request.fromLogo} 
                    alt={request.fromUserName}
                    sx={{ 
                      width: 56, 
                      height: 56,
                      mr: 2,
                      border: '2px solid',
                      borderColor: 'primary.light'
                    }}
                  >
                    {request.fromUserName?.charAt(0) || <Person />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={
                    <Typography variant="subtitle1" fontWeight={600}>
                      {request.fromUserName}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      Solicitado {getTimeAgo(request.timestamp)}
                    </Typography>
                  }
                />
              </ListItemButton>
              <Stack 
                direction={isMobile ? "column" : "row"} 
                spacing={1}
                sx={{ 
                  pr: 2,
                  '& .MuiButton-root': {
                    borderRadius: 2,
                    px: 2,
                    minWidth: isMobile ? '100%' : 100
                  }
                }}
              >
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  startIcon={<Check />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAccept(request.id, request);
                  }}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Aceitar
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<Close />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onReject(request.id, request);
                  }}
                  sx={{ 
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  Recusar
                </Button>
              </Stack>
            </ListItem>
            {index < requests.length - 1 && <Divider sx={{ mx: 2 }} />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

const ConnectionsTab = ({ connections, isMobile, getTimeAgo, onMenuOpen }) => {
  if (connections.length === 0) {
    return (
      <EmptyState
      icon={<Group sx={{ fontSize: 48 }} />}
      title="Nenhuma empresa encontrada"
      description="Procure por empresas para se conectar e iniciar novas oportunidades."
      actionText="Explorar empresas"
      actionLink="/empresas"
    />
    );
  }
  return (
    <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden' }}>
      <List disablePadding>
        {connections.map((connection, index) => (
          <React.Fragment key={connection.id}>
            <ListItem
              secondaryAction={
                <Tooltip title="Options">
                  <IconButton 
                    edge="end" 
                    aria-label="more"
                    onClick={(e) => onMenuOpen(e, connection)}
                  >
                    <MoreVert />
                  </IconButton>
                </Tooltip>
              }
              sx={{ padding: 0 }}
            >
              <ListItemButton
                component={Link}
                to={`/perfil/${connection.id}`}
                sx={{ 
                  py: 2,
                  px: 2,
                  flex: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.03)'
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar 
                    src={connection.fromLogo} 
                    alt={connection.fromUserName}
                    sx={{ 
                      width: 56, 
                      height: 56,
                      mr: 2,
                      border: '2px solid',
                      borderColor: 'primary.light'
                    }}
                  >
                    {connection.fromUserName?.charAt(0) || <Person />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText 
                  primary={
                    <Typography variant="subtitle1" fontWeight={600}>
                      {connection.fromUserName}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      Connectada há {getTimeAgo(connection.connectedAt)}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
            {index < connections.length - 1 && <Divider sx={{ mx: 2 }} />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

// Reusable Empty State Component
const EmptyState = ({ icon, title, description, actionText, actionLink }) => (
  <Paper elevation={0} sx={{ 
    p: 4,
    borderRadius: 3,
    textAlign: 'center',
    backgroundColor: 'rgba(245, 245, 245, 0.5)'
  }}>
    <Box sx={{ 
      display: 'inline-flex',
      p: 2,
      mb: 2,
      borderRadius: '50%',
      backgroundColor: 'primary.light',
      color: 'primary.main'
    }}>
      {icon}
    </Box>
    <Typography variant="h6" color="text.secondary">
      {title}
    </Typography>
    <Typography variant="body2" color="text.disabled" sx={{ mt: 1, mb: 3 }}>
      {description}
    </Typography>
    <Button
      component={Link}
      to={actionLink}
      variant="contained"
      color="primary"
      sx={{ 
        borderRadius: 2,
        px: 4,
        fontWeight: 600
      }}
    >
      {actionText}
    </Button>
  </Paper>
);

export default ConnectionsDesk;
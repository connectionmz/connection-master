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
  Stack
} from "@mui/material";
import { Person, Check, Close, Notifications, Search } from "@mui/icons-material";
import { ref, onValue, update, set } from "firebase/database";
import { db } from "../../fb";
import { Link } from "react-router-dom";
import { saveContentToInbox } from "../SaveToInbox";
import { formatDistanceToNow } from 'date-fns';
import { pt } from 'date-fns/locale';

const ConnectionsDesk = ({ user }) => {
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const isMobile = useMediaQuery("(max-width:600px)");

  const userId = user.id;



  // Carregar conexões
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

          setConnections(accepted);
          setPendingRequests(pending);
        } else {
          setConnections([]);
          setPendingRequests([]);
        }
      } catch (error) {
        console.error("Erro ao carregar conexões:", error);
        setSnackbar({
          open: true,
          message: 'Erro ao carregar conexões',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // Criar conexão recíproca
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
      console.error("Erro ao criar conexão recíproca:", error);
      return false;
    }
  }, [userId]);

  // Aceitar conexão
  const handleAccept = useCallback(async (requestId, requestData) => {
    try {
      // Atualizar status para "accepted" no usuário atual
      const requestRef = ref(db, `connections/${userId}/${requestId}`);
      await update(requestRef, { 
        status: "accepted",
        connectedAt: new Date().toISOString()
      });

      // Criar conexão recíproca no outro usuário
      const success = await createReciprocalConnection(requestId, {
        fromUserId: userId,
        fromUserName: user.nome,
        fromLogo: user?.logo || '',
        status: "accepted",
        connectedAt: new Date().toISOString()
      });

      if (!success) {
        throw new Error("Failed to create reciprocal connection");
      }

      // Atualizar estado local
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
      setConnections(prev => [...prev, { 
        id: requestId, 
        ...requestData,
        status: "accepted",
        connectedAt: new Date().toISOString()
      }]);

      // Enviar notificação
      const notification = {
        type: "connection_request",
        message: `${user.nome} aceitou seu pedido de conexão`,
        fromUserId: userId,
        fromUserName: user.nome,
        timestamp: new Date().toISOString(),
        status: "unread",
        link: `/perfil/${userId}`
      };
      
      await saveContentToInbox(requestId, notification);

      setSnackbar({
        open: true,
        message: 'Conexão aceita com sucesso!',
        severity: 'success'
      });
    } catch (error) {
      console.error("Erro ao aceitar conexão:", error);
      setSnackbar({
        open: true,
        message: 'Erro ao aceitar conexão',
        severity: 'error'
      });
    }
  }, [userId, user.nome, user.logo, createReciprocalConnection]);

  // Rejeitar conexão
  const handleReject = useCallback(async (requestId, requestData) => {
    try {
      const requestRef = ref(db, `connections/${userId}/${requestId}`);
      await update(requestRef, { status: "rejected" });

      // Atualizar estado local
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));

      // Enviar notificação
      const notification = {
        type: "connection_request",
        message: `${user.nome} recusou seu pedido de conexão`,
        fromUserId: userId,
        fromUserName: user.nome,
        timestamp: new Date().toISOString(),
        status: "unread",
        link: `/perfil/${userId}`
      };
      
      await saveContentToInbox(requestId, notification);

      setSnackbar({
        open: true,
        message: 'Pedido de conexão recusado',
        severity: 'info'
      });
    } catch (error) {
      console.error("Erro ao rejeitar conexão:", error);
      setSnackbar({
        open: true,
        message: 'Erro ao rejeitar conexão',
        severity: 'error'
      });
    }
  }, [userId, user.nome]);

  // Filtrar conexões
  const filterItems = useCallback((items) => {
    return items.filter(item =>
      item.fromUserName?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
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
      {/* Cabeçalho Aprimorado */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3 
      }}>
        <Typography variant="h4" sx={{ 
          color: 'primary.main',
          fontSize: isMobile ? '1.8rem' : '2.4rem'
        }}>
          Conexões
        </Typography>
        <Badge 
          badgeContent={pendingRequests.length} 
          color="error"
          overlap="circular"
          sx={{ 
            '& .MuiBadge-badge': {
              right: -3,
              top: 13,
              border: '2px solid white'
            }
          }}
        >
          
        </Badge>
      </Box>

      {/* Campo de Pesquisa Estilizado */}
      <Paper elevation={0} sx={{ 
        mb: 4,
        borderRadius: 3,
        background: 'rgba(245, 245, 245, 0.8)',
        backdropFilter: 'blur(5px)'
      }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Pesquisar conexões..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <Search sx={{ color: 'text.secondary', mr: 1 }} />
            )
           
          }}
        />
      </Paper>

      {/* Tabs Modernas */}
      <Paper elevation={0} sx={{ 
        mb: 4,
        borderRadius: 3,
        background: 'rgba(245, 245, 245, 0.8)'
      }}>
        <Tabs
          value={selectedTab}
          onChange={(e, newValue) => setSelectedTab(newValue)}
          variant="fullWidth"
          sx={{
            '& .MuiTabs-indicator': {
              height: 4,
              borderRadius: '0 0 4px 4px',
              backgroundColor: 'primary.main'
            }
          }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ 
                  fontWeight: 600,
                  mr: 1
                }}>
                  Pendentes
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
              minHeight: 60
            }}
          />
          <Tab 
            label={
              <Typography sx={{ fontWeight: 600 }}>
                Minhas Conexões
              </Typography>
            }
            sx={{
              fontSize: isMobile ? '0.9rem' : '1rem',
              textTransform: 'none',
              minHeight: 60
            }}
          />
        </Tabs>
      </Paper>

      {/* Lista de Pedidos Pendentes */}
      {selectedTab === 0 && (
        <Box>
          <Typography variant="h6" sx={{ 
            mb: 2,
            fontWeight: 600,
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center'
          }}>
            Solicitações de Conexão
            <Chip 
              label={pendingRequests.length} 
              size="small" 
              color="primary"
              sx={{ ml: 1, height: 24 }}
            />
          </Typography>
          
          {filterItems(pendingRequests).length > 0 ? (
            <Paper elevation={0} sx={{ 
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <List disablePadding>
                {filterItems(pendingRequests).map((request, index) => (
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
                              Deseja se conectar com você
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
                            handleAccept(request.id, request);
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
                            handleReject(request.id, request);
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
                    {index < pendingRequests.length - 1 && (
                      <Divider sx={{ mx: 2 }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ 
              p: 4,
              borderRadius: 3,
              textAlign: 'center',
              backgroundColor: 'rgba(245, 245, 245, 0.5)'
            }}>
              <Notifications sx={{ 
                fontSize: 48,
                color: 'text.disabled',
                mb: 2
              }} />
              <Typography variant="h6" color="text.secondary">
                Nenhuma solicitação pendente
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                Quando receber novas solicitações, elas aparecerão aqui
              </Typography>
            </Paper>
          )}
        </Box>
      )}

      {/* Lista de Conexões */}
      {selectedTab === 1 && (
        <Box>
          <Typography variant="h6" sx={{ 
            mb: 2,
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center'
          }}>
            Minhas Conexões
            <Chip 
              label={connections.length} 
              size="small" 
              color="primary"
              sx={{ ml: 1, height: 24 }}
            />
          </Typography>
          
          {filterItems(connections).length > 0 ? (
            <Paper elevation={0} sx={{ 
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <List disablePadding>
                {filterItems(connections).map((connection, index) => (
                  <React.Fragment key={connection.id}>
                    <ListItemButton
                      component={Link}
                      to={`/perfil/${connection.id}`}
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
                          </Typography>
                        }
                      />
                    </ListItemButton>
                    {index < connections.length - 1 && (
                      <Divider sx={{ mx: 2 }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          ) : (
            <Paper elevation={0} sx={{ 
              p: 4,
              borderRadius: 3,
              textAlign: 'center',
              backgroundColor: 'rgba(245, 245, 245, 0.5)'
            }}>
              <Person sx={{ 
                fontSize: 48,
                color: 'text.disabled',
                mb: 2
              }} />
              <Typography variant="h6" color="text.secondary">
                Sua rede está vazia
              </Typography>
              <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
                Conecte-se com outras empresas para expandir sua rede
              </Typography>
              <Button
                component={Link}
                to="/empresas"
                variant="contained"
                color="primary"
                sx={{ 
                  mt: 3,
                  borderRadius: 2,
                  px: 4,
                  fontWeight: 600
                }}
              >
                Explorar Usuários
              </Button>
            </Paper>
          )}
        </Box>
      )}

      {/* Snackbar Estilizado */}
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

export default ConnectionsDesk;

import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItemButton, 
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Badge,
  Button,
  Tabs,
  Tab,
  Paper,
  ListItem,
  TextField, // Importando TextField para o campo de pesquisa
} from "@mui/material";
import { Person, Check, Close } from "@mui/icons-material";
import { ref, onValue, update } from "firebase/database";
import { db } from "../../fb";
import { Link } from "react-router-dom"; 
import { saveContentToInbox } from "../SaveToInbox";

const ConnectionsDesk = ({ user }) => {
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState(""); // Estado para o campo de pesquisa

  const userId = user.id;

  useEffect(() => {
    if (!userId) return;

    const targetUserConnectionRef = ref(db, `connections/${userId}`);

    const unsubscribe = onValue(targetUserConnectionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        const accepted = [];
        const pending = [];

        // Separar conexões aceitas e pedidos pendentes
        Object.entries(data).forEach(([key, value]) => {
          if (value.status === "accepted") {
            accepted.push({ id: key, ...value });
          } else if (value.status === "pending") {
            pending.push({ id: key, ...value });
          }
        });

        setConnections(accepted);
        setPendingRequests(pending);
      } else {
        setConnections([]);
        setPendingRequests([]);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const handleAccept = (requestId) => {
    const requestRef = ref(db, `connections/${userId}/${requestId}`);
    update(requestRef, { status: "accepted" })
      .then(() => {
        // Atualiza o estado sem precisar de uma nova requisição ao Firebase
        setPendingRequests(pendingRequests.filter(req => req.id !== requestId));
        setConnections(prev => [
          ...prev,
          pendingRequests.find(req => req.id === requestId)
        ]);
        const notification = {
          type: "connection_request",
          message: `${user.nome} aceitou seu pedido de conexao`,
          fromUserId: user.id,
          fromUserName: user.nome,
          timestamp: new Date().toISOString(),
          status: "unread",
        };
          saveContentToInbox(requestId,notification)
      })
      .catch((error) => console.error("Erro ao aceitar o pedido:", error));
  };

  const handleReject = (requestId) => {
    const requestRef = ref(db, `connections/${userId}/${requestId}`);
    update(requestRef, { status: "rejected" })
      .then(() => {
        // Atualiza o estado sem precisar de uma nova requisição ao Firebase
        setPendingRequests(pendingRequests.filter(req => req.id !== requestId));
            
      const notification = {
        type: "connection_request",
        message: `${user.nome} recusou seu pedido de conexao`,
        fromUserId: user.id,
        fromUserName: user.nome,
        timestamp: new Date().toISOString(),
        status: "unread",
      };
        saveContentToInbox(requestId,notification)
      })
      .catch((error) => console.error("Erro ao rejeitar o pedido:", error));
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // Função para filtrar com base no nome
  const filterItems = (items) => {
    return items.filter((item) =>
      item.fromUserName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  return (
    <Box width="100%" minHeight="100vh">
      <Typography variant="h5" sx={{ marginBottom: 2, fontWeight: "bold" }}>
        Conexões
      </Typography>

      {/* Campo de pesquisa */}
      <TextField
        label="Pesquisar por nome"
        variant="outlined"
        fullWidth
        sx={{ marginBottom: 2 }}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />

      {/* Tabs para Pedidos Pendentes e Conexões */}
      <Paper sx={{ marginBottom: 4 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          aria-label="connection tabs"
          centered
          variant="fullWidth"
        >
          <Tab label="Pedidos Pendentes" />
          <Tab label="Minhas Conexões" />
        </Tabs>
      </Paper>

      {/* Conteúdo da Aba: Pedidos Pendentes */}
      {selectedTab === 0 && (
        <Box sx={{ padding: 2 }}>
          <Typography variant="h6" sx={{ marginBottom: 1 }}>
            Pedidos Pendentes
          </Typography>
          <List>
            {filterItems(pendingRequests).length > 0 ? (
              filterItems(pendingRequests).map((request, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="center">
                    <ListItemButton
                      component={Link}
                      to={`/perfil/${request.id}`}
                      sx={{ textDecoration: "none" }}
                    >
                      <ListItemAvatar>
                        <Avatar src={request.fromLogo} alt={request.name}>
                          <Person />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={request.fromUserName} />
                      <Box display="flex" gap={1}>
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<Check />}
                          onClick={() => handleAccept(request.id)}
                        >
                          Aceitar
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<Close />}
                          onClick={() => handleReject(request.id)}
                        >
                          Rejeitar
                        </Button>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                  {index < pendingRequests.length - 1 && <Divider />}
                </React.Fragment>
              ))
            ) : (
              <Typography variant="body1" sx={{ color: "#555" }}>
                Não há pedidos pendentes no momento.
              </Typography>
            )}
          </List>
        </Box>
      )}

      {/* Conteúdo da Aba: Conexões */}
      {selectedTab === 1 && (
        <Box sx={{ padding: 2 }}>
          <Typography variant="h6" sx={{ marginBottom: 1 }}>
            Minhas Conexões
          </Typography>
          <List>
            {filterItems(connections).length > 0 ? (
              filterItems(connections).map((connection, index) => (
                <React.Fragment key={index}>
                  <ListItemButton
                    component={Link}
                    to={`/vperfil/${connection.requestedBy}`}
                    sx={{ textDecoration: "none" }}
                  >
                    <ListItemAvatar>
                      <Avatar src={connection.fromLogo} alt={connection.name}>
                        <Person />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={connection.fromUserName} />
                  </ListItemButton>
                  {index < connections.length - 1 && <Divider />}
                </React.Fragment>
              ))
            ) : (
              <Typography variant="body1" sx={{ color: "#555" }}>
                Ainda não há conexões.
              </Typography>
            )}
          </List>
        </Box>
      )}
    </Box>
  );
};

export default ConnectionsDesk;

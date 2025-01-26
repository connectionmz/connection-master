import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Badge,
  Button,
} from "@mui/material";
import { Person, Check, Close } from "@mui/icons-material";
import { ref, onValue, update } from "firebase/database";
import { db } from "../../fb";

const ConnectionsDesk = ({ user }) => {
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);

  const userId = user.id

  useEffect(() => {
    if (!userId) return;

    const targetUserConnectionRef = ref(db, `connections/${userId}`);

    const unsubscribe = onValue(targetUserConnectionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();

        console.log(data)
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

    return () => unsubscribe(); // Limpar o listener ao desmontar o componente
  }, [userId]);

  const handleAccept = (requestId) => {
    const requestRef = ref(db, `connections/${userId}/${requestId}`);
    update(requestRef, { status: "accepted" }).catch((error) =>
      console.error("Erro ao aceitar o pedido:", error)
    );
  };

  const handleReject = (requestId) => {
    const requestRef = ref(db, `connections/${userId}/${requestId}`);
    update(requestRef, { status: "rejected" }).catch((error) =>
      console.error("Erro ao rejeitar o pedido:", error)
    );
  };

  return (
    <Box width='100%' minHeight="100vh">
      <Typography variant="h5" sx={{ marginBottom: 2, fontWeight: "bold" }}>
        Conexões
      </Typography>

      {/* Pending Requests */}
      <Box sx={{ marginBottom: 4 }}>
        <Typography variant="h6" sx={{ marginBottom: 1 }}>
          Pedidos Pendentes
        </Typography>
        <List>
          {pendingRequests.length > 0 ? (
            pendingRequests.map((request, index) => (
              <React.Fragment key={index}>
                <ListItem alignItems="center">
                  <ListItemAvatar>
                    <Avatar src={request.avatar} alt={request.name}>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText primary={request.name} secondary={request.email} />
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

      {/* Connections List */}
      <Box>
        <Typography variant="h6" sx={{ marginBottom: 1 }}>
          Minhas Conexões
        </Typography>
        <List>
          {connections.length > 0 ? (
            connections.map((connection, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemAvatar>
                    <Avatar src={connection.avatar} alt={connection.name}>
                      <Person />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={connection.name}
                    secondary={connection.email}
                  />
                </ListItem>
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
    </Box>
  );
};

export default ConnectionsDesk;

import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, List, ListItem, ListItemText, ListItemSecondaryAction, IconButton } from '@mui/material';
import { ref, onValue, update, remove } from 'firebase/database';
import { auth, db } from '../../fb';
import BackButton from '../BackButton';
import DeleteIcon from '@mui/icons-material/Delete';

const InboxDesk = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Função para buscar notificações
  useEffect(() => {
    const notificationsRef = ref(db, 'notifications');
    onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      const userNotifications = [];

      // Filtrando as notificações para o usuário logado
      for (const userId in data) {
        // Verifica se o usuário tem notificações
        if (data[userId]) {
          for (const notificationId in data[userId]) {
            const notification = data[userId][notificationId];
            if (userId === user.id) {
              userNotifications.push({
                id: notificationId,
                fromUserId: notification.fromUserId,
                fromUserName: notification.fromUserName,
                message: notification.message,
                status: notification.status,
                timestamp: notification.timestamp,
                type: notification.type,
              });
            }
          }
        }
      }

      setNotifications(userNotifications);
      setLoading(false);
    });

    return () => {
      setNotifications([]);
      setLoading(true);
    };
  }, [user.id]);

  // Função para marcar a notificação como lida
  const markAsRead = (notificationId) => {
    const notificationRef = ref(db, `notifications/${user.id}/${notificationId}`);
    update(notificationRef, { status: 'read' });
  };

  // Função para excluir a notificação
  const deleteNotification = (notificationId) => {
    const notificationRef = ref(db, `notifications/${user.id}/${notificationId}`);
    remove(notificationRef);
  };

  if (loading) {
    return <Typography>Carregando...</Typography>;
  }

  return (
    <Box width="100%" minHeight="100vh">
      <br/>
      <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom sx={{textAlign:'center'}}>
        Caixa de Entrada
      </Typography>

      {notifications.length === 0 ? (
        <Typography variant="h6" color="textSecondary">
          Nenhuma notificação encontrada.
        </Typography>
      ) : (
        <List>
          {notifications.map((notification) => (
            <ListItem key={notification.id}>
              <ListItemText
                primary={`${notification.fromUserName}: ${notification.message}`}
                secondary={`Tipo: ${notification.type} | Data: ${new Date(notification.timestamp).toLocaleString()}`}
              />
              <ListItemSecondaryAction>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => markAsRead(notification.id)}
                  disabled={notification.status === 'read'}
                >
                  {notification.status === 'read' ? 'Lida' : 'Marcar como lida'}
                </Button>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => deleteNotification(notification.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default InboxDesk;

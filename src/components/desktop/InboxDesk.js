import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  useMediaQuery,
} from '@mui/material';
import { ref, onValue, update, remove } from 'firebase/database';
import { auth, db } from '../../fb';
import BackButton from '../BackButton';
import DeleteIcon from '@mui/icons-material/Delete';

const InboxDesk = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width:600px)'); // Detecta dispositivos móveis

  // Função para buscar notificações
  useEffect(() => {
    const notificationsRef = ref(db, 'notifications');
    onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      const userNotifications = [];
      // Filtrando as notificações para o usuário logado
      for (const userId in data) {
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
    return <Typography variant="h6" align="center">Carregando...</Typography>;
  }

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        padding: isMobile ? 1 : 2, // Ajusta o padding para mobile
        boxSizing: 'border-box',
      }}
    >
      <BackButton sx={{ mb: 2 }} />
      <Typography
        variant="h4"
        component="h1"
        fontWeight="bold"
        gutterBottom
        sx={{
          textAlign: 'center',
          fontSize: isMobile ? '1.5rem' : '2rem', // Ajusta o tamanho da fonte para mobile
        }}
      >
        Caixa de Entrada
      </Typography>

      {notifications.length === 0 ? (
        <Typography
          variant="h6"
          color="textSecondary"
          sx={{
            textAlign: 'center',
            mt: 4,
            fontSize: isMobile ? '0.875rem' : '1rem', // Ajusta o tamanho da fonte para mobile
          }}
        >
          Nenhuma notificação encontrada.
        </Typography>
      ) : (
        <List
          sx={{
            maxWidth: isMobile ? '100%' : '600px', // Ajusta a largura máxima para mobile
            margin: '0 auto', // Centraliza horizontalmente
            '& .MuiListItem-root': {
              padding: isMobile ? '8px 16px' : '12px 24px', // Ajusta o padding dos itens da lista
            },
          }}
        >
          {notifications.map((notification) => (
            <ListItem
              key={notification.id}
              dense={isMobile} // Reduz o espaçamento em dispositivos móveis
              sx={{
                backgroundColor:
                  notification.status === 'unread' ? '#f9f9f9' : 'transparent', // Destaca notificações não lidas
              }}
            >
              <ListItemText
                primary={
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: isMobile ? '0.875rem' : '1rem', // Ajusta o tamanho da fonte para mobile
                    }}
                  >
                    {`${notification.fromUserName}: ${notification.message}`}
                  </Typography>
                }
                secondary={
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{
                      fontSize: isMobile ? '0.75rem' : '0.875rem', // Ajusta o tamanho da fonte para mobile
                    }}
                  >
                    {`Tipo: ${notification.type} | Data: ${new Date(
                      notification.timestamp
                    ).toLocaleString()}`}
                  </Typography>
                }
              />
              <ListItemSecondaryAction>
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={() => markAsRead(notification.id)}
                  disabled={notification.status === 'read'}
                  sx={{
                    fontSize: isMobile ? '0.75rem' : '0.875rem', // Ajusta o tamanho da fonte para mobile
                    px: isMobile ? 1 : 2, // Ajusta o padding horizontal
                    py: isMobile ? 0.5 : 1, // Ajusta o padding vertical
                  }}
                >
                  {notification.status === 'read' ? 'Lida' : 'Marcar como lida'}
                </Button>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={() => deleteNotification(notification.id)}
                  sx={{
                    ml: isMobile ? 0.5 : 1, // Ajusta o espaçamento entre botões
                  }}
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
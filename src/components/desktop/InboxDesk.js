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
  Paper,
  Divider,
  Avatar,
  Tooltip,
  Link,
} from '@mui/material';
import { ref, onValue, update, remove } from 'firebase/database';
import { auth, db } from '../../fb';
import BackButton from '../BackButton';
import DeleteIcon from '@mui/icons-material/Delete';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import EmailIcon from '@mui/icons-material/Email';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';

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
                link: notification?.link || ''
              });
            }
          }
        }
      }
      // Ordenar notificações por timestamp (mais recente primeiro)
      userNotifications.sort((a, b) => {
        const dateA = new Date(a.timestamp).getTime(); // Converte para timestamp
        const dateB = new Date(b.timestamp).getTime(); // Converte para timestamp
        return dateB - dateA; // Ordena em ordem decrescente
      });
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

  // Função para marcar todas as notificações como lidas
  const markAllAsRead = () => {
    notifications.forEach((notification) => {
      if (notification.status === 'unread') {
        const notificationRef = ref(db, `notifications/${user.id}/${notification.id}`);
        update(notificationRef, { status: 'read' });
      }
    });
  };

  // Função para excluir uma notificação
  const deleteNotification = (notificationId) => {
    const notificationRef = ref(db, `notifications/${user.id}/${notificationId}`);
    remove(notificationRef);
  };

  // Função para excluir todas as notificações
  const deleteAllNotifications = () => {
    notifications.forEach((notification) => {
      const notificationRef = ref(db, `notifications/${user.id}/${notification.id}`);
      remove(notificationRef);
    });
  };

  if (loading) {
    return <Typography variant="h6" align="center">Carregando...</Typography>;
  }

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        padding: isMobile ? 1 : 4, // Ajusta o padding para mobile
        backgroundColor: '#fff', // Fundo suave
      }}
    >
      <BackButton sx={{ mb: 2 }} />
      <Paper
        sx={{
          padding: isMobile ? 2 : 4,
          borderRadius: 2,
          maxWidth: isMobile ? '100%' : '800px', // Limita a largura máxima
          margin: '0 auto', // Centraliza horizontalmente
        }}
      >
        {/* Cabeçalho */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Marcar todas como lidas">
              <Button
                variant="contained"
                color="primary"
                startIcon={<MarkEmailReadIcon />}
                onClick={markAllAsRead}
                sx={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                }}
              >
                {isMobile ? 'Marcar todas' : 'Marcar todas como lidas'}
              </Button>
            </Tooltip>
            <Tooltip title="Eliminar todas as notificações">
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteForeverIcon />}
                onClick={deleteAllNotifications}
                sx={{
                  fontSize: isMobile ? '0.75rem' : '0.875rem',
                }}
              >
                {isMobile ? 'Eliminar todas' : 'Eliminar todas as notificações'}
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {notifications.length === 0 ? (
          <Typography
            variant="h6"
            color="textSecondary"
            sx={{
              textAlign: 'center',
              mt: 4,
              fontSize: isMobile ? '0.875rem' : '1rem', 
            }}
          >
            Nenhuma notificação encontrada.
          </Typography>
        ) : (
          <List sx={{ width: '100%' }}>
            {notifications.map((notification) => (
              <Paper
                key={notification.id}
                elevation={1}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  backgroundColor:
                    notification.status === 'unread' ? '#f9f9f9' : '#ffffff', 
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
              >
                <ListItem
                  dense={isMobile}
                  sx={{
                    padding: isMobile ? '8px 16px' : '12px 24px', 
                  }}
                >
                  <ListItemText
                    primary={
                      <Link
                        href={notification.link || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          textDecoration: 'none',
                          color: 'inherit',
                          '&:hover': {
                            textDecoration: 'underline',
                          },
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{
                            fontSize: isMobile ? '0.875rem' : '1rem', 
                            fontWeight: notification.status === 'unread' ? 'bold' : 'normal',
                          }}
                        >
                          {notification.message}
                        </Typography>
                      </Link>
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
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Marcar como lida">
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
                      </Tooltip>
                      <Tooltip title="Eliminar notificação">
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => deleteNotification(notification.id)}
                          sx={{
                            ml: isMobile ? 0.5 : 1, 
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </ListItemSecondaryAction>
                </ListItem>
              </Paper>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default InboxDesk;
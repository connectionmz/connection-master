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
  Chip,
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
  const isMobile = useMediaQuery('(max-width:600px)');
  const isSmallMobile = useMediaQuery('(max-width:400px)');

  useEffect(() => {
    if (!user?.id) return;

    const notificationsRef = ref(db, `notifications/${user.id}`);
    setLoading(true);

    const unsubscribe = onValue(notificationsRef, (snapshot) => {
      const data = snapshot.val();
      const userNotifications = [];

      if (data) {
        // Converter o objeto de notificações em array
        for (const notificationId in data) {
          const notification = data[notificationId];
          userNotifications.push({
            id: notificationId,
            fromUserId: notification.fromUserId,
            fromUserName: notification.fromUserName,
            message: notification.message,
            status: notification.status || 'unread', // Default para 'unread' se não existir
            timestamp: notification.timestamp,
            type: notification.type,
            link: notification?.link || ''
          });
        }

        // Ordenar por timestamp (mais recente primeiro)
        userNotifications.sort((a, b) => {
          // Converter strings de data para timestamps numéricos
          const dateA = new Date(a.timestamp).getTime();
          const dateB = new Date(b.timestamp).getTime();
          return dateB - dateA; // Ordem decrescente
        });

        setNotifications(userNotifications);
      } else {
        setNotifications([]); // Caso não haja notificações
      }

      setLoading(false);
    }, (error) => {
      console.error("Erro ao carregar notificações:", error);
      setLoading(false);
    });

    return () => {
      unsubscribe(); // Limpar o listener quando o componente desmontar
      setNotifications([]); // Resetar notificações
    };
}, [user.id]);

  const markAsRead = (notificationId) => {
    const notificationRef = ref(db, `notifications/${user.id}/${notificationId}`);
    update(notificationRef, { status: 'read' });
  };

  const markAllAsRead = () => {
    notifications.forEach((notification) => {
      if (notification.status === 'unread') {
        const notificationRef = ref(db, `notifications/${user.id}/${notification.id}`);
        update(notificationRef, { status: 'read' });
      }
    });
  };

  const deleteNotification = (notificationId) => {
    const notificationRef = ref(db, `notifications/${user.id}/${notificationId}`);
    remove(notificationRef);
  };

  const deleteAllNotifications = () => {
    notifications.forEach((notification) => {
      const notificationRef = ref(db, `notifications/${user.id}/${notification.id}`);
      remove(notificationRef);
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Typography variant="h6" align="center">Carregando...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        padding: isMobile ? 1 : 4,
        backgroundColor: '#f5f7fa',
      }}
    >
      <BackButton sx={{ mb: 2 }} />
      <Paper
        sx={{
          padding: isMobile ? 2 : 3,
          borderRadius: 2,
          maxWidth: '100%',
          margin: '0 auto',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        {/* Cabeçalho */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            justifyContent: 'space-between',
            mb: 3,
            gap: isMobile ? 2 : 0,
          }}
        >
          <Typography 
            variant="h5" 
            component="h1"
            sx={{
              fontWeight: 600,
              fontSize: isMobile ? '1.25rem' : '1.5rem',
              color: '#2c3e50',
            }}
          >
            Suas Notificações
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            gap: 1,
            flexWrap: 'wrap',
            justifyContent: isMobile ? 'flex-start' : 'flex-end',
            width: isMobile ? '100%' : 'auto',
          }}>
            <Tooltip title="Marcar todas como lidas">
              <Button
                variant="contained"
                color="primary"
                size={isMobile ? 'small' : 'medium'}
                startIcon={<MarkEmailReadIcon />}
                onClick={markAllAsRead}
                sx={{
                  minWidth: 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                {isMobile ? 'Ler todas' : 'Marcar como lidas'}
              </Button>
            </Tooltip>
            <Tooltip title="Eliminar todas">
              <Button
                variant="outlined"
                color="error"
                size={isMobile ? 'small' : 'medium'}
                startIcon={<DeleteForeverIcon />}
                onClick={deleteAllNotifications}
                sx={{
                  minWidth: 'auto',
                  whiteSpace: 'nowrap',
                }}
              >
                {isMobile ? 'Limpar' : 'Limpar tudo'}
              </Button>
            </Tooltip>
          </Box>
        </Box>

        {notifications.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            py: 4 
          }}>
            <EmailIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
            <Typography
              variant="h6"
              color="textSecondary"
              sx={{
                textAlign: 'center',
                fontSize: isMobile ? '1rem' : '1.25rem',
              }}
            >
              Nenhuma notificação encontrada
            </Typography>
          </Box>
        ) : (
          <List sx={{ width: '100%', p: 0 }}>
            {notifications.map((notification) => (
              <Paper
                key={notification.id}
                elevation={0}
                sx={{
                  mb: 2,
                  borderRadius: 2,
                  borderLeft: notification.status === 'unread' ? '4px solid #1976d2' : '4px solid transparent',
                  backgroundColor: notification.status === 'unread' ? '#f0f7ff' : '#ffffff',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                  },
                }}
              >
                <ListItem
                  sx={{
                    p: isMobile ? 1 : 2,
                    alignItems: 'flex-start',
                    flexDirection: isSmallMobile ? 'column' : 'row',
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    flex: 1,
                    minWidth: 0, // Previne overflow
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      mb: 0.5,
                      gap: 1,
                    }}>
                      {notification.status === 'unread' && (
                        <Chip 
                          label="Nova" 
                          size="small" 
                          color="primary" 
                          sx={{ 
                            height: 20,
                            fontSize: '0.65rem',
                            fontWeight: 'bold',
                          }} 
                        />
                      )}
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  fontSize: '0.75rem',
                }}
              >
                {new Date(notification.timestamp).toLocaleString('pt-PT', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </Typography>
                    </Box>
                    <ListItemText
                     onClick={() => markAsRead(notification.id)}
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
                              fontWeight: notification.status === 'unread' ? '600' : '400',
                              wordBreak: 'break-word',
                            }}
                          >
                            {notification.message}
                          </Typography>
                        </Link>
                      }
                    />
                  </Box>
                  
                  <ListItemSecondaryAction
                    sx={{
                      position: isSmallMobile ? 'relative' : 'absolute',
                      right: isSmallMobile ? 0 : 16,
                      top: isSmallMobile ? 'auto' : 16,
                      transform: isSmallMobile ? 'none' : 'translateY(0)',
                      display: 'flex',
                      flexDirection: isSmallMobile ? 'row' : 'column',
                      gap: isSmallMobile ? 1 : 0.5,
                      mt: isSmallMobile ? 1 : 0,
                      alignItems: 'center',
                    }}
                  >
                    <Tooltip title={notification.status === 'read' ? 'Já lida' : 'Marcar como lida'}>
                      <IconButton
                        size="small"
                        color={notification.status === 'read' ? 'default' : 'primary'}
                        onClick={() => markAsRead(notification.id)}
                        disabled={notification.status === 'read'}
                        sx={{
                          bgcolor: notification.status === 'read' ? 'action.selected' : 'primary.light',
                          '&:hover': {
                            bgcolor: notification.status === 'read' ? 'action.selected' : 'primary.main',
                            color: 'white',
                          },
                        }}
                      >
                        <MarkEmailReadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Excluir">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => deleteNotification(notification.id)}
                        sx={{
                          bgcolor: 'error.light',
                          '&:hover': {
                            bgcolor: 'error.main',
                            color: 'white',
                          },
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
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
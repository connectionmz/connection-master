import React, { useState, useEffect } from 'react';
import { ref, onValue, update, remove } from 'firebase/database';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../fb';
import { Clear, DoneAll } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { Box, Tabs, Tab, List, ListItem, ListItemText, IconButton, Button, Typography } from '@mui/material';

const InboxDesk = () => {
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    if (user) {
      const inboxRef = ref(db, `company/${user.uid}/inbox`);
      onValue(inboxRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const messagesArray = Object.keys(data)
            .map(key => ({ id: key, ...data[key] }))
            .sort((a, b) => b.timestamp - a.timestamp); 
          setMessages(messagesArray);
        }
      });
    }
  }, [user]);

  const markAsRead = (messageId) => {
    const messageRef = ref(db, `company/${user.uid}/inbox/${messageId}`);
    update(messageRef, { opened: true });
  };

  const deleteMessage = (messageId) => {
    const messageRef = ref(db, `company/${user.uid}/inbox/${messageId}`);
    remove(messageRef).then(() => {
      setMessages(prevMessages => prevMessages.filter(message => message.id !== messageId));
    }).catch((error) => {
      console.error('Error deleting message:', error);
    });
  };

  const handleOpenMessage = (message) => {
    setSelectedMessage(message);
    markAsRead(message.id);
  };

  const unreadMessages = messages.filter(message => !message.opened);
  const readMessages = messages.filter(message => message.opened);

  return (
    <Box className="container" sx={{ mt: 8, p: 4 }}>
      <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
        Caixa de entrada
      </Typography>

      {selectedMessage ? (
        <Box sx={{ bgcolor: 'gray.100', p: 4, borderRadius: 2 }}>
          <Typography variant="h6" fontWeight="bold">{selectedMessage.title}</Typography>
          <Typography variant="body2" color="textSecondary">{new Date(selectedMessage.timestamp).toLocaleString()}</Typography>
          <Typography variant="body1" sx={{ my: 2 }} dangerouslySetInnerHTML={{ __html: selectedMessage.proposal }} />
          <Link to={selectedMessage.content.url} target="_blank" rel="noopener noreferrer">
            Ir ao conteúdo
          </Link>
          <Button sx={{ mt: 2 }} variant="contained" color="primary" onClick={() => setSelectedMessage(null)}>
            Voltar
          </Button>
        </Box>
      ) : (
        <>
          <Tabs value={tabIndex} onChange={(e, newIndex) => setTabIndex(newIndex)} aria-label="messages tabs">
            <Tab label={`Não lidas (${unreadMessages.length})`} />
            <Tab label={`Lidas (${readMessages.length})`} />
            <Tab label={`Todas (${messages.length})`} />
          </Tabs>

          <Box sx={{ mt: 4 }}>
            {tabIndex === 0 && (
              <List>
                {unreadMessages.length > 0 ? (
                  unreadMessages.map((message) => (
                    <ListItem key={message.id} sx={{ bgcolor: 'gray.100', mb: 2 }}>
                      <ListItemText
                        primary={message.title || 'No Title'}
                        secondary={new Date(message.timestamp).toLocaleString()}
                        onClick={() => handleOpenMessage(message)}
                        sx={{ cursor: 'pointer' }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton color="success" onClick={() => markAsRead(message.id)}><DoneAll /></IconButton>
                        <IconButton color="error" onClick={() => deleteMessage(message.id)}><Clear /></IconButton>
                      </Box>
                    </ListItem>
                  ))
                ) : (
                  <Typography color="textSecondary">Nenhuma mensagem não lida.</Typography>
                )}
              </List>
            )}

            {tabIndex === 1 && (
              <List>
                {readMessages.length > 0 ? (
                  readMessages.map((message) => (
                    <ListItem key={message.id} sx={{ bgcolor: 'gray.50', mb: 2 }}>
                      <ListItemText
                        primary={message.title || 'No Title'}
                        secondary={new Date(message.timestamp).toLocaleString()}
                        onClick={() => handleOpenMessage(message)}
                        sx={{ cursor: 'pointer' }}
                      />
                      <Button variant="outlined" color="error" onClick={() => deleteMessage(message.id)}>
                        Excluir
                      </Button>
                    </ListItem>
                  ))
                ) : (
                  <Typography color="textSecondary">Nenhuma mensagem lida.</Typography>
                )}
              </List>
            )}

            {tabIndex === 2 && (
              <List>
                {messages.length > 0 ? (
                  messages.map((message) => (
                    <ListItem key={message.id} sx={{ bgcolor: message.opened ? 'gray.50' : 'gray.100', mb: 2 }}>
                      <ListItemText
                        primary={message.title || 'No Title'}
                        secondary={new Date(message.timestamp).toLocaleString()}
                        onClick={() => handleOpenMessage(message)}
                        sx={{ cursor: 'pointer' }}
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {!message.opened && (
                          <Button variant="contained" color="primary" onClick={() => markAsRead(message.id)} sx={{ mr: 2 }}>
                            Marcar como lida
                          </Button>
                        )}
                        <Button variant="outlined" color="error" onClick={() => deleteMessage(message.id)}>
                          Excluir
                        </Button>
                      </Box>
                    </ListItem>
                  ))
                ) : (
                  <Typography color="textSecondary">Nenhuma notificação.</Typography>
                )}
              </List>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default InboxDesk;

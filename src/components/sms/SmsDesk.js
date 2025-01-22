import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../fb';
import { Box, Typography, Paper, List, ListItem, ListItemText, Divider } from '@mui/material';
import BackButton from '../BackButton';


const SmsDesk = ({ user }) => {

  console.log(user)
  const [smsBalance, setSmsBalance] = useState();
  const [smsHistory, setSmsHistory] = useState([]);

  useEffect(() => {
    const userRef = ref(db, `company/${user.id}/activeModules/moduloSMS`);
    onValue(userRef, (snapshot) => {
      const data = snapshot.val();
      console.log(data);
      setSmsBalance(data?.smsCount || 0);
    });
  }, [user.id]);

  return (
    <Box sx={{ maxWidth: 'lg', margin: 'auto', padding: 4, backgroundColor: 'white', borderRadius: 2, boxShadow: 3, marginTop: 5 }}>
            <BackButton sx={{ mb: 2 }} />

      <Typography variant="h3" align="center" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
        Módulo de SMS
      </Typography>

      <Typography variant="body1" align="center" sx={{ color: 'text.secondary', marginBottom: 3, lineHeight: 1.5 }}>
        O módulo de SMS é uma solução prática e eficiente para empresas que desejam estar sempre informadas sobre os pedidos de cotação e outras interações na plataforma.
      </Typography>

      <Paper sx={{ backgroundColor: 'lightblue', padding: 3, borderRadius: 2, marginBottom: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          Saldo de SMS
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>
          Saldo atual: <strong>{smsBalance} SMS</strong>
        </Typography>
      </Paper>

      <Paper sx={{ backgroundColor: 'lightgreen', padding: 3, borderRadius: 2, marginBottom: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
          Histórico de SMS
        </Typography>
        {smsHistory.length > 0 ? (
          <List sx={{ padding: 0 }}>
            {smsHistory.slice(0, 5).map((sms) => (
              <ListItem key={sms.id} sx={{ padding: 1, borderBottom: 1, borderColor: 'divider' }}>
                <ListItemText
                  primary={<Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>{sms.date || 'Data desconhecida'}</Typography>}
                  secondary={sms.message}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            Nenhum SMS recebido até o momento.
          </Typography>
        )}
      </Paper>

      <Typography variant="body1" align="center" sx={{ color: 'text.secondary', marginBottom: 3, lineHeight: 1.5 }}>
        Mantenha sua equipe informada em tempo real, aumentando a agilidade no atendimento e a chance de fechar negócios rapidamente.
      </Typography>
    </Box>
  );
};

export default SmsDesk;

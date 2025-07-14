import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import BackButton from '../BackButton';
import InfoIcon from '@mui/icons-material/Info';
import { formatPrice } from '../../utils/utils';

const SmsDesk = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [activeTab, setActiveTab] = useState(1); // Set to Info tab by default
  const MONTHLY_SUBSCRIPTION_PRICE = 270;

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ 
      maxWidth: 'lg', 
      margin: 'auto', 
      padding: isMobile ? 2 : 4, 
      backgroundColor: '#f5f5f5', 
      borderRadius: 2, 
      boxShadow: 3, 
      marginTop: isMobile ? 3 : 5 
    }}>
      <BackButton sx={{ mb: 2 }} />

    
      {activeTab === 1 && (
        <Paper sx={{ 
          backgroundColor: '#fff', 
          padding: isMobile ? 2 : 3, 
          borderRadius: 2, 
          marginBottom: 4, 
          boxShadow: 2 
        }}>
          <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold', color: '#333', mb: 2 }}>
            Como funciona o plano de notificações por email?
          </Typography>
          
          <Typography paragraph sx={{ fontSize: isMobile ? '0.875rem' : '1rem' }}>
            Receba alertas instantâneos sobre novos pedidos de cotação e concursos públicos do seu setor, diretamente no seu e-mail — seja na sua província ou em todo o país. Não perca nenhuma oportunidade!
          </Typography>
          
          <Typography paragraph sx={{ fontWeight: 'bold', fontSize: isMobile ? '0.875rem' : '1rem' }}>
            Benefícios do plano:
          </Typography>
          
          <Box component="ul" sx={{ 
            pl: isMobile ? 2 : 3,
            '& li': { 
              fontSize: isMobile ? '0.875rem' : '1rem',
              mb: 1
            }
          }}>
            <li><Typography>Notificações por Email</Typography></li>
            <li><Typography>Cobertura para todos os pedidos do seu setor</Typography></li>
            <li><Typography>Sem custos adicionais</Typography></li>
            <li><Typography>Renovação mensal automática</Typography></li>
          </Box>
          
          <Typography paragraph sx={{ fontWeight: 'bold' }}>
            Valor mensal: {formatPrice(MONTHLY_SUBSCRIPTION_PRICE)} MT
          </Typography>
          
          <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 'bold', mt: 3, mb: 1 }}>
            Perguntas Frequentes
          </Typography>
          
          <Box sx={{ 
            '& > *': { 
              mb: 2,
              fontSize: isMobile ? '0.875rem' : '1rem'
            } 
          }}>
            <Typography>
              <strong>Como ativo o plano?</strong><br />
              Basta clicar em "Ativar Assinatura" e seguir os passos para pagamento.
            </Typography>
            <Typography>
              <strong>Quais métodos de pagamento aceitamos?</strong><br />
              M-Pesa e e-Mola. O pagamento é rápido e seguro.
            </Typography>
            <Typography>
              <strong>Posso cancelar a qualquer momento?</strong><br />
              Sim, você pode cancelar a renovação automática quando quiser.
            </Typography>
            <Typography>
              <strong>Quando recebo as notificações?</strong><br />
              Imediatamente quando um cliente faz um pedido no seu setor.
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default SmsDesk;
import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Divider,
  Chip,
  useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import PaymentIcon from '@mui/icons-material/Payment';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const PagamentoAccordion = ({ data }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const handleOpenModal = () => setOpen(true);
  const handleCloseModal = () => setOpen(false);

  return (
    <>
      <Accordion 
        sx={{ 
          mt: 2,
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          overflow: 'hidden',
          '&:before': {
            display: 'none'
          }
        }}
      >
        <AccordionSummary 
          expandIcon={<ExpandMoreIcon />}
          sx={{
            backgroundColor: theme.palette.mode === 'light' ? '#f5f5f5' : '#121212',
            borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <PaymentIcon sx={{color:'#d32f2f'}} />
            <Typography variant="h6" fontWeight="bold" sx={{color:'#d32f2f'}}>
              Pagamento via M-Pesa
            </Typography>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails sx={{ pt: 3, pb: 3 }}>
          <Box 
            sx={{
              backgroundColor: '#e8f5e9',
              p: 2,
              borderRadius: '8px',
              mb: 3,
              borderLeft: '4px solid #d32f2f'
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" color="#2e7d32">
              Código de Serviço: 902444
            </Typography>
            <Typography variant="body2" color="#2e7d32">
             Entidade: Connection Mozambique
            </Typography>
          </Box>

          {/* Passos do pagamento */}
          <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ mt: 2 }}>
            <SmartphoneIcon sx={{ verticalAlign: 'middle', mr: 1, color:'#d32f2f' }} />
            Procedimento de Pagamento:
          </Typography>
        {[
  `Digita *150#`,
  `Escolha a opção 6. Pagamentos`,
  `Escolha a opção 7. Digita o código do serviço`,
  `Digita 902444 (código de serviço)`,
  `Digita a referência ${data.key}`,
  `Digita o valor a pagar ${data.price} MT`,
  `Confirme a Entidade: Connection Mozambique, LDA`,
  `Digita o teu PIN`,
  `Confirma a transação`
].map((step, index) => (
  <Typography
    key={index}
    variant="body2"
    sx={{
      display: 'flex',
      alignItems: 'flex-start',
      mb: 1.5,
      '&:before': {
        content: `"${index + 1}"`,
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '24px',
        height: '24px',
        background: '#e8f5e9',
        borderRadius: '50%',
        mr: 1.5,
        flexShrink: 0,
        color: '#2e7d32',
        fontWeight: 'bold',
        fontSize: '0.75rem'
      }
    }}
  >
    {step.split(' ').map((word, i) => {
      // Words to highlight
      const highlightWords = [
        '*150#',
        '6.',
        '7.',
        '902444',
        data.key,
        `${data.price}`,
        `${data.price} MT`,
        'Connection',
        'Mozambique',
        'PIN'
      ];
      
      // Clean word for comparison (remove punctuation)
      const cleanedWord = word.replace(/[.,:;()#]/g, '');
      
      return (
        <React.Fragment key={i}>
          {highlightWords.includes(cleanedWord) ? (
            <Box 
              component="span" 
              sx={{
                color: '#d32f2f',
                fontWeight: 'bold',
                bgcolor: i === 0 ? 'transparent' : 'rgba(211, 47, 47, 0.08)',
                px: i === 0 ? 0 : 0.5,
                borderRadius: i === 0 ? 0 : '4px',
                display: 'inline-block'
              }}
            >
              {word}
            </Box>
          ) : (
            word
          )}
          {' '}
        </React.Fragment>
      );
    })}
  </Typography>
))}

<Accordion sx={{ 
  mt: 3, 
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  borderLeft: '4px solid rgb(255, 0, 30)'
}}>
  <Accordion 
  sx={{ 
    mt: 3,
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    '&:before': {
      display: 'none'
    }
  }}
>
  <AccordionSummary 
    expandIcon={<ExpandMoreIcon />}
    sx={{
      backgroundColor: theme.palette.mode === 'light' ? '#f5f5f5' : '#121212',
      borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
    }}
  >
    <Box display="flex" alignItems="center" gap={2}>
      <CheckCircleIcon sx={{color: '#d32f2f'}} />
      <Typography variant="h6" fontWeight="bold" sx={{color: '#d32f2f'}}>
        Validação do Pagamento
      </Typography>
    </Box>
  </AccordionSummary>
  
  <AccordionDetails sx={{ pt: 3, pb: 3 }}>
    <Typography variant="body1" paragraph>
      Para garantir que o seu pagamento seja confirmado rapidamente, siga estes passos:
    </Typography>

    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        1. Capture o Comprovativo
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: '1rem', mr: 1 }} />
        <Typography variant="body2">
          Se recebeu uma mensagem (SMS) de confirmação: Tire um print (captura de tela) dessa mensagem.
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: '1rem', mr: 1 }} />
        <Typography variant="body2">
          Se usou o aplicativo M-Pesa: Faça o download do recibo (factura) do pagamento.
        </Typography>
      </Box>
    </Box>

    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        2. Preencha o Formulário
      </Typography>
      <Typography variant="body2" paragraph>
        No formulário de validação, informe:
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: '1rem', mr: 1 }} />
        <Typography variant="body2">
          Nome da conta que fez o pagamento (copie da mensagem ou recibo).
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: '1rem', mr: 1 }} />
        <Typography variant="body2">
          Número de referência do pagamento (copie da mensagem ou recibo).
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: '1rem', mr: 1 }} />
        <Typography variant="body2">
          Um contacto telefónico alternativo (caso precisemos de confirmar algo).
        </Typography>
      </Box>
    </Box>

    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        3. Anexe o Comprovativo
      </Typography>
      <Typography variant="body2">
        No campo "Carregar comprovativo", anexe:
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: '1rem', mr: 1 }} />
        <Typography variant="body2">
          A captura de tela da mensagem ou o recibo (factura) do pagamento.
        </Typography>
      </Box>
    </Box>

    <Box sx={{ mb: 3 }}>
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
        4. Finalize o Envio
      </Typography>
      <Typography variant="body2">
        Clique em "Enviar comprovativo" para concluir.
      </Typography>
    </Box>

    <Box sx={{ 
      backgroundColor: '#e8f5e9',
      p: 2,
      borderRadius: '8px',
      mb: 3,
      borderLeft: '4px solid #2e7d32'
    }}>
      <Typography variant="subtitle1" fontWeight="bold" color="#2e7d32" gutterBottom>
        Por que esses passos são importantes?
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: '1rem', mr: 1 }} />
        <Typography variant="body2" color="#2e7d32">
          Garantem a validação rápida do seu pagamento.
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <CheckCircleIcon sx={{ color: '#2e7d32', fontSize: '1rem', mr: 1 }} />
        <Typography variant="body2" color="#2e7d32">
          Evitam atrasos no processamento.
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <CloseIcon sx={{ color: '#d32f2f', fontSize: '1rem', mr: 1 }} />
        <Typography variant="body2" color="#d32f2f">
          Ignorar esses passos pode dificultar ou até impedir a confirmação do pagamento.
        </Typography>
      </Box>
    </Box>

    <Typography variant="body2" paragraph>
      Agradecemos sua colaboração! Siga essas instruções para que tudo seja concluído sem problemas. 😊
    </Typography>

    <Typography variant="body2" fontStyle="italic">
      Nota: Se tiver dúvidas, entre em contacto com o nosso suporte.
    </Typography>
  </AccordionDetails>
</Accordion>
</Accordion>

          {/* Botão de demonstração */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleOpenModal}
              sx={{
                borderRadius: '24px',
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(243, 7, 7, 0.3)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(243, 7, 7, 0.3)'
                }
              }}
            >
              Ver Demonstração em Vídeo
            </Button>
          </Box>
        </AccordionDetails>
      </Accordion>

      {/* Modal de demonstração */}
      <Dialog 
        open={open} 
        onClose={handleCloseModal} 
        fullWidth 
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          backgroundColor: '#d32f2f',
          color: 'white',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Demonstração de Pagamento M-Pesa
          <IconButton
            aria-label="close"
            onClick={handleCloseModal}
            sx={{
              color: 'white'
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          <Box sx={{ position: 'relative', paddingTop: '56.25%' }}>
            <iframe
              src="https://www.youtube.com/embed/VUfdUdCQ174"
              title="Demonstração de Pagamento M-Pesa"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PagamentoAccordion;
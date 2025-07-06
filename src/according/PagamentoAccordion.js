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
  useTheme,
  useMediaQuery
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import PaymentIcon from '@mui/icons-material/Payment';
import SmartphoneIcon from '@mui/icons-material/Smartphone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import EmailIcon from '@mui/icons-material/Email';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const PagamentoAccordion = ({ data }) => {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleOpenModal = () => setOpen(true);
  const handleCloseModal = () => setOpen(false);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(text);
      setTimeout(() => setCopied(''), 2000);
    }
  };

  const bankAccounts = [
    {
      bank: 'MOZA BANCO, S.A',
      nib: '00340000426791710106',
      account: '42679210001'
    },
    {
      bank: 'FNB MOÇAMBIQUE',
      nib: '001400004345188210122',
      account: '4345188210001'
    }
  ];

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
        <AccordionDetails>
          <Accordion sx={{ 
            borderRadius: '8px',
            borderLeft: '4px solid #1976d2'
          }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box display="flex" alignItems="center" gap={2}>
                <AccountBalanceIcon sx={{color: '#1976d2'}} />
                <Typography variant={isMobile ? "body1" : "subtitle1"} fontWeight="bold">
                  Transferência Bancária
                </Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body1" paragraph>
                Para pagamentos via transferência bancária, utilize os seguintes dados:
              </Typography>

              {bankAccounts.map((account, index) => (
                <Box key={index} sx={{ 
                  mb: 3,
                  p: 2,
                  backgroundColor: '#e3f2fd',
                  borderRadius: '8px',
                  borderLeft: '4px solid #1976d2'
                }}>
                  <Typography variant={isMobile ? "body1" : "subtitle1"} fontWeight="bold" gutterBottom>
                    {account.bank}
                  </Typography>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" fontWeight="bold">
                      NIB:
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#ffffff',
                      p: 1,
                      borderRadius: '4px',
                      mt: 1
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          wordBreak: 'break-all',
                          fontFamily: 'monospace'
                        }}
                      >
                        {account.nib}
                      </Typography>
                      <IconButton 
                        size="small"
                        onClick={() => handleCopy(account.nib)}
                        title="Copiar NIB"
                        sx={{ ml: 1 }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      Número da Conta:
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#ffffff',
                      p: 1,
                      borderRadius: '4px',
                      mt: 1
                    }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          wordBreak: 'break-all',
                          fontFamily: 'monospace'
                        }}
                      >
                        {account.account}
                      </Typography>
                      <IconButton 
                        size="small"
                        onClick={() => handleCopy(account.account)}
                        title="Copiar Conta"
                        sx={{ ml: 1 }}
                      >
                        <ContentCopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              ))}

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight="bold">
                  Referência:
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {data.key}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" fontWeight="bold">
                  Valor:
                </Typography>
                <Typography variant="body2">
                  {data.price} MT
                </Typography>
              </Box>

              <Box sx={{ 
                mt: 3,
                p: 2,
                backgroundColor: '#fff8e1',
                borderRadius: '8px',
                borderLeft: '4px solid #ffa000'
              }}>
                <Typography variant={isMobile ? "body1" : "subtitle1"} fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmailIcon color="primary" /> Envio do Comprovativo
                </Typography>
                <Typography variant="body2" paragraph>
                  Após realizar a transferência, envie o comprovativo para:
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  backgroundColor: '#e3f2fd',
                  p: 1,
                  borderRadius: '4px',
                  justifyContent: 'space-between',
                  mb: 2
                }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      wordBreak: 'break-all',
                      fontFamily: 'monospace'
                    }}
                  >
                    comercial@connectionmozambique.com
                  </Typography>
                  <IconButton 
                    size="small"
                    onClick={() => handleCopy('comercial@connectionmozambique.com')}
                    title="Copiar email">
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                  No assunto do email, inclua a referência: <strong>{data.key}</strong>
                </Typography>
              </Box>
              <Box sx={{ mt: 3 }}>
                <Typography variant={isMobile ? "body1" : "subtitle2"} fontWeight="bold" gutterBottom>
                  Informações importantes:
                </Typography>
                <Box component="ul" sx={{ 
                  pl: 2,
                  '& li': {
                    mb: 1
                  }
                }}>
                  <li>
                    <Typography variant="body2">
                      O comprovativo deve estar legível com todos os dados visíveis
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      Inclua no corpo do email o nome da pessoa/empresa que realizou o pagamento
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2">
                      O processamento pode levar até 24 horas úteis após envio do comprovativo
                    </Typography>
                  </li>
                </Box>
              </Box>
            </AccordionDetails>
          </Accordion>
        </AccordionDetails>
      </Accordion>
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
        }}>
      </Dialog>
    </>
  );
};

export default PagamentoAccordion;
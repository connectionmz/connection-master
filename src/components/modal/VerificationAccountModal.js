import React, { useState } from 'react';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';

const VerificationAccountModal = ({user}) => {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ 
    open: false, 
    message: "", 
    severity: "info" 
  });

  const handleResend = async () => {
    // Your resend logic here
  };

  return (
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
      <DialogTitle>Conta em verificação</DialogTitle>
      <DialogContent>
        <Box sx={{ maxHeight: '400px', overflowY: 'auto', padding: 2 }}>
        <Typography variant="h6" gutterBottom>
              A sua conta está em processo de verificação
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Assim que a verificação for concluída, enviaremos um email para:
            </Typography>
            <Typography variant="body1" sx={{ 
              fontWeight: 500, 
              color: "#2e7d32", 
              mb: 4,
              wordBreak: "break-word"
            }}>
              {user?.email}
            </Typography>
            <Button
              variant="contained"
              color="success"
              fullWidth
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
              sx={{ mb: 2 }}>
              {loading ? "A reenviar..." : "Reenviar email de verificação"}
            </Button>
            <Typography 
              variant="caption" 
              color="text.secondary" 
              sx={{ mt: 3, display: "block" }}
            >
              Se não receber o email em alguns minutos, verifique o spam ou{" "}
              <Button 
                size="small" 
                onClick={() => alert("Função de reporte em breve.")}
                sx={{ verticalAlign: "baseline" }}
              >
                reporte a demora
              </Button>
              .
            </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default VerificationAccountModal;
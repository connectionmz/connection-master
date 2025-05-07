import React, { useState } from "react";
import {
  Box,
  Container,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Typography,
} from "@mui/material";
import { Mail } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import logo from '../../img/bg.png';
import BackButton from "../BackButton";

const VerifyAccount = ({ user }) => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ 
    open: false, 
    message: "", 
    severity: "info" 
  });
  const navigate = useNavigate();

  const handleResend = async () => {
    // Your resend logic here
  };

  return (
    <Box sx={{ 
      minHeight: "100vh", 
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      pt: 8
    }}>
      {/* Centered Logo */}
      

      {/* Content */}
      <Container maxWidth="sm">
      <BackButton sx={{ mb: 3 }} />
        <Card elevation={3} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: "center", py: 6, px: 4 }}> 
            <Box
              sx={{
                borderRadius: "50%",
                mx: "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 3,
              }}
              >
                <Box 
                    component="img" 
                    src={logo} 
                    alt="Logo" 
                    sx={{ 
                    height: 80, 
                    mb: 4,
                    }} 
                />
            </Box>
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
              onClick={handleResend}
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
          </CardContent>
        </Card>
      </Container>

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback({ ...feedback, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert 
          onClose={() => setFeedback({ ...feedback, open: false })} 
          severity={feedback.severity}
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VerifyAccount;
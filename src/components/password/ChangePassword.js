import { useState } from "react";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../../fb";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Stack,
  FormControl,
} from "@mui/material";

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", error: false });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = formData;

    if (newPassword !== confirmPassword) {
      setFeedback({ message: "As senhas não coincidem.", error: true });
      return;
    }

    setLoading(true);
    const user = auth.currentUser;

    if (!user) {
      setFeedback({ message: "Usuário não autenticado.", error: true });
      setLoading(false);
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setFeedback({ 
        message: "Senha atualizada com sucesso!", 
        error: false 
      });
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Erro ao atualizar senha:", error.message);
      setFeedback({ 
        message: "Erro ao atualizar a senha. Verifique as informações.", 
        error: true 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100%",
        p: 2
      }}
    >
      <Paper elevation={3} sx={{ p: 4, width: "100%", maxWidth: "500px" }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
          Alterar Senha
        </Typography>
        
        <FormControl component="form" onSubmit={handleChangePassword} fullWidth>
          <Stack spacing={3}>
            <TextField
              label="Senha Atual"
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              required
              fullWidth
              variant="outlined"
            />
            
            <TextField
              label="Nova Senha"
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              required
              fullWidth
              variant="outlined"
            />
            
            <TextField
              label="Confirmar Nova Senha"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              fullWidth
              variant="outlined"
            />
            
            {feedback.message && (
              <Alert severity={feedback.error ? "error" : "success"}>
                {feedback.message}
              </Alert>
            )}
            
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 2 }}
              endIcon={loading && <CircularProgress size={24} />}
            >
              {loading ? "Atualizando..." : "Atualizar Senha"}
            </Button>
          </Stack>
        </FormControl>
      </Paper>
    </Box>
  );
};

export default ChangePassword;
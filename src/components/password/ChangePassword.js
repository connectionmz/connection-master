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
import { useLanguage } from "../../context/LanguageContext";

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: "", error: false });
  const { t } = useLanguage();

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
      setFeedback({ message: t('password.error.mismatch'), error: true });
      return;
    }

    setLoading(true);
    const user = auth.currentUser;

    if (!user) {
      setFeedback({ message: t('password.error.unauthenticated'), error: true });
      setLoading(false);
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setFeedback({ 
        message: t('password.success'),
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
        message: t('password.error.generic'),
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
        bgcolor: 'background.default',
        p: { xs: 2, sm: 4 },
      }}
    >
      <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, width: "100%", maxWidth: "500px", borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
          {t('password.changeTitle')}
        </Typography>
        
        <FormControl component="form" onSubmit={handleChangePassword} fullWidth>
          <Stack spacing={3}>
            <TextField
              label={t('auth.currentPassword')}
              type="password"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleInputChange}
              required
              fullWidth
              variant="outlined"
              autoComplete="current-password"
              inputProps={{ 'aria-label': t('auth.currentPassword') }}
            />
            
            <TextField
              label={t('auth.newPassword')}
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              required
              fullWidth
              variant="outlined"
              autoComplete="new-password"
              inputProps={{ 'aria-label': t('auth.newPassword') }}
            />
            
            <TextField
              label={t('auth.confirmPassword')}
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              fullWidth
              variant="outlined"
              autoComplete="new-password"
              inputProps={{ 'aria-label': t('auth.confirmPassword') }}
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
              {loading ? t('password.updating') : t('password.update')}
            </Button>
          </Stack>
        </FormControl>
      </Paper>
    </Box>
  );
};

export default ChangePassword;

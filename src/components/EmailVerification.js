import React, { useState } from 'react';
import { Alert, Box, Button, CircularProgress, Container, Paper, Stack, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/MarkEmailReadOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import ReplayIcon from '@mui/icons-material/Replay';
import { useNavigate } from 'react-router-dom';
import { signOut, sendEmailVerification } from 'firebase/auth';
import { auth } from '../fb';
import { useLanguage } from '../context/LanguageContext';

const EmailVerification = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isResending, setIsResending] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const email = auth.currentUser?.email || t('auth.email');

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/auth');
    } catch (error) {
      setFeedback({ severity: 'error', message: t('emailVerification.error') });
    }
  };

  const handleResendVerificationEmail = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setFeedback({ severity: 'error', message: t('emailVerification.noUser') });
      return;
    }

    setIsResending(true);
    setFeedback(null);
    try {
      await sendEmailVerification(currentUser);
      setFeedback({ severity: 'success', message: t('emailVerification.sent') });
    } catch (error) {
      setFeedback({ severity: 'error', message: t('emailVerification.error') });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'grid', placeItems: 'center', p: { xs: 2, sm: 4 } }}>
      <Container maxWidth="sm" disableGutters>
        <Paper component="section" aria-labelledby="verification-title" elevation={4} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
          <CheckCircleOutlineIcon color="primary" sx={{ fontSize: { xs: 64, sm: 80 }, mb: 2 }} />
          <Typography id="verification-title" component="h1" variant="h4" fontWeight={700} gutterBottom>
            {t('emailVerification.title')}
          </Typography>
          <Typography color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
            {t('emailVerification.description', { email })}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            {t('emailVerification.support')}{' '}
            <Box component="a" href="mailto:support@connectionmozambique.com" sx={{ color: 'primary.main' }}>
              support@connectionmozambique.com
            </Box>
          </Typography>

          {feedback && <Alert severity={feedback.severity} sx={{ mb: 3, textAlign: 'left' }}>{feedback.message}</Alert>}

          <Stack spacing={1.5}>
            <Button variant="contained" size="large" onClick={handleResendVerificationEmail} disabled={isResending} startIcon={isResending ? <CircularProgress size={20} color="inherit" /> : <ReplayIcon />}>
              {isResending ? t('emailVerification.resending') : t('emailVerification.resend')}
            </Button>
            <Button variant="outlined" size="large" onClick={handleLogout} startIcon={<LogoutIcon />}>
              {t('emailVerification.signOut')}
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
};

export default EmailVerification;

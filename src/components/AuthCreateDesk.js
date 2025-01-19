import React, { useState } from 'react';
import { Google, Facebook, Apple, Email } from '@mui/icons-material';
import { auth, googleProvider, facebookProvider, appleProvider, db } from '../fb';
import { signInWithPopup, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { ref, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import logo from '../img/bg.png';
import marketing from '../img/marketing.jpg';

import { Snackbar, Alert, TextField, Button, Checkbox, FormControlLabel, Grid, Box } from '@mui/material';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorMessages';

const AuthCreateDesk = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState(''); // Mensagem de sucesso
  const [termsAccepted, setTermsAccepted] = useState(false);
  const navigate = useNavigate();

  const saveUserData = async (user) => {
    const userRef = ref(db, 'users/' + user.uid);
    const userData = {
      displayName: user.displayName,
      uid: user.uid,
      email: user.email,
      profilepic: user.photoURL,
      provider: user.providerData[0]?.providerId,
      country: 'Unknown',
      ip: 'Unknown',
      loginDate: new Date().toISOString(),
      emailVerified: user.emailVerified, // Armazena o estado da verificação
    };

    await set(userRef, userData);
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      setErrorMessage('Você deve aceitar os Termos de Uso e a Política de Privacidade.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(result.user); // Envia o email de verificação
      await saveUserData(result.user);

      setSuccessMessage('Conta criada com sucesso! Verifique seu email para ativar a conta.');
      setEmail('');
      setPassword('');
      setTermsAccepted(false);
      window.location='/email-verification'; // Após enviar o email de verificação

    } catch (error) {
      const userFriendlyMessage = getFirebaseErrorMessage(error.code);
      setErrorMessage(userFriendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Grid container sx={{ height: '100vh' }}>
      {/* Left side (form) */}
      <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Box sx={{ maxWidth: 400, width: '100%', padding: 2 }}>
          <div className="text-center mb-6">
            <img src={logo} alt="Logo" className="w-32 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Connections</h2>
          </div>

          {errorMessage && (
            <Snackbar open={true} autoHideDuration={6000} onClose={() => setErrorMessage('')}>
              <Alert severity="error" sx={{ width: '100%' }}>
                {errorMessage}
              </Alert>
            </Snackbar>
          )}

          {successMessage && (
            <Snackbar open={true} autoHideDuration={6000} onClose={() => setSuccessMessage('')}>
              <Alert severity="success" sx={{ width: '100%' }}>
                {successMessage}
              </Alert>
            </Snackbar>
          )}

          <form onSubmit={handleEmailSignIn}>
            <div className="space-y-4">
              <TextField
                label="Email"
                variant="outlined"
                type="email"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                margin="normal"
              />
              <TextField
                label="Palavra-passe"
                variant="outlined"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                margin="normal"
              />

              <FormControlLabel
                control={
                  <Checkbox
                    checked={termsAccepted}
                    onChange={() => setTermsAccepted(!termsAccepted)}
                    name="terms"
                    color="primary"
                  />
                }
                label="Eu li e concordo com os Termos de Uso e a Política de Privacidade"
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isLoading || !termsAccepted}
                sx={{ marginTop: 2 }}
              >
                <Email sx={{ marginRight: 1 }} />
                Criar Conta
              </Button>
            </div>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600 font-bold">
              Já tem uma conta?{' '}
              <a href="/auth" className="text-blue-500 hover:underline">Entrar agora</a>
            </p>
          </div>
        </Box>
      </Grid>

      {/* Right side (background image) */}
      <Grid item xs={12} md={6} sx={{
        backgroundImage: `url(${marketing})`, 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: '100vh',
      }}></Grid>
    </Grid>
  );
};

export default AuthCreateDesk;

import React, { useState } from 'react';
import { Email, Visibility, VisibilityOff } from '@mui/icons-material';
import { auth, db } from '../fb';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import logo from '../img/bg.png';
import marketing from '../img/marketing.jpg';
import { Snackbar, Alert, IconButton, TextField, Button, InputAdornment, Grid, Box, useMediaQuery } from '@mui/material';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorMessages';

const AuthDesk = ({ data }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');

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
    };

    await set(userRef, userData);

    const companyRef = ref(db, 'company/' + user.uid);
    try {
      const snapshot = await get(companyRef);
      if (snapshot.exists()) {
        const companyData = snapshot.val();
      } else {
        console.log('Dados da empresa não encontrados.');
      }
    } catch (error) {
      console.error('Erro ao buscar dados da empresa:', error.message);
    }
  };

  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
  
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
  
      if (!result.user.emailVerified) {
        setErrorMessage('Por favor, verifique seu e-mail antes de fazer login.');
        navigate('/email-verification')
        setShowSnackbar(true);
        setIsLoading(false);
        return;
      }
  
      await saveUserData(result.user);
  
      if (data) {
        if (data.status) {
          navigate('/');
        } else {
          navigate('/pricing');
        }
      } else {
        navigate('/setup');
      }
    } catch (error) {
      console.log(error.code);
      const userFriendlyMessage = getFirebaseErrorMessage(error.code);
      setErrorMessage(userFriendlyMessage);
      setShowSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  return (
    <Grid container sx={{ height: '100vh' }}>
      <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: isMobile ? 2 : 0 }}>
        <Box sx={{ maxWidth: 400, width: '100%', p: isMobile ? 2 : 0 }}>
          <div className="text-center mb-6">
            <img src={logo} alt="Logo" className="w-32 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Connections</h2>
          </div>

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
              <div>
                <TextField
                  label="Palavra-passe"
                  variant="outlined"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  margin="normal"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={togglePasswordVisibility} edge="end">
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={isLoading}
                startIcon={<Email />}
                sx={{ mt: 2 }}
              >
                {isLoading ? 'Carregando...' : 'Entrar com Email e Senha'}
              </Button>
            </div>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Ainda não tem uma conta?{' '}
              <a href="/create" className="text-blue-500 hover:underline">Cadastre-se</a>
            </p>
            <p className="mt-2">
              <a href="/forget-password" className="text-blue-500 hover:underline">Esqueceu sua senha?</a>
            </p>
            <p className="mt-2 text-xs">
              Ao continuar, você aceita nossos Termos de Uso e confirma que leu nossa
              <a href="/terms" className="text-blue-500 hover:underline"> Termos & Políticas.</a>
            </p>
          </div>
        </Box>
      </Grid>

      <Grid item xs={12} md={6} sx={{
        backgroundImage: `url(${marketing})`, 
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        height: isMobile ? '50vh' : '100vh',
      }}></Grid>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSnackbar(false)} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default AuthDesk;
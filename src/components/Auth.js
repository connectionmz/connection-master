import React, { useState } from 'react';
import { Email, Visibility, VisibilityOff } from '@mui/icons-material'; 
import { auth, db } from '../fb';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import logo from '../img/bg.png';
import { Snackbar, Alert, IconButton, InputAdornment } from '@mui/material'; 

const Auth = ({ data }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [errorMessage, setErrorMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
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
      setErrorMessage('Erro ao fazer login com email e senha: ' + error.message);
      setShowSnackbar(true); 
    } finally {
      setIsLoading(false);
    }
  };
  const togglePasswordVisibility = () => {
    setShowPassword((prevShowPassword) => !prevShowPassword);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-6">
          <img src={logo} alt="Logo" />
          <span>Connections</span>
        </h2>

        <form className="mt-4" onSubmit={handleEmailSignIn}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-gray-700">Email</label>
              <input 
                type="email" 
                id="email" 
                className="w-full p-2 border rounded-lg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-gray-700">Palavra-passe</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  id="password" 
                  className="w-full p-2 border rounded-lg"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <InputAdornment position="end" className="absolute inset-y-0 right-0 pr-2 flex items-center">
                  <IconButton onClick={togglePasswordVisibility} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition duration-300">
              <Email className="mr-2" />
              {isLoading ? 'Carregando...' : 'Entrar com Email e Senha'}
            </button>
          </div>
        </form>
        <div className="text-center mt-6">
          <p className="text-gray-600 font-bold">
            Ainda não tem uma conta? <a href="/create" className="text-blue-500 hover:underline">Cadastre-se</a>
          </p>
          <p className="mt-2">
            <a href="/forget-password" className="text-blue-500 hover:underline">Esqueceu sua senha?</a>
          </p>
          <p className="mt-2 text-xs">
            Ao continuar, você aceita nossos Termos de Uso e confirma que leu nossa 
            <a href="/terms" className="text-blue-500 hover:underline"> Termos & Políticas.</a>
          </p>
        </div>
      </div>
      <Snackbar 
        open={showSnackbar} 
        autoHideDuration={6000} 
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setShowSnackbar(false)} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Auth;

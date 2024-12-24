import React, { useState } from 'react';
import { Google, Facebook, Email, Apple } from '@mui/icons-material';
import { auth, googleProvider, facebookProvider, appleProvider, db } from '../fb';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { ref, set, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import logo from '../img/bg.png';
import { getFirebaseErrorMessage } from '../utils/firebaseErrorMessages';

const AuthCreate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await saveUserData(result.user);
      navigate('/');
    } catch (error) {

    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      await saveUserData(result.user);
      navigate('/');
    } catch (error) {
      setErrorMessage('Erro ao fazer login com Facebook: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, appleProvider);
      await saveUserData(result.user);
      navigate('/');
    } catch (error) {
      setErrorMessage('Erro ao fazer login com Apple: ' + error.message);
    } finally {
      setIsLoading(false);
    }
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
      await saveUserData(result.user);
      navigate('/');
    } catch (error) {
      const userFriendlyMessage = getFirebaseErrorMessage(error.code);
      setErrorMessage(userFriendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-6">
          <img src={logo} alt="Logo" />
          <span>Connections</span>
        </h2>
        
        {errorMessage && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4">
            {errorMessage}
          </div>
        )}

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
              <input 
                type="password" 
                id="password" 
                className="w-full p-2 border rounded-lg"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="terms" 
                className="mr-2"
                checked={termsAccepted}
                onChange={() => setTermsAccepted(!termsAccepted)} 
              />
              <label htmlFor="terms" className="text-gray-700 text-sm">
                Eu li e concordo com os <a href="/termos" className="text-blue-500 hover:underline">Termos de Uso</a> e a <a href="/privacidade" className="text-blue-500 hover:underline">Política de Privacidade</a>.
              </label>
            </div>

            <button 
              type="submit"
              disabled={isLoading || !termsAccepted}
              className={`w-full bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition duration-300 ${isLoading || !termsAccepted ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Email className="mr-2" />
              Criar Conta
            </button>
          </div>
        </form>

        <div className="text-center mt-6">
          <p className="text-gray-600 font-bold">
           Tenho uma conta? <a href="/auth" className="text-blue-500 hover:underline">Entrar agora</a>
          </p>
          <p className="mt-2 text-xs">
            Ao continuar, você aceita nossos Termos de Uso e confirma que leu nossa 
            <a href="termos" className="text-blue-500 hover:underline"> Política de Privacidade.</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCreate;

import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Snackbar, Alert } from '@mui/material';
import { auth } from '../../fb';

const ForgetPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false); // Novo estado para desabilitar os campos

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsDisabled(true); // Desabilita os campos durante o envio
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('E-mail de redefinição de senha enviado com sucesso!');
      setEmail(''); // Limpa o campo de e-mail
      window.location='/auth'
    } catch (error) {
      setMessage('Erro ao enviar e-mail de redefinição: ' + error.message);
    } finally {
      setIsDisabled(false); // Reabilita os campos
      setShowSnackbar(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-4">Esqueceu sua senha?</h2>
        <form onSubmit={handleResetPassword}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              className="w-full p-2 border rounded-lg"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isDisabled} // Desabilita o campo quando necessário
            />
          </div>
          <button
            type="submit"
            className={`w-full text-white py-2 px-4 rounded-lg transition duration-300 ${
              isDisabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-800'
            }`}
            disabled={isDisabled} // Desabilita o botão quando necessário
          >
            {isDisabled ? 'Enviando...' : 'Enviar e-mail de redefinição'}
          </button>
        </form>
      </div>
      <Snackbar
        open={showSnackbar}
        autoHideDuration={6000}
        onClose={() => setShowSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setShowSnackbar(false)} severity={message.includes('sucesso') ? 'success' : 'error'} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ForgetPassword;

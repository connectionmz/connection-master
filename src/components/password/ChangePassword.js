import React, { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { Snackbar, Alert } from '@mui/material';
import { auth } from '../../fb';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [showSnackbar, setShowSnackbar] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (user) {
      try {
        await updatePassword(user, newPassword);
        setMessage('Senha alterada com sucesso!');
      } catch (error) {
        setMessage('Erro ao alterar a senha: ' + error.message);
      } finally {
        setShowSnackbar(true);
      }
    } else {
      setMessage('Usuário não autenticado.');
      setShowSnackbar(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
        <h2 className="text-2xl font-bold text-center mb-4">Alterar Senha</h2>
        <form onSubmit={handleChangePassword}>
          <div className="mb-4">
            <label htmlFor="newPassword" className="block text-gray-700">Nova Senha</label>
            <input
              type="password"
              id="newPassword"
              className="w-full p-2 border rounded-lg"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition duration-300"
          >
            Alterar Senha
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

export default ChangePassword;

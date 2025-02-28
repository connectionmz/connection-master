import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { ref, set } from 'firebase/database';
import { db } from '../../fb';
import { Snackbar, Alert } from '@mui/material';

const CreateStoreForm = ({ storeId, planPrice = 800, user }) => {
  const [store, setStore] = useState({ name: '', description: '', company: user || '', logoUrl: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [logo, setLogo] = useState(null);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleInputChange = (e) => {
    setStore({ ...store, [e.target.name]: e.target.value });
  };

  const handleDescriptionChange = (value) => {
    if (value.length <= 500) {
      setStore({ ...store, description: value });
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
      setStore({ ...store, logoUrl: URL.createObjectURL(file) });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!store.name.trim()) {
      newErrors.name = 'O nome da loja é obrigatório.';
    }
    if (!store.description.trim()) {
      newErrors.description = 'A descrição da loja é obrigatória.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // Simulação de pagamento
      return true;
    } catch (error) {
      setSnackbar({ open: true, message: 'A transação falhou. Por favor, tente novamente.', severity: 'error' });
      console.error('Erro no pagamento:', error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const createStore = async () => {
    if (!validateForm()) {
      setSnackbar({ open: true, message: 'Preencha todos os campos obrigatórios.', severity: 'error' });
      return;
    }

    setIsLoading(true);

    if (!user) {
      setSnackbar({ open: true, message: 'Usuário não definido. Não é possível criar a loja.', severity: 'error' });
      setIsLoading(false);
      return;
    }

    const paymentSuccessful = await handlePayment();

    if (paymentSuccessful) {
      try {
        const storeRef = ref(db, `stores/${storeId}`);
        await set(storeRef, store);
        setSnackbar({ open: true, message: 'Loja criada com sucesso!', severity: 'success' });
        setTimeout(() => window.location.reload(), 2000); // Recarrega a página após 2 segundos
      } catch (error) {
        setSnackbar({ open: true, message: 'Erro ao criar a loja.', severity: 'error' });
        console.error('Erro:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean'],
    ],
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      {/* Informação sobre a taxa */}
      <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-md mb-6">
        <p className="text-yellow-800 text-sm">
          <strong>Nota:</strong> A subscrição de uma loja online requer o pagamento único de{' '}
          <strong>{planPrice} MT</strong>.
        </p>
      </div>

      <h2 className="text-xl font-semibold mb-6">Criar Loja</h2>

      {/* Campo de nome da loja */}
      <div className="mb-6">
        <input
          type="text"
          name="name"
          value={store.name}
          onChange={handleInputChange}
          className={`w-full p-2 border rounded-md ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          placeholder="Nome da Loja"
        />
        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
      </div>

      {/* Campo de descrição da loja com ReactQuill */}
      <div className="mb-6">
        <ReactQuill
          value={store.description}
          onChange={handleDescriptionChange}
          modules={quillModules}
          placeholder="Descrição da Loja"
          className={`${errors.description ? 'border-red-500' : 'border-gray-300'}`}
        />
        <p className="text-sm text-gray-500 mt-1">
          {store.description.length}/500 caracteres
        </p>
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Campo para o logotipo */}
      <div className="mb-6">
        <input
          type="file"
          onChange={handleLogoChange}
          className="w-full p-2 border rounded-md"
        />
        {logo && (
          <img
            src={URL.createObjectURL(logo)}
            alt="Logo"
            className="w-20 h-20 object-cover mt-2"
          />
        )}
      </div>

      {/* Botão de criação da loja */}
      <button
        className={`bg-blue-500 text-white py-2 px-4 rounded-md ${
          isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'
        }`}
        onClick={createStore}
        disabled={isLoading}
      >
        {isLoading ? 'Criando Loja...' : 'Criar Loja'}
      </button>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CreateStoreForm;
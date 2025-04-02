import React, { useState, useEffect } from 'react';
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { Alert, Snackbar, LinearProgress, IconButton } from '@mui/material';
import { ref, update, push, set } from 'firebase/database';
import { db } from '../../fb';
import { useParams } from 'react-router-dom';
import { Add, DoneAll, Delete, Close } from '@mui/icons-material';

const ProductForm = ({ 
  storeId, 
  editingProduct, 
  onAddProduct, 
  onUpdateProduct, 
  onCancel 
}) => {
  const [product, setProduct] = useState({
    name: '',
    price: '',
    description: '',
    imageUrl: '',
    imageFile: null
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [loading, setLoading] = useState(false);

  // Preenche o formulário se estiver no modo de edição
  useEffect(() => {
    if (editingProduct) {
      setProduct({
        name: editingProduct.name || '',
        price: editingProduct.price || '',
        description: editingProduct.description || '',
        imageUrl: editingProduct.imageUrl || '',
        imageFile: null
      });
    } else {
      // Reseta o formulário para adição
      setProduct({
        name: '',
        price: '',
        description: '',
        imageUrl: '',
        imageFile: null
      });
    }
  }, [editingProduct]);

  const handleChange = (field, value) => {
    setProduct(prev => ({ ...prev, [field]: value }));
  };

  const handleImageChange = (file) => {
    setProduct(prev => ({ ...prev, imageFile: file }));
  };

  const handleUploadImage = async () => {
    if (!product.imageFile) return product.imageUrl;

    const storage = getStorage();
    const storageReference = storageRef(storage, `products/${product.imageFile.name}`);
    const uploadTask = uploadBytesResumable(storageReference, product.imageFile);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => reject(error),
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve(downloadURL);
        }
      );
    });
  };

  const validateProduct = () => {
    if (!product.name) {
      showSnackbar('Por favor, insira o nome do produto', 'error');
      return false;
    }
    if (!product.price) {
      showSnackbar('Por favor, insira o preço do produto', 'error');
      return false;
    }
    if (!editingProduct && !product.imageFile) {
      showSnackbar('Por favor, selecione uma imagem para o produto', 'error');
      return false;
    }
    return true;
  };

  const showSnackbar = (message, severity = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateProduct()) return;

    setLoading(true);

    try {
      let imageUrl = product.imageUrl;
      
      // Faz upload da nova imagem se foi selecionada
      if (product.imageFile) {
        imageUrl = await handleUploadImage();
      }

      const productData = {
        name: product.name,
        price: product.price,
        description: product.description,
        imageUrl: imageUrl
      };

      if (editingProduct) {
        // Modo edição - atualiza o produto existente
        const productRef = ref(db, `stores/${storeId}/products/${editingProduct.id}`);
        await update(productRef, productData);
        onUpdateProduct({ id: editingProduct.id, ...productData });
        showSnackbar('Produto atualizado com sucesso!', 'success');
      } else {
        // Modo adição - cria novo produto
        const productsRef = ref(db, `stores/${storeId}/products`);
        const newProductRef = push(productsRef);
        await set(newProductRef, productData);
        onAddProduct({ id: newProductRef.key, ...productData });
        showSnackbar('Produto adicionado com sucesso!', 'success');
      }

      // Limpa o formulário após sucesso (apenas no modo adição)
      if (!editingProduct) {
        setProduct({
          name: '',
          price: '',
          description: '',
          imageUrl: '',
          imageFile: null
        });
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      showSnackbar('Erro ao salvar produto. Tente novamente.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-md">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">
          {editingProduct ? 'Editar Produto' : 'Adicionar Produto'}
        </h2>
        {onCancel && (
          <IconButton onClick={onCancel}>
            <Close />
          </IconButton>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Nome do Produto</label>
          <input
            type="text"
            value={product.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full p-2 border rounded"
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Preço</label>
          <input
            type="number"
            value={product.price}
            onChange={(e) => handleChange('price', e.target.value)}
            className="w-full p-2 border rounded"
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <textarea
            value={product.description}
            onChange={(e) => handleChange('description', e.target.value)}
            className="w-full p-2 border rounded"
            disabled={loading}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            {editingProduct ? 'Alterar Imagem (opcional)' : 'Imagem do Produto'}
          </label>
          <input
            type="file"
            onChange={(e) => handleImageChange(e.target.files[0])}
            disabled={loading}
          />
          {product.imageFile && (
            <p className="text-sm mt-1">Novo arquivo: {product.imageFile.name}</p>
          )}
          {!product.imageFile && product.imageUrl && (
            <div className="mt-2">
              <p className="text-sm">Imagem atual:</p>
              <img 
                src={product.imageUrl} 
                alt="Imagem do produto" 
                className="w-20 h-20 object-cover"
              />
            </div>
          )}
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <LinearProgress variant="determinate" value={uploadProgress} className="mb-4" />
        )}

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-gray-500 text-white py-2 px-4 rounded"
              disabled={loading}
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            className="bg-green-500 text-white py-2 px-4 rounded"
            disabled={loading}
          >
            {loading ? 'Salvando...' : editingProduct ? 'Atualizar Produto' : 'Adicionar Produto'}
          </button>
        </div>
      </form>

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ProductForm;
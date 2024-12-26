import React, { useState } from 'react';
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { Alert, Snackbar, LinearProgress, IconButton } from '@mui/material';
import { push, ref, set } from 'firebase/database';
import { db } from '../../fb';
import { useParams } from 'react-router-dom';
import { Add, DoneAll, Delete } from '@mui/icons-material';

const ProductForm = ({ user }) => {
  const { storeId } = useParams();

  const [products, setProducts] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);  // Novo estado para controlar o carregamento

  // Adiciona um novo produto ao array de produtos
  const handleAddProduct = () => {
    setProducts((prevProducts) => [
      ...prevProducts,
      { name: '', price: '', description: '', imageUrl: '', imageFile: null },
    ]);
  };

  // Atualiza os campos do produto individualmente
  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][field] = value;
    setProducts(updatedProducts);
  };

  // Atualiza a imagem de um produto
  const handleImageChange = (index, file) => {
    const updatedProducts = [...products];
    updatedProducts[index].imageFile = file;
    setProducts(updatedProducts);
  };

  // Remove um produto do array
  const handleRemoveProduct = (index) => {
    setProducts((prevProducts) => prevProducts.filter((_, i) => i !== index));
  };

  // Função para upload das imagens para o Firebase Storage
  const handleUploadImages = async (product) => {
    if (!product.imageFile) return product;

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
          resolve({ ...product, imageUrl: downloadURL });
        }
      );
    });
  };

  // Função para validar o preenchimento dos campos
  const validateProducts = () => {
    for (const product of products) {
      if (!product.name || !product.price || !product.imageFile) {
        setErrorMessage('Por favor, preencha todos os campos e carregue uma imagem para cada produto.');
        return false;
      }
    }
    return true;
  };

  // Submissão de produtos com validação e upload de imagem
  const handleSubmit = async () => {
    if (!validateProducts()) return;

    setLoading(true);  // Inicia o estado de carregamento

    try {
      const uploadedProducts = await Promise.all(
        products.map((product) => handleUploadImages(product))
      );

      const productsRef = ref(db, `stores/${storeId}/products`);

      for (const product of uploadedProducts) {
        const newProductRef = push(productsRef);
        await set(newProductRef, {
          name: product.name,
          price: product.price,
          description: product.description,
          imageUrl: product.imageUrl || '',
        });
      }

      setUploadSuccess(true);
      setSnackbarOpen(true);
      setProducts([]);
      setUploadProgress(0); // Reseta a barra de progresso após a submissão
    } catch (error) {
      setErrorMessage('Erro ao adicionar produtos, tente novamente.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);  // Finaliza o estado de carregamento
    }
  };

  // Fecha o Snackbar de feedback
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    setErrorMessage('');
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-semibold mb-4">Adicionar Produtos</h2>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      {products.map((product, index) => (
        <div key={index} className="mb-4 border-b pb-4 relative">
          <input
            type="text"
            placeholder="Nome do Produto"
            value={product.name}
            onChange={(e) => handleProductChange(index, 'name', e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />
          <input
            type="number"
            placeholder="Preço"
            value={product.price}
            onChange={(e) => handleProductChange(index, 'price', e.target.value)}
            className="w-full p-2 border rounded mb-2"
          />
          <textarea
            placeholder="Descrição"
            value={product.description}
            onChange={(e) => handleProductChange(index, 'description', e.target.value)}
            className="w-full p-2 border rounded mb-2"
          ></textarea>
          <input
            type="file"
            onChange={(e) => handleImageChange(index, e.target.files[0])}
            className="mb-2"
          />
          {product.imageFile && (
            <div>
              <p className="text-sm">Arquivo: {product.imageFile.name}</p>
            </div>
          )}
          {/* Botão de remover produto */}
          <IconButton
            onClick={() => handleRemoveProduct(index)}
            className="absolute right-0 top-0"
          >
            <Delete color="error" />
          </IconButton>
        </div>
      ))}

      {uploadProgress > 0 && (
        <LinearProgress variant="determinate" value={uploadProgress} className="mb-4" />
      )}

      <div className="flex justify-between items-center">
        <button
          onClick={handleAddProduct}
          className="bg-blue-500 text-white py-2 px-4 rounded"
          disabled={loading}  // Desabilita o botão se estiver carregando
        >
          <Add />
        </button>
        <button
          onClick={handleSubmit}
          disabled={products.length === 0 || loading}  // Desabilita o botão se estiver carregando ou não houver produtos
          className={`py-2 px-4 rounded ${products.length === 0 || loading ? 'bg-gray-400' : 'bg-green-500 text-white'}`}
        >
          <DoneAll />
        </button>
      </div>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={uploadSuccess ? 'success' : 'info'} sx={{ width: '100%' }}>
          {uploadSuccess ? 'Produtos adicionados com sucesso!' : `Progresso do upload: ${Math.round(uploadProgress)}%`}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ProductForm;

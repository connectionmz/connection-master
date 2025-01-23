import React, { useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  IconButton,
  Typography,
  Snackbar,
  Alert,
  LinearProgress,
  Paper,
} from '@mui/material';
import { Add, DoneAll, Delete, ArrowBack } from '@mui/icons-material';
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { push, ref, set } from 'firebase/database';
import { db } from '../../fb';
import { useParams, useNavigate } from 'react-router-dom';
import BackButton from '../BackButton';

const ProductFormDesk = () => {
  const { storeId } = useParams();
  const navigate = useNavigate(); 

  const [products, setProducts] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAddProduct = () => {
    setProducts((prev) => [
      ...prev,
      { name: '', price: '', description: '', imageUrl: '', imageFile: null },
    ]);
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][field] = value;
    setProducts(updatedProducts);
  };

  const handleImageChange = (index, file) => {
    const updatedProducts = [...products];
    updatedProducts[index].imageFile = file;
    setProducts(updatedProducts);
  };

  const handleRemoveProduct = (index) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

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

  const validateProducts = () => {
    for (const product of products) {
      if (!product.name || !product.price || !product.imageFile) {
        setErrorMessage('Por favor, preencha todos os campos e carregue uma imagem.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateProducts()) return;

    setLoading(true);

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
      setUploadProgress(0);
    } catch (error) {
      setErrorMessage('Erro ao adicionar produtos. Tente novamente.');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
    setErrorMessage('');
  };

  return (
    <Box sx={{ width:'100%',p: 4}}>
      <BackButton sx={{ mb: 2 }} />
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
        Adicionar Produtos
      </Typography>

      {errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorMessage}
        </Alert>
      )}

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Preço</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Imagem</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product, index) => (
              <TableRow key={index}>
                <TableCell>
                  <TextField
                    fullWidth
                    placeholder="Nome do Produto"
                    value={product.name}
                    onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    placeholder="Preço"
                    type="number"
                    value={product.price}
                    onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    placeholder="Descrição"
                    value={product.description}
                    onChange={(e) => handleProductChange(index, 'description', e.target.value)}
                    multiline
                    rows={2}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button variant="outlined" component="label" size="small">
                    Carregar
                    <input
                      type="file"
                      hidden
                      onChange={(e) => handleImageChange(index, e.target.files[0])}
                    />
                  </Button>
                  {product.imageFile && (
                    <Typography variant="caption" display="block">
                      {product.imageFile.name}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleRemoveProduct(index)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {uploadProgress > 0 && <LinearProgress variant="determinate" value={uploadProgress} sx={{ mb: 2 }} />}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddProduct}
          disabled={loading}
        >
          Adicionar Produto
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<DoneAll />}
          onClick={handleSubmit}
          disabled={products.length === 0 || loading}
        >
          Salvar Produtos
        </Button>
      </Box>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert
          onClose={handleCloseSnackbar}
          severity={uploadSuccess ? 'success' : 'error'}
          sx={{ width: '100%' }}
        >
          {uploadSuccess ? 'Produtos adicionados com sucesso!' : errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductFormDesk;

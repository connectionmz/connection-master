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
  Card,
  CardMedia,
  Grid,
  Tooltip,
  Badge
} from '@mui/material';
import {
  Add,
  DoneAll,
  Delete,
  ArrowBack,
  CloudUpload,
  Image,
  Cancel,
  HelpOutline,
  Category,
  Description,
  AttachMoney,
  Inventory
} from '@mui/icons-material';
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { push, ref, set } from 'firebase/database';
import { db } from '../../fb';
import { useNavigate } from 'react-router-dom';
import BackButton from '../BackButton';

const ProductFormDesk = ({ user }) => {
  const storeId = user.id;
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
      { 
        name: '', 
        price: '', 
        description: '', 
        imageUrl: '', 
        imageFile: null,
        category: '',
        sku: ''
      },
    ]);
  };

  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][field] = value;
    setProducts(updatedProducts);
  };

  const handleImageChange = (index, file) => {
    if (!file) return;
    
    const updatedProducts = [...products];
    updatedProducts[index].imageFile = file;
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      updatedProducts[index].imageUrl = e.target.result;
      setProducts([...updatedProducts]);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index) => {
    const updatedProducts = [...products];
    updatedProducts[index].imageUrl = '';
    updatedProducts[index].imageFile = null;
    setProducts(updatedProducts);
  };

  const handleRemoveProduct = (index) => {
    setProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadImages = async (product) => {
    // If no image file but has image URL (from previous upload), keep it
    if (!product.imageFile && product.imageUrl) {
      return product;
    }
    
    // If no image at all, proceed without image
    if (!product.imageFile) {
      return { ...product, imageUrl: '' };
    }

    const storage = getStorage();
    const storageReference = storageRef(storage, `products/${Date.now()}_${product.imageFile.name}`);
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
      if (!product.name || !product.price) {
        setErrorMessage('Por favor, preencha pelo menos nome e preço para cada produto.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateProducts()) {
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    setUploadSuccess(false);

    try {
      const uploadedProducts = await Promise.all(
        products.map((product) => handleUploadImages(product))
      );

      const productsRef = ref(db, `stores/${storeId}/products`);
      const uploadPromises = uploadedProducts.map((product) => {
        const newProductRef = push(productsRef);
        return set(newProductRef, {
          name: product.name,
          price: parseFloat(product.price),
          description: product.description || '',
          imageUrl: product.imageUrl || '',
          category: product.category || 'Geral',
          sku: product.sku || '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      });

      await Promise.all(uploadPromises);

      setUploadSuccess(true);
      setSnackbarOpen(true);
      setProducts([]);
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload error:', error);
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
    <Box sx={{ width: '100%', p: 4 }}>
      <BackButton sx={{ mb: 2 }} />
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
        <Inventory sx={{ mr: 1 }} /> Adicionar Produtos
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 120 }}>
                    <Box display="flex" alignItems="center">
                  Imagem
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                       Nome
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                       Preço (MT)
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center">
                      Categoria
                    </Box>
                  </TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {products.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      {product.imageUrl ? (
                        <Box sx={{ position: 'relative' }}>
                          <CardMedia
                            component="img"
                            sx={{ 
                              width: 80, 
                              height: 80, 
                              objectFit: 'cover',
                              borderRadius: 1
                            }}
                            image={product.imageUrl}
                            alt="Preview"
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveImage(index)}
                            sx={{
                              position: 'absolute',
                              top: 0,
                              right: 0,
                              backgroundColor: 'rgba(255,255,255,0.7)',
                              '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.9)'
                              }
                            }}
                          >
                            <Cancel color="error" fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Tooltip title="Imagem opcional">
                          <Button
                            variant="outlined"
                            component="label"
                            size="small"
                            startIcon={<CloudUpload />}
                            fullWidth
                            sx={{ height: 80 }}
                          >
                            Adicionar
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={(e) => handleImageChange(index, e.target.files[0])}
                            />
                          </Button>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        placeholder="Nome do Produto*"
                        value={product.name}
                        onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                        size="small"
                        required
                        InputProps={{
                          startAdornment: (
                            <Description color="action" sx={{ mr: 1 }} />
                          ),
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        placeholder="Preço*"
                        type="number"
                        value={product.price}
                        onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                        size="small"
                        inputProps={{ min: 0, step: 0.01 }}
                        required
                        InputProps={{
                          startAdornment: (
                            <AttachMoney color="action" sx={{ mr: 1 }} />
                          ),
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        placeholder="Categoria"
                        value={product.category}
                        onChange={(e) => handleProductChange(index, 'category', e.target.value)}
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <Category color="action" sx={{ mr: 1 }} />
                          ),
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleRemoveProduct(index)}
                        color="error"
                        disabled={loading}
                      >
                        <Tooltip title="Remover produto">
                          <Delete />
                        </Tooltip>
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                sx={{ flexGrow: 1, height: 8, mr: 2 }} 
              />
              <Typography variant="body2" color="text.secondary">
                {Math.round(uploadProgress)}%
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={handleAddProduct}
              disabled={loading}
              sx={{ flex: 1 }}
            >
              Adicionar Produto
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<DoneAll />}
              onClick={handleSubmit}
              disabled={products.length === 0 || loading}
              sx={{ flex: 1 }}
            >
              {loading ? 'Salvando...' : 'Salvar Produtos'}
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, position: 'sticky', top: 20 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
              <HelpOutline sx={{ mr: 1 }} /> Dicas para Cadastro
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
              <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '3px' }} />
              Imagens são opcionais mas aumentam as vendas (recomendado 500x500px)
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
              <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '3px' }} />
              Use categorias para organizar seus produtos
            </Typography>
            <Typography variant="body2" sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
              <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '3px' }} />
              Você pode adicionar a imagem depois se necessário
            </Typography>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start' }}>
              <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '3px' }} />
              Campos marcados com * são obrigatórios
            </Typography>
          </Card>
        </Grid>
      </Grid>

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={uploadSuccess ? 'success' : 'error'}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {uploadSuccess ? '✅ Produtos cadastrados com sucesso!' : `❌ ${errorMessage}`}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductFormDesk;
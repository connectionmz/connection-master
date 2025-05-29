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
  Badge,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider
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
  Inventory,
  Info
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [products, setProducts] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentProductIndex, setCurrentProductIndex] = useState(null);
  const [openMobileDialog, setOpenMobileDialog] = useState(false);

  const handleAddProduct = () => {
    setProducts((prev) => [
      ...prev,
      { 
        name: '', 
        price: '', 
        description: '', 
        qtd:'',
        imageUrl: '', 
        imageFile: null,
        category: '',
        sku: ''
      },
    ]);
    
    if (isMobile) {
      setCurrentProductIndex(products.length);
      setOpenMobileDialog(true);
    }
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
    if (isMobile && openMobileDialog) {
      setOpenMobileDialog(false);
    }
  };

  const handleEditProductMobile = (index) => {
    setCurrentProductIndex(index);
    setOpenMobileDialog(true);
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
          qtd:product.qtd || '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        });
      });

      await Promise.all(uploadPromises);

      setUploadSuccess(true);
      setSnackbarOpen(true);
      setProducts([]);
      setUploadProgress(0);
      if (isMobile) {
        setOpenMobileDialog(false);
      }
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

  const handleCloseMobileDialog = () => {
    setOpenMobileDialog(false);
  };

// Renderização responsiva
const renderDesktopView = () => (
  <Box>
    {/* Card de Dicas - Agora aparece antes da tabela em mobile */}
    <Card sx={{ p: 2, mb: 3, display: { xs: 'block', md: 'none' } }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
        <HelpOutline sx={{ mr: 1 }} /> Dicas para Cadastro
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
        <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '3px' }} />
        Imagens são opcionais mas aumentam as vendas (recomendado 500x500px)
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

    {/* Tabela de Produtos */}
    <TableContainer component={Paper} sx={{ mb: 3 }}>
      <Table size={isTablet ? 'small' : 'medium'}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: isTablet ? 80 : 120 }}>
              <Box display="flex" alignItems="center">
                Imagem
              </Box>
            </TableCell>
            <TableCell>
              <Box display="flex" alignItems="center">
                Nome
              </Box>
            </TableCell>
            {!isMobile && (
              <TableCell>
                <Box display="flex" alignItems="center">
                  Descrição
                </Box>
              </TableCell>
            )}
            <TableCell>
              <Box display="flex" alignItems="center">
                Preço (MT)
              </Box>
            </TableCell>
            <TableCell>
              <Box display="flex" alignItems="center">
                Qtd (MT)
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
                        width: isTablet ? 60 : 80, 
                        height: isTablet ? 60 : 80, 
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
                      fullWidth
                      sx={{ height: isTablet ? 60 : 80 }}
                    >
                      <CloudUpload fontSize="small" />
                      {!isTablet && 'Adicionar'}
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
                  placeholder="Nome*"
                  value={product.name}
                  onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                  size={isTablet ? 'small' : 'medium'}
                  required
                />
              </TableCell>
              {!isMobile && (
                <TableCell>
                  <TextField
                    label="Descrição"
                    fullWidth
                    multiline
                    rows={3}
                    value={product.description}
                    onChange={(e) => handleProductChange(index, 'description', e.target.value)}
                    sx={{ mb: 2 }}
                  />
                </TableCell>
              )}
              <TableCell>
                <TextField
                  fullWidth
                  placeholder="Preço*"
                  type="number"
                  value={product.price}
                  onChange={(e) => handleProductChange(index, 'price', e.target.value)}
                  size={isTablet ? 'small' : 'medium'}
                  inputProps={{ min: 0, step: 0.01 }}
                  required
                />
              </TableCell>
              <TableCell>
                <TextField
                  fullWidth
                  placeholder="Qtd*"
                  type="number"
                  value={product.qtd}
                  onChange={(e) => handleProductChange(index, 'qtd', e.target.value)}
                  size={isTablet ? 'small' : 'medium'}
                  inputProps={{ min: 0, step: 0.01 }}
                  required
                />
              </TableCell>            
              <TableCell>
                <IconButton
                  onClick={() => handleRemoveProduct(index)}
                  color="error"
                  disabled={loading}
                >
                  <Tooltip title="Remover produto">
                    <Delete fontSize={isTablet ? 'small' : 'medium'} />
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

    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 3 }}>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={handleAddProduct}
        disabled={loading}
        sx={{ flex: 1 }}
        size={isTablet ? 'small' : 'medium'}
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
        size={isTablet ? 'small' : 'medium'}
      >
        {loading ? 'Salvando...' : 'Salvar Produtos'}
      </Button>
    </Box>

    {/* Card de Dicas - Aparece apenas em desktop/tablet */}
    <Card sx={{ p: 2, display: { xs: 'none', md: 'block' } }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
        <HelpOutline sx={{ mr: 1 }} /> Dicas para Cadastro
      </Typography>
      <Typography variant="body2" sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}>
        <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '3px' }} />
        Imagens são opcionais mas aumentam as vendas (recomendado 500x500px)
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
  </Box>
);

  // Renderização para mobile
  const renderMobileView = () => (
    <Box>
      <Box sx={{ mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleAddProduct}
          disabled={loading}
          fullWidth
        >
          Adicionar Produto
        </Button>
      </Box>

      {products.length > 0 && (
        <Card sx={{ mb: 2 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle1">
              Produtos a cadastrar: {products.length}
            </Typography>
          </Box>
          <Divider />
          {products.map((product, index) => (
            <Box key={index}>
              <Box 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  alignItems: 'center',
                  backgroundColor: index % 2 === 0 ? 'action.hover' : 'background.paper'
                }}
              >
                <Box sx={{ mr: 2 }}>
                  {product.imageUrl ? (
                    <CardMedia
                      component="img"
                      sx={{ 
                        width: 60, 
                        height: 60, 
                        objectFit: 'cover',
                        borderRadius: 1
                      }}
                      image={product.imageUrl}
                      alt="Preview"
                    />
                  ) : (
                    <Box sx={{ 
                      width: 60, 
                      height: 60, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: 1
                    }}>
                      <Image color="disabled" />
                    </Box>
                  )}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1" noWrap>
                    {product.name || 'Novo Produto'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {product.price ? `MT ${parseFloat(product.price).toFixed(2)}` : 'Preço não definido'}
                  </Typography>
                </Box>
                <Box>
                  <IconButton onClick={() => handleEditProductMobile(index)}>
                    <Info color="primary" />
                  </IconButton>
                  <IconButton onClick={() => handleRemoveProduct(index)} color="error">
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
              <Divider />
            </Box>
          ))}
        </Card>
      )}

      {products.length > 0 && (
        <Button
          variant="contained"
          color="success"
          startIcon={<DoneAll />}
          onClick={handleSubmit}
          disabled={loading}
          fullWidth
          sx={{ mb: 2 }}
        >
          {loading ? 'Salvando...' : 'Salvar Produtos'}
        </Button>
      )}

      <Card sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
          <HelpOutline sx={{ mr: 1 }} /> Dicas Rápidas
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          • Toque em um produto para editar
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          • Imagens melhoram as vendas
        </Typography>
        <Typography variant="body2">
          • Preencha pelo menos nome e preço
        </Typography>
      </Card>

      {/* Dialog para edição no mobile */}
      {currentProductIndex !== null && products[currentProductIndex] && (
        <Dialog 
          open={openMobileDialog} 
          onClose={handleCloseMobileDialog}
          fullScreen
        >
          <DialogTitle>
            {products[currentProductIndex].name || 'Novo Produto'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              {products[currentProductIndex].imageUrl ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                  <CardMedia
                    component="img"
                    sx={{ 
                      width: 200, 
                      height: 200, 
                      objectFit: 'cover',
                      borderRadius: 1,
                      mb: 1
                    }}
                    image={products[currentProductIndex].imageUrl}
                    alt="Preview"
                  />
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Delete />}
                    onClick={() => handleRemoveImage(currentProductIndex)}
                    fullWidth
                  >
                    Remover Imagem
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<CloudUpload />}
                  fullWidth
                  sx={{ mb: 2 }}>
                  Adicionar Imagem
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => handleImageChange(currentProductIndex, e.target.files[0])}
                  />
                </Button>
              )}
              <TextField
                label="Nome do Produto*"
                fullWidth
                value={products[currentProductIndex].name}
                onChange={(e) => handleProductChange(currentProductIndex, 'name', e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                label="Preço (MT)*"
                fullWidth
                type="number"
                value={products[currentProductIndex].price}
                onChange={(e) => handleProductChange(currentProductIndex, 'price', e.target.value)}
                sx={{ mb: 2 }}
                inputProps={{ min: 0, step: 0.01 }}
                required
              />

              <TextField
                label="Descrição"
                fullWidth
                multiline
                rows={3}
                value={products[currentProductIndex].description}
                onChange={(e) => handleProductChange(currentProductIndex, 'description', e.target.value)}
                sx={{ mb: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseMobileDialog}>Cancelar</Button>
            <Button 
              onClick={() => {
                handleCloseMobileDialog();
                if (!products[currentProductIndex].name || !products[currentProductIndex].price) {
                  setErrorMessage('Preencha pelo menos nome e preço');
                  setSnackbarOpen(true);
                }
              }}
              color="primary"
            >
              Salvar
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );

  return (
    <Box sx={{ width: '100%', p: isMobile ? 2 : 4 }}>
      <BackButton sx={{ mb: 2 }} />
      <Typography 
        variant={isMobile ? 'h6' : 'h5'} 
        sx={{ 
          mb: 3, 
          fontWeight: 'bold', 
          display: 'flex', 
          alignItems: 'center' 
        }}
      >
        <Inventory sx={{ mr: 1 }} /> Adicionar Produtos
      </Typography>

      {isMobile ? renderMobileView() : renderDesktopView()}

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
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
  Tooltip,
  Badge,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
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
  Info,
  Scale,
  Straighten,
  LocalShipping,
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
import { NumericFormat } from 'react-number-format';

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
  const [errors, setErrors] = useState({});

  const handleAddProduct = () => {
    setProducts((prev) => [
      ...prev,
      {
        type: 'product',
        name: '',
        price: '',
        description: '',
        qtd: '',
        imageUrl: '',
        imageFile: null,
        category: '',
        sku: '',
        weight: '',
        height: '',
        width: '',
        length: '',
        nationalShipping: false,
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
    if (!product.imageFile && product.imageUrl) {
      return product;
    }

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
    let newErrors = {};
    let isValid = true;

    products.forEach((product, index) => {
      // Validate Name
      if (!product.name || product.name.trim() === '') {
        newErrors[`name-${index}`] = 'Nome é obrigatório';
        isValid = false;
      }

      // Validate Price
      if (!product.price || isNaN(parseFloat(product.price)) || parseFloat(product.price) <= 0) {
        newErrors[`price-${index}`] = 'Preço deve ser um número maior que zero';
        isValid = false;
      }

      // Validate Product-specific fields
      if (product.type === 'product') {
        if (!product.qtd || isNaN(parseFloat(product.qtd)) || parseFloat(product.qtd) <= 0) {
          newErrors[`qtd-${index}`] = 'Quantidade deve ser um número maior que zero';
          isValid = false;
        }
        if (product.nationalShipping) {
          // Validate Weight
          if (!product.weight || isNaN(parseFloat(product.weight)) || parseFloat(product.weight) <= 0) {
            newErrors[`weight-${index}`] = 'Peso deve ser um número maior que zero';
            isValid = false;
          }
          // Validate Dimensions
          if (
            !product.height ||
            isNaN(parseFloat(product.height)) ||
            parseFloat(product.height) <= 0
          ) {
            newErrors[`height-${index}`] = 'Altura deve ser um número maior que zero';
            isValid = false;
          }
          if (
            !product.width ||
            isNaN(parseFloat(product.width)) ||
            parseFloat(product.width) <= 0
          ) {
            newErrors[`width-${index}`] = 'Largura deve ser um número maior que zero';
            isValid = false;
          }
          if (
            !product.length ||
            isNaN(parseFloat(product.length)) ||
            parseFloat(product.length) <= 0
          ) {
            newErrors[`length-${index}`] = 'Comprimento deve ser um número maior que zero';
            isValid = false;
          }
        }
      }
    });

    setErrors(newErrors);
    if (!isValid) {
      setErrorMessage('Por favor, corrija os erros nos campos obrigatórios.');
    }
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateProducts()) {
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    setUploadSuccess(false);

    try {
      const uploadedProducts = await Promise.all(products.map((product) => handleUploadImages(product)));

      const productsRef = ref(db, `stores/${storeId}/products`);
      const uploadPromises = uploadedProducts.map((product) => {
        const newProductRef = push(productsRef);
        return set(newProductRef, {
          type: product.type,
          name: product.name,
          price: parseFloat(product.price),
          description: product.description || '',
          imageUrl: product.imageUrl || '',
          category: product.category || 'Geral',
          sku: product.sku || '',
          qtd: product.type === 'product' ? parseFloat(product.qtd) : null,
          weight: product.type === 'product' && product.nationalShipping ? parseFloat(product.weight) : null,
          height: product.type === 'product' && product.nationalShipping ? parseFloat(product.height) : null,
          width: product.type === 'product' && product.nationalShipping ? parseFloat(product.width) : null,
          length: product.type === 'product' && product.nationalShipping ? parseFloat(product.length) : null,
          nationalShipping: product.type === 'product' ? product.nationalShipping : false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      await Promise.all(uploadPromises);

      setUploadSuccess(true);
      setSnackbarOpen(true);
      setProducts([]);
      setUploadProgress(0);
      setErrors({});
      if (isMobile) {
        setOpenMobileDialog(false);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setErrorMessage('Erro ao adicionar itens. Tente novamente.');
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

  // Componente para o sidebar de dicas (fixo em desktop)
  const TipsSidebar = () => (
    <Card
      sx={{
        position: 'fixed',
        top: 100,
        right: 20,
        width: 300,
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        p: 2,
        boxShadow: 3,
        borderRadius: 2,
        backgroundColor: 'background.paper',
        display: { xs: 'none', lg: 'block' },
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
        <HelpOutline sx={{ mr: 1, verticalAlign: 'middle' }} /> Dicas para Cadastro
      </Typography>
      <Typography variant="body2" sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start' }}>
        <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '4px' }} />
        Escolha entre <strong>Produto</strong> (ex: roupas, eletrônicos) ou <strong>Serviço</strong> (ex: consultoria).
      </Typography>
      <Typography variant="body2" sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start' }}>
        <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '4px' }} />
        Para frete nacional, ative e informe peso/dimensões precisas (kg/cm).
      </Typography>
      <Typography variant="body2" sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start' }}>
        <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '4px' }} />
        Imagens quadradas (500x500px) aumentam o engajamento.
      </Typography>
      <Typography variant="body2" sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start' }}>
        <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '4px' }} />
        Use SKU para variações (ex: CAM-BRANCO-M para camiseta branca média).
      </Typography>
      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '4px' }} />
        Campos com * são obrigatórios; erros são destacados.
      </Typography>
    </Card>
  );

  // Renderização para desktop
  const renderDesktopView = () => (
    <Box sx={{ display: 'flex', gap: 3 }}>
      <Box sx={{ flexGrow: 1, maxWidth: isTablet ? '100%' : 'calc(100% - 340px)' }}>
        <Card
          sx={{
            p: 2,
            mb: 3,
            boxShadow: 2,
            display: { xs: 'block', lg: 'none' },
            borderRadius: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main', display: 'flex', alignItems: 'center' }}
          >
            <HelpOutline sx={{ mr: 1 }} /> Dicas para Cadastro
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start' }}>
            <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '4px' }} />
            Escolha entre <strong>Produto</strong> (ex: roupas, eletrônicos) ou <strong>Serviço</strong> (ex: consultoria).
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start' }}>
            <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '4px' }} />
            Para frete nacional, ative e informe peso/dimensões precisas (kg/cm).
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start' }}>
            <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '4px' }} />
            Imagens quadradas (500x500px) aumentam o engajamento.
          </Typography>
          <Typography variant="body2" sx={{ mb: 1.5, display: 'flex', alignItems: 'flex-start' }}>
            <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '4px' }} />
            Use SKU para variações (ex: CAM-BRANCO-M para camiseta branca média).
          </Typography>
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'flex-start' }}>
            <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '4px' }} />
            Campos com * são obrigatórios; erros são destacados.
          </Typography>
        </Card>

        <TableContainer component={Paper} sx={{ mb: 3, boxShadow: 2, borderRadius: 2 }}>
          <Table size={isTablet ? 'small' : 'medium'}>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'primary.light' }}>
                <TableCell sx={{ width: isTablet ? 80 : 100, fontWeight: 'bold', color: 'white' }}>Imagem</TableCell>
                <TableCell sx={{ width: 120, fontWeight: 'bold', color: 'white' }}>Tipo *</TableCell>
                <TableCell sx={{ width: 300, fontWeight: 'bold', color: 'white' }}>Nome *</TableCell>
                <TableCell sx={{ width: 200, fontWeight: 'bold', color: 'white' }}>Categoria</TableCell>
                {!isTablet && <TableCell sx={{ width: 350, fontWeight: 'bold', color: 'white' }}>Descrição</TableCell>}
                <TableCell sx={{ width: 180, fontWeight: 'bold', color: 'white' }}>Preço (MZN) *</TableCell>
                <TableCell sx={{ width: 150, fontWeight: 'bold', color: 'white' }}>Qtd/SKU</TableCell>
                {!isTablet && <TableCell sx={{ width: 200, fontWeight: 'bold', color: 'white' }}>Frete Nacional</TableCell>}
                <TableCell sx={{ width: 80, fontWeight: 'bold', color: 'white' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={index} hover sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                  <TableCell>
                    {product.imageUrl ? (
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          sx={{
                            width: isTablet ? 60 : 80,
                            height: isTablet ? 60 : 80,
                            objectFit: 'cover',
                            borderRadius: 2,
                            boxShadow: 1,
                          }}
                          image={product.imageUrl}
                          alt="Preview"
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveImage(index)}
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            backgroundColor: 'error.main',
                            color: 'white',
                            '&:hover': { backgroundColor: 'error.dark' },
                          }}
                        >
                          <Cancel fontSize="small" />
                        </IconButton>
                      </Box>
                    ) : (
                      <Tooltip title="Adicione uma imagem (opcional, recomendado 500x500px)">
                        <Button
                          variant="outlined"
                          color="primary"
                          component="label"
                          size="small"
                          fullWidth
                          sx={{
                            height: isTablet ? 60 : 80,
                            borderStyle: 'dashed',
                            borderColor: 'primary.main',
                            justifyContent: 'center',
                            textTransform: 'none',
                          }}
                        >
                          <CloudUpload sx={{ mr: isTablet ? 0 : 1 }} />
                          {!isTablet && 'Imagem'}
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
                    <FormControl fullWidth size={isTablet ? 'small' : 'medium'} error={!!errors[`type-${index}`]}>
                      <Select
                        value={product.type}
                        onChange={(e) => handleProductChange(index, 'type', e.target.value)}
                      >
                        <MenuItem value="product">Produto</MenuItem>
                        <MenuItem value="service">Serviço</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      placeholder="Ex: Camiseta Branca ou Consultoria de Marketing Digital"
                      value={product.name}
                      onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                      size={isTablet ? 'small' : 'medium'}
                      error={!!errors[`name-${index}`]}
                      helperText={errors[`name-${index}`]}
                      required
                      sx={{ minWidth: 280 }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      placeholder="Ex: Roupas, Eletrônicos, Serviços"
                      value={product.category}
                      onChange={(e) => handleProductChange(index, 'category', e.target.value)}
                      size={isTablet ? 'small' : 'medium'}
                      sx={{ minWidth: 180 }}
                    />
                  </TableCell>
                  {!isTablet && (
                    <TableCell>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Descreva material, benefícios, ou detalhes do serviço"
                        value={product.description}
                        onChange={(e) => handleProductChange(index, 'description', e.target.value)}
                        size="small"
                        sx={{ minWidth: 330 }}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <NumericFormat
                      value={product.price}
                      thousandSeparator="."
                      decimalSeparator=","
                      decimalScale={2}
                      fixedDecimalScale
                      allowNegative={false}
                      onValueChange={(values) => handleProductChange(index, 'price', values.value)}
                      customInput={TextField}
                      fullWidth
                      size={isTablet ? 'small' : 'medium'}
                      InputProps={{
                        startAdornment: <InputAdornment position="start">MZN</InputAdornment>,
                      }}
                      error={!!errors[`price-${index}`]}
                      helperText={errors[`price-${index}`]}
                      required
                      sx={{ minWidth: 160 }}
                    />
                  </TableCell>
                  <TableCell>
                    {product.type === 'product' ? (
                      <Box>
                        <TextField
                          fullWidth
                          placeholder="Quantidade *"
                          type="number"
                          value={product.qtd}
                          onChange={(e) => handleProductChange(index, 'qtd', e.target.value)}
                          size={isTablet ? 'small' : 'medium'}
                          inputProps={{ min: 0 }}
                          sx={{ mb: 1 }}
                          error={!!errors[`qtd-${index}`]}
                          helperText={errors[`qtd-${index}`]}
                          required
                        />
                        <TextField
                          fullWidth
                          placeholder="SKU (ex: CAM-BRA-M)"
                          value={product.sku}
                          onChange={(e) => handleProductChange(index, 'sku', e.target.value)}
                          size={isTablet ? 'small' : 'medium'}
                        />
                      </Box>
                    ) : (
                      <TextField
                        fullWidth
                        placeholder="SKU (opcional)"
                        value={product.sku}
                        onChange={(e) => handleProductChange(index, 'sku', e.target.value)}
                        size={isTablet ? 'small' : 'medium'}
                      />
                    )}
                  </TableCell>
                  {!isTablet && (
                    <TableCell>
                      {product.type === 'product' ? (
                        <Box>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={product.nationalShipping}
                                onChange={(e) => handleProductChange(index, 'nationalShipping', e.target.checked)}
                                color="primary"
                              />
                            }
                            label="Habilitar Frete"
                            sx={{ mb: 1 }}
                          />
                          {product.nationalShipping && (
                            <Box>
                              <TextField
                                fullWidth
                                placeholder="Peso (kg) *"
                                type="number"
                                value={product.weight}
                                onChange={(e) => handleProductChange(index, 'weight', e.target.value)}
                                size="small"
                                inputProps={{ min: 0, step: 0.01 }}
                                InputProps={{ startAdornment: <Scale fontSize="small" sx={{ mr: 1 }} /> }}
                                sx={{ mb: 1 }}
                                error={!!errors[`weight-${index}`]}
                                helperText={errors[`weight-${index}`]}
                                required
                              />
                              <TextField
                                fullWidth
                                placeholder="Altura (cm) *"
                                type="number"
                                value={product.height}
                                onChange={(e) => handleProductChange(index, 'height', e.target.value)}
                                size="small"
                                inputProps={{ min: 0, step: 0.01 }}
                                InputProps={{ startAdornment: <Straighten fontSize="small" sx={{ mr: 1 }} /> }}
                                sx={{ mb: 1 }}
                                error={!!errors[`height-${index}`]}
                                helperText={errors[`height-${index}`]}
                                required
                              />
                              <TextField
                                fullWidth
                                placeholder="Largura (cm) *"
                                type="number"
                                value={product.width}
                                onChange={(e) => handleProductChange(index, 'width', e.target.value)}
                                size="small"
                                inputProps={{ min: 0, step: 0.01 }}
                                InputProps={{ startAdornment: <Straighten fontSize="small" sx={{ mr: 1 }} /> }}
                                sx={{ mb: 1 }}
                                error={!!errors[`width-${index}`]}
                                helperText={errors[`width-${index}`]}
                                required
                              />
                              <TextField
                                fullWidth
                                placeholder="Comprimento (cm) *"
                                type="number"
                                value={product.length}
                                onChange={(e) => handleProductChange(index, 'length', e.target.value)}
                                size="small"
                                inputProps={{ min: 0, step: 0.01 }}
                                InputProps={{ startAdornment: <Straighten fontSize="small" sx={{ mr: 1 }} /> }}
                                error={!!errors[`length-${index}`]}
                                helperText={errors[`length-${index}`]}
                                required
                              />
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                          Não aplicável
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <IconButton onClick={() => handleRemoveProduct(index)} color="error" disabled={loading}>
                      <Tooltip title="Remover item">
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={{ flexGrow: 1, height: 10, borderRadius: 5, mr: 2 }}
              color="primary"
            />
            <Typography variant="body2" color="primary">
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
            sx={{ flex: 1, borderRadius: 2, textTransform: 'none' }}
            size={isTablet ? 'medium' : 'large'}
          >
            Adicionar Item
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<DoneAll />}
            onClick={handleSubmit}
            disabled={products.length === 0 || loading}
            sx={{ flex: 1, borderRadius: 2, textTransform: 'none' }}
            size={isTablet ? 'medium' : 'large'}
          >
            {loading ? 'Salvando...' : 'Salvar Itens'}
          </Button>
        </Box>
      </Box>
      <TipsSidebar />
    </Box>
  );

  // Renderização para mobile
  const renderMobileView = () => (
    <Box>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={handleAddProduct}
        disabled={loading}
        fullWidth
        sx={{ mb: 3, borderRadius: 2, textTransform: 'none' }}
        size="large"
      >
        Adicionar Item
      </Button>

      {products.length > 0 && (
        <Card sx={{ mb: 3, boxShadow: 2, borderRadius: 2 }}>
          <Box sx={{ p: 2, backgroundColor: 'primary.light' }}>
            <Typography variant="subtitle1" color="white">
              Itens a cadastrar: {products.length}
            </Typography>
          </Box>
          {products.map((product, index) => (
            <Box key={index}>
              <Box
                sx={{
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: index % 2 === 0 ? 'background.default' : 'action.hover',
                }}
              >
                <Box sx={{ mr: 2 }}>
                  {product.imageUrl ? (
                    <CardMedia
                      component="img"
                      sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 2, boxShadow: 1 }}
                      image={product.imageUrl}
                      alt="Preview"
                    />
                  ) : (
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px dashed',
                        borderColor: 'primary.main',
                        borderRadius: 2,
                      }}
                    >
                      <Image color="primary" />
                    </Box>
                  )}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1">
                    {product.name || 'Novo Item'} ({product.type === 'product' ? 'Produto' : 'Serviço'})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {product.price ? `MZN ${parseFloat(product.price).toFixed(2)}` : 'Preço pendente'}
                  </Typography>
                </Box>
                <Box>
                  <IconButton onClick={() => handleEditProductMobile(index)} color="primary">
                    <Info />
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
          sx={{ mb: 3, borderRadius: 2, textTransform: 'none' }}
          size="large"
        >
          {loading ? 'Salvando...' : 'Salvar Itens'}
        </Button>
      )}

      <Card sx={{ p: 2, boxShadow: 2, borderRadius: 2 }}>
        <Typography
          variant="subtitle1"
          sx={{ mb: 1, display: 'flex', alignItems: 'center', color: 'primary.main' }}
        >
          <HelpOutline sx={{ mr: 1 }} /> Dicas Rápidas
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          • Toque no item para editar detalhes
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          • Para produtos, ative frete se aplicável
        </Typography>
        <Typography variant="body2" sx={{ mb: 1 }}>
          • Imagens atraem mais clientes
        </Typography>
        <Typography variant="body2">• Campos * são obrigatórios</Typography>
      </Card>

      {/* Dialog para edição no mobile */}
      {currentProductIndex !== null && products[currentProductIndex] && (
        <Dialog open={openMobileDialog} onClose={handleCloseMobileDialog} fullScreen sx={{ '& .MuiDialog-paper': { borderRadius: 0 } }}>
          <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white' }}>
            {products[currentProductIndex].name || 'Novo Item'}
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Tipo *</InputLabel>
              <Select
                value={products[currentProductIndex].type}
                label="Tipo"
                onChange={(e) => handleProductChange(currentProductIndex, 'type', e.target.value)}
              >
                <MenuItem value="product">Produto (ex: roupas)</MenuItem>
                <MenuItem value="service">Serviço (ex: delivery)</MenuItem>
              </Select>
            </FormControl>
            {products[currentProductIndex].imageUrl ? (
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <CardMedia
                  component="img"
                  sx={{ width: '100%', maxWidth: 300, height: 'auto', borderRadius: 2, mx: 'auto', boxShadow: 2 }}
                  image={products[currentProductIndex].imageUrl}
                  alt="Preview"
                />
                <Button
                  variant="text"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => handleRemoveImage(currentProductIndex)}
                  sx={{ mt: 1 }}
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
                sx={{ mb: 3, borderStyle: 'dashed', height: 56, textTransform: 'none' }}
              >
                Adicionar Imagem (Opcional)
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => handleImageChange(currentProductIndex, e.target.files[0])}
                />
              </Button>
            )}
            <TextField
              label="Nome *"
              fullWidth
              value={products[currentProductIndex].name}
              onChange={(e) => handleProductChange(currentProductIndex, 'name', e.target.value)}
              sx={{ mb: 3 }}
              error={!!errors[`name-${currentProductIndex}`]}
              helperText={errors[`name-${currentProductIndex}`] || 'Ex: Camiseta ou Consultoria'}
              required
            />
            <TextField
              label="Categoria"
              fullWidth
              value={products[currentProductIndex].category}
              onChange={(e) => handleProductChange(currentProductIndex, 'category', e.target.value)}
              sx={{ mb: 3 }}
              helperText="Ex: Moda, Serviços Digitais"
            />
            <NumericFormat
              value={products[currentProductIndex].price}
              thousandSeparator="."
              decimalSeparator=","
              decimalScale={2}
              fixedDecimalScale
              allowNegative={false}
              onValueChange={(values) => handleProductChange(currentProductIndex, 'price', values.value)}
              customInput={TextField}
              fullWidth
              label="Preço (MZN) *"
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">MZN</InputAdornment>,
              }}
              error={!!errors[`price-${currentProductIndex}`]}
              helperText={errors[`price-${currentProductIndex}`] || 'Valor mínimo 0.01'}
              required
            />
            {products[currentProductIndex].type === 'product' && (
              <>
                <TextField
                  label="Quantidade *"
                  fullWidth
                  type="number"
                  value={products[currentProductIndex].qtd}
                  onChange={(e) => handleProductChange(currentProductIndex, 'qtd', e.target.value)}
                  sx={{ mb: 3 }}
                  inputProps={{ min: 0 }}
                  error={!!errors[`qtd-${currentProductIndex}`]}
                  helperText={errors[`qtd-${currentProductIndex}`] || 'Estoque disponível'}
                  required
                />
                <TextField
                  label="SKU"
                  fullWidth
                  value={products[currentProductIndex].sku}
                  onChange={(e) => handleProductChange(currentProductIndex, 'sku', e.target.value)}
                  sx={{ mb: 3 }}
                  helperText="Código interno (ex: CAM-BRANCO-M)"
                />
                <Divider sx={{ my: 2 }} />
                <Typography
                  variant="subtitle2"
                  sx={{ mb: 2, display: 'flex', alignItems: 'center', color: 'primary.main' }}
                >
                  <LocalShipping sx={{ mr: 1 }} /> Frete Nacional
                </Typography>
                <FormControlLabel
                  control={
                    <Switch
                      checked={products[currentProductIndex].nationalShipping}
                      onChange={(e) => handleProductChange(currentProductIndex, 'nationalShipping', e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Habilitar frete para todo Moçambique"
                  sx={{ mb: 2 }}
                />
                {products[currentProductIndex].nationalShipping && (
                  <>
                    <TextField
                      label="Peso (kg) *"
                      fullWidth
                      type="number"
                      value={products[currentProductIndex].weight}
                      onChange={(e) => handleProductChange(currentProductIndex, 'weight', e.target.value)}
                      sx={{ mb: 3 }}
                      inputProps={{ min: 0, step: 0.01 }}
                      error={!!errors[`weight-${currentProductIndex}`]}
                      helperText={errors[`weight-${currentProductIndex}`] || 'Ex: 0.5 para roupas leves'}
                      required
                    />
                    <TextField
                      label="Altura (cm) *"
                      fullWidth
                      type="number"
                      value={products[currentProductIndex].height}
                      onChange={(e) => handleProductChange(currentProductIndex, 'height', e.target.value)}
                      sx={{ mb: 3 }}
                      inputProps={{ min: 0, step: 0.01 }}
                      error={!!errors[`height-${currentProductIndex}`]}
                      helperText={errors[`height-${currentProductIndex}`] || 'Ex: 30'}
                      required
                    />
                    <TextField
                      label="Largura (cm) *"
                      fullWidth
                      type="number"
                      value={products[currentProductIndex].width}
                      onChange={(e) => handleProductChange(currentProductIndex, 'width', e.target.value)}
                      sx={{ mb: 3 }}
                      inputProps={{ min: 0, step: 0.01 }}
                      error={!!errors[`width-${currentProductIndex}`]}
                      helperText={errors[`width-${currentProductIndex}`] || 'Ex: 20'}
                      required
                    />
                    <TextField
                      label="Comprimento (cm) *"
                      fullWidth
                      type="number"
                      value={products[currentProductIndex].length}
                      onChange={(e) => handleProductChange(currentProductIndex, 'length', e.target.value)}
                      sx={{ mb: 3 }}
                      inputProps={{ min: 0, step: 0.01 }}
                      error={!!errors[`length-${currentProductIndex}`]}
                      helperText={errors[`length-${currentProductIndex}`] || 'Ex: 5'}
                      required
                    />
                  </>
                )}
              </>
            )}
            {products[currentProductIndex].type === 'service' && (
              <TextField
                label="SKU"
                fullWidth
                value={products[currentProductIndex].sku}
                onChange={(e) => handleProductChange(currentProductIndex, 'sku', e.target.value)}
                sx={{ mb: 3 }}
                helperText="Código opcional para serviços"
              />
            )}
            <TextField
              label="Descrição"
              fullWidth
              multiline
              rows={4}
              value={products[currentProductIndex].description}
              onChange={(e) => handleProductChange(currentProductIndex, 'description', e.target.value)}
              sx={{ mb: 3 }}
              helperText="Detalhes atrativos para o cliente"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2, backgroundColor: 'background.default' }}>
            <Button
              onClick={handleCloseMobileDialog}
              color="inherit"
              variant="outlined"
              fullWidth
              sx={{ mr: 1, textTransform: 'none' }}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (validateProducts()) {
                  handleCloseMobileDialog();
                } else {
                  setSnackbarOpen(true);
                }
              }}
              color="primary"
              variant="contained"
              fullWidth
              sx={{ textTransform: 'none' }}
            >
              Salvar Alterações
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );

  return (
    <Box sx={{ width: '100%', p: isMobile ? 2 : 3, maxWidth: 1400, mx: 'auto' }}>
      <BackButton sx={{ mb: 2 }} />
      <Typography
        variant={isMobile ? 'h6' : 'h5'}
        sx={{
          mb: 3,
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          color: 'primary.main',
        }}
      >
        <Inventory sx={{ mr: 1 }} /> Adicionar Produtos/Serviços
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
          sx={{ width: '100%', borderRadius: 2 }}
          variant="filled"
          elevation={6}
        >
          {uploadSuccess ? '✅ Itens cadastrados com sucesso!' : `❌ ${errorMessage}`}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductFormDesk;
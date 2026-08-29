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
  Collapse,
  Alert as MuiAlert,
  Container,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Add,
  Delete,
  Image,
  Cancel,
  HelpOutline,
  Inventory,
  Info,
  Scale,
  Straighten,
  LocalShipping,
  Warning,
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Close,
  Save,
  Upload,
} from '@mui/icons-material';
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { get, push, ref, set } from 'firebase/database';
import { db } from '../../fb';
import { useNavigate } from 'react-router-dom';
import BackButton from '../BackButton';
import { NumericFormat } from 'react-number-format';
import { normalizeProduct, validateProduct } from './productData';

/* ── Design Tokens (mesmos da hero) ───────────────────────────────────── */
const T = {
  navy:     '#08192E',
  navyMid:  '#0E2849',
  navyLight:'#183A63',
  gold:     '#C8903A',
  goldLight:'#E8B96A',
  goldPale: '#FDF3E3',
  cream:    '#FAFAF7',
  white:    '#FFFFFF',
  text:     '#0F1C2D',
  textMid:  '#3D5A7A',
  textSub:  '#6B89A5',
  border:   '#E0E8F0',
  borderMid:'#C5D4E3',
  surface:  '#F4F7FB',
  success:  '#10b981',
  error:    '#ef4444',
  warning:  '#f59e0b',
};

/* ── Keyframes (mesmos da hero) ───────────────────────────────────────── */
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes pulse-gold {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.8; transform: scale(0.98); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .animate-fade-up {
    animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) both;
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease both;
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  .animate-pulse-gold {
    animation: pulse-gold 2s ease-in-out infinite;
  }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.22s; }
  .delay-3 { animation-delay: 0.34s; }
  .delay-4 { animation-delay: 0.46s; }
  .delay-5 { animation-delay: 0.58s; }
  
  .product-card {
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .product-card:hover {
    transform: translateY(-2px);
    border-color: ${T.gold} !important;
    box-shadow: 0 16px 48px rgba(8,25,46,0.1) !important;
  }
  .tips-card {
    transition: all 0.2s ease;
  }
  .tips-card:hover {
    border-color: ${T.gold} !important;
  }
  .upload-area {
    transition: all 0.2s ease;
  }
  .upload-area:hover {
    border-color: ${T.gold} !important;
    background: ${T.goldPale};
  }
  .table-header {
    background: ${T.gold};
  }
`;

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
  const [showShippingTips, setShowShippingTips] = useState(false);

  // Constantes de frete
  const BASE_SHIPPING_FEE = 100;
  const SHIPPING_RATE_PER_KG = 50;

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
    
    if (field === 'nationalShipping' && value === false) {
      updatedProducts[index].weight = '';
      updatedProducts[index].height = '';
      updatedProducts[index].width = '';
      updatedProducts[index].length = '';
    }
    
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

  const calculateShippingExample = (weight) => {
    if (!weight || isNaN(parseFloat(weight)) || parseFloat(weight) <= 0) {
      return null;
    }
    const calculatedShipping = BASE_SHIPPING_FEE + (parseFloat(weight) * SHIPPING_RATE_PER_KG);
    return calculatedShipping;
  };

  const handleUploadImages = async (product) => {
    if (!product.imageFile && product.imageUrl) {
      return product;
    }

    if (!product.imageFile) {
      return { ...product, imageUrl: '' };
    }

    const storage = getStorage();
    const storageReference = storageRef(storage, `products/${storeId}/new/${Date.now()}_${product.imageFile.name}`);
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
    const newErrors = products.reduce((allErrors, product, index) => {
      Object.entries(validateProduct(product)).forEach(([field, message]) => {
        allErrors[`${field}-${index}`] = message;
      });
      return allErrors;
    }, {});
    const isValid = Object.keys(newErrors).length === 0;

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
      const storeSnapshot = await get(ref(db, `stores/${storeId}`));
      if (!storeSnapshot.exists()) {
        setErrorMessage('Crie a sua loja antes de adicionar produtos.');
        setSnackbarOpen(true);
        navigate('/market', { replace: true });
        return;
      }

      const uploadedProducts = await Promise.all(products.map((product) => handleUploadImages(product)));

      const productsRef = ref(db, `stores/${storeId}/products`);
      const uploadPromises = uploadedProducts.map((product) => {
        const newProductRef = push(productsRef);
        return set(newProductRef, normalizeProduct(product, {
          imageUrl: product.imageUrl || '',
          includeCreatedAt: true,
        }));
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

  const ShippingExample = ({ weight }) => {
    const shippingCost = calculateShippingExample(weight);
    
    if (!shippingCost) return null;

    return (
      <MuiAlert 
        severity="info" 
        sx={{ 
          mt: 1, 
          mb: 2,
          borderRadius: '12px',
          bgcolor: T.goldPale,
          color: T.gold,
          '& .MuiAlert-icon': { color: T.gold }
        }}
        icon={<LocalShipping />}
      >
        <Typography variant="body2" fontWeight="bold">
          Exemplo de Frete:
        </Typography>
        <Typography variant="body2">
          • Peso: {parseFloat(weight).toFixed(2)} kg
        </Typography>
        <Typography variant="body2">
          • Cálculo: {BASE_SHIPPING_FEE} MT (taxa base) + ({parseFloat(weight).toFixed(2)} kg × {SHIPPING_RATE_PER_KG} MT/kg)
        </Typography>
        <Typography variant="body2" fontWeight="bold">
          • Frete estimado: {shippingCost.toFixed(2)} MT
        </Typography>
      </MuiAlert>
    );
  };

  const TipsSidebar = () => (
    <Card
      className="tips-card"
      sx={{
        position: 'fixed',
        top: 100,
        right: 20,
        width: 300,
        maxHeight: 'calc(100vh - 120px)',
        overflowY: 'auto',
        p: 3,
        borderRadius: '20px',
        border: `1px solid ${T.border}`,
        backgroundColor: T.white,
        boxShadow: '0 8px 24px rgba(0,0,0,0.05)',
        display: { xs: 'none', lg: 'block' },
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: T.text, fontFamily: '"Playfair Display", serif' }}>
        <HelpOutline sx={{ mr: 1, color: T.gold, verticalAlign: 'middle' }} /> Dicas para Cadastro
      </Typography>
      
      <Box 
        sx={{ 
          mb: 2, 
          p: 2, 
          bgcolor: T.goldPale, 
          borderRadius: '12px',
          cursor: 'pointer',
          border: `1px solid ${T.gold}30`,
        }}
        onClick={() => setShowShippingTips(!showShippingTips)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ color: T.gold }}>
            <LocalShipping sx={{ mr: 1, fontSize: 18, color: T.gold }} />
            Informações sobre Frete
          </Typography>
          {showShippingTips ? <ExpandLess sx={{ color: T.gold }} /> : <ExpandMore sx={{ color: T.gold }} />}
        </Box>
        
        <Collapse in={showShippingTips}>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1, color: T.text }}>
              • <strong>Taxa Base:</strong> {BASE_SHIPPING_FEE} MT
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: T.text }}>
              • <strong>Taxa por kg:</strong> {SHIPPING_RATE_PER_KG} MT/kg
            </Typography>
            <Typography variant="body2" sx={{ mb: 1, color: T.text }}>
              • <strong>Fórmula:</strong> {BASE_SHIPPING_FEE} MT + (peso × {SHIPPING_RATE_PER_KG} MT)
            </Typography>
            <Typography variant="body2" sx={{ color: T.text }}>
              • <strong>Exemplo:</strong> 2kg = {BASE_SHIPPING_FEE + (2 * SHIPPING_RATE_PER_KG)} MT
            </Typography>
          </Box>
        </Collapse>
      </Box>

      {[
        'Escolha entre Produto (ex: roupas, eletrônicos) ou Serviço (ex: consultoria)',
        'Para frete nacional, ative e informe peso/dimensões precisas (kg/cm)',
        'Imagens quadradas (500x500px) aumentam o engajamento',
        'Use SKU para variações (ex: CAM-BRANCO-M para camiseta branca média)',
        'Campos com * são obrigatórios; erros são destacados',
      ].map((tip, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.5 }}>
          <Badge 
            color="primary" 
            variant="dot" 
            sx={{ 
              mr: 1, 
              mt: '6px',
              '& .MuiBadge-dot': { bgcolor: T.gold }
            }} 
          />
          <Typography variant="body2" sx={{ color: T.textMid, fontSize: '0.85rem' }}>
            {tip}
          </Typography>
        </Box>
      ))}
    </Card>
  );

  const renderDesktopView = () => (
    <Box sx={{ display: 'flex', gap: 3 }}>
      <Box sx={{ flexGrow: 1, maxWidth: isTablet ? '100%' : 'calc(100% - 340px)' }}>
        {/* Tips Card para tablet */}
        <Card
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '20px',
            border: `1px solid ${T.border}`,
            backgroundColor: T.white,
            display: { xs: 'block', lg: 'none' },
          }}
        >
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: T.text, fontFamily: '"Playfair Display", serif' }}>
            <HelpOutline sx={{ mr: 1, color: T.gold }} /> Dicas para Cadastro
          </Typography>
          
          <Box 
            sx={{ 
              mb: 2, 
              p: 2, 
              bgcolor: T.goldPale, 
              borderRadius: '12px',
              cursor: 'pointer'
            }}
            onClick={() => setShowShippingTips(!showShippingTips)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: T.gold }}>
                <LocalShipping sx={{ mr: 1, fontSize: 18 }} />
                Informações sobre Frete
              </Typography>
              {showShippingTips ? <ExpandLess sx={{ color: T.gold }} /> : <ExpandMore sx={{ color: T.gold }} />}
            </Box>
            
            <Collapse in={showShippingTips}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1, color: T.text }}>
                  • Taxa Base: {BASE_SHIPPING_FEE} MT
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, color: T.text }}>
                  • Taxa por kg: {SHIPPING_RATE_PER_KG} MT/kg
                </Typography>
                <Typography variant="body2" sx={{ color: T.text }}>
                  • Exemplo: 2kg = {BASE_SHIPPING_FEE + (2 * SHIPPING_RATE_PER_KG)} MT
                </Typography>
              </Box>
            </Collapse>
          </Box>

          {[
            'Escolha entre Produto ou Serviço',
            'Para frete nacional, informe peso/dimensões',
            'Imagens quadradas aumentam engajamento',
            'Use SKU para variações',
            'Campos * são obrigatórios',
          ].map((tip, index) => (
            <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
              <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '6px', '& .MuiBadge-dot': { bgcolor: T.gold } }} />
              <Typography variant="body2" sx={{ color: T.textMid }}>{tip}</Typography>
            </Box>
          ))}
        </Card>

        <TableContainer 
          component={Paper} 
          sx={{ 
            mb: 3, 
            borderRadius: '20px', 
            border: `1px solid ${T.border}`,
            overflow: 'hidden',
          }}
        >
          <Table size={isTablet ? 'small' : 'medium'}>
            <TableHead>
              <TableRow sx={{ bgcolor: T.gold }}>
                <TableCell sx={{ width: isTablet ? 80 : 100, fontWeight: 700, color: T.white }}>Imagem</TableCell>
                <TableCell sx={{ width: 120, fontWeight: 700, color: T.white }}>Tipo *</TableCell>
                <TableCell sx={{ width: 300, fontWeight: 700, color: T.white }}>Nome *</TableCell>
                <TableCell sx={{ width: 200, fontWeight: 700, color: T.white }}>Categoria</TableCell>
                {!isTablet && <TableCell sx={{ width: 350, fontWeight: 700, color: T.white }}>Descrição</TableCell>}
                <TableCell sx={{ width: 180, fontWeight: 700, color: T.white }}>Preço (MZN) *</TableCell>
                <TableCell sx={{ width: 150, fontWeight: 700, color: T.white }}>Qtd/SKU</TableCell>
                {!isTablet && <TableCell sx={{ width: 250, fontWeight: 700, color: T.white }}>Frete Nacional</TableCell>}
                <TableCell sx={{ width: 80, fontWeight: 700, color: T.white }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    {product.imageUrl ? (
                      <Box sx={{ position: 'relative' }}>
                        <CardMedia
                          component="img"
                          sx={{
                            width: isTablet ? 60 : 80,
                            height: isTablet ? 60 : 80,
                            objectFit: 'cover',
                            borderRadius: '12px',
                            border: `1px solid ${T.border}`,
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
                            bgcolor: T.error,
                            color: T.white,
                            '&:hover': { bgcolor: '#dc2626' },
                            width: 20,
                            height: 20,
                          }}
                        >
                          <Cancel sx={{ fontSize: 12 }} />
                        </IconButton>
                      </Box>
                    ) : (
                      <Tooltip title="Adicione uma imagem (opcional, recomendado 500x500px)">
                        <Button
                          variant="outlined"
                          component="label"
                          size="small"
                          fullWidth
                          sx={{
                            height: isTablet ? 60 : 80,
                            borderStyle: 'dashed',
                            borderColor: T.borderMid,
                            color: T.gold,
                            borderRadius: '12px',
                            textTransform: 'none',
                            '&:hover': { borderColor: T.gold, bgcolor: T.goldPale },
                          }}
                        >
                          <Upload sx={{ mr: isTablet ? 0 : 1, fontSize: 20 }} />
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
                    <FormControl fullWidth size={isTablet ? 'small' : 'medium'}>
                      <Select
                        value={product.type}
                        onChange={(e) => handleProductChange(index, 'type', e.target.value)}
                        sx={{
                          borderRadius: '10px',
                          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: T.gold },
                        }}
                      >
                        <MenuItem value="product">Produto</MenuItem>
                        <MenuItem value="service">Serviço</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      placeholder="Ex: Camiseta Branca ou Consultoria"
                      value={product.name}
                      onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                      size={isTablet ? 'small' : 'medium'}
                      error={!!errors[`name-${index}`]}
                      helperText={errors[`name-${index}`]}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          '&:hover fieldset': { borderColor: T.gold },
                          '&.Mui-focused fieldset': { borderColor: T.gold },
                        },
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      fullWidth
                      placeholder="Ex: Roupas, Eletrônicos"
                      value={product.category}
                      onChange={(e) => handleProductChange(index, 'category', e.target.value)}
                      size={isTablet ? 'small' : 'medium'}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          '&:hover fieldset': { borderColor: T.gold },
                          '&.Mui-focused fieldset': { borderColor: T.gold },
                        },
                      }}
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
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '10px',
                            '&:hover fieldset': { borderColor: T.gold },
                            '&.Mui-focused fieldset': { borderColor: T.gold },
                          },
                        }}
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
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          '&:hover fieldset': { borderColor: T.gold },
                          '&.Mui-focused fieldset': { borderColor: T.gold },
                        },
                      }}
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
                          error={!!errors[`qtd-${index}`]}
                          helperText={errors[`qtd-${index}`]}
                          required
                          sx={{
                            mb: 1,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '10px',
                              '&:hover fieldset': { borderColor: T.gold },
                              '&.Mui-focused fieldset': { borderColor: T.gold },
                            },
                          }}
                        />
                        <TextField
                          fullWidth
                          placeholder="SKU (ex: CAM-BRA-M)"
                          value={product.sku}
                          onChange={(e) => handleProductChange(index, 'sku', e.target.value)}
                          size={isTablet ? 'small' : 'medium'}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '10px',
                              '&:hover fieldset': { borderColor: T.gold },
                              '&.Mui-focused fieldset': { borderColor: T.gold },
                            },
                          }}
                        />
                      </Box>
                    ) : (
                      <TextField
                        fullWidth
                        placeholder="SKU (opcional)"
                        value={product.sku}
                        onChange={(e) => handleProductChange(index, 'sku', e.target.value)}
                        size={isTablet ? 'small' : 'medium'}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '10px',
                            '&:hover fieldset': { borderColor: T.gold },
                            '&.Mui-focused fieldset': { borderColor: T.gold },
                          },
                        }}
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
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: T.gold,
                                  },
                                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                    backgroundColor: T.gold,
                                  },
                                }}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <LocalShipping sx={{ mr: 1, fontSize: 18, color: T.gold }} />
                                <Typography variant="body2">Frete Nacional</Typography>
                              </Box>
                            }
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
                                InputProps={{ 
                                  startAdornment: <Scale sx={{ fontSize: 16, color: T.gold }} />,
                                  endAdornment: <InputAdornment position="end">kg</InputAdornment>
                                }}
                                error={!!errors[`weight-${index}`]}
                                helperText={errors[`weight-${index}`]}
                                required
                                sx={{
                                  mb: 1,
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '10px',
                                    '&:hover fieldset': { borderColor: T.gold },
                                  },
                                }}
                              />
                              {product.weight && (
                                <ShippingExample weight={product.weight} />
                              )}
                              <TextField
                                fullWidth
                                placeholder="Altura (cm) *"
                                type="number"
                                value={product.height}
                                onChange={(e) => handleProductChange(index, 'height', e.target.value)}
                                size="small"
                                inputProps={{ min: 0, step: 0.01 }}
                                InputProps={{ 
                                  startAdornment: <Straighten sx={{ fontSize: 16, color: T.gold }} />,
                                  endAdornment: <InputAdornment position="end">cm</InputAdornment>
                                }}
                                error={!!errors[`height-${index}`]}
                                helperText={errors[`height-${index}`]}
                                required
                                sx={{
                                  mb: 1,
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '10px',
                                    '&:hover fieldset': { borderColor: T.gold },
                                  },
                                }}
                              />
                              <TextField
                                fullWidth
                                placeholder="Largura (cm) *"
                                type="number"
                                value={product.width}
                                onChange={(e) => handleProductChange(index, 'width', e.target.value)}
                                size="small"
                                inputProps={{ min: 0, step: 0.01 }}
                                InputProps={{ 
                                  startAdornment: <Straighten sx={{ fontSize: 16, color: T.gold }} />,
                                  endAdornment: <InputAdornment position="end">cm</InputAdornment>
                                }}
                                error={!!errors[`width-${index}`]}
                                helperText={errors[`width-${index}`]}
                                required
                                sx={{
                                  mb: 1,
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '10px',
                                    '&:hover fieldset': { borderColor: T.gold },
                                  },
                                }}
                              />
                              <TextField
                                fullWidth
                                placeholder="Comprimento (cm) *"
                                type="number"
                                value={product.length}
                                onChange={(e) => handleProductChange(index, 'length', e.target.value)}
                                size="small"
                                inputProps={{ min: 0, step: 0.01 }}
                                InputProps={{ 
                                  startAdornment: <Straighten sx={{ fontSize: 16, color: T.gold }} />,
                                  endAdornment: <InputAdornment position="end">cm</InputAdornment>
                                }}
                                error={!!errors[`length-${index}`]}
                                helperText={errors[`length-${index}`]}
                                required
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    borderRadius: '10px',
                                    '&:hover fieldset': { borderColor: T.gold },
                                  },
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" sx={{ color: T.textSub, textAlign: 'center' }}>
                          Não aplicável
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <IconButton onClick={() => handleRemoveProduct(index)} disabled={loading}>
                      <Tooltip title="Remover item">
                        <Delete sx={{ color: T.error, fontSize: isTablet ? 20 : 24 }} />
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
              sx={{ flexGrow: 1, height: 8, borderRadius: 4, mr: 2, bgcolor: T.border, '& .MuiLinearProgress-bar': { bgcolor: T.gold } }}
            />
            <Typography variant="body2" sx={{ color: T.gold, fontWeight: 600 }}>
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
            sx={{ 
              flex: 1, 
              borderRadius: '12px', 
              bgcolor: T.navy, 
              color: T.white,
              '&:hover': { bgcolor: T.navyLight },
              textTransform: 'none',
              py: 1.5,
              fontWeight: 600,
            }}
            size={isTablet ? 'medium' : 'large'}
          >
            Adicionar Item
          </Button>
          <Button
            variant="contained"
            startIcon={<Save />}
            onClick={handleSubmit}
            disabled={products.length === 0 || loading}
            sx={{ 
              flex: 1, 
              borderRadius: '12px', 
              bgcolor: T.gold, 
              color: T.white,
              '&:hover': { bgcolor: T.goldLight },
              '&.Mui-disabled': { bgcolor: T.borderMid, color: T.white },
              textTransform: 'none',
              py: 1.5,
              fontWeight: 600,
            }}
            size={isTablet ? 'medium' : 'large'}
          >
            {loading ? 'Salvando...' : 'Salvar Itens'}
          </Button>
        </Box>
      </Box>
      <TipsSidebar />
    </Box>
  );

  const renderMobileView = () => (
    <Box>
      <Button
        variant="contained"
        startIcon={<Add />}
        onClick={handleAddProduct}
        disabled={loading}
        fullWidth
        sx={{ 
          mb: 3, 
          borderRadius: '12px', 
          bgcolor: T.navy, 
          color: T.white,
          '&:hover': { bgcolor: T.navyLight },
          textTransform: 'none',
          py: 1.5,
          fontWeight: 600,
        }}
        size="large"
      >
        Adicionar Item
      </Button>

      {products.length > 0 && (
        <Card sx={{ mb: 3, borderRadius: '20px', border: `1px solid ${T.border}`, overflow: 'hidden' }}>
          <Box sx={{ p: 2, bgcolor: T.gold }}>
            <Typography variant="subtitle1" sx={{ color: T.white, fontWeight: 600 }}>
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
                  bgcolor: index % 2 === 0 ? T.white : T.surface,
                }}
              >
                <Box sx={{ mr: 2 }}>
                  {product.imageUrl ? (
                    <CardMedia
                      component="img"
                      sx={{ width: 60, height: 60, objectFit: 'cover', borderRadius: '12px', border: `1px solid ${T.border}` }}
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
                        border: `2px dashed ${T.borderMid}`,
                        borderRadius: '12px',
                        bgcolor: T.surface,
                      }}
                    >
                      <Image sx={{ color: T.gold }} />
                    </Box>
                  )}
                </Box>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: T.text }}>
                    {product.name || 'Novo Item'}
                  </Typography>
                  <Chip
                    label={product.type === 'product' ? 'Produto' : 'Serviço'}
                    size="small"
                    sx={{ 
                      mt: 0.5,
                      bgcolor: product.type === 'product' ? T.goldPale : T.surface,
                      color: product.type === 'product' ? T.gold : T.textMid,
                    }}
                  />
                  <Typography variant="body2" sx={{ color: T.gold, fontWeight: 600, mt: 0.5 }}>
                    {product.price ? `${parseFloat(product.price).toFixed(2)} MT` : 'Preço pendente'}
                    {product.nationalShipping && ' 🚚'}
                  </Typography>
                </Box>
                <Box>
                  <IconButton onClick={() => handleEditProductMobile(index)} sx={{ color: T.gold }}>
                    <Info />
                  </IconButton>
                  <IconButton onClick={() => handleRemoveProduct(index)} sx={{ color: T.error }}>
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
              <Divider sx={{ borderColor: T.border }} />
            </Box>
          ))}
        </Card>
      )}

      {products.length > 0 && (
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSubmit}
          disabled={loading}
          fullWidth
          sx={{ 
            mb: 3, 
            borderRadius: '12px', 
            bgcolor: T.gold, 
            color: T.white,
            '&:hover': { bgcolor: T.goldLight },
            '&.Mui-disabled': { bgcolor: T.borderMid },
            textTransform: 'none',
            py: 1.5,
            fontWeight: 600,
          }}
          size="large"
        >
          {loading ? 'Salvando...' : 'Salvar Itens'}
        </Button>
      )}

      <Card sx={{ p: 3, borderRadius: '20px', border: `1px solid ${T.border}` }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700, color: T.text, fontFamily: '"Playfair Display", serif' }}>
          <HelpOutline sx={{ mr: 1, color: T.gold }} /> Dicas Rápidas
        </Typography>
        
        <Box 
          sx={{ 
            mb: 2, 
            p: 2, 
            bgcolor: T.goldPale, 
            borderRadius: '12px',
            cursor: 'pointer',
          }}
          onClick={() => setShowShippingTips(!showShippingTips)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: T.gold }}>
              <LocalShipping sx={{ mr: 1, fontSize: 16 }} />
              Informações sobre Frete
            </Typography>
            {showShippingTips ? <ExpandLess sx={{ color: T.gold }} /> : <ExpandMore sx={{ color: T.gold }} />}
          </Box>
          
          <Collapse in={showShippingTips}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 0.5, color: T.text }}>
                • Taxa Base: {BASE_SHIPPING_FEE} MT
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5, color: T.text }}>
                • Taxa por kg: {SHIPPING_RATE_PER_KG} MT/kg
              </Typography>
              <Typography variant="body2" sx={{ color: T.text }}>
                • Exemplo: 2kg = {BASE_SHIPPING_FEE + (2 * SHIPPING_RATE_PER_KG)} MT
              </Typography>
            </Box>
          </Collapse>
        </Box>

        {[
          'Toque no item para editar detalhes',
          'Para produtos, ative frete se aplicável',
          'Imagens atraem mais clientes',
          'Campos * são obrigatórios',
        ].map((tip, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start', mb: 1 }}>
            <Badge color="primary" variant="dot" sx={{ mr: 1, mt: '6px', '& .MuiBadge-dot': { bgcolor: T.gold } }} />
            <Typography variant="body2" sx={{ color: T.textMid }}>{tip}</Typography>
          </Box>
        ))}
      </Card>

      {/* Dialog para edição no mobile */}
      {currentProductIndex !== null && products[currentProductIndex] && (
        <Dialog 
          open={openMobileDialog} 
          onClose={handleCloseMobileDialog} 
          fullScreen 
          PaperProps={{
            sx: {
              bgcolor: T.cream,
              borderRadius: 0,
            }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: T.navy, 
            color: T.white,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {products[currentProductIndex].name || 'Editar Item'}
            </Typography>
            <IconButton onClick={handleCloseMobileDialog} sx={{ color: T.white }}>
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel sx={{ color: T.textSub }}>Tipo *</InputLabel>
              <Select
                value={products[currentProductIndex].type}
                label="Tipo"
                onChange={(e) => handleProductChange(currentProductIndex, 'type', e.target.value)}
                sx={{
                  borderRadius: '12px',
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: T.gold },
                }}
              >
                <MenuItem value="product">Produto (ex: roupas)</MenuItem>
                <MenuItem value="service">Serviço (ex: delivery)</MenuItem>
              </Select>
            </FormControl>

            {products[currentProductIndex].imageUrl ? (
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <CardMedia
                  component="img"
                  sx={{ 
                    width: '100%', 
                    maxWidth: 300, 
                    height: 'auto', 
                    borderRadius: '12px', 
                    mx: 'auto', 
                    border: `1px solid ${T.border}`,
                  }}
                  image={products[currentProductIndex].imageUrl}
                  alt="Preview"
                />
                <Button
                  variant="text"
                  color="error"
                  startIcon={<Delete />}
                  onClick={() => handleRemoveImage(currentProductIndex)}
                  sx={{ mt: 1, textTransform: 'none' }}
                >
                  Remover Imagem
                </Button>
              </Box>
            ) : (
              <Button
                variant="outlined"
                component="label"
                startIcon={<Upload />}
                fullWidth
                sx={{ 
                  mb: 3, 
                  borderStyle: 'dashed',
                  borderColor: T.borderMid,
                  color: T.gold,
                  borderRadius: '12px',
                  py: 2,
                  textTransform: 'none',
                  '&:hover': { borderColor: T.gold, bgcolor: T.goldPale },
                }}
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
              error={!!errors[`name-${currentProductIndex}`]}
              helperText={errors[`name-${currentProductIndex}`] || 'Ex: Camiseta ou Consultoria'}
              required
              InputLabelProps={{ sx: { color: T.textSub } }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': { borderColor: T.gold },
                  '&.Mui-focused fieldset': { borderColor: T.gold },
                },
              }}
            />

            <TextField
              label="Categoria"
              fullWidth
              value={products[currentProductIndex].category}
              onChange={(e) => handleProductChange(currentProductIndex, 'category', e.target.value)}
              helperText="Ex: Moda, Serviços Digitais"
              InputLabelProps={{ sx: { color: T.textSub } }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': { borderColor: T.gold },
                  '&.Mui-focused fieldset': { borderColor: T.gold },
                },
              }}
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
              InputProps={{
                startAdornment: <InputAdornment position="start">MZN</InputAdornment>,
              }}
              error={!!errors[`price-${currentProductIndex}`]}
              helperText={errors[`price-${currentProductIndex}`] || 'Valor mínimo 0.01'}
              required
              InputLabelProps={{ sx: { color: T.textSub } }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': { borderColor: T.gold },
                  '&.Mui-focused fieldset': { borderColor: T.gold },
                },
              }}
            />

            {products[currentProductIndex].type === 'product' && (
              <>
                <TextField
                  label="Quantidade *"
                  fullWidth
                  type="number"
                  value={products[currentProductIndex].qtd}
                  onChange={(e) => handleProductChange(currentProductIndex, 'qtd', e.target.value)}
                  inputProps={{ min: 0 }}
                  error={!!errors[`qtd-${currentProductIndex}`]}
                  helperText={errors[`qtd-${currentProductIndex}`] || 'Estoque disponível'}
                  required
                  InputLabelProps={{ sx: { color: T.textSub } }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold },
                    },
                  }}
                />

                <TextField
                  label="SKU"
                  fullWidth
                  value={products[currentProductIndex].sku}
                  onChange={(e) => handleProductChange(currentProductIndex, 'sku', e.target.value)}
                  helperText="Código interno (ex: CAM-BRANCO-M)"
                  InputLabelProps={{ sx: { color: T.textSub } }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold },
                    },
                  }}
                />

                <Divider sx={{ my: 2, borderColor: T.border }} />

                <Typography
                  variant="subtitle2"
                  sx={{ mb: 2, display: 'flex', alignItems: 'center', color: T.gold, fontWeight: 600 }}
                >
                  <LocalShipping sx={{ mr: 1 }} /> Frete Nacional
                </Typography>

                <FormControlLabel
                  control={
                    <Switch
                      checked={products[currentProductIndex].nationalShipping}
                      onChange={(e) => handleProductChange(currentProductIndex, 'nationalShipping', e.target.checked)}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: T.gold,
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: T.gold,
                        },
                      }}
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
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: <Scale sx={{ fontSize: 20, color: T.gold }} />,
                        endAdornment: <InputAdornment position="end">kg</InputAdornment>
                      }}
                      error={!!errors[`weight-${currentProductIndex}`]}
                      helperText={errors[`weight-${currentProductIndex}`] || 'Ex: 0.5 para roupas leves'}
                      required
                      InputLabelProps={{ sx: { color: T.textSub } }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          '&:hover fieldset': { borderColor: T.gold },
                          '&.Mui-focused fieldset': { borderColor: T.gold },
                        },
                      }}
                    />

                    {products[currentProductIndex].weight && (
                      <ShippingExample weight={products[currentProductIndex].weight} />
                    )}

                    <TextField
                      label="Altura (cm) *"
                      fullWidth
                      type="number"
                      value={products[currentProductIndex].height}
                      onChange={(e) => handleProductChange(currentProductIndex, 'height', e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: <Straighten sx={{ fontSize: 20, color: T.gold }} />,
                        endAdornment: <InputAdornment position="end">cm</InputAdornment>
                      }}
                      error={!!errors[`height-${currentProductIndex}`]}
                      helperText={errors[`height-${currentProductIndex}`] || 'Ex: 30'}
                      required
                      InputLabelProps={{ sx: { color: T.textSub } }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          '&:hover fieldset': { borderColor: T.gold },
                          '&.Mui-focused fieldset': { borderColor: T.gold },
                        },
                      }}
                    />

                    <TextField
                      label="Largura (cm) *"
                      fullWidth
                      type="number"
                      value={products[currentProductIndex].width}
                      onChange={(e) => handleProductChange(currentProductIndex, 'width', e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: <Straighten sx={{ fontSize: 20, color: T.gold }} />,
                        endAdornment: <InputAdornment position="end">cm</InputAdornment>
                      }}
                      error={!!errors[`width-${currentProductIndex}`]}
                      helperText={errors[`width-${currentProductIndex}`] || 'Ex: 20'}
                      required
                      InputLabelProps={{ sx: { color: T.textSub } }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          '&:hover fieldset': { borderColor: T.gold },
                          '&.Mui-focused fieldset': { borderColor: T.gold },
                        },
                      }}
                    />

                    <TextField
                      label="Comprimento (cm) *"
                      fullWidth
                      type="number"
                      value={products[currentProductIndex].length}
                      onChange={(e) => handleProductChange(currentProductIndex, 'length', e.target.value)}
                      inputProps={{ min: 0, step: 0.01 }}
                      InputProps={{
                        startAdornment: <Straighten sx={{ fontSize: 20, color: T.gold }} />,
                        endAdornment: <InputAdornment position="end">cm</InputAdornment>
                      }}
                      error={!!errors[`length-${currentProductIndex}`]}
                      helperText={errors[`length-${currentProductIndex}`] || 'Ex: 5'}
                      required
                      InputLabelProps={{ sx: { color: T.textSub } }}
                      sx={{
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          '&:hover fieldset': { borderColor: T.gold },
                          '&.Mui-focused fieldset': { borderColor: T.gold },
                        },
                      }}
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
                helperText="Código opcional para serviços"
                InputLabelProps={{ sx: { color: T.textSub } }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': { borderColor: T.gold },
                    '&.Mui-focused fieldset': { borderColor: T.gold },
                  },
                }}
              />
            )}

            <TextField
              label="Descrição"
              fullWidth
              multiline
              rows={4}
              value={products[currentProductIndex].description}
              onChange={(e) => handleProductChange(currentProductIndex, 'description', e.target.value)}
              helperText="Detalhes atrativos para o cliente"
              InputLabelProps={{ sx: { color: T.textSub } }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': { borderColor: T.gold },
                  '&.Mui-focused fieldset': { borderColor: T.gold },
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3, bgcolor: T.white, borderTop: `1px solid ${T.border}` }}>
            <Button
              onClick={handleCloseMobileDialog}
              variant="outlined"
              fullWidth
              sx={{ 
                mr: 1, 
                borderRadius: '10px', 
                borderColor: T.borderMid,
                color: T.textSub,
                textTransform: 'none',
                '&:hover': { borderColor: T.gold, color: T.gold },
              }}
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
              variant="contained"
              fullWidth
              sx={{ 
                borderRadius: '10px', 
                bgcolor: T.gold, 
                color: T.white,
                '&:hover': { bgcolor: T.goldLight },
                textTransform: 'none',
              }}
            >
              Salvar Alterações
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );

  return (
    <Box 
      sx={{ 
        backgroundColor: T.cream, 
        minHeight: '100vh',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        py: 4
      }}
    >
      <style>{KEYFRAMES}</style>

      <Container maxWidth="xl" sx={{ px: isMobile ? 2 : 3 }}>
        {/* Header com design da hero */}
        <Paper
          className="animate-fade-up"
          sx={{
            background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyLight} 100%)`,
            borderRadius: '24px',
            p: { xs: 3, md: 4 },
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 80% 60% at 90% 10%, rgba(200,144,58,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 50% 50% at 5% 90%, rgba(200,144,58,0.07) 0%, transparent 50%)
            `,
          }} />
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.035,
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
          }} />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <BackButton sx={{ color: T.white, mb: 2 }} />
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: T.gold,
                  color: T.white,
                  border: `2px solid ${T.white}`,
                }}
              >
                <Inventory sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: T.white,
                    fontFamily: '"Playfair Display", serif',
                  }}
                >
                  Adicionar Produtos/Serviços
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Cadastre os itens que serão exibidos em sua loja
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>

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
            sx={{ 
              width: '100%', 
              borderRadius: '12px',
              bgcolor: uploadSuccess ? T.success : T.error,
              color: T.white,
              '& .MuiAlert-icon': { color: T.white },
            }}
            variant="filled"
            icon={uploadSuccess ? <CheckCircle /> : <Warning />}
          >
            {uploadSuccess ? 'CADASTRADO COM SUCESSO' : `❌ ${errorMessage}`}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
};

export default ProductFormDesk;

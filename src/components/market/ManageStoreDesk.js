import React, { useState, useEffect, useMemo } from 'react';
import { ref, get, onValue, remove, update } from 'firebase/database';
import { db, storage } from '../../fb';
import { isSafePlainName } from '../../utils/sanitizeText';
import { Link } from 'react-router-dom';
import {
  Box,
  Button,
  IconButton,
  InputAdornment,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  TablePagination,
  TableSortLabel,
  Snackbar,
  Alert,
  Switch,
  useMediaQuery,
  useTheme,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Tooltip,
  Chip,
  Tabs,
  Tab,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  Select,
  InputLabel,
  Container,
  Avatar,
  Stack,
} from '@mui/material';
import {
  Search,
  Edit,
  Delete,
  Settings,
  MoreVert,
  Add,
  Image,
  Category,
  Close,
  Visibility,
  Phone,
  Email,
  LocationOn,
  AccessTime,
  Language,
  ExpandMore,
  Facebook,
  Instagram,
  Twitter,
  WhatsApp,
  Scale,
  Straighten,
  LocalShipping,
  Storefront,
  Inventory,
  AttachMoney,
  Verified,
  Save,
  ShoppingCart,
  Description,
  RequestQuote,
  Warning
} from '@mui/icons-material';
import { ref as storageRef, getDownloadURL, uploadBytes, deleteObject } from 'firebase/storage';
import { formatPrice } from '../../utils/utils';
import { NumericFormat } from 'react-number-format';

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
  .animate-fade-up {
    animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) both;
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease both;
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.22s; }
  .delay-3 { animation-delay: 0.34s; }
  .delay-4 { animation-delay: 0.46s; }
  
  .manage-card {
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .manage-card:hover {
    transform: translateY(-2px);
    border-color: ${T.gold} !important;
    box-shadow: 0 16px 48px rgba(8,25,46,0.1) !important;
  }
  .product-card {
    transition: all 0.3s ease;
  }
  .product-card:hover {
    transform: translateY(-4px);
    border-color: ${T.gold} !important;
    box-shadow: 0 20px 40px rgba(8,25,46,0.12) !important;
  }
  .stats-card {
    transition: all 0.2s ease;
  }
  .stats-card:hover {
    background: ${T.goldPale};
    border-color: ${T.gold} !important;
  }
  .tab-indicator {
    background: ${T.gold} !important;
    height: 3px !important;
  }
`;

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ManageStoreDesk = ({ storeId, storeData: initialStoreData }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState({
    products: false,
    store: false,
    productUpdate: false,
    imageUpload: false,
  });
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: isMobile ? 3 : 5,
  });
  const [sorting, setSorting] = useState({
    order: 'asc',
    orderBy: 'name',
  });
  const [feedback, setFeedback] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [modals, setModals] = useState({
    settings: false,
    editProduct: false,
    deleteConfirm: false,
  });
  const [storeData, setStoreData] = useState({
    name: '',
    description: '',
    logo: '',
    settings: {
      showPrices: true,
    },
    contact: {
      phone: '',
      email: '',
      whatsapp: '',
    },
    location: {
      address: '',
      city: '',
      province: '',
      coordinates: {
        lat: '',
        lng: '',
      },
    },
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      website: '',
    },
    businessHours: {
      monday: { open: '', close: '', closed: false },
      tuesday: { open: '', close: '', closed: false },
      wednesday: { open: '', close: '', closed: false },
      thursday: { open: '', close: '', closed: false },
      friday: { open: '', close: '', closed: false },
      saturday: { open: '', close: '', closed: false },
      sunday: { open: '', close: '', closed: false },
    },
    policies: {
      delivery: '',
      returns: '',
      payments: '',
    },
  });
  const [productData, setProductData] = useState({
    id: null,
    type: 'product',
    name: '',
    price: '',
    category: '',
    description: '',
    imageUrl: '',
    imageFile: null,
    sku: '',
    qtd: '',
    weight: '',
    height: '',
    width: '',
    length: '',
    nationalShipping: false,
  });
  const [logoFile, setLogoFile] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [settingsTab, setSettingsTab] = useState(0);
  const [activeSection, setActiveSection] = useState('overview');
  const [receivedQuotes, setReceivedQuotes] = useState([]);
  const [marketMetrics, setMarketMetrics] = useState({ views: 0, clicks: 0 });
  const [errors, setErrors] = useState({});
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSales: 0,
    totalViews: 0,
    averageRating: 0,
  });

  // Estatísticas derivadas apenas de dados reais disponíveis
  useEffect(() => {
    setStats({
      totalProducts: products.length,
      totalSales: receivedQuotes.filter((quote) => quote.status === 'accepted').length,
      totalViews: marketMetrics.views,
      averageRating: 0,
    });
  }, [products, receivedQuotes, marketMetrics.views]);

  useEffect(() => {
    if (!storeId) return undefined;
    const unsubscribe = onValue(ref(db, `quotes/${storeId}`), (snapshot) => {
      const data = snapshot.val() || {};
      setReceivedQuotes(Object.entries(data).map(([id, quote]) => ({ id, ...quote })));
    });
    return unsubscribe;
  }, [storeId]);

  useEffect(() => {
    if (!storeId) return;
    get(ref(db, `market_metrics/products/${storeId}`)).then((snapshot) => {
      const productMetrics = snapshot.val() || {};
      setMarketMetrics(Object.values(productMetrics).reduce((totals, metric) => ({
        views: totals.views + Number(metric?.views || 0),
        clicks: totals.clicks + Number(metric?.clicks || 0),
      }), { views: 0, clicks: 0 }));
    }).catch(() => setMarketMetrics({ views: 0, clicks: 0 }));
  }, [storeId]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading((prev) => ({ ...prev, products: true }));

        const productsRef = ref(db, `stores/${storeId}/products`);
        const productsSnapshot = await get(productsRef);
        const productsData = productsSnapshot.exists() ? Object.entries(productsSnapshot.val()) : [];
        setProducts(productsData);

        // Se initialStoreData foi passado, use ele, senão busque do banco
        if (initialStoreData) {
          setStoreData(prev => ({
            ...prev,
            name: initialStoreData.name || '',
            description: initialStoreData.description || '',
            logo: initialStoreData.company?.logo || '',
            settings: initialStoreData.settings || { showPrices: true },
            contact: initialStoreData.contact || { phone: '', email: '', whatsapp: '' },
            location: initialStoreData.location || {
              address: '',
              city: '',
              province: '',
              coordinates: { lat: '', lng: '' },
            },
            socialMedia: initialStoreData.socialMedia || {
              facebook: '',
              instagram: '',
              twitter: '',
              website: '',
            },
            businessHours: initialStoreData.businessHours || {
              monday: { open: '', close: '', closed: false },
              tuesday: { open: '', close: '', closed: false },
              wednesday: { open: '', close: '', closed: false },
              thursday: { open: '', close: '', closed: false },
              friday: { open: '', close: '', closed: false },
              saturday: { open: '', close: '', closed: false },
              sunday: { open: '', close: '', closed: false },
            },
            policies: initialStoreData.policies || {
              delivery: '',
              returns: '',
              payments: '',
            },
          }));
        } else {
          const storeRef = ref(db, `stores/${storeId}`);
          const storeSnapshot = await get(storeRef);
          if (storeSnapshot.exists()) {
            const data = storeSnapshot.val();
            setStoreData({
              name: data.name || '',
              description: data.description || '',
              logo: data.company?.logo || '',
              settings: data.settings || { showPrices: true },
              contact: data.contact || { phone: '', email: '', whatsapp: '' },
              location: data.location || {
                address: '',
                city: '',
                province: '',
                coordinates: { lat: '', lng: '' },
              },
              socialMedia: data.socialMedia || {
                facebook: '',
                instagram: '',
                twitter: '',
                website: '',
              },
              businessHours: data.businessHours || {
                monday: { open: '', close: '', closed: false },
                tuesday: { open: '', close: '', closed: false },
                wednesday: { open: '', close: '', closed: false },
                thursday: { open: '', close: '', closed: false },
                friday: { open: '', close: '', closed: false },
                saturday: { open: '', close: '', closed: false },
                sunday: { open: '', close: '', closed: false },
              },
              policies: data.policies || {
                delivery: '',
                returns: '',
                payments: '',
              },
            });
          }
        }
      } catch (error) {
        showFeedback('Erro ao carregar dados. Tente novamente.', 'error');
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading((prev) => ({ ...prev, products: false }));
      }
    };

    fetchInitialData();
  }, [storeId, initialStoreData]);

  // Feedback helper
  const showFeedback = (message, severity = 'success') => {
    setFeedback({ open: true, message, severity });
  };

  // Handlers para modais
  const toggleModal = (modalName, isOpen) => {
    setModals((prev) => ({ ...prev, [modalName]: isOpen }));
    if (!isOpen) {
      setErrors({});
    }
  };

  // Menu de ações para mobile
  const handleMenuOpen = (event, productId) => {
    setAnchorEl(event.currentTarget);
    setSelectedProductId(productId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProductId(null);
  };

  // Handlers para produtos
  const handleEditProduct = (productId, product) => {
    setProductData({
      id: productId,
      type: product.type || 'product',
      name: product.name || '',
      price: product.price ? String(product.price) : '',
      category: product.category || '',
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      imageFile: null,
      sku: product.sku || '',
      qtd: product.qtd ? String(product.qtd) : '',
      weight: product.weight ? String(product.weight) : '',
      height: product.height ? String(product.height) : '',
      width: product.width ? String(product.width) : '',
      length: product.length ? String(product.length) : '',
      nationalShipping: product.nationalShipping || false,
    });
    toggleModal('editProduct', true);
    handleMenuClose();
  };

  const handleRemoveProduct = async (productId) => {
    toggleModal('deleteConfirm', false);
    try {
      const product = products.find(([id]) => id === productId)?.[1];
      if (product?.imageUrl) {
        try {
          const imageRef = storageRef(storage, product.imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.warn('Erro ao remover imagem do produto:', error);
        }
      }

      await remove(ref(db, `stores/${storeId}/products/${productId}`));
      setProducts((prev) => prev.filter(([key]) => key !== productId));
      showFeedback('Produto removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      showFeedback('Erro ao remover o produto.', 'error');
    }
    handleMenuClose();
  };

  // Handler para alterar imagem do produto
  const handleProductImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProductData((prev) => ({
        ...prev,
        imageFile: file,
        imageUrl: URL.createObjectURL(file),
      }));
    }
  };

  // Handler para remover imagem do produto
  const handleRemoveProductImage = () => {
    setProductData((prev) => ({
      ...prev,
      imageFile: null,
      imageUrl: '',
    }));
  };

  // Validate product data before update
  const validateProductData = () => {
    let newErrors = {};
    let isValid = true;

    if (!productData.name.trim()) {
      newErrors['name'] = 'Nome é obrigatório';
      isValid = false;
    }

    const priceValue = parseFloat(productData.price.replace(',', '.'));
    if (!productData.price || isNaN(priceValue) || priceValue <= 0) {
      newErrors['price'] = 'Preço deve ser um número maior que zero';
      isValid = false;
    }

    if (productData.type === 'product') {
      const qtdValue = parseFloat(productData.qtd);
      if (!productData.qtd || isNaN(qtdValue) || qtdValue <= 0) {
        newErrors['qtd'] = 'Quantidade deve ser um número maior que zero';
        isValid = false;
      }
      if (productData.nationalShipping) {
        const weightValue = parseFloat(productData.weight);
        if (!productData.weight || isNaN(weightValue) || weightValue <= 0) {
          newErrors['weight'] = 'Peso deve ser um número maior que zero';
          isValid = false;
        }
        const heightValue = parseFloat(productData.height);
        if (!productData.height || isNaN(heightValue) || heightValue <= 0) {
          newErrors['height'] = 'Altura deve ser um número maior que zero';
          isValid = false;
        }
        const widthValue = parseFloat(productData.width);
        if (!productData.width || isNaN(widthValue) || widthValue <= 0) {
          newErrors['width'] = 'Largura deve ser um número maior que zero';
          isValid = false;
        }
        const lengthValue = parseFloat(productData.length);
        if (!productData.length || isNaN(lengthValue) || lengthValue <= 0) {
          newErrors['length'] = 'Comprimento deve ser um número maior que zero';
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    if (!isValid) {
      showFeedback('Por favor, corrija os erros nos campos obrigatórios.', 'error');
    }
    return isValid;
  };

  // Atualizar produto com nova imagem
  const handleUpdateProduct = async () => {
    if (!validateProductData()) {
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, productUpdate: true }));

      let imageUrl = productData.imageUrl;

      if (productData.imageFile) {
        setLoading((prev) => ({ ...prev, imageUpload: true }));

        const imageRef = storageRef(
          storage,
          `products/${storeId}/${productData.id}/${productData.imageFile.name}`
        );

        await uploadBytes(imageRef, productData.imageFile);
        imageUrl = await getDownloadURL(imageRef);

        if (productData.imageUrl && productData.imageUrl !== imageUrl) {
          try {
            const oldImageRef = storageRef(storage, productData.imageUrl);
            await deleteObject(oldImageRef);
          } catch (error) {
            console.warn('Não foi possível remover a imagem antiga:', error);
          }
        }

        setLoading((prev) => ({ ...prev, imageUpload: false }));
      }

      const priceValue = parseFloat(productData.price.replace(',', '.'));
      const productToUpdate = {
        type: productData.type,
        name: productData.name.trim(),
        price: priceValue,
        category: productData.category.trim(),
        description: productData.description.trim(),
        imageUrl: imageUrl,
        sku: productData.sku.trim(),
        qtd: productData.type === 'product' ? parseFloat(productData.qtd) : null,
        weight: productData.type === 'product' && productData.nationalShipping ? parseFloat(productData.weight) : null,
        height: productData.type === 'product' && productData.nationalShipping ? parseFloat(productData.height) : null,
        width: productData.type === 'product' && productData.nationalShipping ? parseFloat(productData.width) : null,
        length: productData.type === 'product' && productData.nationalShipping ? parseFloat(productData.length) : null,
        nationalShipping: productData.type === 'product' ? productData.nationalShipping : false,
        updatedAt: Date.now(),
      };

      await update(ref(db, `stores/${storeId}/products/${productData.id}`), productToUpdate);

      setProducts((prev) =>
        prev.map(([key, product]) =>
          key === productData.id ? [key, productToUpdate] : [key, product]
        )
      );

      toggleModal('editProduct', false);
      showFeedback('Produto atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      showFeedback('Erro ao atualizar o produto.', 'error');
    } finally {
      setLoading((prev) => ({
        ...prev,
        productUpdate: false,
        imageUpload: false,
      }));
    }
  };

  // Handlers para loja
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setStoreData((prev) => ({ ...prev, logo: URL.createObjectURL(file) }));
    }
  };

  const handleStoreUpdate = async () => {
    if (!storeData.name.trim()) {
      showFeedback('O nome da loja é obrigatório.', 'error');
      return;
    }

    if (!isSafePlainName(storeData.name)) {
      showFeedback('O nome da loja contém conteúdo inválido. Use apenas texto simples.', 'error');
      return;
    }

    try {
      setLoading((prev) => ({ ...prev, store: true }));

      let logoUrl = storeData.logo;

      if (logoFile) {
        const logoRef = storageRef(storage, `store-logos/${storeId}/${logoFile.name}`);
        await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(logoRef);
      }

      const updates = {};
      updates[`stores/${storeId}/name`] = storeData.name.trim();
      updates[`stores/${storeId}/description`] = storeData.description.trim();
      updates[`stores/${storeId}/company/logo`] = logoUrl;
      updates[`stores/${storeId}/settings/showPrices`] = storeData.settings.showPrices;
      updates[`stores/${storeId}/contact`] = storeData.contact;
      updates[`stores/${storeId}/location`] = storeData.location;
      updates[`stores/${storeId}/socialMedia`] = storeData.socialMedia;
      updates[`stores/${storeId}/businessHours`] = storeData.businessHours;
      updates[`stores/${storeId}/policies`] = storeData.policies;
      updates[`stores/${storeId}/updatedAt`] = Date.now();

      await update(ref(db), updates);

      setStoreData((prev) => ({
        ...prev,
        logo: logoUrl,
      }));

      toggleModal('settings', false);
      showFeedback('Configurações da loja atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar loja:', error);
      showFeedback('Erro ao atualizar as configurações.', 'error');
    } finally {
      setLoading((prev) => ({ ...prev, store: false }));
    }
  };

  // Handler para mudar as abas nas configurações
  const handleTabChange = (event, newValue) => {
    setSettingsTab(newValue);
  };

  // Handler para atualizar horário de funcionamento
  const handleBusinessHoursChange = (day, field, value) => {
    setStoreData((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value,
        },
      },
    }));
  };

  // Handler para toggle de dia fechado
  const handleDayClosedToggle = (day) => {
    setStoreData((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          closed: !prev.businessHours[day].closed,
        },
      },
    }));
  };

  // Filtragem e ordenação
  const filteredProducts = useMemo(() => {
    return products.filter(([, product]) =>
      product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort(([, a], [, b]) => {
      const aValue = a[sorting.orderBy] || '';
      const bValue = b[sorting.orderBy] || '';
      if (sorting.order === 'asc') {
        return aValue.toString().localeCompare(bValue.toString());
      } else {
        return bValue.toString().localeCompare(aValue.toString());
      }
    });
  }, [filteredProducts, sorting]);

  // Paginação
  const handleChangePage = (event, newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination((prev) => ({
      ...prev,
      rowsPerPage: parseInt(event.target.value, 10),
      page: 0,
    }));
  };

  // Ordenação
  const handleRequestSort = (property) => {
    const isAsc = sorting.orderBy === property && sorting.order === 'asc';
    setSorting({
      order: isAsc ? 'desc' : 'asc',
      orderBy: property,
    });
  };

  // Renderização condicional para mobile/desktop
  const renderProducts = () => {
    if (isMobile) {
      return (
        <Grid container spacing={2} sx={{ mt: 2 }}>
          {sortedProducts
            .slice(
              pagination.page * pagination.rowsPerPage,
              pagination.page * pagination.rowsPerPage + pagination.rowsPerPage
            )
            .map(([key, product]) => (
              <Grid item xs={12} key={key}>
                <Card
                  className="product-card"
                  sx={{
                    borderRadius: '16px',
                    border: `1px solid ${T.border}`,
                    overflow: 'hidden',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                        {product?.imageUrl ? (
                          <CardMedia
                            component="img"
                            sx={{ width: 80, height: 80, borderRadius: 1 }}
                            image={product.imageUrl}
                            alt={product.name}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 80,
                              height: 80,
                              bgcolor: T.surface,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 1,
                            }}
                          >
                            <Image sx={{ color: T.textSub }} />
                          </Box>
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold" sx={{ color: T.text }}>
                            {product?.name || 'Sem nome'}
                          </Typography>
                          <Typography variant="body2" sx={{ color: T.gold, fontWeight: 600 }}>
                            {storeData.settings.showPrices
                              ? `${formatPrice(product?.price) || '0.00'} MT`
                              : 'Preço sob consulta'}
                          </Typography>
                          <Chip
                            label={product?.category || 'Sem categoria'}
                            size="small"
                            sx={{
                              mt: 1,
                              bgcolor: T.goldPale,
                              color: T.gold,
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>
                      </Box>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, key)}
                        aria-label="Ações do produto"
                        sx={{ color: T.gold }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      );
    } else {
      return (
        <TableContainer
          component={Paper}
          sx={{
            mt: 3,
            borderRadius: '16px',
            border: `1px solid ${T.border}`,
            overflow: 'hidden',
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: T.surface }}>
                <TableCell sx={{ width: 100, color: T.text, fontWeight: 600 }}>Imagem</TableCell>
                <TableCell sx={{ width: 300, color: T.text, fontWeight: 600 }}>
                  <TableSortLabel
                    active={sorting.orderBy === 'name'}
                    direction={sorting.order}
                    onClick={() => handleRequestSort('name')}
                    sx={{ color: T.text, '&.Mui-active': { color: T.gold } }}
                  >
                    Nome
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: 180, color: T.text, fontWeight: 600 }}>
                  <TableSortLabel
                    active={sorting.orderBy === 'price'}
                    direction={sorting.order}
                    onClick={() => handleRequestSort('price')}
                    sx={{ color: T.text, '&.Mui-active': { color: T.gold } }}
                  >
                    Preço
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: 200, color: T.text, fontWeight: 600 }}>Categoria</TableCell>
                {!isTablet && <TableCell sx={{ width: 350, color: T.text, fontWeight: 600 }}>Descrição</TableCell>}
                <TableCell sx={{ width: 150, color: T.text, fontWeight: 600 }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedProducts
                .slice(
                  pagination.page * pagination.rowsPerPage,
                  pagination.page * pagination.rowsPerPage + pagination.rowsPerPage
                )
                .map(([key, product]) => (
                  <TableRow key={key} hover>
                    <TableCell>
                      <Link to={`/market/products/${key}/edit`} style={{ textDecoration: 'none' }}>
                        {product?.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              bgcolor: T.surface,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 1,
                            }}
                          >
                            <Image sx={{ color: T.textSub, fontSize: 24 }} />
                          </Box>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        to={`/market/products/${key}/edit`}
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Typography sx={{ fontWeight: 500, color: T.text }}>
                          {product?.name || 'Sem nome'}
                        </Typography>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600, color: T.gold }}>
                        {storeData.settings.showPrices
                          ? `${formatPrice(product?.price) || '0.00'} MT`
                          : '--'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={product?.category || 'Sem categoria'}
                        size="small"
                        sx={{ bgcolor: T.goldPale, color: T.gold }}
                      />
                    </TableCell>
                    {!isTablet && (
                      <TableCell>
                        <Typography variant="body2" sx={{ color: T.textSub }}>
                          {product?.description?.length > 50
                            ? `${product.description.substring(0, 50)}...`
                            : product?.description || 'Sem descrição'}
                        </Typography>
                      </TableCell>
                    )}
                    <TableCell>
                      <Tooltip title="Ver produto">
                        <IconButton
                          component={Link}
                          to={`/product/${key}/store/${storeId}`}
                          sx={{ color: T.gold }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar produto">
                        <IconButton
                          onClick={() => handleEditProduct(key, product)}
                          sx={{ color: T.gold }}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remover produto">
                        <IconButton
                          onClick={() => {
                            setSelectedProductId(key);
                            toggleModal('deleteConfirm', true);
                          }}
                          sx={{ color: T.error }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }
  };

  const pendingQuotes = receivedQuotes.filter((quote) => quote.status === 'pending');
  const awaitingDecision = receivedQuotes.filter((quote) => quote.status === 'answered');
  const acceptedQuotes = receivedQuotes.filter((quote) => quote.status === 'accepted');
  const rejectedQuotes = receivedQuotes.filter((quote) => quote.status === 'rejected');
  const outOfStockProducts = products.filter(([, product]) =>
    product?.type === 'product' && Number(product?.qtd) === 0
  );
  const incompleteProducts = products.filter(([, product]) =>
    !product?.name?.trim() || !(Number(product?.price) > 0) || !product?.imageUrl
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

      <Container maxWidth="lg">
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
          {/* Background decorations */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: T.gold,
                  color: T.white,
                  border: `2px solid ${T.white}`,
                }}
              >
                <Storefront sx={{ fontSize: 32 }} />
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
                  {storeData.name || 'Minha Loja'}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Gerencie seus produtos e configurações
                </Typography>
              </Box>
            </Box>

            {/* Stats Cards */}
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={4} md={3}>
                <Paper
                  className="stats-card"
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid rgba(255,255,255,0.1)`,
                    textAlign: 'center',
                  }}
                >
                  <Inventory sx={{ color: T.gold, fontSize: 24, mb: 1 }} />
                  <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: T.white }}>
                    {stats.totalProducts}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>
                    Produtos
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper
                  className="stats-card"
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid rgba(255,255,255,0.1)`,
                    textAlign: 'center',
                  }}
                >
                  <ShoppingCart sx={{ color: T.gold, fontSize: 24, mb: 1 }} />
                  <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: T.white }}>
                    {stats.totalSales}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>
                    Negócios aceites
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} md={3}>
                <Paper
                  className="stats-card"
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid rgba(255,255,255,0.1)`,
                    textAlign: 'center',
                  }}
                >
                  <Visibility sx={{ color: T.gold, fontSize: 24, mb: 1 }} />
                  <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: T.white }}>
                    {stats.totalViews}
                  </Typography>
                  <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>
                    Visualizações
                  </Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        <Paper sx={{ mb: 3, borderRadius: 2, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
          <Tabs
            value={activeSection}
            onChange={(_, section) => setActiveSection(section)}
            variant={isMobile ? 'scrollable' : 'fullWidth'}
            scrollButtons="auto"
            aria-label="Secções de gestão da loja"
          >
            <Tab value="overview" label="Visão geral" />
            <Tab value="products" label={`Produtos (${products.length})`} />
            <Tab value="requests" label={`Pedidos (${pendingQuotes.length})`} />
            <Tab value="settings" label="Definições" />
          </Tabs>
        </Paper>

        {activeSection === 'overview' && (
          <Stack spacing={3}>
            <Grid container spacing={2}>
              {[
                { label: 'Pedidos pendentes', value: pendingQuotes.length, icon: <RequestQuote />, color: T.gold },
                { label: 'Aguardam decisão', value: awaitingDecision.length, icon: <AccessTime />, color: T.warning },
                { label: 'Propostas aceites', value: acceptedQuotes.length, icon: <Verified />, color: T.success },
                { label: 'Cliques em produtos', value: marketMetrics.clicks, icon: <Visibility />, color: T.navyLight },
              ].map((item) => (
                <Grid item xs={6} md={3} key={item.label}>
                  <Paper variant="outlined" sx={{ p: 2.5, height: '100%', borderRadius: 2 }}>
                    <Box sx={{ color: item.color, mb: 1 }}>{item.icon}</Box>
                    <Typography variant="h4" fontWeight={800}>{item.value}</Typography>
                    <Typography color="text.secondary" variant="body2">{item.label}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {(outOfStockProducts.length > 0 || incompleteProducts.length > 0) && (
              <Alert severity="warning" icon={<Warning />}>
                {outOfStockProducts.length > 0 && `${outOfStockProducts.length} produto(s) sem stock. `}
                {incompleteProducts.length > 0 && `${incompleteProducts.length} produto(s) precisam de imagem ou dados válidos.`}
              </Alert>
            )}

            <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Ações rápidas</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button component={Link} to="/market/products/new" variant="contained" startIcon={<Add />}>Adicionar produto</Button>
                <Button onClick={() => setActiveSection('requests')} variant="outlined" startIcon={<RequestQuote />}>Ver pedidos</Button>
                <Button component={Link} to={`/loja/${storeId}`} variant="outlined" startIcon={<Visibility />}>Ver loja pública</Button>
                <Button onClick={() => setActiveSection('settings')} startIcon={<Settings />}>Editar loja</Button>
              </Stack>
            </Paper>
          </Stack>
        )}

        {activeSection === 'requests' && (
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={800}>Pedidos recebidos</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {pendingQuotes.length} pendente(s), {awaitingDecision.length} a aguardar decisão, {acceptedQuotes.length} aceite(s) e {rejectedQuotes.length} recusado(s).
            </Typography>
            {receivedQuotes.length === 0 ? (
              <Alert severity="info">Ainda não recebeu pedidos através da sua loja.</Alert>
            ) : (
              <Stack spacing={1.5} sx={{ mb: 3 }}>
                {receivedQuotes.slice(0, 5).map((quote) => (
                  <Paper key={quote.id} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1}>
                      <Box>
                        <Typography fontWeight={700}>{quote.customerName || 'Cliente'}</Typography>
                        <Typography variant="body2" color="text.secondary">{quote.totalItems || quote.items?.length || 0} item(ns)</Typography>
                      </Box>
                      <Chip size="small" label={quote.status || 'pending'} />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            )}
            <Button component={Link} to="/cotacoes" variant="contained" startIcon={<RequestQuote />}>Abrir central de pedidos</Button>
          </Paper>
        )}

        {activeSection === 'settings' && (
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 }, borderRadius: 2 }}>
            <Typography variant="h5" fontWeight={800}>Definições da loja</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>Atualize informações, contactos, localização, horários e políticas.</Typography>
            <Button variant="contained" startIcon={<Settings />} onClick={() => toggleModal('settings', true)}>Abrir definições</Button>
          </Paper>
        )}

        {/* Barra de pesquisa e ações */}
        {activeSection === 'products' && (
          <>
        <Paper
          className="animate-fade-up delay-1"
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '16px',
            border: `1px solid ${T.border}`,
            background: T.white,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'stretch' : 'center',
              gap: isMobile ? 2 : 0,
            }}
          >
            <TextField
              placeholder="Pesquisar produto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: T.gold }} />
                  </InputAdornment>
                ),
              }}
              fullWidth
              size={isMobile ? 'small' : 'medium'}
              sx={{
                maxWidth: isMobile ? '100%' : '400px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': { borderColor: T.gold },
                  '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                },
              }}
            />
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Button
                variant="contained"
                component={Link}
                to="/market/products/new"
                size={isMobile ? 'small' : 'medium'}
                startIcon={<Add />}
                sx={{
                  bgcolor: T.gold,
                  color: T.white,
                  '&:hover': { bgcolor: T.goldLight },
                  borderRadius: '10px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                }}
              >
                {isMobile ? 'Adicionar' : 'Adicionar Produto'}
              </Button>
              <IconButton
                onClick={() => {
                  toggleModal('settings', true);
                  setSettingsTab(0);
                }}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  bgcolor: T.surface,
                  color: T.gold,
                  '&:hover': { bgcolor: T.goldPale },
                  borderRadius: '10px',
                }}
              >
                <Settings />
              </IconButton>
            </Box>
          </Box>
        </Paper>

        {/* Tabela/Lista de produtos */}
        {loading.products ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: T.gold }} />
          </Box>
        ) : (
          <>
            {renderProducts()}
            <TablePagination
              rowsPerPageOptions={isMobile ? [3, 5, 10] : [5, 10, 25]}
              component="div"
              count={filteredProducts.length}
              rowsPerPage={pagination.rowsPerPage}
              page={pagination.page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={isMobile ? 'Itens:' : 'Itens por página:'}
              sx={{
                mt: 2,
                '& .MuiTablePagination-toolbar': {
                  paddingLeft: isMobile ? 0 : undefined,
                },
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  color: T.textSub,
                },
              }}
            />
          </>
        )}
          </>
        )}
      </Container>

      {/* Menu de ações para mobile */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            border: `1px solid ${T.border}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          }
        }}
      >
        <MenuItem onClick={() => {
          const product = products.find(([id]) => id === selectedProductId)?.[1];
          if (product) handleEditProduct(selectedProductId, product);
        }}>
          <ListItemIcon>
            <Edit sx={{ color: T.gold, fontSize: 20 }} />
          </ListItemIcon>
          <Typography variant="inherit" sx={{ color: T.text }}>Editar</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedProductId(selectedProductId);
            toggleModal('deleteConfirm', true);
          }}
        >
          <ListItemIcon>
            <Delete sx={{ color: T.error, fontSize: 20 }} />
          </ListItemIcon>
          <Typography variant="inherit" sx={{ color: T.error }}>Remover</Typography>
        </MenuItem>
      </Menu>

      {/* Modal de Configurações da Loja */}
      <Dialog
        open={modals.settings}
        onClose={() => toggleModal('settings', false)}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: '24px',
            overflow: 'hidden',
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyLight} 100%)`,
            color: T.white,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Configurações da Loja</Typography>
          <IconButton onClick={() => toggleModal('settings', false)} sx={{ color: T.white }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <Box sx={{ borderBottom: `1px solid ${T.border}`, bgcolor: T.surface }}>
          <Tabs
            value={settingsTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            TabIndicatorProps={{
              sx: {
                background: T.gold,
                height: 3,
              }
            }}
            sx={{
              '& .MuiTab-root': {
                color: T.textSub,
                textTransform: 'none',
                fontWeight: 600,
                '&.Mui-selected': {
                  color: T.gold,
                },
              },
            }}
          >
            <Tab label="Informações Básicas" />
            <Tab label="Contacto" />
            <Tab label="Localização" />
            <Tab label="Redes Sociais" />
            <Tab label="Horário" />
            <Tab label="Políticas" />
          </Tabs>
        </Box>
        <DialogContent dividers sx={{ pt: 3, maxHeight: '60vh', overflow: 'auto', bgcolor: T.white }}>
          {/* Aba 1: Informações Básicas */}
          <TabPanel value={settingsTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome da Loja"
                  value={storeData.name}
                  onChange={(e) => setStoreData((prev) => ({ ...prev, name: e.target.value }))}
                  error={!!errors['storeName']}
                  helperText={errors['storeName'] || ''}
                  size={isMobile ? 'small' : 'medium'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Storefront sx={{ color: T.gold }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Descrição da Loja"
                  value={storeData.description}
                  onChange={(e) => setStoreData((prev) => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={isMobile ? 3 : 4}
                  size={isMobile ? 'small' : 'medium'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Description sx={{ color: T.gold }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                    },
                  }}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body1" sx={{ color: T.text }}>Exibir Preços</Typography>
                  <Switch
                    checked={storeData.settings.showPrices}
                    onChange={(e) =>
                      setStoreData((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, showPrices: e.target.checked },
                      }))
                    }
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': {
                        color: T.gold,
                      },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                        backgroundColor: T.gold,
                      },
                    }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" sx={{ mb: 1, color: T.text }}>Logo da Loja</Typography>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    sx={{ mb: 2, borderColor: T.borderMid, color: T.gold }}
                    size={isMobile ? 'small' : 'medium'}
                  >
                    Alterar Logo
                  </Button>
                </label>
                {storeData.logo && (
                  <Box
                    sx={{
                      width: '100%',
                      height: isMobile ? 150 : 200,
                      border: `1px dashed ${T.borderMid}`,
                      borderRadius: 2,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: T.surface,
                    }}
                  >
                    <img
                      src={storeData.logo}
                      alt="Logo da Loja"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                      }}
                    />
                  </Box>
                )}
              </Grid>
            </Grid>
          </TabPanel>
          {/* Aba 2: Contacto */}
          <TabPanel value={settingsTab} index={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Telefone"
                  value={storeData.contact.phone}
                  onChange={(e) =>
                    setStoreData((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, phone: e.target.value },
                    }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone sx={{ color: T.gold }} />
                      </InputAdornment>
                    ),
                  }}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="WhatsApp"
                  value={storeData.contact.whatsapp}
                  onChange={(e) =>
                    setStoreData((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, whatsapp: e.target.value },
                    }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <WhatsApp sx={{ color: '#25D366' }} />
                      </InputAdornment>
                    ),
                  }}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={storeData.contact.email}
                  onChange={(e) =>
                    setStoreData((prev) => ({
                      ...prev,
                      contact: { ...prev.contact, email: e.target.value },
                    }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email sx={{ color: '#EA4335' }} />
                      </InputAdornment>
                    ),
                  }}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </TabPanel>
          {/* Aba 3: Localização */}
          <TabPanel value={settingsTab} index={2}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Endereço"
                  value={storeData.location.address}
                  onChange={(e) =>
                    setStoreData((prev) => ({
                      ...prev,
                      location: { ...prev.location, address: e.target.value },
                    }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ color: T.gold }} />
                      </InputAdornment>
                    ),
                  }}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Cidade"
                  value={storeData.location.city}
                  onChange={(e) =>
                    setStoreData((prev) => ({
                      ...prev,
                      location: { ...prev.location, city: e.target.value },
                    }))
                  }
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Província"
                  value={storeData.location.province}
                  onChange={(e) =>
                    setStoreData((prev) => ({
                      ...prev,
                      location: { ...prev.location, province: e.target.value },
                    }))
                  }
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </TabPanel>
          {/* Aba 4: Redes Sociais */}
          <TabPanel value={settingsTab} index={3}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Website"
                  value={storeData.socialMedia.website}
                  onChange={(e) =>
                    setStoreData((prev) => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, website: e.target.value },
                    }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Language sx={{ color: '#4285F4' }} />
                      </InputAdornment>
                    ),
                  }}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Facebook"
                  value={storeData.socialMedia.facebook}
                  onChange={(e) =>
                    setStoreData((prev) => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, facebook: e.target.value },
                    }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Facebook sx={{ color: '#1877F2' }} />
                      </InputAdornment>
                    ),
                  }}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Instagram"
                  value={storeData.socialMedia.instagram}
                  onChange={(e) =>
                    setStoreData((prev) => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, instagram: e.target.value },
                    }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Instagram sx={{ color: '#E4405F' }} />
                      </InputAdornment>
                    ),
                  }}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Twitter"
                  value={storeData.socialMedia.twitter}
                  onChange={(e) =>
                    setStoreData((prev) => ({
                      ...prev,
                      socialMedia: { ...prev.socialMedia, twitter: e.target.value },
                    }))
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Twitter sx={{ color: '#1DA1F2' }} />
                      </InputAdornment>
                    ),
                  }}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </TabPanel>
          {/* Aba 5: Horário de Funcionamento */}
          <TabPanel value={settingsTab} index={4}>
            <Typography variant="body2" sx={{ color: T.textSub, mb: 2 }}>
              Defina o horário de funcionamento da sua loja. Deixe em branco se não aplicável.
            </Typography>
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => {
              const dayNames = {
                monday: 'Segunda-feira',
                tuesday: 'Terça-feira',
                wednesday: 'Quarta-feira',
                thursday: 'Quinta-feira',
                friday: 'Sexta-feira',
                saturday: 'Sábado',
                sunday: 'Domingo',
              };
              return (
                <Accordion key={day} sx={{ mb: 1, borderRadius: '12px', border: `1px solid ${T.border}` }}>
                  <AccordionSummary expandIcon={<ExpandMore sx={{ color: T.gold }} />}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!storeData.businessHours[day].closed}
                          onChange={() => handleDayClosedToggle(day)}
                          onClick={(e) => e.stopPropagation()}
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
                        <Typography sx={{ color: T.text, fontWeight: 500 }}>
                          {dayNames[day]}
                        </Typography>
                      }
                      sx={{ mr: 2 }}
                    />
                    {!storeData.businessHours[day].closed && (
                      <Chip
                        size="small"
                        label={`${storeData.businessHours[day].open || '--:--'} - ${storeData.businessHours[day].close || '--:--'}`}
                        sx={{ bgcolor: T.goldPale, color: T.gold }}
                      />
                    )}
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Abre às"
                          type="time"
                          value={storeData.businessHours[day].open}
                          onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                          disabled={storeData.businessHours[day].closed}
                          size={isMobile ? 'small' : 'medium'}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '&:hover fieldset': { borderColor: T.gold },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          fullWidth
                          label="Fecha às"
                          type="time"
                          value={storeData.businessHours[day].close}
                          onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                          disabled={storeData.businessHours[day].closed}
                          size={isMobile ? 'small' : 'medium'}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '&:hover fieldset': { borderColor: T.gold },
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </TabPanel>
          {/* Aba 6: Políticas */}
          <TabPanel value={settingsTab} index={5}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Política de Entregas"
                  value={storeData.policies.delivery}
                  onChange={(e) =>
                    setStoreData((prev) => ({
                      ...prev,
                      policies: { ...prev.policies, delivery: e.target.value },
                    }))
                  }
                  multiline
                  rows={3}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Política de Devoluções"
                  value={storeData.policies.returns}
                  onChange={(e) =>
                    setStoreData((prev) => ({
                      ...prev,
                      policies: { ...prev.policies, returns: e.target.value },
                    }))
                  }
                  multiline
                  rows={3}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                    },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Política de Pagamentos"
                  value={storeData.policies.payments}
                  onChange={(e) =>
                    setStoreData((prev) => ({
                      ...prev,
                      policies: { ...prev.policies, payments: e.target.value },
                    }))
                  }
                  multiline
                  rows={3}
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                    },
                  }}
                />
              </Grid>
            </Grid>
          </TabPanel>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: T.white, borderTop: `1px solid ${T.border}` }}>
          <Button
            variant="outlined"
            onClick={() => toggleModal('settings', false)}
            disabled={loading.store}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              borderColor: T.borderMid,
              color: T.textSub,
              '&:hover': { borderColor: T.gold, color: T.gold },
              borderRadius: '10px',
              textTransform: 'none',
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleStoreUpdate}
            disabled={!storeData.name.trim() || loading.store}
            size={isMobile ? 'small' : 'medium'}
            startIcon={loading.store ? <CircularProgress size={20} /> : <Save />}
            sx={{
              bgcolor: T.gold,
              color: T.white,
              '&:hover': { bgcolor: T.goldLight },
              borderRadius: '10px',
              textTransform: 'none',
              px: 3,
            }}
          >
            {loading.store ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Edição de Produto */}
      <Dialog
        open={modals.editProduct}
        onClose={() => !loading.productUpdate && toggleModal('editProduct', false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            overflow: 'hidden',
          }
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyLight} 100%)`,
            color: T.white,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Editar Produto</Typography>
          <IconButton
            onClick={() => !loading.productUpdate && toggleModal('editProduct', false)}
            sx={{ color: T.white }}
            disabled={loading.productUpdate}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3, bgcolor: T.white }}>
          <Grid container spacing={2}>
            {/* Seção de Upload de Imagem */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom sx={{ color: T.text, fontWeight: 600 }}>
                Imagem do Produto
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  mb: 3,
                }}
              >
                {(productData.imageUrl || productData.imageFile) && (
                  <Box
                    sx={{
                      width: '100%',
                      height: isMobile ? 150 : 200,
                      position: 'relative',
                      border: `1px dashed ${T.borderMid}`,
                      borderRadius: 2,
                      overflow: 'hidden',
                      bgcolor: T.surface,
                    }}
                  >
                    <img
                      src={productData.imageUrl || URL.createObjectURL(productData.imageFile)}
                      alt="Preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                    <IconButton
                      onClick={handleRemoveProductImage}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: T.white,
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.7)',
                        },
                      }}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProductImageChange}
                    style={{ display: 'none' }}
                    id="product-image-upload"
                  />
                  <label htmlFor="product-image-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      fullWidth
                      startIcon={<Image />}
                      disabled={loading.imageUpload}
                      sx={{
                        borderColor: T.borderMid,
                        color: T.gold,
                        '&:hover': { borderColor: T.gold },
                        borderRadius: '10px',
                        textTransform: 'none',
                      }}
                    >
                      {productData.imageUrl ? 'Alterar Imagem' : 'Adicionar Imagem'}
                    </Button>
                  </label>
                  {productData.imageUrl && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleRemoveProductImage}
                      fullWidth
                      startIcon={<Delete />}
                      disabled={loading.imageUpload}
                      sx={{
                        borderColor: T.borderMid,
                        color: T.error,
                        '&:hover': { borderColor: T.error },
                        borderRadius: '10px',
                        textTransform: 'none',
                      }}
                    >
                      Remover Imagem
                    </Button>
                  )}
                </Box>
              </Box>
            </Grid>
            {/* Campos do Produto */}
            <Grid item xs={12} md={8}>
              <FormControl fullWidth sx={{ mb: 2 }} error={!!errors['type']}>
                <InputLabel sx={{ color: T.textSub }}>Tipo *</InputLabel>
                <Select
                  value={productData.type}
                  label="Tipo"
                  onChange={(e) => setProductData((prev) => ({ ...prev, type: e.target.value }))}
                  sx={{
                    borderRadius: '12px',
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: T.gold },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: T.gold },
                  }}
                >
                  <MenuItem value="product">Produto</MenuItem>
                  <MenuItem value="service">Serviço</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Nome do Produto *"
                value={productData.name}
                onChange={(e) => setProductData((prev) => ({ ...prev, name: e.target.value }))}
                fullWidth
                error={!!errors['name']}
                helperText={errors['name'] || 'Ex: Camiseta Branca ou Consultoria de Marketing'}
                size={isMobile ? 'small' : 'medium'}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Inventory sx={{ color: T.gold }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': { borderColor: T.gold },
                    '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                  },
                }}
              />
              <NumericFormat
                value={productData.price}
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                onValueChange={(values) => setProductData((prev) => ({ ...prev, price: values.value }))}
                customInput={TextField}
                fullWidth
                label="Preço (MZN) *"
                InputProps={{
                  startAdornment: <InputAdornment position="start"><AttachMoney sx={{ color: T.gold }} /></InputAdornment>,
                }}
                error={!!errors['price']}
                helperText={errors['price'] || 'Ex: 1234,56'}
                size={isMobile ? 'small' : 'medium'}
                required
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': { borderColor: T.gold },
                    '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                  },
                }}
              />
              <TextField
                label="Categoria"
                value={productData.category}
                onChange={(e) => setProductData((prev) => ({ ...prev, category: e.target.value }))}
                fullWidth
                helperText="Ex: Roupas, Eletrônicos, Serviços"
                size={isMobile ? 'small' : 'medium'}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Category sx={{ color: T.gold }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': { borderColor: T.gold },
                    '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                  },
                }}
              />
              <TextField
                label="Descrição"
                value={productData.description}
                onChange={(e) => setProductData((prev) => ({ ...prev, description: e.target.value }))}
                multiline
                rows={isMobile ? 3 : 4}
                fullWidth
                helperText="Detalhes atrativos para o cliente"
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': { borderColor: T.gold },
                    '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                  },
                }}
              />
              {productData.type === 'product' ? (
                <>
                  <NumericFormat
                    value={productData.qtd}
                    allowNegative={false}
                    onValueChange={(values) => setProductData((prev) => ({ ...prev, qtd: values.value }))}
                    customInput={TextField}
                    fullWidth
                    label="Quantidade *"
                    error={!!errors['qtd']}
                    helperText={errors['qtd'] || 'Estoque disponível'}
                    size={isMobile ? 'small' : 'medium'}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Inventory sx={{ color: T.gold }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '&:hover fieldset': { borderColor: T.gold },
                        '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                      },
                    }}
                  />
                  <TextField
                    label="SKU"
                    value={productData.sku}
                    onChange={(e) => setProductData((prev) => ({ ...prev, sku: e.target.value }))}
                    fullWidth
                    helperText="Código interno (ex: CAM-BRANCO-M)"
                    size={isMobile ? 'small' : 'medium'}
                    sx={{
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '&:hover fieldset': { borderColor: T.gold },
                        '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                      },
                    }}
                  />
                  <Divider sx={{ my: 2, borderColor: T.border }} />
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 2, display: 'flex', alignItems: 'center', color: T.gold }}
                  >
                    <LocalShipping sx={{ mr: 1 }} /> Frete Nacional
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={productData.nationalShipping}
                        onChange={(e) => setProductData((prev) => ({ ...prev, nationalShipping: e.target.checked }))}
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
                  {productData.nationalShipping && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <NumericFormat
                          value={productData.weight}
                          allowNegative={false}
                          decimalScale={2}
                          fixedDecimalScale
                          onValueChange={(values) => setProductData((prev) => ({ ...prev, weight: values.value }))}
                          customInput={TextField}
                          fullWidth
                          label="Peso (kg) *"
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><Scale sx={{ color: T.gold }} /></InputAdornment>,
                          }}
                          error={!!errors['weight']}
                          helperText={errors['weight'] || 'Ex: 0,50 para roupas leves'}
                          size={isMobile ? 'small' : 'medium'}
                          required
                          sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '&:hover fieldset': { borderColor: T.gold },
                              '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <NumericFormat
                          value={productData.height}
                          allowNegative={false}
                          decimalScale={2}
                          fixedDecimalScale
                          onValueChange={(values) => setProductData((prev) => ({ ...prev, height: values.value }))}
                          customInput={TextField}
                          fullWidth
                          label="Altura (cm) *"
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><Straighten sx={{ color: T.gold }} /></InputAdornment>,
                          }}
                          error={!!errors['height']}
                          helperText={errors['height'] || 'Ex: 30,00'}
                          size={isMobile ? 'small' : 'medium'}
                          required
                          sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '&:hover fieldset': { borderColor: T.gold },
                              '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <NumericFormat
                          value={productData.width}
                          allowNegative={false}
                          decimalScale={2}
                          fixedDecimalScale
                          onValueChange={(values) => setProductData((prev) => ({ ...prev, width: values.value }))}
                          customInput={TextField}
                          fullWidth
                          label="Largura (cm) *"
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><Straighten sx={{ color: T.gold }} /></InputAdornment>,
                          }}
                          error={!!errors['width']}
                          helperText={errors['width'] || 'Ex: 20,00'}
                          size={isMobile ? 'small' : 'medium'}
                          required
                          sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '&:hover fieldset': { borderColor: T.gold },
                              '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <NumericFormat
                          value={productData.length}
                          allowNegative={false}
                          decimalScale={2}
                          fixedDecimalScale
                          onValueChange={(values) => setProductData((prev) => ({ ...prev, length: values.value }))}
                          customInput={TextField}
                          fullWidth
                          label="Comprimento (cm) *"
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><Straighten sx={{ color: T.gold }} /></InputAdornment>,
                          }}
                          error={!!errors['length']}
                          helperText={errors['length'] || 'Ex: 5,00'}
                          size={isMobile ? 'small' : 'medium'}
                          required
                          sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '&:hover fieldset': { borderColor: T.gold },
                              '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  )}
                </>
              ) : (
                <TextField
                  label="SKU"
                  value={productData.sku}
                  onChange={(e) => setProductData((prev) => ({ ...prev, sku: e.target.value }))}
                  fullWidth
                  helperText="Código opcional para serviços"
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    mb: 2,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold, borderWidth: '2px' },
                    },
                  }}
                />
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: T.white, borderTop: `1px solid ${T.border}` }}>
          <Button
            variant="outlined"
            onClick={() => toggleModal('editProduct', false)}
            disabled={loading.productUpdate}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              borderColor: T.borderMid,
              color: T.textSub,
              '&:hover': { borderColor: T.gold, color: T.gold },
              borderRadius: '10px',
              textTransform: 'none',
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateProduct}
            disabled={Object.keys(errors).length > 0 || loading.productUpdate}
            size={isMobile ? 'small' : 'medium'}
            startIcon={loading.productUpdate ? <CircularProgress size={20} /> : <Save />}
            sx={{
              bgcolor: T.gold,
              color: T.white,
              '&:hover': { bgcolor: T.goldLight },
              borderRadius: '10px',
              textTransform: 'none',
              px: 3,
            }}
          >
            {loading.productUpdate ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog
        open={modals.deleteConfirm}
        onClose={() => toggleModal('deleteConfirm', false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            border: `1px solid ${T.border}`,
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: T.text }}>
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: T.textSub }}>
            Tem certeza que deseja remover este produto? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={() => toggleModal('deleteConfirm', false)}
            variant="outlined"
            size={isMobile ? 'small' : 'medium'}
            sx={{
              borderColor: T.borderMid,
              color: T.textSub,
              '&:hover': { borderColor: T.gold, color: T.gold },
              borderRadius: '10px',
              textTransform: 'none',
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              handleRemoveProduct(selectedProductId);
              toggleModal('deleteConfirm', false);
            }}
            variant="contained"
            sx={{
              bgcolor: T.error,
              color: T.white,
              '&:hover': { bgcolor: '#dc2626' },
              borderRadius: '10px',
              textTransform: 'none',
              px: 3,
            }}
          >
            Remover
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de feedback */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{
          vertical: isMobile ? 'bottom' : 'top',
          horizontal: 'center',
        }}
      >
        <Alert
          onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
          severity={feedback.severity}
          sx={{
            width: '100%',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          }}
          variant="filled"
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageStoreDesk;

import React, { useState, useEffect, useMemo } from 'react';
import { ref, get, remove, update } from 'firebase/database';
import { db, storage } from '../../fb';
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
} from '@mui/icons-material';
import { ref as storageRef, getDownloadURL, uploadBytes, deleteObject } from 'firebase/storage';
import { formatPrice } from '../../utils/utils';
import { NumericFormat } from 'react-number-format';

// Componente para abas nas configurações
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

const ManageStoreDesk = ({ storeId }) => {
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
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading((prev) => ({ ...prev, products: true }));

        const productsRef = ref(db, `stores/${storeId}/products`);
        const productsSnapshot = await get(productsRef);
        setProducts(productsSnapshot.exists() ? Object.entries(productsSnapshot.val()) : []);

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
      } catch (error) {
        showFeedback('Erro ao carregar dados. Tente novamente.', 'error');
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading((prev) => ({ ...prev, products: false }));
      }
    };

    fetchInitialData();
  }, [storeId]);

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
                <Card>
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
                              bgcolor: 'grey.100',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: 1,
                            }}
                          >
                            <Image color="disabled" />
                          </Box>
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {product?.name || 'Sem nome'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {storeData.settings.showPrices
                              ? `${formatPrice(product?.price) || '0.00'} MZN`
                              : '--'}
                          </Typography>
                          <Typography variant="body2">
                            {product?.category || 'Sem categoria'}
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton
                        onClick={(e) => handleMenuOpen(e, key)}
                        aria-label="Ações do produto"
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
        <TableContainer component={Paper} sx={{ mt: 3, boxShadow: 2, borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.light', '& th': { color: 'white' } }}>
                <TableCell sx={{ width: 100 }}>Imagem</TableCell>
                <TableCell sx={{ width: 300 }}>
                  <TableSortLabel
                    active={sorting.orderBy === 'name'}
                    direction={sorting.order}
                    onClick={() => handleRequestSort('name')}
                  >
                    Nome
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: 180 }}>
                  <TableSortLabel
                    active={sorting.orderBy === 'price'}
                    direction={sorting.order}
                    onClick={() => handleRequestSort('price')}
                  >
                    Preço
                  </TableSortLabel>
                </TableCell>
                <TableCell sx={{ width: 200 }}>Categoria</TableCell>
                {!isTablet && <TableCell sx={{ width: 350 }}>Descrição</TableCell>}
                <TableCell sx={{ width: 150 }}>Ações</TableCell>
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
                      <Link to={`/produto/${key}`} style={{ textDecoration: 'none' }}>
                        {product?.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Sem imagem
                          </Typography>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link to={`/produto/${key}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {product?.name || 'Sem nome'}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {storeData.settings.showPrices
                        ? `${formatPrice(product?.price) || '0.00'} MZN`
                        : '--'}
                    </TableCell>
                    <TableCell>{product?.category || 'Sem categoria'}</TableCell>
                    {!isTablet && (
                      <TableCell>
                        {product?.description?.length > 50
                          ? `${product.description.substring(0, 50)}...`
                          : product?.description || 'Sem descrição'}
                      </TableCell>
                    )}
                    <TableCell>
                      <Tooltip title="Ver produto">
                        <IconButton
                          color="info"
                          component={Link}
                          to={`/produto/${key}/loja/${storeId}`}
                          aria-label="Ver produto"
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar produto">
                        <IconButton
                          color="primary"
                          onClick={() => handleEditProduct(key, product)}
                          aria-label="Editar produto"
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remover produto">
                        <IconButton
                          color="error"
                          onClick={() => {
                            setSelectedProductId(key);
                            toggleModal('deleteConfirm', true);
                          }}
                          aria-label="Remover produto"
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

  return (
    <Box sx={{ p: isMobile ? 2 : 4, bgcolor: 'white', maxWidth: 1400, mx: 'auto' }}>
      <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
        Gerir Loja
      </Typography>

      {/* Barra de pesquisa e ações */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? 2 : 0,
          mb: 3,
        }}
      >
        <TextField
          placeholder="Pesquisar produto..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          fullWidth
          size={isMobile ? 'small' : 'medium'}
          sx={{
            maxWidth: isMobile ? '100%' : '400px',
            order: isMobile ? 1 : 0,
          }}
        />
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            order: isMobile ? 0 : 1,
          }}
        >
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to={`/addProduct`}
            size={isMobile ? 'small' : 'medium'}
            startIcon={<Add />}
            sx={{
              whiteSpace: 'nowrap',
              order: isMobile ? 0 : 1,
            }}
          >
            {isMobile ? 'Adicionar' : 'Adicionar Produto'}
          </Button>
          <IconButton
            color="primary"
            onClick={() => {
              toggleModal('settings', true);
              setSettingsTab(0);
            }}
            size={isMobile ? 'small' : 'medium'}
            sx={{
              order: isMobile ? 1 : 0,
              ml: isMobile ? 0 : 2,
            }}
          >
            <Settings fontSize={isMobile ? 'small' : 'medium'} />
          </IconButton>
        </Box>
      </Box>

      {/* Tabela/Lista de produtos */}
      {loading.products ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
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
            }}
          />
        </>
      )}

      {/* Menu de ações para mobile */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        <MenuItem
          onClick={() => {
            const product = products.find(([id]) => id === selectedProductId)?.[1];
            if (product) handleEditProduct(selectedProductId, product);
          }}
        >
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <Typography variant="inherit">Editar</Typography>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setSelectedProductId(selectedProductId);
            toggleModal('deleteConfirm', true);
          }}
        >
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <Typography variant="inherit" color="error">
            Remover
          </Typography>
        </MenuItem>
      </Menu>

      {/* Modal de Configurações da Loja */}
      <Dialog
        open={modals.settings}
        onClose={() => toggleModal('settings', false)}
        fullWidth
        maxWidth="md"
        fullScreen={isMobile}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'primary.main',
            color: 'white',
            position: 'sticky',
            top: 0,
            zIndex: 1,
          }}
        >
          <Typography variant="h6">Configurações da Loja</Typography>
          <IconButton onClick={() => toggleModal('settings', false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={settingsTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="Informações Básicas" />
            <Tab label="Contacto" />
            <Tab label="Localização" />
            <Tab label="Redes Sociais" />
            <Tab label="Horário" />
            <Tab label="Políticas" />
          </Tabs>
        </Box>
        <DialogContent dividers sx={{ pt: 3, maxHeight: '60vh', overflow: 'auto' }}>
          {/* Aba 1: Informações Básicas */}
          <TabPanel value={settingsTab} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome da Loja"
                  value={storeData.name}
                  onChange={(e) => setStoreData((prev) => ({ ...prev, name: e.target.value }))}
                  sx={{ mb: 3, minWidth: isMobile ? '100%' : 300 }}
                  error={!!errors['storeName']}
                  helperText={errors['storeName'] || ''}
                  size={isMobile ? 'small' : 'medium'}
                />
                <TextField
                  fullWidth
                  label="Descrição da Loja"
                  value={storeData.description}
                  onChange={(e) => setStoreData((prev) => ({ ...prev, description: e.target.value }))}
                  multiline
                  rows={isMobile ? 3 : 4}
                  sx={{ mb: 3, minWidth: isMobile ? '100%' : 330 }}
                  size={isMobile ? 'small' : 'medium'}
                />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="body1">Exibir Preços</Typography>
                  <Switch
                    checked={storeData.settings.showPrices}
                    onChange={(e) =>
                      setStoreData((prev) => ({
                        ...prev,
                        settings: { ...prev.settings, showPrices: e.target.checked },
                      }))
                    }
                    color="primary"
                  />
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  Logo da Loja
                </Typography>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                  id="logo-upload"
                />
                <label htmlFor="logo-upload">
                  <Button variant="contained" component="span" fullWidth sx={{ mb: 2 }} size={isMobile ? 'small' : 'medium'}>
                    Alterar Logo
                  </Button>
                </label>
                {storeData.logo && (
                  <Box
                    sx={{
                      width: '100%',
                      height: isMobile ? 150 : 200,
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: 1,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
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
                        <Phone fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2, minWidth: isMobile ? '100%' : 280 }}
                  size={isMobile ? 'small' : 'medium'}
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
                        <WhatsApp fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2, minWidth: isMobile ? '100%' : 280 }}
                  size={isMobile ? 'small' : 'medium'}
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
                        <Email fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2, minWidth: isMobile ? '100%' : 330 }}
                  size={isMobile ? 'small' : 'medium'}
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
                        <LocationOn fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2, minWidth: isMobile ? '100%' : 330 }}
                  size={isMobile ? 'small' : 'medium'}
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
                  sx={{ mb: 2, minWidth: isMobile ? '100%' : 280 }}
                  size={isMobile ? 'small' : 'medium'}
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
                        <Language fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2, minWidth: isMobile ? '100%' : 330 }}
                  size={isMobile ? 'small' : 'medium'}
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
                        <Facebook fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2, minWidth: isMobile ? '100%' : 280 }}
                  size={isMobile ? 'small' : 'medium'}
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
                        <Instagram fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2, minWidth: isMobile ? '100%' : 280 }}
                  size={isMobile ? 'small' : 'medium'}
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
                        <Twitter fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2, minWidth: isMobile ? '100%' : 330 }}
                  size={isMobile ? 'small' : 'medium'}
                />
              </Grid>
            </Grid>
          </TabPanel>
          {/* Aba 5: Horário de Funcionamento */}
          <TabPanel value={settingsTab} index={4}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
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
                <Accordion key={day} sx={{ mb: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!storeData.businessHours[day].closed}
                          onChange={() => handleDayClosedToggle(day)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      }
                      label={dayNames[day]}
                      sx={{ mr: 2 }}
                    />
                    {!storeData.businessHours[day].closed && (
                      <Chip
                        size="small"
                        label={`${storeData.businessHours[day].open || '--:--'} - ${storeData.businessHours[day].close || '--:--'}`}
                        color="primary"
                        variant="outlined"
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
                  sx={{ mb: 2, minWidth: isMobile ? '100%' : 330 }}
                  size={isMobile ? 'small' : 'medium'}
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
                  sx={{ mb: 2, minWidth: isMobile ? '100%' : 330 }}
                  size={isMobile ? 'small' : 'medium'}
                />
              </Grid>
            </Grid>
          </TabPanel>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            onClick={() => toggleModal('settings', false)}
            disabled={loading.store}
            size={isMobile ? 'small' : 'medium'}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleStoreUpdate}
            disabled={!storeData.name.trim() || loading.store}
            size={isMobile ? 'small' : 'medium'}
          >
            {loading.store ? <CircularProgress size={24} /> : 'Salvar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Edição de Produto */}
      <Dialog
        open={modals.editProduct}
        onClose={() => !loading.productUpdate && toggleModal('editProduct', false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'primary.main',
            color: 'white',
          }}
        >
          <Typography variant="h6">Editar Produto</Typography>
          <IconButton
            onClick={() => !loading.productUpdate && toggleModal('editProduct', false)}
            sx={{ color: 'white' }}
            disabled={loading.productUpdate}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            {/* Seção de Upload de Imagem */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom>
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
                      border: '1px dashed',
                      borderColor: 'divider',
                      borderRadius: 1,
                      overflow: 'hidden',
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
                        color: 'white',
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
                <InputLabel>Tipo *</InputLabel>
                <Select
                  value={productData.type}
                  label="Tipo"
                  onChange={(e) => setProductData((prev) => ({ ...prev, type: e.target.value }))}
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
                sx={{ mb: 2, minWidth: isMobile ? '100%' : 330 }}
                error={!!errors['name']}
                helperText={errors['name'] || 'Ex: Camiseta Branca ou Consultoria de Marketing'}
                size={isMobile ? 'small' : 'medium'}
                required
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
                sx={{ mb: 2, minWidth: isMobile ? '100%' : 280 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">MZN</InputAdornment>,
                }}
                error={!!errors['price']}
                helperText={errors['price'] || 'Ex: 1234,56'}
                size={isMobile ? 'small' : 'medium'}
                required
              />
              <TextField
                label="Categoria"
                value={productData.category}
                onChange={(e) => setProductData((prev) => ({ ...prev, category: e.target.value }))}
                fullWidth
                sx={{ mb: 2, minWidth: isMobile ? '100%' : 280 }}
                helperText="Ex: Roupas, Eletrônicos, Serviços"
                size={isMobile ? 'small' : 'medium'}
              />
              <TextField
                label="Descrição"
                value={productData.description}
                onChange={(e) => setProductData((prev) => ({ ...prev, description: e.target.value }))}
                multiline
                rows={isMobile ? 3 : 4}
                fullWidth
                sx={{ mb: 2, minWidth: isMobile ? '100%' : 330 }}
                helperText="Detalhes atrativos para o cliente"
                size={isMobile ? 'small' : 'medium'}
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
                    sx={{ mb: 2, minWidth: isMobile ? '100%' : 280 }}
                    error={!!errors['qtd']}
                    helperText={errors['qtd'] || 'Estoque disponível'}
                    size={isMobile ? 'small' : 'medium'}
                    required
                  />
                  <TextField
                    label="SKU"
                    value={productData.sku}
                    onChange={(e) => setProductData((prev) => ({ ...prev, sku: e.target.value }))}
                    fullWidth
                    sx={{ mb: 2, minWidth: isMobile ? '100%' : 280 }}
                    helperText="Código interno (ex: CAM-BRANCO-M)"
                    size={isMobile ? 'small' : 'medium'}
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
                        checked={productData.nationalShipping}
                        onChange={(e) => setProductData((prev) => ({ ...prev, nationalShipping: e.target.checked }))}
                        color="primary"
                      />
                    }
                    label="Habilitar frete para todo Moçambique"
                    sx={{ mb: 2 }}
                  />
                  {productData.nationalShipping && (
                    <>
                      <NumericFormat
                        value={productData.weight}
                        allowNegative={false}
                        decimalScale={2}
                        fixedDecimalScale
                        onValueChange={(values) => setProductData((prev) => ({ ...prev, weight: values.value }))}
                        customInput={TextField}
                        fullWidth
                        label="Peso (kg) *"
                        sx={{ mb: 2, minWidth: isMobile ? '100%' : 280 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Scale fontSize="small" /></InputAdornment>,
                        }}
                        error={!!errors['weight']}
                        helperText={errors['weight'] || 'Ex: 0,50 para roupas leves'}
                        size={isMobile ? 'small' : 'medium'}
                        required
                      />
                      <NumericFormat
                        value={productData.height}
                        allowNegative={false}
                        decimalScale={2}
                        fixedDecimalScale
                        onValueChange={(values) => setProductData((prev) => ({ ...prev, height: values.value }))}
                        customInput={TextField}
                        fullWidth
                        label="Altura (cm) *"
                        sx={{ mb: 2, minWidth: isMobile ? '100%' : 280 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Straighten fontSize="small" /></InputAdornment>,
                        }}
                        error={!!errors['height']}
                        helperText={errors['height'] || 'Ex: 30,00'}
                        size={isMobile ? 'small' : 'medium'}
                        required
                      />
                      <NumericFormat
                        value={productData.width}
                        allowNegative={false}
                        decimalScale={2}
                        fixedDecimalScale
                        onValueChange={(values) => setProductData((prev) => ({ ...prev, width: values.value }))}
                        customInput={TextField}
                        fullWidth
                        label="Largura (cm) *"
                        sx={{ mb: 2, minWidth: isMobile ? '100%' : 280 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Straighten fontSize="small" /></InputAdornment>,
                        }}
                        error={!!errors['width']}
                        helperText={errors['width'] || 'Ex: 20,00'}
                        size={isMobile ? 'small' : 'medium'}
                        required
                      />
                      <NumericFormat
                        value={productData.length}
                        allowNegative={false}
                        decimalScale={2}
                        fixedDecimalScale
                        onValueChange={(values) => setProductData((prev) => ({ ...prev, length: values.value }))}
                        customInput={TextField}
                        fullWidth
                        label="Comprimento (cm) *"
                        sx={{ mb: 2, minWidth: isMobile ? '100%' : 280 }}
                        InputProps={{
                          startAdornment: <InputAdornment position="start"><Straighten fontSize="small" /></InputAdornment>,
                        }}
                        error={!!errors['length']}
                        helperText={errors['length'] || 'Ex: 5,00'}
                        size={isMobile ? 'small' : 'medium'}
                        required
                      />
                    </>
                  )}
                </>
              ) : (
                <TextField
                  label="SKU"
                  value={productData.sku}
                  onChange={(e) => setProductData((prev) => ({ ...prev, sku: e.target.value }))}
                  fullWidth
                  sx={{ mb: 2, minWidth: isMobile ? '100%' : 280 }}
                  helperText="Código opcional para serviços"
                  size={isMobile ? 'small' : 'medium'}
                />
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            onClick={() => toggleModal('editProduct', false)}
            disabled={loading.productUpdate}
            size={isMobile ? 'small' : 'medium'}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateProduct}
            disabled={Object.keys(errors).length > 0 || loading.productUpdate}
            size={isMobile ? 'small' : 'medium'}
          >
            {loading.productUpdate ? <CircularProgress size={24} /> : 'Salvar Alterações'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog
        open={modals.deleteConfirm}
        onClose={() => toggleModal('deleteConfirm', false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>Tem certeza que deseja remover este produto?</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => toggleModal('deleteConfirm', false)}
            variant="outlined"
            size={isMobile ? 'small' : 'medium'}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => {
              handleRemoveProduct(selectedProductId);
              toggleModal('deleteConfirm', false);
            }}
            variant="contained"
            color="error"
            size={isMobile ? 'small' : 'medium'}
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
          sx={{ width: '100%' }}
          variant="filled"
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageStoreDesk;
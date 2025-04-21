import React, { useState, useEffect, useMemo } from 'react';
import { ref, get, remove, update, set } from 'firebase/database';
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
  Modal,
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
  Divider
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
  Close
} from '@mui/icons-material';
import { ref as storageRef, getDownloadURL, uploadBytes } from 'firebase/storage';
import { formatPrice } from '../../utils/utils';

const ManageStoreDesk = ({ storeId }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Estados
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState({
    products: false,
    store: false,
    productUpdate: false
  });
  const [pagination, setPagination] = useState({
    page: 0,
    rowsPerPage: isMobile ? 3 : 5
  });
  const [sorting, setSorting] = useState({
    order: 'asc',
    orderBy: 'name'
  });
  const [feedback, setFeedback] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });
  const [modals, setModals] = useState({
    settings: false,
    editProduct: false,
    deleteConfirm: false
  });
  const [storeData, setStoreData] = useState({
    name: '',
    description: '',
    logo: '',
    settings: {
      showPrices: true
    }
  });
  const [productData, setProductData] = useState({
    id: null,
    name: '',
    price: '',
    category: '',
    description: ''
  });
  const [logoFile, setLogoFile] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProductId, setSelectedProductId] = useState(null);

  // Menu de ações para mobile
  const handleMenuOpen = (event, productId) => {
    setAnchorEl(event.currentTarget);
    setSelectedProductId(productId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedProductId(null);
  };

  // Buscar dados iniciais
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(prev => ({ ...prev, products: true }));
        
        // Buscar produtos
        const productsRef = ref(db, `stores/${storeId}/products`);
        const productsSnapshot = await get(productsRef);
        setProducts(productsSnapshot.exists() ? Object.entries(productsSnapshot.val()) : []);

        // Buscar dados da loja
        const storeRef = ref(db, `stores/${storeId}`);
        const storeSnapshot = await get(storeRef);
        if (storeSnapshot.exists()) {
          const data = storeSnapshot.val();
          setStoreData({
            name: data.name || '',
            description: data.description || '',
            logo: data.company?.logo || '',
            settings: data.settings || { showPrices: true }
          });
        }
      } catch (error) {
        showFeedback('Erro ao carregar dados. Tente novamente.', 'error');
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(prev => ({ ...prev, products: false }));
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
    setModals(prev => ({ ...prev, [modalName]: isOpen }));
  };

  // Handlers para produtos
  const handleEditProduct = (productId, product) => {
    setProductData({
      id: productId,
      name: product.name || '',
      price: product.price ? String(product.price) : '',
      category: product.category || '',
      description: product.description || ''
    });
    toggleModal('editProduct', true);
    handleMenuClose();
  };

  const handleRemoveProduct = async (productId) => {
    toggleModal('deleteConfirm', false);
    try {
      await remove(ref(db, `stores/${storeId}/products/${productId}`));
      setProducts(prev => prev.filter(([key]) => key !== productId));
      showFeedback('Produto removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      showFeedback('Erro ao remover o produto.', 'error');
    }
    handleMenuClose();
  };

  const handleUpdateProduct = async () => {
    if (!productData.name.trim()) {
      showFeedback('O nome do produto é obrigatório.', 'error');
      return;
    }

    const price = parseFloat(productData.price.replace(',', '.'));
    if (isNaN(price) || price < 0) {
      showFeedback('Preço inválido. Use valores positivos.', 'error');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, productUpdate: true }));

      const productToUpdate = {
        name: productData.name.trim(),
        price: price,
        category: productData.category.trim(),
        description: productData.description.trim(),
        updatedAt: Date.now()
      };

      await update(ref(db, `stores/${storeId}/products/${productData.id}`), productToUpdate);

      // Atualizar estado local
      setProducts(prev =>
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
      setLoading(prev => ({ ...prev, productUpdate: false }));
    }
  };

  // Handlers para loja
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setStoreData(prev => ({ ...prev, logo: URL.createObjectURL(file) }));
    }
  };

  const handleStoreUpdate = async () => {
    if (!storeData.name.trim()) {
      showFeedback('O nome da loja é obrigatório.', 'error');
      return;
    }

    try {
      setLoading(prev => ({ ...prev, store: true }));

      let logoUrl = storeData.logo;

      // Upload do novo logo se houver arquivo
      if (logoFile) {
        const logoRef = storageRef(storage, `store-logos/${storeId}/${logoFile.name}`);
        await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(logoRef);
      }

      // Preparar dados para atualização
      const updates = {};
      updates[`stores/${storeId}/name`] = storeData.name.trim();
      updates[`stores/${storeId}/description`] = storeData.description.trim();
      updates[`stores/${storeId}/company/logo`] = logoUrl;
      updates[`stores/${storeId}/settings/showPrices`] = storeData.settings.showPrices;
      updates[`stores/${storeId}/updatedAt`] = Date.now();

      // Executar atualização atômica
      await update(ref(db), updates);

      // Atualizar estado local
      setStoreData(prev => ({
        ...prev,
        logo: logoUrl,
        settings: { ...prev.settings }
      }));

      toggleModal('settings', false);
      showFeedback('Configurações da loja atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar loja:', error);
      showFeedback('Erro ao atualizar as configurações.', 'error');
    } finally {
      setLoading(prev => ({ ...prev, store: false }));
    }
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
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handleChangeRowsPerPage = (event) => {
    setPagination(prev => ({
      ...prev,
      rowsPerPage: parseInt(event.target.value, 10),
      page: 0
    }));
  };

  // Ordenação
  const handleRequestSort = (property) => {
    const isAsc = sorting.orderBy === property && sorting.order === 'asc';
    setSorting({
      order: isAsc ? 'desc' : 'asc',
      orderBy: property
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
                          <Box sx={{ 
                            width: 80, 
                            height: 80, 
                            bgcolor: 'grey.100',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 1
                          }}>
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
        <TableContainer component={Paper} sx={{ mt: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.200' }}>
                <TableCell>Imagem</TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sorting.orderBy === 'name'}
                    direction={sorting.order}
                    onClick={() => handleRequestSort('name')}
                  >
                    Nome
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sorting.orderBy === 'price'}
                    direction={sorting.order}
                    onClick={() => handleRequestSort('price')}
                  >
                    Preço
                  </TableSortLabel>
                </TableCell>
                <TableCell>Categoria</TableCell>
                {!isTablet && <TableCell>Descrição</TableCell>}
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedProducts
                .slice(
                  pagination.page * pagination.rowsPerPage,
                  pagination.page * pagination.rowsPerPage + pagination.rowsPerPage
                )
                .map(([key, product]) => (
                  <TableRow key={key}>
                    <TableCell>
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
                    </TableCell>
                    <TableCell>{product?.name || 'Sem nome'}</TableCell>
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
                      <IconButton
                        color="primary"
                        onClick={() => handleEditProduct(key, product)}
                        aria-label="Editar produto"
                      >
                        <Edit />
                      </IconButton>
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
    <Box sx={{ p: isMobile ? 2 : 4, bgcolor: 'white' }}>
      <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ mb: 3, fontWeight: 'bold' }}>
        Gerir Loja
      </Typography>

      {/* Barra de pesquisa e ações */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        gap: isMobile ? 2 : 0,
        mb: 3 
      }}>
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
            order: isMobile ? 1 : 0
          }}
        />
        
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          gap: 1,
          order: isMobile ? 0 : 1
        }}>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to={`/addProduct`}
            size={isMobile ? 'small' : 'medium'}
            startIcon={<Add />}
            sx={{ 
              whiteSpace: 'nowrap',
              order: isMobile ? 0 : 1
            }}
          >
            {isMobile ? 'Adicionar' : 'Adicionar Produto'}
          </Button>
          
          <IconButton
            color="primary"
            onClick={() => toggleModal('settings', true)}
            size={isMobile ? 'small' : 'medium'}
            sx={{ 
              order: isMobile ? 1 : 0,
              ml: isMobile ? 0 : 2
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
          
          {/* Paginação */}
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
                paddingLeft: isMobile ? 0 : undefined
              }
            }}
          />
        </>
      )}

      {/* Menu de ações para mobile */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          const product = products.find(([id]) => id === selectedProductId)?.[1];
          if (product) handleEditProduct(selectedProductId, product);
        }}>
          <ListItemIcon>
            <Edit fontSize="small" />
          </ListItemIcon>
          <Typography variant="inherit">Editar</Typography>
        </MenuItem>
        <MenuItem onClick={() => {
          setSelectedProductId(selectedProductId);
          toggleModal('deleteConfirm', true);
        }}>
          <ListItemIcon>
            <Delete fontSize="small" color="error" />
          </ListItemIcon>
          <Typography variant="inherit" color="error">Remover</Typography>
        </MenuItem>
      </Menu>

      {/* Modal de Configurações da Loja */}
      <Dialog
        open={modals.settings}
        onClose={() => toggleModal('settings', false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white'
        }}>
          <Typography variant="h6">Configurações da Loja</Typography>
          <IconButton onClick={() => toggleModal('settings', false)} sx={{ color: 'white' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers sx={{ pt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nome da Loja"
                value={storeData.name}
                onChange={(e) => setStoreData(prev => ({ ...prev, name: e.target.value }))}
                sx={{ mb: 3 }}
                error={!storeData.name.trim()}
                helperText={!storeData.name.trim() ? 'Campo obrigatório' : ''}
                size={isMobile ? 'small' : 'medium'}
              />

              <TextField
                fullWidth
                label="Descrição da Loja"
                value={storeData.description}
                onChange={(e) => setStoreData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={isMobile ? 3 : 4}
                sx={{ mb: 3 }}
                size={isMobile ? 'small' : 'medium'}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="body1">Exibir Preços</Typography>
                <Switch
                  checked={storeData.settings.showPrices}
                  onChange={(e) => setStoreData(prev => ({
                    ...prev,
                    settings: { ...prev.settings, showPrices: e.target.checked }
                  }))}
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
                <Button 
                  variant="contained" 
                  component="span"
                  fullWidth
                  sx={{ mb: 2 }}
                  size={isMobile ? 'small' : 'medium'}
                >
                  Alterar Logo
                </Button>
              </label>
              
              {storeData.logo && (
                <Box sx={{ 
                  width: '100%', 
                  height: isMobile ? 150 : 200,
                  border: '1px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <img
                    src={storeData.logo}
                    alt="Logo da Loja"
                    style={{ 
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </Box>
              )}
            </Grid>
          </Grid>
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
        maxWidth="sm"
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          bgcolor: 'primary.main',
          color: 'white'
        }}>
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
            <Grid item xs={12}>
              <TextField
                label="Nome do Produto"
                value={productData.name}
                onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
                fullWidth
                sx={{ mb: 2 }}
                error={!productData.name.trim()}
                helperText={!productData.name.trim() ? 'Campo obrigatório' : ''}
                size={isMobile ? 'small' : 'medium'}
                
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Preço (MZN)"
                value={productData.price}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9.,]/g, '');
                  setProductData(prev => ({ ...prev, price: value }));
                }}
                fullWidth
                sx={{ mb: 2 }}
                error={isNaN(parseFloat(productData.price.replace(',', '.')))}
                helperText={
                  isNaN(parseFloat(productData.price.replace(',', '.'))) 
                    ? 'Insira um valor numérico válido' 
                    : ''
                }
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                label="Categoria"
                value={productData.category}
                onChange={(e) => setProductData(prev => ({ ...prev, category: e.target.value }))}
                fullWidth
                sx={{ mb: 2 }}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                label="Descrição"
                value={productData.description}
                onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
                multiline
                rows={isMobile ? 3 : 4}
                fullWidth
                sx={{ mb: 2 }}
                size={isMobile ? 'small' : 'medium'}
              />
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
            disabled={
              !productData.name.trim() || 
              isNaN(parseFloat(productData.price.replace(',', '.'))) ||
              loading.productUpdate
            }
            size={isMobile ? 'small' : 'medium'}
          >
            {loading.productUpdate ? <CircularProgress size={24} /> : 'Salvar'}
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
        onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
        anchorOrigin={{
          vertical: isMobile ? 'bottom' : 'top',
          horizontal: 'center'
        }}
      >
        <Alert
          onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
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
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
} from '@mui/material';
import { Search, Edit, Delete, Settings } from '@mui/icons-material';
import { ref as storageRef, getDownloadURL, uploadBytes } from 'firebase/storage';
import { formatPrice } from '../../utils/utils';

const ManageStoreDesk = ({ storeId }) => {
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
    rowsPerPage: 5
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
    editProduct: false
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
  };

  const handleRemoveProduct = async (productId) => {
    const confirmRemove = window.confirm('Tem certeza que deseja remover este produto?');
    if (!confirmRemove) return;

    try {
      await remove(ref(db, `stores/${storeId}/products/${productId}`));
      setProducts(prev => prev.filter(([key]) => key !== productId));
      showFeedback('Produto removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      showFeedback('Erro ao remover o produto.', 'error');
    }
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

  return (
    <Box sx={{ p: 4, bgcolor: 'white' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Gerir Loja
      </Typography>

      {/* Barra de pesquisa e ações */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
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
        />
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            to={`/addProduct`}
            sx={{ ml: 2 }}
          >
            Adicionar Produto
          </Button>
          <IconButton
            color="primary"
            sx={{ ml: 2 }}
            onClick={() => toggleModal('settings', true)}
          >
            <Settings />
          </IconButton>
        </Box>
      </Box>

      {/* Tabela de produtos */}
      {loading.products ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
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
                <TableCell>Descrição</TableCell>
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
                    <TableCell>
                      {product?.description?.length > 50 
                        ? `${product.description.substring(0, 50)}...` 
                        : product?.description || 'Sem descrição'}
                    </TableCell>
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
                        onClick={() => handleRemoveProduct(key)}
                        aria-label="Remover produto"
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredProducts.length}
            rowsPerPage={pagination.rowsPerPage}
            page={pagination.page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Itens por página:"
          />
        </TableContainer>
      )}

      {/* Modal de Configurações da Loja */}
      <Modal
        open={modals.settings}
        onClose={() => toggleModal('settings', false)}
        aria-labelledby="settings-modal-title"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Configurações da Loja
          </Typography>
          
          <TextField
            fullWidth
            label="Nome da Loja"
            value={storeData.name}
            onChange={(e) => setStoreData(prev => ({ ...prev, name: e.target.value }))}
            sx={{ mb: 3 }}
            error={!storeData.name.trim()}
            helperText={!storeData.name.trim() ? 'Campo obrigatório' : ''}
          />

          <TextField
            fullWidth
            label="Descrição da Loja"
            value={storeData.description}
            onChange={(e) => setStoreData(prev => ({ ...prev, description: e.target.value }))}
            multiline
            rows={3}
            sx={{ mb: 3 }}
          />

          <Box sx={{ mb: 3 }}>
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
              <Button variant="contained" component="span">
                Alterar Logo
              </Button>
            </label>
            {storeData.logo && (
              <Box sx={{ mt: 2 }}>
                <img
                  src={storeData.logo}
                  alt="Logo da Loja"
                  style={{ width: '100%', height: 'auto', maxHeight: 200, objectFit: 'contain', borderRadius: 8 }}
                />
              </Box>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography>Exibir Preços dos Produtos</Typography>
            <Switch
              checked={storeData.settings.showPrices}
              onChange={(e) => setStoreData(prev => ({
                ...prev,
                settings: { ...prev.settings, showPrices: e.target.checked }
              }))}
              color="primary"
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => toggleModal('settings', false)}
              disabled={loading.store}
            >
              Cancelar
            </Button>
            <Button 
              variant="contained" 
              onClick={handleStoreUpdate}
              disabled={!storeData.name.trim() || loading.store}
            >
              {loading.store ? <CircularProgress size={24} /> : 'Salvar'}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Modal de Edição de Produto */}
      <Modal
        open={modals.editProduct}
        onClose={() => !loading.productUpdate && toggleModal('editProduct', false)}
        aria-labelledby="edit-product-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Editar Produto
          </Typography>
          
          <TextField
            label="Nome do Produto"
            value={productData.name}
            onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
            fullWidth
            sx={{ mb: 2 }}
            error={!productData.name.trim()}
            helperText={!productData.name.trim() ? 'Campo obrigatório' : ''}
          />
          
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
          />

          <TextField
            label="Categoria"
            value={productData.category}
            onChange={(e) => setProductData(prev => ({ ...prev, category: e.target.value }))}
            fullWidth
            sx={{ mb: 2 }}
          />
          
          <TextField
            label="Descrição"
            value={productData.description}
            onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
            multiline
            rows={3}
            fullWidth
            sx={{ mb: 3 }}
          />
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button 
              variant="outlined" 
              onClick={() => toggleModal('editProduct', false)}
              disabled={loading.productUpdate}
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
            >
              {loading.productUpdate ? <CircularProgress size={24} /> : 'Salvar'}
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Snackbar de feedback */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
          severity={feedback.severity}
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageStoreDesk;
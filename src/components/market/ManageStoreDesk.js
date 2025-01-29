import React, { useState, useEffect, useMemo } from 'react';
import { ref, get, remove, update, set } from 'firebase/database';
import { db } from '../../fb';
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

const ManageStoreDesk = ({ storeId }) => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [editProductData, setEditProductData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });
  const [openModal, setOpenModal] = useState(false);
  const [paypalCode, setPaypalCode] = useState(''); 
  const [showPrices, setShowPrices] = useState(true); 


  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);


  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsRef = ref(db, `stores/${storeId}/products`);
        const productsSnapshot = await get(productsRef);

        if (productsSnapshot.exists()) {
          setProducts(Object.entries(productsSnapshot.val()));
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        setFeedback({ open: true, message: 'Erro ao buscar produtos.', severity: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [storeId]);

  const handleProductAdd = (newProducts) => {
    setProducts((prevProducts) => [...prevProducts, ...newProducts]);
    resetFormState();
    setFeedback({ open: true, message: 'Produto adicionado com sucesso!', severity: 'success' });
  };

  const handleSaveSettings = () => {
    // Função para salvar as configurações
    const settings = {
      paypalCode,
      showPrices,
    };
    
    // Salve as configurações no banco de dados (Firebase, por exemplo)
    const settingsRef = ref(db, `stores/${storeId}/settings`);
    set(settingsRef, settings)
      .then(() => {
        console.log('Configurações salvas com sucesso');
        handleCloseModal(); // Fechar o modal após salvar
      })
      .catch((error) => {
        console.error('Erro ao salvar configurações:', error);
      });
  };

  const handleRemoveProduct = async (productId) => {
    const confirmRemove = window.confirm('Tem a certeza que deseja remover este produto?');
    if (confirmRemove) {
      try {
        const productRef = ref(db, `stores/${storeId}/products/${productId}`);
        await remove(productRef);
        setProducts((prevProducts) => prevProducts.filter(([key]) => key !== productId));
        setFeedback({ open: true, message: 'Produto removido com sucesso!', severity: 'success' });
      } catch (error) {
        console.error('Erro ao remover produto:', error);
        setFeedback({ open: true, message: 'Erro ao remover o produto.', severity: 'error' });
      }
    }
  };

  const handleEditProduct = (productId, productData) => {
    const confirmEdit = window.confirm('Tem certeza que deseja editar este produto?');
    if (confirmEdit) {
      setEditProductId(productId);
      setEditProductData(productData);
      setShowAddProductForm(true);
    }
  };

  const handleProductUpdate = async (updatedProduct) => {
    try {
      const productRef = ref(db, `stores/${storeId}/products/${editProductId}`);
      await update(productRef, updatedProduct);
      setProducts((prevProducts) =>
        prevProducts.map(([key, product]) =>
          key === editProductId ? [key, updatedProduct] : [key, product]
        )
      );
      resetFormState();
      setFeedback({ open: true, message: 'Produto atualizado com sucesso!', severity: 'success' });
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      setFeedback({ open: true, message: 'Erro ao atualizar o produto.', severity: 'error' });
    }
  };

  const resetFormState = () => {
    setEditProductId(null);
    setEditProductData(null);
    setShowAddProductForm(false);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(([key, product]) =>
      product?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const handleRequestSort = (property) => {
    const isAscending = orderBy === property && order === 'asc';
    setOrder(isAscending ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedProducts = useMemo(() => {
    return filteredProducts.sort(([, a], [, b]) => {
      if (order === 'asc') {
        return a[orderBy]?.localeCompare(b[orderBy]);
      } else {
        return b[orderBy]?.localeCompare(a[orderBy]);
      }
    });
  }, [filteredProducts, order, orderBy]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ p: 4, bgcolor: 'white' }}>  <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
    Gerir Loja
  </Typography>

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
        to={`/addProduct/${storeId}`}
        sx={{ ml: 2 }}
      >
        Adicionar Produto
      </Button>
      <IconButton
        color="primary"
        sx={{ ml: 2 }}
        onClick={handleOpenModal} >
        <Settings />
      </IconButton>
    </Box>
  </Box>


      {loading ? (
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
                    active={orderBy === 'name'}
                    direction={order}
                    onClick={() => handleRequestSort('name')}
                  >
                    Nome
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={orderBy === 'price'}
                    direction={order}
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
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
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
                    <TableCell>{product?.price || 'Sem preço'} MZN</TableCell>
                    <TableCell>{product?.category || 'Sem categoria'}</TableCell>
                    <TableCell>{product?.description || 'Sem descrição'}</TableCell>
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
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </TableContainer>
      )}

      

      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={() => setFeedback({ ...feedback, open: false })}>
        <Alert
          onClose={() => setFeedback({ ...feedback, open: false })}
          severity={feedback.severity}
          sx={{ width: '100%' }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>


     {/* Modal para configurações */}
<Modal
  open={openModal}
  onClose={handleCloseModal}
  aria-labelledby="settings-modal-title"
  aria-describedby="settings-modal-description"
>
  <Box
    sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 400,
      bgcolor: 'background.paper',
      boxShadow: 24,
      p: 4,
      borderRadius: 2,
    }}
  >
    <Typography id="settings-modal-title" variant="h6" sx={{ mb: 2 }}>
      Configurações da Loja
    </Typography>
    <Typography id="settings-modal-description" variant="body1" sx={{ mb: 3 }}>
      Configure as preferências da sua loja abaixo.
    </Typography>

    {/* Campo para inserir código PayPal */}
    <TextField
      fullWidth
      label="Código PayPal"
      placeholder="Insira o código PayPal aqui"
      value={paypalCode} // Estado associado ao código PayPal
      onChange={(e) => setPaypalCode(e.target.value)}
      sx={{ mb: 3 }}
    />

    {/* Alternar para exibir ou não os preços */}
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
      <Typography>Exibir Preços dos Produtos</Typography>
      <Switch
        checked={showPrices} // Estado associado à exibição de preços
        onChange={(e) => setShowPrices(e.target.checked)}
        color="primary"
      />
    </Box>

    {/* Botões de ação */}
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
      <Button variant="contained" color="secondary" onClick={handleCloseModal}>
        Cancelar
      </Button>
      <Button variant="contained" color="primary" onClick={handleSaveSettings}>
        Salvar
      </Button>
    </Box>
  </Box>
</Modal>

    </Box>
  );
};
export default ManageStoreDesk;
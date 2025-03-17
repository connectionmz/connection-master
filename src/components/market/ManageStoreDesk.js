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
import { getDownloadURL, uploadBytes } from 'firebase/storage';

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
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [storeLogo, setStoreLogo] = useState('');
  const [logoFile, setLogoFile] = useState(null); // Para armazenar o arquivo de logo

  const handleOpenModal = () => setOpenModal(true);
  const handleCloseModal = () => setOpenModal(false);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setStoreLogo(URL.createObjectURL(file)); // Atualiza a visualização do logo
    }
  };


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

  const handleSaveSettings = async () => {
    try {
      let logoUrl = storeLogo; // Mantém a URL atual do logo
  
      // Faz o upload da nova foto, se houver um arquivo selecionado
      if (logoFile) {
        const logoStorageRef = logoStorageRef(storage, `store-logos/${storeId}/${logoFile.name}`);
        await uploadBytes(logoStorageRef, logoFile);
        logoUrl = await getDownloadURL(logoStorageRef); // Obtém a URL do Firebase Storage
  
        // Atualiza o logo da loja em `stores/${storeId}/company/logo` (opcional)
        const companyLogoRef = ref(db, `stores/${storeId}/company/logo`);
        await set(companyLogoRef, logoUrl);
      }
  
      // Atualiza o nome e a descrição da loja em `stores/${storeId}`
      const storeRef = ref(db, `stores/${storeId}`);
      await update(storeRef, {
        name: storeName,
        description: storeDescription,
      });
  
      // Atualiza as configurações em `stores/${storeId}/settings`
      const settingsRef = ref(db, `stores/${storeId}/settings`);
      await set(settingsRef, {
        paypalCode,
        showPrices,
      });
  
      // Feedback de sucesso
      setFeedback({ open: true, message: 'Configurações salvas com sucesso!', severity: 'success' });
      handleCloseModal(); // Fecha o modal após salvar
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setFeedback({ open: true, message: 'Erro ao salvar configurações.', severity: 'error' });
    }
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
        to={`/addProduct`}
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
      Alterações & Configurações da Loja
    </Typography>
    

    {/* Campo para editar o nome da loja */}
    <TextField
      fullWidth
      label="Nome da Loja"
      placeholder="Insira o nome da loja"
      value={storeName} // Estado associado ao nome da loja
      onChange={(e) => setStoreName(e.target.value)}
      sx={{ mb: 3 }}
    />

    {/* Campo para editar a descrição da loja */}
    <TextField
      fullWidth
      label="Descrição da Loja"
      placeholder="Insira a descrição da loja"
      value={storeDescription} // Estado associado à descrição da loja
      onChange={(e) => setStoreDescription(e.target.value)}
      multiline
      rows={3}
      sx={{ mb: 3 }}
    />

    {/* Campo para editar a foto da loja */}
    <Box sx={{ mb: 3 }}>
      <Typography variant="body1" sx={{ mb: 1 }}>
        Foto da Loja
      </Typography>
      <input
        type="file"
        accept="image/*"
        onChange={handleLogoChange} // Função para lidar com a mudança de arquivo
        style={{ display: 'none' }}
        id="logo-upload"
      />
      <label htmlFor="logo-upload">
        <Button variant="contained" component="span">
          Carregar Nova Foto
        </Button>
      </label>
      {storeLogo && (
        <Box sx={{ mt: 2 }}>
          <img
            src={storeLogo}
            alt="Logo da Loja"
            style={{ width: '100%', height: 'auto', borderRadius: 8 }}
          />
        </Box>
      )}
    </Box>

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
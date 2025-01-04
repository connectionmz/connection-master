import React, { useState, useEffect, useMemo } from 'react';
import { ref, get, remove, update } from 'firebase/database';
import { db } from '../../fb';
import ProductForm from './ProductForm';
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
} from '@mui/material';
import { Search, Edit, Delete } from '@mui/icons-material';

const ManageStoreDesk = ({ storeId }) => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [editProductId, setEditProductId] = useState(null);
  const [editProductData, setEditProductData] = useState(null);
  const [loading, setLoading] = useState(false);

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
        alert('Ocorreu um erro ao buscar produtos. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [storeId]);

  const handleProductAdd = (newProducts) => {
    setProducts((prevProducts) => [...prevProducts, ...newProducts]);
    resetFormState();
  };

  const handleRemoveProduct = async (productId) => {
    const confirmRemove = window.confirm('Tem a certeza que deseja remover este produto?');
    if (confirmRemove) {
      try {
        const productRef = ref(db, `stores/${storeId}/products/${productId}`);
        await remove(productRef);
        setProducts((prevProducts) => prevProducts.filter(([key]) => key !== productId));
      } catch (error) {
        console.error('Erro ao remover produto:', error);
        alert('Erro ao remover o produto. Tente novamente.');
      }
    }
  };

  const handleEditProduct = (productId, productData) => {
    setEditProductId(productId);
    setEditProductData(productData);
    setShowAddProductForm(true);
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
    } catch (error) {
      console.error('Erro ao atualizar produto:', error);
      alert('Erro ao atualizar o produto. Tente novamente.');
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

  return (
    <Box sx={{ p: 4, bgcolor: 'white', borderRadius: 2, boxShadow: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Gerir Loja
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
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
        <Button
          variant="contained"
          color="primary"
          component={Link}
          to={`/addProduct/${storeId}`}
          sx={{ ml: 2 }}
        >
          Adicionar Produto
        </Button>
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
                <TableCell>Nome</TableCell>
                <TableCell>Preço</TableCell>
                <TableCell>Descrição</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProducts.length > 0 ? (
                filteredProducts.map(([key, product]) => (
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    Nenhum produto encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ManageStoreDesk;

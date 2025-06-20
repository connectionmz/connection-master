import React, { useState, useEffect } from 'react';
import { ref, onValue, update, remove } from 'firebase/database';
import { db } from '../../fb';
import {
  Box,
  Drawer,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton,
  TextField,
  useMediaQuery,
  useTheme,
  CircularProgress,
  Snackbar,
  Alert,
  Badge
} from '@mui/material';
import {
  Close,
  Delete,
  ShoppingCart,
  LocalShipping,
  Payment,
  Add,
  Remove
} from '@mui/icons-material';
import { formatPrice } from '../../utils/utils';

const MyCart = ({ 
  open, 
  onClose, 
  userId,
  onCheckout 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [cartItems, setCartItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Atualizar carrinho e calcular total
  useEffect(() => {
    if (!userId || !open) return;

    setLoading(true);
    const cartRef = ref(db, `cart/${userId}`);
    const unsubscribe = onValue(cartRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.entries(data).map(([id, item]) => ({
          id,
          ...item,
          // Garante que a quantidade está entre 1 e 10
          quantity: Math.min(Math.max(1, item.quantity), 10)
        }));
        
        setCartItems(items);
        setTotal(calculateTotal(items));
      } else {
        setCartItems([]);
        setTotal(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, open]);

  const calculateTotal = (items) => {
    return items.reduce((sum, item) => {
      const price = item.discountPrice || item.price;
      return sum + (price * item.quantity);
    }, 0);
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (!userId) return;
    
    // Validação da quantidade
    let quantity = parseInt(newQuantity);
    if (isNaN(quantity) || quantity < 1) quantity = 1;
    if (quantity > 10) quantity = 10;

    try {
      const cartItemRef = ref(db, `cart/${userId}/${itemId}`);
      await update(cartItemRef, { quantity });
      
      // Atualização otimista para melhor resposta visual
      setCartItems(prevItems => 
        prevItems.map(item => 
          item.id === itemId ? { ...item, quantity } : item
        )
      );
      setTotal(calculateTotal(cartItems.map(item => 
        item.id === itemId ? { ...item, quantity } : item
      )));
      
    } catch (error) {
      console.error("Erro ao atualizar quantidade:", error);
      showSnackbar('Erro ao atualizar quantidade', 'error');
    }
  };

  const handleIncrement = (itemId) => {
    const item = cartItems.find(i => i.id === itemId);
    if (item && item.quantity < 10) {
      handleQuantityChange(itemId, item.quantity + 1);
    }
  };

  const handleDecrement = (itemId) => {
    const item = cartItems.find(i => i.id === itemId);
    if (item && item.quantity > 1) {
      handleQuantityChange(itemId, item.quantity - 1);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const itemRef = ref(db, `cart/${userId}/${itemId}`);
      await remove(itemRef);
      showSnackbar('Item removido do carrinho!', 'success');
    } catch (error) {
      console.error("Erro ao remover item:", error);
      showSnackbar('Erro ao remover item', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleCheckoutClick = () => {
    onCheckout();
    onClose();
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 420,
            p: 2,
            backgroundColor: '#f8f8f8',
            display: 'flex',
            flexDirection: 'column'
          }
        }}
      >
        {/* Cabeçalho */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}
        >
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <Badge 
              badgeContent={cartItems.length} 
              color="primary" 
              sx={{ mr: 1 }}
            >
              <ShoppingCart />
            </Badge>
            Meu Carrinho
          </Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>

        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            flexGrow: 1 
          }}>
            <CircularProgress />
          </Box>
        ) : cartItems.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            mt: 4,
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Seu carrinho está vazio
            </Typography>
            <Button 
              variant="contained" 
              color="primary"
              onClick={onClose}
              startIcon={<Add />}
            >
              Continuar Comprando
            </Button>
          </Box>
        ) : (
          <>
            {/* Lista de itens */}
            <List sx={{ 
              flexGrow: 1, 
              overflowY: 'auto',
              pr: 1,
              '&::-webkit-scrollbar': {
                width: 6,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.primary.main,
                borderRadius: 3,
              },
            }}>
              {cartItems.map((item) => (
                <React.Fragment key={item.id}>
                  <ListItem
                    sx={{
                      backgroundColor: '#fff',
                      mb: 1,
                      borderRadius: 1,
                      boxShadow: 1,
                      pr: 8
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={item.imageUrl}
                        alt={item.name}
                        variant="square"
                        sx={{ 
                          width: 64, 
                          height: 64, 
                          mr: 2,
                          borderRadius: 1
                        }}
                      />
                    </ListItemAvatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <ListItemText
                        primary={
                          <Typography 
                            variant="subtitle1" 
                            sx={{ fontWeight: 500 }}
                          >
                            {item.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {item.storeName}
                          </Typography>
                        }
                      />
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mt: 2,
                        gap: 1
                      }}>
                        {/* Contador de quantidade */}
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1
                        }}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDecrement(item.id)}
                            disabled={item.quantity <= 1}
                            sx={{ 
                              p: 0.5,
                              color: item.quantity <= 1 ? 'text.disabled' : 'primary.main'
                            }}
                          >
                            <Remove fontSize="small" />
                          </IconButton>
                          <TextField
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                            inputProps={{ 
                              min: 1, 
                              max: 10,
                              style: { 
                                textAlign: 'center',
                                padding: '6px',
                                width: '40px'
                              }
                            }}
                            variant="standard"
                            sx={{ 
                              '& .MuiInputBase-root': {
                                '&:before, &:after': {
                                  borderBottom: 'none'
                                }
                              },
                              input: {
                                textAlign: 'center'
                              }
                            }}
                          />
                          <IconButton 
                            size="small" 
                            onClick={() => handleIncrement(item.id)}
                            disabled={item.quantity >= 10}
                            sx={{ 
                              p: 0.5,
                              color: item.quantity >= 10 ? 'text.disabled' : 'primary.main'
                            }}
                          >
                            <Add fontSize="small" />
                          </IconButton>
                        </Box>

                        <Typography 
                          variant="subtitle1" 
                          sx={{ 
                            fontWeight: 'bold',
                            ml: 'auto',
                            color: theme.palette.primary.main
                          }}
                        >
                          {formatPrice((item.discountPrice || item.price) * item.quantity)}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton 
                      onClick={() => handleRemoveItem(item.id)}
                      color="error"
                      sx={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)'
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </ListItem>
                </React.Fragment>
              ))}
            </List>

            {/* Resumo do pedido */}
            <Box sx={{ 
              mt: 'auto', 
              p: 2, 
              backgroundColor: '#fff', 
              borderRadius: 2,
              boxShadow: 1
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                mb: 1 
              }}>
                <Typography variant="body1">Subtotal:</Typography>
                <Typography variant="body1">{formatPrice(total)}</Typography>
              </Box>
              
      
              
              <Divider sx={{ my: 1 }} />
              
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                mb: 2 
              }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6" color="primary">
                  {formatPrice(total)}
                </Typography>
              </Box>

              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                onClick={handleCheckoutClick}
                startIcon={<Payment />}
                sx={{
                  py: 1.5,
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                Finalizar Compra
              </Button>
            </Box>
          </>
        )}
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default MyCart;
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
  Alert
} from '@mui/material';
import {
  Close,
  Delete,
  ShoppingCart,
  LocalShipping,
  Payment
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

  useEffect(() => {
    if (!userId || !open) return;

    const cartRef = ref(db, `cart/${userId}`);
    const unsubscribe = onValue(cartRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.entries(data).map(([id, item]) => ({
          id,
          ...item
        }));
        setCartItems(items);
        
        const newTotal = items.reduce((sum, item) => {
          const price = item.discountPrice || item.price;
          return sum + (price * item.quantity);
        }, 0);
        setTotal(newTotal);
      } else {
        setCartItems([]);
        setTotal(0);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, open]);

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (!userId || newQuantity < 1) return;
  
    try {
      const cartItemRef = ref(db, `cart/${userId}/${itemId}`);
      
      await update(cartItemRef, {
        quantity: newQuantity
      });
  
    } catch (error) {
      console.error("Erro ao atualizar quantidade:", error);
      setSnackbar({
        open: true,
        message: 'Erro ao atualizar quantidade',
        severity: 'error'
      });
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const itemRef = ref(db, `cart/${userId}/${itemId}`);
      await remove(itemRef);
      setSnackbar({
        open: true,
        message: 'Item removido do carrinho!',
        severity: 'success'
      });
    } catch (error) {
      console.error("Erro ao remover item:", error);
      setSnackbar({
        open: true,
        message: 'Erro ao remover item',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  if (loading) {
    return (
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 400,
            p: 2,
            backgroundColor: '#f8f8f8'
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      </Drawer>
    );
  }

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: isMobile ? '100%' : 400,
            p: 2,
            backgroundColor: '#f8f8f8'
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2
          }}
        >
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <ShoppingCart sx={{ mr: 1 }} />
            Meu Carrinho
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        {cartItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Typography variant="body1" color="text.secondary">
              Seu carrinho está vazio
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ mt: 2 }}
              onClick={onClose}
            >
              Adicionar Itens
            </Button>
          </Box>
        ) : (
          <>
            <List sx={{ flexGrow: 1, overflowY: 'auto' }}>
              {cartItems.map((item) => (
                <React.Fragment key={item.id}>
                  <ListItem
                    sx={{
                      backgroundColor: '#fff',
                      mb: 1,
                      borderRadius: 1,
                      boxShadow: 1
                    }}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        onClick={() => handleRemoveItem(item.id)}
                        color="error"
                      >
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={item.imageUrl}
                        alt={item.name}
                        variant="square"
                        sx={{ width: 56, height: 56, mr: 2 }}
                      />
                    </ListItemAvatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <ListItemText
                        primary={item.name}
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {item.storeName}
                          </Typography>
                        }
                      />
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <TextField
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const newQuantity = Math.max(1, parseInt(e.target.value) || 1);
                            handleQuantityChange(item.id, newQuantity);
                          }}
                          inputProps={{ min: 1 }}
                          size="small"
                          sx={{ width: 80, mr: 2 }}
                        />
                        <Typography variant="body1" fontWeight="bold">
                          {formatPrice(
                            (item.discountPrice || item.price) * item.quantity
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                  <Divider sx={{ my: 1 }} />
                </React.Fragment>
              ))}
            </List>

            <Box sx={{ mt: 'auto', p: 2, backgroundColor: '#fff', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>{formatPrice(total)}</Typography>
              </Box>
             
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">{formatPrice(total)}</Typography>
              </Box>
            </Box>
          </>
        )}
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default MyCart;
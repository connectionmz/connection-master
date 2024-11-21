import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../fb';
import {
    AppBar, Toolbar, IconButton, InputBase, Typography, Card, CardContent, CardMedia, Grid, Box, CircularProgress,
    Badge, Button, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText
} from '@mui/material';
import { Search, ShoppingCart, Share, Store } from '@mui/icons-material';

const StoreDetails = () => {
    const { storeId } = useParams();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false); // Controle do diálogo do carrinho

    useEffect(() => {
        const fetchStoreDetails = async () => {
            try {
                const storeRef = ref(db, `stores/${storeId}`);
                const storeSnapshot = await get(storeRef);
                if (storeSnapshot.exists()) {
                    setStore(storeSnapshot.val());
                } else {
                    setStore(null);
                }
            } catch (error) {
                console.error("Erro ao buscar os detalhes da loja:", error);
            }
            setLoading(false);
        };
        fetchStoreDetails();
    }, [storeId]);

    const addToCart = (product) => {
        setCart((prevCart) => [...prevCart, product]);
        alert(`${product.name} foi adicionado ao carrinho.`);
    };

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: store.name,
                text: `Confira essa loja incrível: ${store.name}!`,
                url: window.location.href,
            }).catch((error) => console.error('Erro ao compartilhar', error));
        } else {
            alert('Compartilhamento não suportado neste dispositivo.');
        }
    };

    const generateInvoice = () => {
        const total = cart.reduce((sum, product) => sum + product.price, 0);
        alert(`Fatura gerada com sucesso! Total: ${total} MZN`);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <CircularProgress />
            </div>
        );
    }

    if (!store) {
        return <p className="text-center text-red-500">Loja não encontrada.</p>;
    }

    return (
        <div>
            {/* AppBar */}
            <AppBar position="static" sx={{ backgroundColor: '#ffffff', boxShadow: 'none', borderBottom: '1px solid #e0e0e0' }}>
                <Toolbar>
                    <Typography variant="h6" sx={{ color: '#000', fontWeight: 'bold', flexGrow: 1 }}>
                        <Store sx={{ verticalAlign: 'middle', marginRight: '8px' }} />
                        {store.name}
                    </Typography>
                    <IconButton onClick={handleShare}>
                        <Share sx={{ color: '#000' }} />
                    </IconButton>
                    <IconButton onClick={() => setCartOpen(true)}> {/* Abre o diálogo do carrinho */}
                        <Badge badgeContent={cart.length} color="error">
                            <ShoppingCart sx={{ color: '#000' }} />
                        </Badge>
                    </IconButton>
                </Toolbar>
            </AppBar>

            {/* Produtos */}
            <Box sx={{ padding: '16px' }}>
                <Grid container spacing={2}>
                    {store.products &&
                        Object.entries(store.products).map(([productId, product]) => (
                            <Grid
                                item
                                xs={12} // Tamanho completo em dispositivos muito pequenos
                                sm={6} // 2 colunas por linha em dispositivos médios e maiores
                                key={productId}
                            >
                                <Card
                                    sx={{
                                        transition: 'transform 0.2s',
                                        '&:hover': { transform: 'scale(1.05)' },
                                    }}
                                >
                                    <CardMedia
                                        component="img"
                                        src={product.imageUrl}
                                        alt={product.name}
                                        sx={{ height: 150 }}
                                    />
                                    <CardContent>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                            {product.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {product.discount ? `Desconto: ${product.discount}` : ''}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: '#000' }}>
                                            {product.price} MT
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            fullWidth
                                            sx={{ marginTop: 1 }}
                                            onClick={() => addToCart(product)}
                                        >
                                            Adicionar ao Carrinho
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                </Grid>
            </Box>

            {/* Diálogo do Carrinho */}
            <Dialog open={cartOpen} onClose={() => setCartOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Carrinho de Compras</DialogTitle>
                <DialogContent>
                    {cart.length === 0 ? (
                        <Typography>Seu carrinho está vazio.</Typography>
                    ) : (
                        <List>
                            {cart.map((item, index) => (
                                <ListItem key={index} sx={{ borderBottom: '1px solid #e0e0e0' }}>
                                    <ListItemText
                                        primary={item.name}
                                        secondary={`Preço: ${item.price} MT`}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCartOpen(false)} color="secondary">
                        Fechar
                    </Button>
                    {cart.length > 0 && (
                        <Button onClick={generateInvoice} color="primary" variant="contained">
                            Baixar Fatura
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default StoreDetails;

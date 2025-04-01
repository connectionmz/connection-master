import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../../fb';
import ProductGridDesk from './ProductGridDesk';
import { Box, Typography, Button, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, CircularProgress, Badge, Avatar } from '@mui/material';
import { ShoppingCart, Share, Store } from '@mui/icons-material';
import BackButton from '../BackButton';

const StoreDetailDesk = () => {
    const { storeId } = useParams();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [cartOpen, setCartOpen] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        const fetchStoreDetails = async () => {
            try {
                const storeRef = ref(db, `stores/${storeId}`);
                const storeSnapshot = await get(storeRef);
                if (storeSnapshot.exists()) {
                    setStore(storeSnapshot.val());
                    console.log(storeSnapshot.val())
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

    const handleDialogClose = () => {
        setDialogOpen(false);
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!store) {
        return <Typography variant="h6" align="center" color="error">Loja não encontrada.</Typography>;
    }

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
            {/* Header */}

            <Box sx={{ backgroundColor: '#fff', boxShadow: 3, position: 'sticky', top: 0, zIndex: 10, padding: '16px 24px' }}>
            <BackButton sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                        <Store sx={{ marginRight: 1 }} /> {store.name}
                    </Typography>
                    <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                            alt={store.company.nome} 
                            src={store.company.logo} 
                            sx={{ 
                            width: 32, 
                            height: 32, 
                            marginRight: 1 
                            }}
                        />
                        <Typography variant="body1">{store.company.nome}</Typography>
                        </Box>
                    </Typography>
                    <Box>
                        <IconButton onClick={handleShare} sx={{ marginRight: 2 }}>
                            <Share />
                        </IconButton>
                        <IconButton
                            onClick={() => setCartOpen(true)}
                            sx={{
                                position: 'relative',
                            }}
                        >
                            <ShoppingCart />
                            {cart.length > 0 && (
                                <Badge
                                    badgeContent={cart.length}
                                    color="error"
                                    sx={{
                                        position: 'absolute',
                                        top: -5,
                                        right: -5,
                                        fontSize: '12px',
                                    }}
                                />
                            )}
                        </IconButton>
                    </Box>
                </Box>
            </Box>

            {/* Loja Details */}
            <Box sx={{ padding: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 2 }}>
                    Sobre a Loja
                </Typography>
                <Typography variant="body1" sx={{ marginBottom: 2 }}>
                    {store.description || 'Sem descrição disponível para esta loja.'}
                </Typography>

                <ProductGridDesk products={store.products} storeId={storeId} addToCart={addToCart} />
            </Box>

            {/* Carrinho de Compras */}
            <Dialog open={cartOpen} onClose={() => setCartOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Carrinho de Compras</DialogTitle>
                <DialogContent>
                    {cart.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            Seu carrinho está vazio.
                        </Typography>
                    ) : (
                        <Box>
                            {cart.map((product, index) => (
                                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 1 }}>
                                    <Typography variant="body2">{product.name}</Typography>
                                    <Typography variant="body2">{product.price} MZN</Typography>
                                </Box>
                            ))}
                            <Typography variant="h6" sx={{ marginTop: 2 }}>
                                Total: {cart.reduce((sum, product) => sum + product.price, 0)} MZN
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDialogClose} color="primary">
                        Fechar
                    </Button>
                    <Button
                        onClick={generateInvoice}
                        color="secondary"
                        disabled={cart.length === 0}
                    >
                        Gerar Fatura
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default StoreDetailDesk;

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../fb'; 
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, Radio, RadioGroup, FormControlLabel, FormControl, FormLabel, IconButton, CircularProgress, Grid, Typography, Box, InputBase, CardContent, CardMedia, Card, AppBar, Toolbar } from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import axios from 'axios';
import { CameraAlt, Search, ShoppingCart, Store } from '@mui/icons-material';


const StoreDetails = () => {
    const { storeId } = useParams(); 
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true); 
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [cart, setCart] = useState([]); 
    const [paymentMethod, setPaymentMethod] = useState('');
    const [phoneNumber, setPhoneNumber] = useState(''); 
    const [buyerName, setBuyerName] = useState(''); 
    const [processingPayment, setProcessingPayment] = useState(false);
    const [search, setSearch] = useState('');


    useEffect(() => {
        const fetchStoreDetails = async () => {
            try {
                const storeRef = ref(db, `stores/${storeId}`);
                const storeSnapshot = await get(storeRef);
                if (storeSnapshot.exists()) {
                    setStore(storeSnapshot.val());
                    console.log(storeSnapshot.val().products)
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

    const handleOpenProductDetails = (product) => setSelectedProduct(product);

    const handleCloseProductDetails = () => {
        setSelectedProduct(null);
        setPaymentMethod('');
        setPhoneNumber('');
        setBuyerName('');
    };

    const addToCart = (product) => {
        setCart((prevCart) => [...prevCart, product]);
        alert(`${product.name} foi adicionado ao carrinho.`);
    };

    const handlePayment = async () => {
        if (!paymentMethod || !phoneNumber || !buyerName) {
            alert('Por favor, preencha todos os campos antes de prosseguir.');
            return;
        }

        setProcessingPayment(true);

        const paymentData = {
            carteira: '1729146943643x948653281532969000',
            numero: phoneNumber,
            'quem comprou': buyerName,
            valor: selectedProduct.price,
        };

        try {
            let response;
            if (paymentMethod === 'mpesa') {
                response = await axios.post('https://mozpayment.online/api/1.1/wf/pagamentorotativompesa', paymentData);
            } else if (paymentMethod === 'emola') {
                response = await axios.post('https://mozpayment.online/api/1.1/wf/pagamentorotativoemola', paymentData);
            }

            if (response?.data?.success) {
                alert('Pagamento realizado com sucesso!');
            } else {
                alert('Erro no pagamento. Tente novamente.');
            }
        } catch (error) {
            alert('Erro ao processar o pagamento: ' + error.message);
        } finally {
            setProcessingPayment(false);
            handleCloseProductDetails();
        }
    };

    const generateProforma = () => {
        const total = cart.reduce((sum, product) => sum + product.price, 0);
        alert(`Proforma gerada com sucesso! Total: ${total} MZN`);
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

    if (loading) {
        return <div className="flex justify-center items-center h-64">
            <CircularProgress />
        </div>;
    }

    if (!store) {
        return <p className="text-center text-red-500">Loja não encontrada.</p>;
    }


    const totalCartValue = cart.reduce((total, product) => total + product.price, 0);

    return (
            <>
            <div>
            <AppBar position="static" style={{ backgroundColor: '#FFFFFF', boxShadow: 'none' }}>
                <Toolbar>
                    <Typography variant="h6" style={{ color: '#000', flexGrow: 1, fontWeight: 'bold' }}>
                        <Store/>
                    </Typography>
                    <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f2f2f2', borderRadius: '5px', padding: '0 8px', flexGrow: 2 }}>
                        <Search style={{ color: '#999' }} />
                        <InputBase
                            placeholder="Search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ marginLeft: 8, flex: 1 }}
                        />
                        <IconButton>
                            <CameraAlt style={{ color: '#999' }} />
                        </IconButton>
                    </div>
                    <IconButton color="inherit">
                        <ShoppingCart />
                    </IconButton>
                </Toolbar>
            </AppBar>

            <Box style={{ padding: '16px', backgroundColor: '#f2f2f2' }}>
                <Box style={{ borderRadius: '10px', overflow: 'hidden', marginBottom: '16px' }}>
                    <img src="/path-to-your-banner-image.jpg" style={{ width: '100%', height: 'auto' }} />
                </Box>
             <Grid container spacing={2}>
             {store.products && Object.entries(store.products).map(([productId, product]) => (
                        <Grid item xs={6} sm={3} key={product}>
                            <Card>
                                <CardMedia
                                    component="img"
                                    src={product.imageUrl}
                                    alt={product.name}
                                    style={{ height: 150 }}
                                />
                                <CardContent>
                                    <Typography variant="body2" style={{ fontWeight: 'bold' }}>
                                    {product.name}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                    {product?.discount || ''}
                                    </Typography>
                                    <Typography variant="body2" color="dark">
                                    {product.price} MT
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </div></>
    );
};

export default StoreDetails;

import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Button } from '@mui/material';
import BackButton from '../BackButton';
import { db } from '../../fb';
import { get, ref } from 'firebase/database';

const CreditCardCheckoutDesk = ({user}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [product, setProduct] = useState(null);
  const [paypalID, setPaypalID] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const meticalToUSD = (mzn) => {
    const exchangeRate = 63.45; 
    return (mzn / exchangeRate).toFixed(2); 
  };

  useEffect(() => {
    // Carrega o código PayPal da loja do usuário
    const loadStoreData = async () => {
      try {
        const storeRef = ref(db, `stores/${user.id}`);
        const storeSnapshot = await get(storeRef);

        if (storeSnapshot.exists()) {
          setPaypalID(storeSnapshot.val().paypalCode);
        } else {
          setError('Loja não encontrada.');
        }
      } catch (err) {
        console.error('Erro ao verificar loja:', err);
        setError('Ocorreu um erro ao carregar as informações da loja. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, [user.id]);

  useEffect(() => {
    if (location.state && location.state.product) {
      setProduct(location.state.product);
    }
  }, [location.state]);

  useEffect(() => {
    const loadPayPalScript = () => {
      if (!window.paypal) {
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=${paypalID}`; // Adicione seu client-id aqui
        script.async = true;
        script.onload = () => setPaypalLoaded(true);
        document.body.appendChild(script);
      } else {
        setPaypalLoaded(true);
      }
    };

    loadPayPalScript();
  }, []);

  useEffect(() => {
    if (paypalLoaded && product) {
      const paypalContainer = document.getElementById('paypal-button-container');
      if (paypalContainer) {
        paypalContainer.innerHTML = ''; 

        const usdAmount = meticalToUSD(product.priceWithIVA); 

        window.paypal.Buttons({
          createOrder: function (data, actions) {
            return actions.order.create({
              purchase_units: [{
                amount: {
                  value: usdAmount, 
                },
              }],
            });
          },
          onApprove: function (data, actions) {
            return actions.order.capture().then(function (details) {
              alert('Pagamento concluído com sucesso! Transação: ' + details.id);
              console.log('Transação de sucesso: ', details);
              navigate('/success'); 
            });
          },
          onError: function (err) {
            alert('Ocorreu um erro durante o pagamento: ' + err);
            console.error('Erro no pagamento: ', err);
          }
        }).render('#paypal-button-container');
      }
    }
  }, [paypalLoaded, product, navigate]);

  if (!product) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Erro
          </Typography>
          <Typography variant="body1">
            Não conseguimos encontrar o produto selecionado. Tente novamente.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#E3F2FD', padding: '20px', borderRadius: '8px' }}>
        <Typography variant="h5" gutterBottom>
          Pagamento com Cartão de Débito
        </Typography>
        <Typography variant="body1" gutterBottom>
          Insira os dados do seu cartão para concluir a compra.
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">
            <strong>Produto:</strong> {product.name}
          </Typography>
          <Typography variant="h6">
            <strong>Preço (com IVA):</strong> {product.priceWithIVA} MT ({meticalToUSD(product.priceWithIVA)} USD)
          </Typography>
        </Box>

        <div id="paypal-button-container"></div>

        <Box sx={{ mt: 3 }}>
        <BackButton sx={{ mb: 2 }} />

         
        </Box>
      </Box>
    </Container>
  );
};

export default CreditCardCheckoutDesk;

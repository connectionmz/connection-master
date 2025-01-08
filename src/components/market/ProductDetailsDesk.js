import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ref, get } from "firebase/database";
import { db } from "../../fb";
import {
  Container,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardMedia,
  CardContent,
} from "@mui/material";
import BackButton from "../BackButton";

const ProductDetailsDesk = () => {
  const { productId, store } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const IVA_PERCENTAGE = 16;

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const productRef = ref(db, `stores/${store}/products/${productId}`);
        const productSnapshot = await get(productRef);
        if (productSnapshot.exists()) {
          setProduct(productSnapshot.val());
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Erro ao buscar os detalhes do produto:", error);
      }
      setLoading(false);
    };

    fetchProductDetails();
  }, [productId, store]);

  const addToCart = () => {
    if (product) {
      alert(
        `${quantity} x ${product.name} foi adicionado ao carrinho por um total de ${(product.price * quantity).toFixed(
          2
        )} MT (sem IVA).`
      );
    }
  };

  const handlePayment = () => {
    if (product) {
      const total = product.price * quantity;
      const iva = (total * IVA_PERCENTAGE) / 100;
      const totalWithIva = total + iva;
      alert(
        `Pagamento iniciado para ${quantity} x ${product.name}. Valor: ${totalWithIva.toFixed(
          2
        )} MT (incluindo ${iva.toFixed(2)} MT de IVA).`
      );
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!product) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Alert severity="error">Produto não encontrado.</Alert>
      </Box>
    );
  }

  const total = product.price * quantity;
  const iva = (total * IVA_PERCENTAGE) / 100;
  const totalWithIva = total + iva;

  return (
    <Container sx={{ py: 4 }}>
      <BackButton sx={{ mb: 2 }} />
      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={4}>
        <Card sx={{ flex: 1 }}>
          <CardMedia
            component="img"
            height="400"
            image={product.imageUrl}
            alt={product.name}/>
        </Card>
        <CardContent sx={{ flex: 1 }}>
          <Typography variant="h4" gutterBottom>
            {product.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {product.description}
          </Typography>
          <Typography variant="h6" color="error" gutterBottom>
            Preço: {product.price} MT (por unidade)
          </Typography>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Typography>Quantidade:</Typography>
            <TextField
              type="number"
              value={quantity}
              onChange={(e) => {
                const value = Math.max(1, Number(e.target.value));
                setQuantity(value);
              }}
              inputProps={{ min: 1 }}
              size="small"
              sx={{ width: "80px" }}/>
          </Box>
          <Typography>Subtotal: {total.toFixed(2)} MT</Typography>
          <Typography>IVA ({IVA_PERCENTAGE}%): {iva.toFixed(2)} MT</Typography>
          <Typography variant="h6" gutterBottom>
            Total com IVA: {totalWithIva.toFixed(2)} MT
          </Typography>
          <Box display="flex" gap={2} mt={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={addToCart}>
              Adicionar ao Carrinho
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handlePayment}
            >
              Pagar Agora
            </Button>
          </Box>
        </CardContent>
      </Box>
    </Container>
  );
};

export default ProductDetailsDesk;

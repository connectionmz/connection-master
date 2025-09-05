import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, set, push, remove } from "firebase/database";
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
  Divider,
  Stack,
  useMediaQuery,
  useTheme,
  Snackbar,
  Paper,
} from "@mui/material";
import { LocalShipping, Store as StoreIcon } from "@mui/icons-material";
import BackButton from "../BackButton";
import { formatPrice } from "../../utils/utils";

const Checkout = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();
  const product = location.state?.product || null;

  const [address, setAddress] = useState({
    province: user?.provinciaTemp || user?.provincia || "",
    district: user?.distrito || "",
    addressLine: "",
    contact: user?.contacto || user?.phoneNumber || "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const IVA_PERCENTAGE = 0; // Consistent with ProductDetailsDesk.js and StoresDesk.js
  const SHIPPING_RATE_PER_KG = 50; // Consistent with previous components
  const BASE_SHIPPING_FEE = 100; // Consistent with previous components

  useEffect(() => {
    if (!user?.id) {
      navigate("/auth");
      return;
    }
    if (!product) {
      setSnackbarMessage("Nenhum produto selecionado para checkout.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      setTimeout(() => navigate("/"), 2000);
    }
  }, [user, product, navigate]);

  const handleAddressChange = (field) => (event) => {
    setAddress((prev) => ({ ...prev, [field]: event.target.value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!address.province) newErrors.province = "Província é obrigatória";
    if (!address.district) newErrors.district = "Distrito é obrigatório";
    if (!address.addressLine) newErrors.addressLine = "Endereço é obrigatório";
    if (!address.contact) newErrors.contact = "Contacto é obrigatório";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleOrder = () => {
   alert("Função de finalizar pedido ainda não disponivel.");
    } 

  const handleConfirmOrder = async () => {
    if (!validateForm()) {
      setSnackbarMessage("Por favor, preencha todos os campos obrigatórios.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      return;
    }

    if (!user?.id || !product) return;

    try {
      setLoading(true);
      const orderRef = push(ref(db, "orders"));
      const orderId = orderRef.key;

      const productType = product.type || "product"; // Default to "product"
      const orderData = {
        id: orderId,
        userId: user.id,
        storeId: product.storeId,
        items: {
          [product.productId]: {
            productId: product.productId,
            quantity: Number(product.quantity) || 1,
            price: Number(product.price) || 0,
            type: productType,
          },
        },
        total: Number(product.total) || 0,
        shippingCost: productType === "product" ? Number(product.shippingCost) || 0 : 0,
        subtotal: Number(product.subtotal) || 0,
        iva: Number(product.iva) || 0,
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        shippingAddress: {
          province: address.province,
          district: address.district,
          addressLine: address.addressLine,
          contact: address.contact,
        },
      };

      await set(orderRef, orderData);

      // Clear cart if this product is in it
      const cartRef = ref(db, `cart/${user.id}/${product.productId}`);
      await remove(cartRef);

      setSnackbarMessage("Pedido realizado com sucesso!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      setTimeout(() => navigate(`/order/${orderId}`), 2000);
    } catch (error) {
      console.error("Erro ao finalizar pedido:", error);
      setSnackbarMessage("Erro ao finalizar pedido.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  if (!product) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  const productType = product.type || "product"; // Default to "product"
  const subtotal = Number(product.subtotal) || 0;
  const iva = Number(product.iva) || 0;
  const shippingCost = productType === "product" ? Number(product.shippingCost) || 0 : 0;
  const total = Number(product.total) || 0;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <BackButton sx={{ mb: 2 }} />
      <Typography variant={isMobile ? "h5" : "h4"} gutterBottom fontWeight="bold">
        Finalizar Compra
      </Typography>

      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={4}>
        {/* Order Summary */}
        <Box sx={{ flex: 1 }}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Resumo do Pedido
            </Typography>
            <Card sx={{ display: "flex", mb: 2, borderRadius: 2, boxShadow: 0 }}>
              <CardMedia
                component="img"
                sx={{ width: 100, objectFit: "contain", backgroundColor: "#f5f5f5" }}
                image={product.imageUrl || "https://via.placeholder.com/100"}
                alt={product.name}
              />
              <CardContent sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight="bold">
                  {product.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {product.storeName}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Quantidade: {Number(product.quantity) || 1}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tipo: {productType === "product" ? "Produto" : "Serviço"}
                </Typography>
                {productType === "product" && product.nationalShipping && (
                  <Typography variant="body2" color="text.secondary">
                    Dimensões: {product.dimensions || "Não especificado"}
                  </Typography>
                )}
              </CardContent>
            </Card>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={1}>
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">Subtotal:</Typography>
                <Typography variant="body2">{formatPrice(subtotal)} MT</Typography>
              </Box>
              {productType === "product" && product.nationalShipping && (
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2">Frete:</Typography>
                  <Typography variant="body2">{formatPrice(shippingCost)} MT</Typography>
                </Box>
              )}
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body2">IVA ({IVA_PERCENTAGE}%):</Typography>
                <Typography variant="body2">{formatPrice(iva)} MT</Typography>
              </Box>
              <Divider />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="body1" fontWeight="bold">
                  Total:
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  {formatPrice(total)} MT
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>

        {/* Shipping Address */}
        <Box sx={{ flex: 1 }}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Endereço de Entrega
            </Typography>
            <Stack spacing={2}>
              <TextField
                label="Província"
                value={address.province}
                onChange={handleAddressChange("province")}
                fullWidth
                size="small"
                error={!!errors.province}
                helperText={errors.province}
                disabled={loading}
              />
              <TextField
                label="Distrito"
                value={address.district}
                onChange={handleAddressChange("district")}
                fullWidth
                size="small"
                error={!!errors.district}
                helperText={errors.district}
                disabled={loading}
              />
              <TextField
                label="Endereço"
                value={address.addressLine}
                onChange={handleAddressChange("addressLine")}
                fullWidth
                size="small"
                error={!!errors.addressLine}
                helperText={errors.addressLine}
                disabled={loading}
              />
              <TextField
                label="Contacto"
                value={address.contact}
                onChange={handleAddressChange("contact")}
                fullWidth
                size="small"
                error={!!errors.contact}
                helperText={errors.contact}
                disabled={loading}
              />
            </Stack>
            <Button
              variant="contained"
              color="success"
              size="large"
              onClick={handleOrder}
              disabled={loading || !product}
              startIcon={productType === "product" ? <LocalShipping /> : <StoreIcon />}
              sx={{ mt: 3, width: "100%" }}
            >
              {loading ? <CircularProgress size={24} /> : "Confirmar Pedido"}
            </Button>
          </Paper>
        </Box>
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: isMobile ? "bottom" : "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Checkout;
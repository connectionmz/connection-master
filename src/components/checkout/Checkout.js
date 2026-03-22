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
  Grid,
  Chip,
  Fade,
  Zoom,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  StepConnector
} from "@mui/material";
import { 
  LocalShipping, 
  Store as StoreIcon,
  ShoppingCartCheckout,
  LocationOn,
  Phone,
  Email,
  CheckCircle,
  Payment,
  Receipt,
  ArrowBack,
  Info,
  Verified,
  Security
} from "@mui/icons-material";
import BackButton from "../BackButton";
import { formatPrice } from "../../utils/utils";
import { styled } from '@mui/material/styles';

/* ── Design Tokens (mesmos da hero) ───────────────────────────────────── */
const T = {
  navy:     '#08192E',
  navyMid:  '#0E2849',
  navyLight:'#183A63',
  gold:     '#C8903A',
  goldLight:'#E8B96A',
  goldPale: '#FDF3E3',
  cream:    '#FAFAF7',
  white:    '#FFFFFF',
  text:     '#0F1C2D',
  textMid:  '#3D5A7A',
  textSub:  '#6B89A5',
  border:   '#E0E8F0',
  borderMid:'#C5D4E3',
  surface:  '#F4F7FB',
};

/* ── Keyframes (mesmos da hero) ───────────────────────────────────────── */
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes pulse-gold {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.8; transform: scale(0.98); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes slideInRight {
    from { transform: translateX(50px); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
  }
  .animate-fade-up {
    animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) both;
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease both;
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  .animate-slide-right {
    animation: slideInRight 0.5s ease both;
  }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.22s; }
  .delay-3 { animation-delay: 0.34s; }
  .delay-4 { animation-delay: 0.46s; }
  .delay-5 { animation-delay: 0.58s; }
  
  .checkout-card {
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .checkout-card:hover {
    transform: translateY(-2px);
    border-color: ${T.gold} !important;
    box-shadow: 0 16px 48px rgba(8,25,46,0.1) !important;
  }
  .input-field {
    transition: all 0.2s ease;
  }
  .input-field:hover {
    border-color: ${T.gold} !important;
  }
  .input-field:focus-within {
    border-color: ${T.gold} !important;
    box-shadow: 0 0 0 3px ${T.goldPale} !important;
  }
  .confirm-btn {
    transition: all 0.2s ease;
  }
  .confirm-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(200,144,58,0.3) !important;
  }
`;

// Styled Step Connector
const CustomConnector = styled(StepConnector)(({ theme }) => ({
  '& .MuiStepConnector-line': {
    borderColor: T.borderMid,
    borderWidth: 2,
  },
  '&.Mui-active .MuiStepConnector-line': {
    borderColor: T.gold,
  },
  '&.Mui-completed .MuiStepConnector-line': {
    borderColor: T.gold,
  },
}));

const steps = ['Resumo do Pedido', 'Endereço de Entrega', 'Confirmar Pagamento'];

const Checkout = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();
  const product = location.state?.product || null;

  const [activeStep, setActiveStep] = useState(0);
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

  const IVA_PERCENTAGE = 0;
  const SHIPPING_RATE_PER_KG = 50;
  const BASE_SHIPPING_FEE = 100;

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

  const handleNext = () => {
    if (activeStep === 0) {
      setActiveStep(1);
    } else if (activeStep === 1) {
      if (validateForm()) {
        setActiveStep(2);
      } else {
        setSnackbarMessage("Por favor, preencha todos os campos obrigatórios.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleOrder = () => {
    handleConfirmOrder();
  };

  const handleConfirmOrder = async () => {
    if (!user?.id || !product) return;

    try {
      setLoading(true);
      const orderRef = push(ref(db, "orders"));
      const orderId = orderRef.key;

      const productType = product.type || "product";
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

      // Limpar carrinho se este produto estiver nele
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
        sx={{
          minHeight: '100vh',
          background: T.cream,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: '"Plus Jakarta Sans", sans-serif'
        }}
      >
        <style>{KEYFRAMES}</style>
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 48, height: 48,
              borderRadius: '50%',
              border: `3px solid ${T.border}`,
              borderTopColor: T.gold,
              animation: 'fadeUp 0.8s infinite linear',
              mx: 'auto',
              mb: 2
            }}
          />
          <Typography sx={{ color: T.textSub }}>Redirecionando...</Typography>
        </Box>
      </Box>
    );
  }

  const productType = product.type || "product";
  const subtotal = Number(product.subtotal) || 0;
  const iva = Number(product.iva) || 0;
  const shippingCost = productType === "product" ? Number(product.shippingCost) || 0 : 0;
  const total = Number(product.total) || 0;

  return (
    <Box 
      sx={{ 
        backgroundColor: T.cream, 
        minHeight: '100vh',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        py: 4
      }}
    >
      <style>{KEYFRAMES}</style>

      <Container maxWidth="lg">
        {/* Header com design da hero */}
        <Paper
          className="animate-fade-up"
          sx={{
            background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyLight} 100%)`,
            borderRadius: '24px',
            p: { xs: 3, md: 4 },
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background decorations */}
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 80% 60% at 90% 10%, rgba(200,144,58,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 50% 50% at 5% 90%, rgba(200,144,58,0.07) 0%, transparent 50%)
            `,
          }} />
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.035,
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
          }} />

          <Box sx={{ 
            position: 'relative', 
            zIndex: 1, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}>
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 800, 
                  color: T.white,
                  fontFamily: '"Playfair Display", serif',
                  mb: 1
                }}
              >
                Finalizar Compra
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Complete seu pedido em poucos passos
              </Typography>
            </Box>
            <BackButton sx={{ color: T.white }} />
          </Box>
        </Paper>

        {/* Stepper */}
        <Paper
          className="animate-fade-up delay-1"
          sx={{
            p: 3,
            mb: 4,
            borderRadius: '16px',
            border: `1px solid ${T.border}`,
            background: T.white,
          }}
        >
          <Stepper 
            activeStep={activeStep} 
            connector={<CustomConnector />}
            alternativeLabel={isMobile}
          >
            {steps.map((label, index) => (
              <Step key={index}>
                <StepLabel
                  StepIconComponent={() => (
                    <Avatar
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: activeStep > index 
                          ? T.gold 
                          : activeStep === index 
                            ? T.gold 
                            : T.borderMid,
                        color: activeStep >= index ? T.white : T.textSub,
                        fontSize: '0.9rem',
                        fontWeight: 600,
                      }}
                    >
                      {index + 1}
                    </Avatar>
                  )}
                  sx={{
                    '& .MuiStepLabel-label': {
                      fontFamily: '"Plus Jakarta Sans", sans-serif',
                      fontSize: '0.9rem',
                      '&.Mui-active': {
                        color: T.gold,
                        fontWeight: 600,
                      },
                      '&.Mui-completed': {
                        color: T.text,
                      },
                    },
                  }}
                >
                  {label}
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>

        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={4}>
          {/* Order Summary */}
          <Box sx={{ flex: 1 }}>
            <Fade in={true} timeout={500}>
              <Paper
                className="checkout-card"
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '20px',
                  border: `1px solid ${T.border}`,
                  background: T.white,
                }}
              >
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700, 
                    color: T.text,
                    fontFamily: '"Playfair Display", serif',
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <ShoppingCartCheckout sx={{ color: T.gold }} /> Resumo do Pedido
                </Typography>

                <Card sx={{ 
                  display: "flex", 
                  mb: 2, 
                  borderRadius: '12px',
                  border: `1px solid ${T.border}`,
                  boxShadow: 'none',
                }}>
                  <CardMedia
                    component="img"
                    sx={{ 
                      width: 100, 
                      objectFit: "contain", 
                      backgroundColor: T.surface,
                      p: 1
                    }}
                    image={product.imageUrl || "https://via.placeholder.com/100"}
                    alt={product.name}
                  />
                  <CardContent sx={{ flex: 1 }}>
                    <Typography variant="body1" fontWeight={700} sx={{ color: T.text }}>
                      {product.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: T.textSub }}>
                      {product.storeName}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip
                        label={`Qtd: ${Number(product.quantity) || 1}`}
                        size="small"
                        sx={{ bgcolor: T.surface, color: T.textMid }}
                      />
                      <Chip
                        label={productType === "product" ? "Produto" : "Serviço"}
                        size="small"
                        sx={{ bgcolor: T.goldPale, color: T.gold }}
                      />
                    </Box>
                  </CardContent>
                </Card>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1.5}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: T.textSub }}>Subtotal:</Typography>
                    <Typography variant="body2" sx={{ color: T.text, fontWeight: 600 }}>
                      {formatPrice(subtotal)} MT
                    </Typography>
                  </Box>
                  
                  {productType === "product" && product.nationalShipping && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" sx={{ color: T.textSub }}>Frete:</Typography>
                      <Typography variant="body2" sx={{ color: T.text, fontWeight: 600 }}>
                        {formatPrice(shippingCost)} MT
                      </Typography>
                    </Box>
                  )}
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" sx={{ color: T.textSub }}>IVA ({IVA_PERCENTAGE}%):</Typography>
                    <Typography variant="body2" sx={{ color: T.text, fontWeight: 600 }}>
                      {formatPrice(iva)} MT
                    </Typography>
                  </Box>
                  
                  <Divider />
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1" fontWeight={700} sx={{ color: T.text }}>
                      Total:
                    </Typography>
                    <Typography variant="body1" fontWeight={800} sx={{ color: T.gold }}>
                      {formatPrice(total)} MT
                    </Typography>
                  </Box>
                </Stack>

                {/* Informações de segurança */}
                <Box 
                  sx={{ 
                    mt: 3,
                    p: 2,
                    bgcolor: T.surface,
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <Security sx={{ color: T.gold, fontSize: 20 }} />
                  <Typography variant="caption" sx={{ color: T.textSub }}>
                    Compra segura. Seus dados estão protegidos.
                  </Typography>
                </Box>
              </Paper>
            </Fade>
          </Box>

          {/* Shipping Address */}
          <Box sx={{ flex: 1 }}>
            <Fade in={true} timeout={700}>
              <Paper
                className="checkout-card"
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '20px',
                  border: `1px solid ${T.border}`,
                  background: T.white,
                }}
              >
                {activeStep === 0 && (
                  <Zoom in={true}>
                    <Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          color: T.text,
                          fontFamily: '"Playfair Display", serif',
                          mb: 3,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Info sx={{ color: T.gold }} /> Confirme seu pedido
                      </Typography>
                      <Typography sx={{ color: T.textMid, mb: 2 }}>
                        Revise os detalhes do pedido antes de prosseguir.
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        onClick={handleNext}
                        sx={{
                          bgcolor: T.gold,
                          color: T.white,
                          '&:hover': { bgcolor: T.goldLight },
                          borderRadius: '12px',
                          py: 1.5,
                          textTransform: 'none',
                          fontWeight: 600,
                          width: '100%',
                        }}
                      >
                        Continuar para Endereço
                      </Button>
                    </Box>
                  </Zoom>
                )}

                {activeStep === 1 && (
                  <Zoom in={true}>
                    <Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          color: T.text,
                          fontFamily: '"Playfair Display", serif',
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <LocationOn sx={{ color: T.gold }} /> Endereço de Entrega
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
                          InputProps={{
                            startAdornment: (
                              <LocationOn sx={{ color: T.gold, mr: 1, fontSize: 20 }} />
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '10px',
                              '&:hover fieldset': { borderColor: T.gold },
                              '&.Mui-focused fieldset': { borderColor: T.gold },
                            },
                          }}
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
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '10px',
                              '&:hover fieldset': { borderColor: T.gold },
                              '&.Mui-focused fieldset': { borderColor: T.gold },
                            },
                          }}
                        />
                        
                        <TextField
                          label="Endereço Completo"
                          value={address.addressLine}
                          onChange={handleAddressChange("addressLine")}
                          fullWidth
                          size="small"
                          error={!!errors.addressLine}
                          helperText={errors.addressLine}
                          disabled={loading}
                          placeholder="Rua/Avenida, Nº, Bairro"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '10px',
                              '&:hover fieldset': { borderColor: T.gold },
                              '&.Mui-focused fieldset': { borderColor: T.gold },
                            },
                          }}
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
                          InputProps={{
                            startAdornment: (
                              <Phone sx={{ color: T.gold, mr: 1, fontSize: 20 }} />
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '10px',
                              '&:hover fieldset': { borderColor: T.gold },
                              '&.Mui-focused fieldset': { borderColor: T.gold },
                            },
                          }}
                        />
                      </Stack>

                      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                        <Button
                          variant="outlined"
                          onClick={handleBack}
                          sx={{
                            borderColor: T.borderMid,
                            color: T.text,
                            '&:hover': { borderColor: T.gold, color: T.gold },
                            borderRadius: '10px',
                            py: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            flex: 1,
                          }}
                        >
                          Voltar
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleNext}
                          sx={{
                            bgcolor: T.gold,
                            color: T.white,
                            '&:hover': { bgcolor: T.goldLight },
                            borderRadius: '10px',
                            py: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            flex: 1,
                          }}
                        >
                          Continuar
                        </Button>
                      </Box>
                    </Box>
                  </Zoom>
                )}

                {activeStep === 2 && (
                  <Zoom in={true}>
                    <Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontWeight: 700, 
                          color: T.text,
                          fontFamily: '"Playfair Display", serif',
                          mb: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}
                      >
                        <Payment sx={{ color: T.gold }} /> Confirmar Pagamento
                      </Typography>

                      <Box 
                        sx={{ 
                          p: 2, 
                          bgcolor: T.surface,
                          borderRadius: '12px',
                          mb: 3
                        }}
                      >
                        <Typography variant="body2" sx={{ color: T.textSub, mb: 1 }}>
                          Endereço de entrega:
                        </Typography>
                        <Typography variant="body2" sx={{ color: T.text }}>
                          {address.addressLine}, {address.district}, {address.province}
                        </Typography>
                        <Typography variant="body2" sx={{ color: T.text, mt: 1 }}>
                          Contacto: {address.contact}
                        </Typography>
                      </Box>

                      <Box 
                        sx={{ 
                          p: 2, 
                          bgcolor: T.goldPale,
                          borderRadius: '12px',
                          mb: 3,
                          border: `1px solid ${T.gold}`
                        }}
                      >
                        <Typography variant="body2" sx={{ color: T.gold, fontWeight: 600, mb: 1 }}>
                          Total a pagar:
                        </Typography>
                        <Typography variant="h4" sx={{ color: T.gold, fontWeight: 800 }}>
                          {formatPrice(total)} MT
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Button
                          variant="outlined"
                          onClick={handleBack}
                          disabled={loading}
                          sx={{
                            borderColor: T.borderMid,
                            color: T.text,
                            '&:hover': { borderColor: T.gold, color: T.gold },
                            borderRadius: '10px',
                            py: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            flex: 1,
                          }}
                        >
                          Voltar
                        </Button>
                        <Button
                          variant="contained"
                          onClick={handleOrder}
                          disabled={loading}
                          className="confirm-btn"
                          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                          sx={{
                            bgcolor: T.gold,
                            color: T.white,
                            '&:hover': { bgcolor: T.goldLight },
                            borderRadius: '10px',
                            py: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            flex: 1,
                          }}
                        >
                          {loading ? 'Processando...' : 'Confirmar Pedido'}
                        </Button>
                      </Box>
                    </Box>
                  </Zoom>
                )}
              </Paper>
            </Fade>
          </Box>
        </Box>
      </Container>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: isMobile ? "bottom" : "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setOpenSnackbar(false)}
          severity={snackbarSeverity}
          sx={{ 
            width: "100%",
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Checkout;
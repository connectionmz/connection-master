import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, get, update, remove } from "firebase/database";
import { db, storage } from "../../fb";
import {
  Container,
  Typography,
  Box,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Divider,
  Stack,
  Grid,
  Button,
  IconButton,
  Paper,
  useTheme,
  useMediaQuery,
  LinearProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  InputAdornment,
  Snackbar,
  Alert,
  Avatar,
  Fade,
  Zoom,
  Tooltip,
  Breadcrumbs,
  Link,
  Rating,
  Skeleton,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  ShoppingCart as ShoppingCartIcon,
  Mouse as MouseIcon,
  Category as CategoryIcon,
  Event as EventIcon,
  Update as UpdateIcon,
  LocalShipping as LocalShippingIcon,
  BarChart as BarChartIcon,
  Share as ShareIcon,
  Inventory as InventoryIcon,
  Image as ImageIcon,
  Close as CloseIcon,
  Scale as ScaleIcon,
  Straighten as StraightenIcon,
  Storefront as StoreIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  CalendarToday as CalendarIcon,
  Schedule as ScheduleIcon,
  Verified as VerifiedIcon,
  ArrowBack as ArrowBackIcon,
  ContentCopy as CopyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { ref as storageRef, getDownloadURL, uploadBytes, deleteObject } from "firebase/storage";
import { NumericFormat } from "react-number-format";
import { formatPrice } from "../../utils/utils";
import BackButton from "../BackButton";
import { normalizeProduct, validateProduct } from './productData';

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
  success:  '#10b981',
  error:    '#ef4444',
  warning:  '#f59e0b',
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
  .animate-fade-up {
    animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) both;
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease both;
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  .animate-pulse-gold {
    animation: pulse-gold 2s ease-in-out infinite;
  }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.22s; }
  .delay-3 { animation-delay: 0.34s; }
  .delay-4 { animation-delay: 0.46s; }
  
  .product-card {
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .product-card:hover {
    transform: translateY(-4px);
    border-color: ${T.gold} !important;
    box-shadow: 0 16px 48px rgba(8,25,46,0.1) !important;
  }
  .stats-card {
    transition: all 0.2s ease;
  }
  .stats-card:hover {
    background: ${T.goldPale};
    border-color: ${T.gold} !important;
  }
  .metric-bar {
    transition: width 0.5s ease;
  }
  .tab-indicator {
    background: ${T.gold} !important;
    height: 3px !important;
  }
`;

const ProductPage = ({ user }) => {
  const { id } = useParams();
  const storeId = user?.id;
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success"
  });
  const [salesData, setSalesData] = useState({
    daily: [120, 85, 95, 110, 130, 145, 168],
    weekly: [450, 520, 580, 490, 610],
    monthly: [1850, 2100, 2350, 2800],
  });

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        if (!storeId) {
          navigate('/auth', { replace: true });
          return;
        }

        const productRef = ref(db, `stores/${storeId}/products/${id}`);
        const snapshot = await get(productRef);

        if (snapshot.exists()) {
          const productData = snapshot.val();
          setProduct(productData);
          setFormData({
            type: productData.type || "product",
            name: productData.name || "",
            price: productData.price ? String(productData.price) : "",
            description: productData.description || "",
            category: productData.category || "",
            sku: productData.sku || "",
            qtd: productData.qtd ? String(productData.qtd) : "",
            weight: productData.weight ? String(productData.weight) : "",
            height: productData.height ? String(productData.height) : "",
            width: productData.width ? String(productData.width) : "",
            length: productData.length ? String(productData.length) : "",
            nationalShipping: productData.nationalShipping || false,
            imageUrl: productData.imageUrl || "",
          });
        } else {
          showSnackbar("Produto não encontrado", "error");
          navigate('/market', { replace: true });
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        showSnackbar("Erro ao carregar produto", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id, storeId, navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditOpen = () => {
    setOpenEditDialog(true);
  };

  const handleEditClose = () => {
    setOpenEditDialog(false);
    setErrors({});
    setImageFile(null);
  };

  const handleDeleteOpen = () => {
    setOpenDeleteDialog(true);
  };

  const handleDeleteClose = () => {
    setOpenDeleteDialog(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setFormData((prev) => ({ ...prev, imageUrl: URL.createObjectURL(file) }));
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/product/${id}/store/${storeId}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    showSnackbar("Link copiado!", "success");
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/product/${id}/store/${storeId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name,
          text: `Confira este produto: ${product?.name}`,
          url: url,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      handleCopyLink();
    }
  };

  const validateFormData = () => {
    const newErrors = validateProduct(formData);
    const isValid = Object.keys(newErrors).length === 0;

    setErrors(newErrors);
    if (!isValid) {
      showSnackbar("Por favor, corrija os erros nos campos obrigatórios.", "error");
    }
    return isValid;
  };

  const handleUpdateProduct = async () => {
    if (!validateFormData()) {
      return;
    }

    try {
      setSaving(true);

      let imageUrl = formData.imageUrl;

      if (imageFile) {
        const imageRef = storageRef(storage, `products/${storeId}/${id}/${imageFile.name}`);
        await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(imageRef);

        if (product.imageUrl && product.imageUrl !== imageUrl) {
          try {
            const oldImageRef = storageRef(storage, product.imageUrl);
            await deleteObject(oldImageRef);
          } catch (error) {
            console.warn("Não foi possível remover a imagem antiga:", error);
          }
        }
      }

      const productToUpdate = normalizeProduct(formData, { imageUrl });

      await update(ref(db, `stores/${storeId}/products/${id}`), productToUpdate);
      setProduct(productToUpdate);
      showSnackbar("Produto atualizado com sucesso!", "success");
      handleEditClose();
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      showSnackbar("Erro ao atualizar o produto.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async () => {
    try {
      if (product.imageUrl) {
        try {
          const imageRef = storageRef(storage, product.imageUrl);
          await deleteObject(imageRef);
        } catch (error) {
          console.warn("Erro ao remover imagem do produto:", error);
        }
      }

      await remove(ref(db, `stores/${storeId}/products/${id}`));
      showSnackbar("Produto removido com sucesso!", "success");
      navigate('/market', { replace: true });
    } catch (error) {
      console.error("Erro ao remover produto:", error);
      showSnackbar("Erro ao remover o produto.", "error");
    }
    handleDeleteClose();
  };

  if (loading) {
    return (
      <Box sx={{ backgroundColor: T.cream, minHeight: '100vh', py: 4 }}>
        <Container maxWidth="lg">
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: '24px', mb: 4 }} />
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '16px' }} />
            </Grid>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rectangular" height={400} sx={{ borderRadius: '16px' }} />
            </Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  if (!product) {
    return null;
  }

  const stockStatus = product.type === "product" && product.qtd !== undefined;
  const isLowStock = stockStatus && product.qtd <= 5 && product.qtd > 0;
  const isOutOfStock = stockStatus && product.qtd === 0;
  const views = product.views || 0;
  const cartAdds = product.cartAdds || 0;
  const clicks = product.clicks || 0;
  const conversionRate = views > 0 ? ((cartAdds / views) * 100).toFixed(1) : 0;

  return (
    <Box sx={{ backgroundColor: T.cream, minHeight: '100vh', fontFamily: '"Plus Jakarta Sans", sans-serif', py: 4 }}>
      <style>{KEYFRAMES}</style>

      <Container maxWidth="xl">
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

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: T.gold,
                  color: T.white,
                  border: `2px solid ${T.white}`,
                }}
              >
                <StoreIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                    color: T.white,
                    fontFamily: '"Playfair Display", serif',
                  }}
                >
                  {product.name}
                </Typography>
                <Breadcrumbs sx={{ color: 'rgba(255,255,255,0.7)' }} separator={<ArrowBackIcon sx={{ fontSize: 14 }} />}>
                  <Link
                    href="/market"
                    sx={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', '&:hover': { color: T.gold } }}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/market"
                    sx={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', '&:hover': { color: T.gold } }}
                  >
                    Produtos
                  </Link>
                  <Typography sx={{ color: T.gold }}>{product.name}</Typography>
                </Breadcrumbs>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={product.type === "product" ? <InventoryIcon /> : <TrendingUpIcon />}
                label={product.type === "product" ? "Produto" : "Serviço"}
                sx={{ bgcolor: 'rgba(200,144,58,0.15)', color: T.goldLight }}
              />
              {isLowStock && (
                <Chip
                  icon={<WarningIcon />}
                  label={`Stock baixo: ${product.qtd} unidades`}
                  sx={{ bgcolor: 'rgba(245,158,11,0.15)', color: T.warning }}
                />
              )}
              {isOutOfStock && (
                <Chip
                  icon={<WarningIcon />}
                  label="Esgotado"
                  sx={{ bgcolor: 'rgba(239,68,68,0.15)', color: T.error }}
                />
              )}
              <Chip
                icon={<VisibilityIcon />}
                label={`${views} visualizações`}
                sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: T.white }}
              />
            </Box>
          </Box>
        </Paper>

        <Grid container spacing={3}>
          {/* Coluna da esquerda - Imagem e informações */}
          <Grid item xs={12} md={4}>
            <Card
              className="product-card"
              sx={{
                mb: 3,
                borderRadius: '20px',
                border: `1px solid ${T.border}`,
                overflow: 'hidden',
              }}
            >
              <Box sx={{ position: 'relative', bgcolor: T.surface, p: 3, textAlign: 'center' }}>
                <CardMedia
                  component="img"
                  height="300"
                  image={product.imageUrl || "https://via.placeholder.com/300?text=Sem+Imagem"}
                  alt={product.name}
                  sx={{ objectFit: 'contain', maxHeight: 300 }}
                />
                {product.type === "product" && product.qtd !== undefined && (
                  <Badge
                    badgeContent={isOutOfStock ? "Esgotado" : isLowStock ? "Stock Baixo" : `Stock: ${product.qtd}`}
                    color={isOutOfStock ? "error" : isLowStock ? "warning" : "success"}
                    sx={{
                      position: 'absolute',
                      top: 16,
                      right: 16,
                      '& .MuiBadge-badge': {
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '6px 12px',
                        borderRadius: '20px',
                      },
                    }}
                  />
                )}
              </Box>

              <CardContent>
                <Typography variant="h5" sx={{ fontWeight: 700, color: T.gold, mb: 2 }}>
                  {formatPrice(product.price)} MT
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  {product.category && (
                    <Chip
                      icon={<CategoryIcon />}
                      label={product.category}
                      size="small"
                      sx={{ bgcolor: T.goldPale, color: T.gold }}
                    />
                  )}
                  {product.sku && (
                    <Chip
                      icon={<InventoryIcon />}
                      label={`SKU: ${product.sku}`}
                      size="small"
                      sx={{ bgcolor: T.surface, color: T.textMid }}
                    />
                  )}
                  {product.type === "product" && product.nationalShipping && (
                    <Chip
                      icon={<LocalShippingIcon />}
                      label="Frete Nacional"
                      size="small"
                      sx={{ bgcolor: T.surface, color: T.textMid }}
                    />
                  )}
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarIcon sx={{ color: T.gold, fontSize: 16 }} />
                    <Typography variant="body2" sx={{ color: T.textSub }}>
                      Criado: {product.createdAt ? new Date(product.createdAt).toLocaleDateString('pt-PT') : 'Não disponível'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <UpdateIcon sx={{ color: T.gold, fontSize: 16 }} />
                    <Typography variant="body2" sx={{ color: T.textSub }}>
                      Atualizado: {product.updatedAt ? new Date(product.updatedAt).toLocaleDateString('pt-PT') : 'Não disponível'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>

            {/* Métricas rápidas */}
            <Paper
              className="stats-card"
              sx={{
                p: 3,
                borderRadius: '20px',
                border: `1px solid ${T.border}`,
                background: T.white,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: T.text, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <BarChartIcon sx={{ color: T.gold }} /> Métricas de Desempenho
              </Typography>

              <Stack spacing={2.5}>
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: T.textSub }}>Visualizações</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: T.text }}>{views}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (views / 1000) * 100)}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: T.border,
                      '& .MuiLinearProgress-bar': { bgcolor: T.gold, borderRadius: 3 },
                    }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: T.textSub }}>Adições ao carrinho</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: T.text }}>{cartAdds}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (cartAdds / 200) * 100)}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: T.border,
                      '& .MuiLinearProgress-bar': { bgcolor: T.gold, borderRadius: 3 },
                    }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: T.textSub }}>Cliques</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: T.text }}>{clicks}</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (clicks / 300) * 100)}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: T.border,
                      '& .MuiLinearProgress-bar': { bgcolor: T.gold, borderRadius: 3 },
                    }}
                  />
                </Box>

                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" sx={{ color: T.textSub }}>Taxa de conversão</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: T.gold }}>{conversionRate}%</Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={parseFloat(conversionRate) || 0}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: T.border,
                      '& .MuiLinearProgress-bar': { bgcolor: T.gold, borderRadius: 3 },
                    }}
                  />
                </Box>
              </Stack>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                <Tooltip title="Compartilhar produto">
                  <Button
                    variant="outlined"
                    startIcon={<ShareIcon />}
                    onClick={handleShare}
                    fullWidth
                    sx={{
                      borderColor: T.borderMid,
                      color: T.text,
                      '&:hover': { borderColor: T.gold, color: T.gold },
                      borderRadius: '10px',
                      textTransform: 'none',
                    }}
                  >
                    Compartilhar
                  </Button>
                </Tooltip>
                <Tooltip title="Copiar link">
                  <Button
                    variant="outlined"
                    startIcon={copiedLink ? <CheckCircleIcon /> : <CopyIcon />}
                    onClick={handleCopyLink}
                    fullWidth
                    sx={{
                      borderColor: T.borderMid,
                      color: T.text,
                      '&:hover': { borderColor: T.gold, color: T.gold },
                      borderRadius: '10px',
                      textTransform: 'none',
                    }}
                  >
                    {copiedLink ? "Copiado!" : "Copiar Link"}
                  </Button>
                </Tooltip>
              </Box>
            </Paper>
          </Grid>

          {/* Coluna da direita - Conteúdo principal */}
          <Grid item xs={12} md={8}>
            <Paper
              sx={{
                borderRadius: '20px',
                border: `1px solid ${T.border}`,
                overflow: 'hidden',
              }}
            >
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                TabIndicatorProps={{
                  sx: {
                    background: T.gold,
                    height: 3,
                  }
                }}
                sx={{
                  borderBottom: `1px solid ${T.border}`,
                  '& .MuiTab-root': {
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.95rem',
                    color: T.textSub,
                    '&.Mui-selected': {
                      color: T.gold,
                    },
                  },
                }}
              >
                <Tab label="Visão Geral" />
                <Tab label="Detalhes Técnicos" />
                <Tab label="Desempenho" />
              </Tabs>

              <Box sx={{ p: 3 }}>
                {tabValue === 0 && (
                  <Fade in={true}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: T.text, mb: 2 }}>
                        Descrição do Produto
                      </Typography>
                      <Typography variant="body1" sx={{ color: T.textMid, lineHeight: 1.8, mb: 4 }}>
                        {product.description || "Nenhuma descrição fornecida para este produto."}
                      </Typography>

                      <Divider sx={{ my: 3 }} />

                      <Typography variant="h6" sx={{ fontWeight: 700, color: T.text, mb: 2 }}>
                        Informações de Entrega
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <Chip
                          icon={<LocalShippingIcon />}
                          label={product.type === "product" && product.nationalShipping
                            ? "Disponível para envio nacional"
                            : product.type === "product"
                            ? "Envio local apenas"
                            : "Serviço (sem envio)"}
                          sx={{ bgcolor: T.surface, color: T.textMid }}
                        />
                        {product.type === "product" && product.nationalShipping && (
                          <>
                            <Chip icon={<ScaleIcon />} label={`Peso: ${product.weight} kg`} sx={{ bgcolor: T.surface, color: T.textMid }} />
                            <Chip icon={<StraightenIcon />} label={`Dimensões: ${product.height}x${product.width}x${product.length} cm`} sx={{ bgcolor: T.surface, color: T.textMid }} />
                          </>
                        )}
                      </Box>
                    </Box>
                  </Fade>
                )}

                {tabValue === 1 && (
                  <Fade in={true}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: T.text, mb: 3 }}>
                        Especificações Técnicas
                      </Typography>

                      <TableContainer component={Paper} sx={{ boxShadow: 'none', border: `1px solid ${T.border}`, borderRadius: '12px' }}>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, color: T.text, borderBottomColor: T.border, width: '40%' }}>Nome do Produto</TableCell>
                              <TableCell sx={{ color: T.textMid, borderBottomColor: T.border }}>{product.name}</TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, color: T.text, borderBottomColor: T.border }}>Tipo</TableCell>
                              <TableCell sx={{ color: T.textMid, borderBottomColor: T.border }}>
                                <Chip
                                  label={product.type === "product" ? "Produto" : "Serviço"}
                                  size="small"
                                  sx={{ bgcolor: product.type === "product" ? T.goldPale : T.surface, color: product.type === "product" ? T.gold : T.textMid }}
                                />
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, color: T.text, borderBottomColor: T.border }}>Preço</TableCell>
                              <TableCell sx={{ color: T.gold, fontWeight: 600, borderBottomColor: T.border }}>{formatPrice(product.price)} MT</TableCell>
                            </TableRow>
                            {product.category && (
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: T.text, borderBottomColor: T.border }}>Categoria</TableCell>
                                <TableCell sx={{ color: T.textMid, borderBottomColor: T.border }}>{product.category}</TableCell>
                              </TableRow>
                            )}
                            {product.sku && (
                              <TableRow>
                                <TableCell sx={{ fontWeight: 600, color: T.text, borderBottomColor: T.border }}>SKU</TableCell>
                                <TableCell sx={{ color: T.textMid, borderBottomColor: T.border }}>{product.sku}</TableCell>
                              </TableRow>
                            )}
                            {product.type === "product" && (
                              <>
                                <TableRow>
                                  <TableCell sx={{ fontWeight: 600, color: T.text, borderBottomColor: T.border }}>Estoque</TableCell>
                                  <TableCell sx={{ color: isOutOfStock ? T.error : isLowStock ? T.warning : T.textMid, borderBottomColor: T.border }}>
                                    {product.qtd} unidades
                                    {isLowStock && " (estoque baixo)"}
                                    {isOutOfStock && " (esgotado)"}
                                  </TableCell>
                                </TableRow>
                                {product.nationalShipping && (
                                  <>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 600, color: T.text, borderBottomColor: T.border }}>Peso</TableCell>
                                      <TableCell sx={{ color: T.textMid, borderBottomColor: T.border }}>{product.weight} kg</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell sx={{ fontWeight: 600, color: T.text, borderBottomColor: T.border }}>Dimensões</TableCell>
                                      <TableCell sx={{ color: T.textMid, borderBottomColor: T.border }}>
                                        {product.height} x {product.width} x {product.length} cm
                                      </TableCell>
                                    </TableRow>
                                  </>
                                )}
                              </>
                            )}
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, color: T.text }}>Data de Criação</TableCell>
                              <TableCell sx={{ color: T.textMid }}>
                                {product.createdAt ? new Date(product.createdAt).toLocaleDateString('pt-PT') : 'Não disponível'}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </Fade>
                )}

                {tabValue === 2 && (
                  <Fade in={true}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: T.text, mb: 3 }}>
                        Análise de Desempenho
                      </Typography>

                      <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={4}>
                          <Paper
                            sx={{
                              p: 2,
                              textAlign: 'center',
                              borderRadius: '16px',
                              border: `1px solid ${T.border}`,
                              background: T.white,
                            }}
                          >
                            <TrendingUpIcon sx={{ color: T.gold, fontSize: 32, mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: T.text }}>{views}</Typography>
                            <Typography variant="body2" sx={{ color: T.textSub }}>Visualizações totais</Typography>
                            <Typography variant="caption" sx={{ color: T.success, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                              +12% esta semana
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Paper
                            sx={{
                              p: 2,
                              textAlign: 'center',
                              borderRadius: '16px',
                              border: `1px solid ${T.border}`,
                              background: T.white,
                            }}
                          >
                            <ShoppingCartIcon sx={{ color: T.gold, fontSize: 32, mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: T.text }}>{cartAdds}</Typography>
                            <Typography variant="body2" sx={{ color: T.textSub }}>Adições ao carrinho</Typography>
                            <Typography variant="caption" sx={{ color: T.success, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                              +8% esta semana
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Paper
                            sx={{
                              p: 2,
                              textAlign: 'center',
                              borderRadius: '16px',
                              border: `1px solid ${T.border}`,
                              background: T.white,
                            }}
                          >
                            <TrendingUpIcon sx={{ color: T.gold, fontSize: 32, mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 700, color: T.text }}>{conversionRate}%</Typography>
                            <Typography variant="body2" sx={{ color: T.textSub }}>Taxa de conversão</Typography>
                            <Typography variant="caption" sx={{ color: conversionRate > 5 ? T.success : T.warning, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mt: 1 }}>
                              {conversionRate > 5 ? 'Acima da média' : 'Abaixo da média'}
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>

                      <Box
                        sx={{
                          height: '300px',
                          bgcolor: T.surface,
                          borderRadius: '16px',
                          border: `1px solid ${T.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          gap: 2,
                        }}
                      >
                        <BarChartIcon sx={{ fontSize: 64, color: T.borderMid }} />
                        <Typography color="text.secondary">
                          Gráficos detalhados disponíveis em breve
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Estamos desenvolvendo análises mais profundas para você
                        </Typography>
                      </Box>
                    </Box>
                  </Fade>
                )}
              </Box>
            </Paper>

            {/* Ações rápidas */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={handleEditOpen}
                sx={{
                  bgcolor: T.navy,
                  color: T.white,
                  '&:hover': { bgcolor: T.navyLight },
                  borderRadius: '12px',
                  textTransform: 'none',
                  px: 4,
                  py: 1.2,
                }}
              >
                Editar Produto
              </Button>
              <Button
                variant="contained"
                startIcon={<DeleteIcon />}
                onClick={handleDeleteOpen}
                sx={{
                  bgcolor: T.error,
                  color: T.white,
                  '&:hover': { bgcolor: '#dc2626' },
                  borderRadius: '12px',
                  textTransform: 'none',
                  px: 4,
                  py: 1.2,
                }}
              >
                Remover Produto
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Modal de Edição */}
      <Dialog
        open={openEditDialog}
        onClose={handleEditClose}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: '24px',
            overflow: 'hidden',
          }
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyLight} 100%)`,
            color: T.white,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>Editar Produto</Typography>
          <IconButton onClick={handleEditClose} sx={{ color: T.white }} disabled={saving}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3, bgcolor: T.white }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, color: T.text }}>
                Imagem do Produto
              </Typography>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {formData.imageUrl && (
                  <Box
                    sx={{
                      width: "100%",
                      height: isMobile ? 150 : 200,
                      position: "relative",
                      border: `1px dashed ${T.borderMid}`,
                      borderRadius: '12px',
                      overflow: "hidden",
                      bgcolor: T.surface,
                    }}
                  >
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <IconButton
                      onClick={handleRemoveImage}
                      size="small"
                      sx={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        color: T.white,
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                  id="product-image-upload"
                />
                <label htmlFor="product-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    startIcon={<ImageIcon />}
                    disabled={saving}
                    sx={{
                      borderColor: T.borderMid,
                      color: T.gold,
                      '&:hover': { borderColor: T.gold, bgcolor: T.goldPale },
                      borderRadius: '10px',
                      textTransform: 'none',
                    }}
                  >
                    {formData.imageUrl ? "Alterar Imagem" : "Adicionar Imagem"}
                  </Button>
                </label>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              <FormControl fullWidth sx={{ mb: 2 }} error={!!errors["type"]}>
                <InputLabel sx={{ color: T.textSub }}>Tipo *</InputLabel>
                <Select
                  value={formData.type}
                  label="Tipo"
                  onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                  disabled={saving}
                  sx={{
                    borderRadius: '12px',
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: T.gold },
                  }}
                >
                  <MenuItem value="product">Produto</MenuItem>
                  <MenuItem value="service">Serviço</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Nome do Produto *"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                fullWidth
                sx={{ mb: 2 }}
                error={!!errors["name"]}
                helperText={errors["name"] || "Ex: Camiseta Branca ou Consultoria de Marketing"}
                size={isMobile ? "small" : "medium"}
                required
                disabled={saving}
                InputLabelProps={{ sx: { color: T.textSub } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': { borderColor: T.gold },
                    '&.Mui-focused fieldset': { borderColor: T.gold },
                  },
                }}
              />

              <NumericFormat
                value={formData.price}
                thousandSeparator="."
                decimalSeparator=","
                decimalScale={2}
                fixedDecimalScale
                allowNegative={false}
                onValueChange={(values) => setFormData((prev) => ({ ...prev, price: values.value }))}
                customInput={TextField}
                fullWidth
                label="Preço (MZN) *"
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">MZN</InputAdornment>,
                }}
                error={!!errors["price"]}
                helperText={errors["price"] || "Ex: 1234,56"}
                size={isMobile ? "small" : "medium"}
                required
                disabled={saving}
                InputLabelProps={{ sx: { color: T.textSub } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': { borderColor: T.gold },
                    '&.Mui-focused fieldset': { borderColor: T.gold },
                  },
                }}
              />

              <TextField
                label="Categoria"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                fullWidth
                sx={{ mb: 2 }}
                helperText="Ex: Roupas, Eletrônicos, Serviços"
                size={isMobile ? "small" : "medium"}
                disabled={saving}
                InputLabelProps={{ sx: { color: T.textSub } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': { borderColor: T.gold },
                    '&.Mui-focused fieldset': { borderColor: T.gold },
                  },
                }}
              />

              <TextField
                label="Descrição"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                multiline
                rows={isMobile ? 3 : 4}
                fullWidth
                sx={{ mb: 2 }}
                helperText="Detalhes atrativos para o cliente"
                size={isMobile ? "small" : "medium"}
                disabled={saving}
                InputLabelProps={{ sx: { color: T.textSub } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    '&:hover fieldset': { borderColor: T.gold },
                    '&.Mui-focused fieldset': { borderColor: T.gold },
                  },
                }}
              />

              {formData.type === "product" ? (
                <>
                  <NumericFormat
                    value={formData.qtd}
                    allowNegative={false}
                    onValueChange={(values) => setFormData((prev) => ({ ...prev, qtd: values.value }))}
                    customInput={TextField}
                    fullWidth
                    label="Quantidade *"
                    sx={{ mb: 2 }}
                    error={!!errors["qtd"]}
                    helperText={errors["qtd"] || "Estoque disponível"}
                    size={isMobile ? "small" : "medium"}
                    required
                    disabled={saving}
                    InputLabelProps={{ sx: { color: T.textSub } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '&:hover fieldset': { borderColor: T.gold },
                        '&.Mui-focused fieldset': { borderColor: T.gold },
                      },
                    }}
                  />

                  <TextField
                    label="SKU"
                    value={formData.sku}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                    fullWidth
                    sx={{ mb: 2 }}
                    helperText="Código interno (ex: CAM-BRANCO-M)"
                    size={isMobile ? "small" : "medium"}
                    disabled={saving}
                    InputLabelProps={{ sx: { color: T.textSub } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        '&:hover fieldset': { borderColor: T.gold },
                        '&.Mui-focused fieldset': { borderColor: T.gold },
                      },
                    }}
                  />

                  <Divider sx={{ my: 2, borderColor: T.border }} />

                  <Typography variant="subtitle2" sx={{ mb: 2, display: "flex", alignItems: "center", color: T.gold, fontWeight: 600 }}>
                    <LocalShippingIcon sx={{ mr: 1 }} /> Frete Nacional
                  </Typography>

                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.nationalShipping}
                        onChange={(e) => setFormData((prev) => ({ ...prev, nationalShipping: e.target.checked }))}
                        sx={{
                          '& .MuiSwitch-switchBase.Mui-checked': { color: T.gold },
                          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: T.gold },
                        }}
                      />
                    }
                    label="Habilitar frete para todo Moçambique"
                    sx={{ mb: 2 }}
                  />

                  {formData.nationalShipping && (
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <NumericFormat
                          value={formData.weight}
                          allowNegative={false}
                          decimalScale={2}
                          fixedDecimalScale
                          onValueChange={(values) => setFormData((prev) => ({ ...prev, weight: values.value }))}
                          customInput={TextField}
                          fullWidth
                          label="Peso (kg) *"
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><ScaleIcon fontSize="small" /></InputAdornment>,
                          }}
                          error={!!errors["weight"]}
                          helperText={errors["weight"] || "Ex: 0,50"}
                          disabled={saving}
                          InputLabelProps={{ sx: { color: T.textSub } }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '&:hover fieldset': { borderColor: T.gold },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <NumericFormat
                          value={formData.height}
                          allowNegative={false}
                          decimalScale={2}
                          fixedDecimalScale
                          onValueChange={(values) => setFormData((prev) => ({ ...prev, height: values.value }))}
                          customInput={TextField}
                          fullWidth
                          label="Altura (cm) *"
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><StraightenIcon fontSize="small" /></InputAdornment>,
                          }}
                          error={!!errors["height"]}
                          helperText={errors["height"] || "Ex: 30,00"}
                          disabled={saving}
                          InputLabelProps={{ sx: { color: T.textSub } }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '&:hover fieldset': { borderColor: T.gold },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <NumericFormat
                          value={formData.width}
                          allowNegative={false}
                          decimalScale={2}
                          fixedDecimalScale
                          onValueChange={(values) => setFormData((prev) => ({ ...prev, width: values.value }))}
                          customInput={TextField}
                          fullWidth
                          label="Largura (cm) *"
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><StraightenIcon fontSize="small" /></InputAdornment>,
                          }}
                          error={!!errors["width"]}
                          helperText={errors["width"] || "Ex: 20,00"}
                          disabled={saving}
                          InputLabelProps={{ sx: { color: T.textSub } }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '&:hover fieldset': { borderColor: T.gold },
                            },
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <NumericFormat
                          value={formData.length}
                          allowNegative={false}
                          decimalScale={2}
                          fixedDecimalScale
                          onValueChange={(values) => setFormData((prev) => ({ ...prev, length: values.value }))}
                          customInput={TextField}
                          fullWidth
                          label="Comprimento (cm) *"
                          InputProps={{
                            startAdornment: <InputAdornment position="start"><StraightenIcon fontSize="small" /></InputAdornment>,
                          }}
                          error={!!errors["length"]}
                          helperText={errors["length"] || "Ex: 5,00"}
                          disabled={saving}
                          InputLabelProps={{ sx: { color: T.textSub } }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '12px',
                              '&:hover fieldset': { borderColor: T.gold },
                            },
                          }}
                        />
                      </Grid>
                    </Grid>
                  )}
                </>
              ) : (
                <TextField
                  label="SKU"
                  value={formData.sku}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                  fullWidth
                  sx={{ mb: 2 }}
                  helperText="Código opcional para serviços"
                  size={isMobile ? "small" : "medium"}
                  disabled={saving}
                  InputLabelProps={{ sx: { color: T.textSub } }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: T.gold },
                      '&.Mui-focused fieldset': { borderColor: T.gold },
                    },
                  }}
                />
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: T.white, borderTop: `1px solid ${T.border}` }}>
          <Button
            variant="outlined"
            onClick={handleEditClose}
            disabled={saving}
            sx={{
              borderColor: T.borderMid,
              color: T.textSub,
              '&:hover': { borderColor: T.gold, color: T.gold },
              borderRadius: '10px',
              textTransform: 'none',
            }}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateProduct}
            disabled={Object.keys(errors).length > 0 || saving}
            sx={{
              bgcolor: T.gold,
              color: T.white,
              '&:hover': { bgcolor: T.goldLight },
              borderRadius: '10px',
              textTransform: 'none',
              px: 3,
            }}
          >
            {saving ? <CircularProgress size={24} /> : "Salvar Alterações"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleDeleteClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '24px',
            border: `1px solid ${T.border}`,
          }
        }}
      >
        <DialogTitle sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: T.text }}>
          Confirmar Exclusão
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: T.textSub }}>
            Tem certeza que deseja remover este produto? Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button
            onClick={handleDeleteClose}
            variant="outlined"
            sx={{
              borderColor: T.borderMid,
              color: T.textSub,
              '&:hover': { borderColor: T.gold, color: T.gold },
              borderRadius: '10px',
              textTransform: 'none',
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteProduct}
            variant="contained"
            sx={{
              bgcolor: T.error,
              color: T.white,
              '&:hover': { bgcolor: '#dc2626' },
              borderRadius: '10px',
              textTransform: 'none',
            }}
          >
            Remover
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: isMobile ? "bottom" : "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ 
            width: "100%",
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProductPage;

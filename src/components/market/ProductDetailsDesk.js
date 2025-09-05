import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ref, get, update, increment, set, remove } from "firebase/database";
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
  Chip,
  Divider,
  Stack,
  useMediaQuery,
  IconButton,
  Avatar,
  useTheme,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Snackbar,
  Tooltip,
} from "@mui/material";
import {
  Share as ShareIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
  Verified as VerifiedIcon,
  Store as StoreIcon,
  VisibilityOff as VisibilityOffIcon,
  Favorite,
  FavoriteBorder,
  Payment as PaymentIcon,
  Inventory as InventoryIcon,
  Category as CategoryIcon,
  Scale as ScaleIcon,
  Straighten as StraightenIcon,
} from "@mui/icons-material";
import BackButton from "../BackButton";
import { formatPrice } from "../../utils/utils";

const ProductDetailsDesk = ({ user }) => {
  const { productId, store } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [product, setProduct] = useState(null);
  const [storeInfo, setStoreInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [views, setViews] = useState(0);
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const IVA_PERCENTAGE = 0; // IVA is 0% as per original code
  const SHIPPING_RATE_PER_KG = 50; // Example: 50 MT per kg for national shipping
  const BASE_SHIPPING_FEE = 100; // Base fee for national shipping in MT

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch product details
        const productRef = ref(db, `stores/${store}/products/${productId}`);
        const productSnapshot = await get(productRef);

        if (productSnapshot.exists()) {
          const productData = productSnapshot.val();
          // Default type to "product" if undefined or null
          productData.type = productData.type || "product";
          setProduct(productData);
          setViews(productData.views || 0);

          // Update view count
          await update(ref(db, `stores/${store}/products/${productId}`), {
            views: increment(1),
          });

          // Fetch store/company information
          const storeRef = ref(db, `stores/${store}`);
          const storeSnapshot = await get(storeRef);
          if (storeSnapshot.exists()) {
            setStoreInfo(storeSnapshot.val());
          }

          // Check if product is favorited
          if (user?.id) {
            const favoriteRef = ref(db, `favorites/${user.id}/${productId}`);
            const favoriteSnapshot = await get(favoriteRef);
            setFavorite(favoriteSnapshot.exists());
          }
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setSnackbarMessage("Erro ao carregar dados do produto.");
        setSnackbarSeverity("error");
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId, store, user?.id]);

  const handleOpenShareMenu = (event) => {
    event.preventDefault();
    setShareAnchorEl(event.currentTarget);
  };

  const handleCloseShareMenu = () => {
    setShareAnchorEl(null);
  };

  const shareOnPlatform = (platform) => {
    const productUrl = `${window.location.origin}/product/${productId}/store/${store}`;
    let shareUrl = "";

    switch (platform) {
      case "whatsapp":
        shareUrl = `https://wa.me/?text=Confira este produto: ${encodeURIComponent(product.name)} - ${productUrl}`;
        break;
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}&text=Confira este produto: ${encodeURIComponent(product.name)}`;
        break;
      case "copy":
        navigator.clipboard.writeText(productUrl);
        setSnackbarMessage("Link copiado para a área de transferência!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
        handleCloseShareMenu();
        return;
      default:
        return;
    }

    window.open(shareUrl, "_blank", "noopener,noreferrer");
    handleCloseShareMenu();
  };

  const toggleFavorite = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const favoriteRef = ref(db, `favorites/${user.id}/${productId}`);
      if (favorite) {
        await remove(favoriteRef);
        setFavorite(false);
        setSnackbarMessage("Removido dos favoritos!");
        setSnackbarSeverity("info");
      } else {
        await set(favoriteRef, { storeId: store, addedAt: Date.now() });
        setFavorite(true);
        setSnackbarMessage("Adicionado aos favoritos!");
        setSnackbarSeverity("success");
      }
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Erro ao gerenciar favorito:", error);
      setSnackbarMessage("Erro ao gerenciar favoritos.");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const addToCart = async () => {
    if (!product || !user?.id) {
      navigate("/auth");
      return;
    }

    try {
      const cartRef = ref(db, `cart/${user.id}/${productId}`);
      const cartItem = {
        productId: productId,
        storeId: store,
        name: product.name,
        imageUrl: product.imageUrl,
        price: product.discountPrice || product.price,
        storeName: storeInfo?.company?.nome || "Loja Desconhecida",
        quantity: Number(quantity),
        addedAt: new Date().toISOString(),
      };

      const snapshot = await get(cartRef);
      if (snapshot.exists()) {
        await update(cartRef, {
          quantity: snapshot.val().quantity + Number(quantity),
        });
      } else {
        await set(cartRef, cartItem);
      }

      const productRef = ref(db, `stores/${store}/products/${productId}`);
      await update(productRef, {
        cartAdds: increment(1),
      });

      setSnackbarMessage(`${quantity} x ${product.name} adicionado ao carrinho!`);
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Erro ao adicionar ao carrinho:", error);
      setSnackbarMessage("Erro ao adicionar ao carrinho");
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
    }
  };

  const handlePayment = () => {
    if (!product || !user?.id) {
      navigate("/auth");
      return;
    }

    const price = product.discountPrice || product.price;
    const subtotal = price * Number(quantity);
    const iva = (subtotal * IVA_PERCENTAGE) / 100;
    let shippingCost = 0;

    if ((product.type || "product") === "product" && product.nationalShipping && product.weight) {
      shippingCost = BASE_SHIPPING_FEE + (Number(product.weight) * SHIPPING_RATE_PER_KG);
    }

    const totalWithIva = subtotal + iva + shippingCost;

    navigate("/checkout", {
      state: {
        product: {
          productId: productId,
          storeId: store,
          name: product.name,
          price: price,
          quantity: Number(quantity),
          imageUrl: product.imageUrl,
          storeName: storeInfo?.company?.nome || "Loja Desconhecida",
          shippingCost: (product.type || "product") === "product" ? shippingCost : 0,
          subtotal: subtotal,
          iva: iva,
          total: totalWithIva,
          weight: Number(product.weight) || 0,
          dimensions: product.nationalShipping ? `${Number(product.height) || 0}x${Number(product.width) || 0}x${Number(product.length) || 0} cm` : null,
          nationalShipping: product.nationalShipping || false,
        },
      },
    });
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

  const productType = product.type || "product"; // Default to "product" if type is undefined
  const price = Number(product.discountPrice) || Number(product.price) || 0;
  const subtotal = price * Number(quantity);
  const iva = (subtotal * IVA_PERCENTAGE) / 100;
  const shippingCost =
    productType === "product" && product.nationalShipping && product.weight
      ? BASE_SHIPPING_FEE + (Number(product.weight) * SHIPPING_RATE_PER_KG)
      : 0;
  const totalWithIva = subtotal + iva + shippingCost;
  const showPrices = storeInfo?.settings?.showPrices !== false;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <BackButton sx={{ mb: 2 }} />

      <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={4}>
        {/* Product Image Section */}
        <Box sx={{ flex: 1, position: "relative" }}>
          <Card sx={{ borderRadius: 2, overflow: "hidden", boxShadow: 3 }}>
            <CardMedia
              component="img"
              height={isMobile ? 300 : 500}
              image={product.imageUrl || "https://via.placeholder.com/500"}
              alt={product.name}
              sx={{ objectFit: "contain", backgroundColor: "#f5f5f5" }}
            />
          </Card>
          <Box sx={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 1 }}>
            {showPrices && product.discountPrice && (
              <Chip
                label={`-${Math.round(((Number(product.price) - Number(product.discountPrice)) / Number(product.price)) * 100)}%`}
                color="error"
                size="small"
                sx={{ fontWeight: "bold" }}
              />
            )}
            {product.isNew && (
              <Chip
                label="Novo"
                color="success"
                size="small"
                sx={{ fontWeight: "bold" }}
              />
            )}
          </Box>
          <Box sx={{ position: "absolute", bottom: 16, right: 16, display: "flex", gap: 1 }}>
            <Tooltip title={favorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
              <IconButton
                onClick={toggleFavorite}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.8)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
                }}
              >
                {favorite ? <Favorite color="error" /> : <FavoriteBorder />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Compartilhar">
              <IconButton
                onClick={handleOpenShareMenu}
                sx={{
                  backgroundColor: "rgba(255,255,255,0.8)",
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.9)" },
                }}
              >
                <ShareIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Product Details Section */}
        <Box sx={{ flex: 1 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Company Info */}
            {storeInfo?.company && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 2,
                  p: 1.5,
                  backgroundColor: "#f9f9f9",
                  borderRadius: 1,
                }}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                  badgeContent={
                    storeInfo.company.verified ? (
                      <VerifiedIcon color="primary" fontSize="small" />
                    ) : null
                  }
                >
                  <Avatar
                    src={storeInfo.company.logo}
                    alt={storeInfo.company.nome}
                    sx={{
                      width: 40,
                      height: 40,
                      mr: 2,
                      border: `1px solid ${theme.palette.divider}`,
                    }}
                  />
                </Badge>
                <Link to={`/perfil/${storeInfo.company.id}`} style={{ textDecoration: "none", cursor: "pointer" }}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold" color="primary">
                      {storeInfo.company.nome}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {storeInfo.company.provincia}
                    </Typography>
                  </Box>
                </Link>
                <Button
                  component={Link}
                  to={`/loja/${store}`}
                  variant="outlined"
                  size="small"
                  startIcon={<StoreIcon />}
                  sx={{ ml: "auto" }}
                >
                  Ver Loja
                </Button>
              </Box>
            )}
            <Typography variant={isMobile ? "h5" : "h4"} gutterBottom fontWeight="bold">
              {product.name}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
              <Chip
                icon={<CategoryIcon />}
                label={`Categoria: ${product.category || "Sem categoria"}`}
                size="small"
              />
              {product.sku && (
                <Chip icon={<InventoryIcon />} label={`SKU: ${product.sku}`} size="small" />
              )}
              <Chip
                label={productType === "product" ? "Produto" : "Serviço"}
                size="small"
                color="primary"
                variant="outlined"
              />
              {productType === "product" && product.qtd !== null && product.qtd !== undefined && (
                <Chip icon={<InventoryIcon />} label={`Estoque: ${product.qtd}`} size="small" />
              )}
              {productType === "product" && product.nationalShipping && (
                <Tooltip
                  title={`Peso: ${Number(product.weight) || 0}kg | Dimensões: ${Number(product.height) || 0}x${Number(product.width) || 0}x${Number(product.length) || 0}cm`}
                >
                  <Chip
                    icon={<LocalShippingIcon />}
                    label="Envio Nacional"
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                </Tooltip>
              )}
            </Stack>
            <Typography variant="body1" color="text.secondary" paragraph>
              {product.description || "Nenhuma descrição fornecida."}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ mb: 3 }}>
              {showPrices ? (
                product.discountPrice ? (
                  <>
                    <Typography variant={isMobile ? "h5" : "h4"} color="error" fontWeight="bold">
                      {formatPrice(Number(product.discountPrice))} MT
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ textDecoration: "line-through", color: "text.secondary" }}
                    >
                      {formatPrice(Number(product.price))} MT
                    </Typography>
                  </>
                ) : (
                  <Typography variant={isMobile ? "h5" : "h4"} color="primary" fontWeight="bold">
                    {formatPrice(Number(product.price) || 0)} MT
                  </Typography>
                )
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <VisibilityOffIcon color="disabled" />
                  <Typography variant="h6" color="text.secondary">
                    Preço sob consulta
                  </Typography>
                </Box>
              )}
            </Box>
            {showPrices && productType === "product" && (
              <>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    Quantidade:
                  </Typography>
                  <TextField
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (
                        value === "" ||
                        (Number(value) >= 1 && Number(value) <= Number(product.qtd || Infinity))
                      ) {
                        setQuantity(value);
                      }
                    }}
                    onBlur={(e) => {
                      let val = parseInt(e.target.value);
                      if (isNaN(val) || val < 1) val = 1;
                      if (product.qtd !== null && product.qtd !== undefined && val > Number(product.qtd)) val = Number(product.qtd);
                      setQuantity(val);
                    }}
                    inputProps={{
                      min: 1,
                      max: Number(product.qtd) || Infinity,
                      "aria-label": `Quantidade (disponível: ${product.qtd || "Ilimitado"})`,
                    }}
                    size="small"
                    sx={{ width: "100px", mr: 2 }}
                    error={product.qtd !== null && product.qtd !== undefined && quantity > Number(product.qtd)}
                    helperText={
                      product.qtd === null || product.qtd === undefined
                        ? ""
                        : Number(product.qtd) === 0
                        ? "Sem stock disponível"
                        : quantity > Number(product.qtd)
                        ? `Quantidade máxima: ${product.qtd}`
                        : ""
                    }
                    disabled={product.qtd !== null && product.qtd !== undefined && Number(product.qtd) === 0}
                  />
                </Box>
                <Box
                  sx={{
                    backgroundColor: "#f5f5f5",
                    p: 2,
                    borderRadius: 1,
                    mb: 3,
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Resumo do Pedido
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Subtotal ({quantity} itens):</Typography>
                      <Typography variant="body2">{formatPrice(subtotal)} MT</Typography>
                    </Box>
                    {productType === "product" && product.nationalShipping && (
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2">Frete:</Typography>
                        <Typography variant="body2">{formatPrice(shippingCost)} MT</Typography>
                      </Box>
                    )}
                    <Divider />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1" fontWeight="bold">Total:</Typography>
                      <Typography variant="body1" fontWeight="bold" color="primary">
                        {formatPrice(totalWithIva)} MT
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </>
            )}
            <Box sx={{ display: "flex", gap: 2 }}>
              {showPrices && productType === "product" ? (
                <>
                  {user?.id !== storeInfo?.company?.id && (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<ShoppingCartIcon />}
                        onClick={addToCart}
                        sx={{ flex: 1 }}
                        disabled={product.qtd !== null && product.qtd !== undefined && Number(product.qtd) === 0}
                      >
                        Adicionar ao Carrinho
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<PaymentIcon />}
                        onClick={handlePayment}
                        sx={{ flex: 1 }}
                        disabled={product.qtd !== null && product.qtd !== undefined && Number(product.qtd) === 0}
                      >
                        Pagar Agora
                      </Button>
                    </>
                  )}
                </>
              ) : (
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<StoreIcon />}
                  onClick={() => navigate(`/loja/${store}`)}
                  sx={{ flex: 1 }}
                >
                  Contactar Loja
                </Button>
              )}
            </Box>
          </CardContent>
        </Box>
      </Box>

      <Menu
        anchorEl={shareAnchorEl}
        open={Boolean(shareAnchorEl)}
        onClose={handleCloseShareMenu}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        <MenuItem onClick={() => shareOnPlatform("whatsapp")}>
          <ListItemIcon>
            <img
              src="https://cdn-icons-png.flaticon.com/512/124/124034.png"
              alt="WhatsApp"
              width={24}
              height={24}
            />
          </ListItemIcon>
          <ListItemText>WhatsApp</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => shareOnPlatform("facebook")}>
          <ListItemIcon>
            <img
              src="https://cdn-icons-png.flaticon.com/512/124/124010.png"
              alt="Facebook"
              width={24}
              height={24}
            />
          </ListItemIcon>
          <ListItemText>Facebook</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => shareOnPlatform("twitter")}>
          <ListItemIcon>
            <img
              src="https://cdn-icons-png.flaticon.com/512/124/124021.png"
              alt="Twitter"
              width={24}
              height={24}
            />
          </ListItemIcon>
          <ListItemText>Twitter</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => shareOnPlatform("copy")}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copiar link</ListItemText>
        </MenuItem>
      </Menu>

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

export default ProductDetailsDesk;
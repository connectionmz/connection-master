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
} from "@mui/icons-material";
import { ref as storageRef, getDownloadURL, uploadBytes, deleteObject } from "firebase/storage";
import { NumericFormat } from "react-number-format";
import { formatPrice } from "../../utils/utils";
import BackButton from "../BackButton";

const ProductPage = ({ user }) => {
  const { id, loja } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [feedback, setFeedback] = useState({ open: false, message: "", severity: "success" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const productRef = ref(db, `stores/${loja}/products/${id}`);
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
          navigate(`/dashboard/${loja}/produtos`);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        setFeedback({ open: true, message: "Erro ao carregar produto.", severity: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id, loja, navigate]);

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

  const validateFormData = () => {
    let newErrors = {};
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors["name"] = "Nome é obrigatório";
      isValid = false;
    }

    const priceValue = parseFloat(formData.price.replace(",", "."));
    if (!formData.price || isNaN(priceValue) || priceValue <= 0) {
      newErrors["price"] = "Preço deve ser um número maior que zero";
      isValid = false;
    }

    if (formData.type === "product") {
      const qtdValue = parseFloat(formData.qtd);
      if (!formData.qtd || isNaN(qtdValue) || qtdValue <= 0) {
        newErrors["qtd"] = "Quantidade deve ser um número maior que zero";
        isValid = false;
      }
      if (formData.nationalShipping) {
        const weightValue = parseFloat(formData.weight);
        if (!formData.weight || isNaN(weightValue) || weightValue <= 0) {
          newErrors["weight"] = "Peso deve ser um número maior que zero";
          isValid = false;
        }
        const heightValue = parseFloat(formData.height);
        if (!formData.height || isNaN(heightValue) || heightValue <= 0) {
          newErrors["height"] = "Altura deve ser um número maior que zero";
          isValid = false;
        }
        const widthValue = parseFloat(formData.width);
        if (!formData.width || isNaN(widthValue) || widthValue <= 0) {
          newErrors["width"] = "Largura deve ser um número maior que zero";
          isValid = false;
        }
        const lengthValue = parseFloat(formData.length);
        if (!formData.length || isNaN(lengthValue) || lengthValue <= 0) {
          newErrors["length"] = "Comprimento deve ser um número maior que zero";
          isValid = false;
        }
      }
    }

    setErrors(newErrors);
    if (!isValid) {
      setFeedback({ open: true, message: "Por favor, corrija os erros nos campos obrigatórios.", severity: "error" });
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
        const imageRef = storageRef(storage, `products/${loja}/${id}/${imageFile.name}`);
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

      const priceValue = parseFloat(formData.price.replace(",", "."));
      const productToUpdate = {
        type: formData.type,
        name: formData.name.trim(),
        price: priceValue,
        category: formData.category.trim(),
        description: formData.description.trim(),
        imageUrl: imageUrl,
        sku: formData.sku.trim(),
        qtd: formData.type === "product" ? parseFloat(formData.qtd) : null,
        weight: formData.type === "product" && formData.nationalShipping ? parseFloat(formData.weight) : null,
        height: formData.type === "product" && formData.nationalShipping ? parseFloat(formData.height) : null,
        width: formData.type === "product" && formData.nationalShipping ? parseFloat(formData.width) : null,
        length: formData.type === "product" && formData.nationalShipping ? parseFloat(formData.length) : null,
        nationalShipping: formData.type === "product" ? formData.nationalShipping : false,
        updatedAt: Date.now(),
      };

      await update(ref(db, `stores/${loja}/products/${id}`), productToUpdate);
      setProduct(productToUpdate);
      setFeedback({ open: true, message: "Produto atualizado com sucesso!", severity: "success" });
      handleEditClose();
    } catch (error) {
      console.error("Erro ao atualizar produto:", error);
      setFeedback({ open: true, message: "Erro ao atualizar o produto.", severity: "error" });
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

      await remove(ref(db, `stores/${loja}/products/${id}`));
      setFeedback({ open: true, message: "Produto removido com sucesso!", severity: "success" });
      navigate(`/dashboard/${loja}/produtos`);
    } catch (error) {
      console.error("Erro ao remover produto:", error);
      setFeedback({ open: true, message: "Erro ao remover o produto.", severity: "error" });
    }
    handleDeleteClose();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!product) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <BackButton sx={{ mb: 2 }} />
        <Typography variant="h6" color="error">
          Produto não encontrado
        </Typography>
        <Button
          variant="contained"
          sx={{ mt: 2 }}
          onClick={() => navigate(`/dashboard/${loja}/produtos`)}
        >
          Voltar para lista de produtos
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <BackButton sx={{ mb: 2 }} />

      {/* Cabeçalho com ações */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          {product.name}
        </Typography>
        <Box>
          <IconButton color="primary" onClick={handleEditOpen} aria-label="Editar produto">
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={handleDeleteOpen} aria-label="Remover produto">
            <DeleteIcon />
          </IconButton>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Coluna da esquerda - Imagem e informações básicas */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardMedia
              component="img"
              height="300"
              image={product.imageUrl || theme.palette.grey[100]}
              alt={product.name}
              sx={{ objectFit: "contain", backgroundColor: theme.palette.grey[100] }}
            />
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {formatPrice(product.price)}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
                <Chip
                  icon={<CategoryIcon />}
                  label={`Categoria: ${product.category || "Sem categoria"}`}
                />
                {product.sku && <Chip icon={<InventoryIcon />} label={`SKU: ${product.sku}`} />}
                <Chip
                  icon={<LocalShippingIcon />}
                  label={`Tipo: ${product.type === "product" ? "Produto" : "Serviço"}`}
                />
                {product.type === "product" && (
                  <Chip icon={<InventoryIcon />} label={`Estoque: ${product.qtd || "0"}`} />
                )}
                {product.type === "product" && product.nationalShipping && (
                  <>
                    <Chip icon={<ScaleIcon />} label={`Peso: ${product.weight} kg`} />
                    <Chip
                      icon={<StraightenIcon />}
                      label={`Dimensões: ${product.height}x${product.width}x${product.length} cm`}
                    />
                  </>
                )}
              </Stack>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary">
                Criado em: {new Date(product.createdAt).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Atualizado em: {new Date(product.updatedAt).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>

          {/* Estatísticas rápidas */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: "flex", alignItems: "center" }}>
              <BarChartIcon sx={{ mr: 1 }} /> Métricas
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2">Visualizações</Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <VisibilityIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body1" sx={{ flexGrow: 1 }}>
                    {product.views || 0}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, product.views || 0)}
                    sx={{ width: "100px", height: "8px", borderRadius: 1 }}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="body2">Adições ao carrinho</Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <ShoppingCartIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body1" sx={{ flexGrow: 1 }}>
                    {product.cartAdds || 0}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, (product.cartAdds || 0) * 10)}
                    sx={{ width: "100px", height: "8px", borderRadius: 1 }}
                  />
                </Box>
              </Box>
              <Box>
                <Typography variant="body2">Cliques</Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <MouseIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body1" sx={{ flexGrow: 1 }}>
                    {product.clicks || 0}
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, product.clicks || 0)}
                    sx={{ width: "100px", height: "8px", borderRadius: 1 }}
                  />
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Coluna da direita - Conteúdo principal */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              sx={{ borderBottom: 1, borderColor: "divider" }}
            >
              <Tab label="Visão Geral" />
              <Tab label="Desempenho" />
            </Tabs>
            <Box sx={{ p: 3 }}>
              {tabValue === 0 && (
                <>
                  <Typography variant="h6" gutterBottom>
                    Descrição do Produto
                  </Typography>
                  <Typography paragraph>
                    {product.description || "Nenhuma descrição fornecida."}
                  </Typography>
                  <Divider sx={{ my: 3 }} />
                  <Typography variant="h6" gutterBottom>
                    Informações de Entrega
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <LocalShippingIcon color="action" sx={{ mr: 1 }} />
                    <Typography>
                      {product.type === "product" && product.nationalShipping
                        ? "Disponível para envio nacional"
                        : product.type === "product"
                        ? "Envio local apenas"
                        : "Serviço (sem envio)"}
                    </Typography>
                  </Box>
                </>
              )}
              {tabValue === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Análise de Desempenho
                  </Typography>
                  <Typography paragraph>
                    Gráficos e análises detalhadas do desempenho do produto virão aqui.
                  </Typography>
                  <Box
                    sx={{
                      height: "300px",
                      bgcolor: theme.palette.grey[100],
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography color="text.secondary">
                      Visualização de desempenho será exibida aqui
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Paper>

          {/* Ações rápidas */}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={() => {
                  /* Lógica de compartilhamento */
                }}
              >
                Compartilhar Produto
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Modal de Edição */}
      <Dialog
        open={openEditDialog}
        onClose={handleEditClose}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: "primary.main",
            color: "white",
          }}
        >
          <Typography variant="h6">Editar Produto</Typography>
          <IconButton onClick={handleEditClose} sx={{ color: "white" }} disabled={saving}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            {/* Seção de Upload de Imagem */}
            <Grid item xs={12} md={4}>
              <Typography variant="subtitle1" gutterBottom>
                Imagem do Produto
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                  mb: 3,
                }}
              >
                {formData.imageUrl && (
                  <Box
                    sx={{
                      width: "100%",
                      height: isMobile ? 150 : 200,
                      position: "relative",
                      border: "1px dashed",
                      borderColor: "divider",
                      borderRadius: 1,
                      overflow: "hidden",
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
                        backgroundColor: "rgba(0,0,0,0.5)",
                        color: "white",
                        "&:hover": {
                          backgroundColor: "rgba(0,0,0,0.7)",
                        },
                      }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
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
                    >
                      {formData.imageUrl ? "Alterar Imagem" : "Adicionar Imagem"}
                    </Button>
                  </label>
                  {formData.imageUrl && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleRemoveImage}
                      fullWidth
                      startIcon={<DeleteIcon />}
                      disabled={saving}
                    >
                      Remover Imagem
                    </Button>
                  )}
                </Box>
              </Box>
            </Grid>
            {/* Campos do Produto */}
            <Grid item xs={12} md={8}>
              <FormControl fullWidth sx={{ mb: 2 }} error={!!errors["type"]}>
                <InputLabel>Tipo *</InputLabel>
                <Select
                  value={formData.type}
                  label="Tipo"
                  onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                  disabled={saving}
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
                sx={{ mb: 2, minWidth: isMobile ? "100%" : 330 }}
                error={!!errors["name"]}
                helperText={errors["name"] || "Ex: Camiseta Branca ou Consultoria de Marketing"}
                size={isMobile ? "small" : "medium"}
                required
                disabled={saving}
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
                sx={{ mb: 2, minWidth: isMobile ? "100%" : 280 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">MZN</InputAdornment>,
                }}
                error={!!errors["price"]}
                helperText={errors["price"] || "Ex: 1234,56"}
                size={isMobile ? "small" : "medium"}
                required
                disabled={saving}
              />
              <TextField
                label="Categoria"
                value={formData.category}
                onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                fullWidth
                sx={{ mb: 2, minWidth: isMobile ? "100%" : 280 }}
                helperText="Ex: Roupas, Eletrônicos, Serviços"
                size={isMobile ? "small" : "medium"}
                disabled={saving}
              />
              <TextField
                label="Descrição"
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                multiline
                rows={isMobile ? 3 : 4}
                fullWidth
                sx={{ mb: 2, minWidth: isMobile ? "100%" : 330 }}
                helperText="Detalhes atrativos para o cliente"
                size={isMobile ? "small" : "medium"}
                disabled={saving}
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
                    sx={{ mb: 2, minWidth: isMobile ? "100%" : 280 }}
                    error={!!errors["qtd"]}
                    helperText={errors["qtd"] || "Estoque disponível"}
                    size={isMobile ? "small" : "medium"}
                    required
                    disabled={saving}
                  />
                  <TextField
                    label="SKU"
                    value={formData.sku}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                    fullWidth
                    sx={{ mb: 2, minWidth: isMobile ? "100%" : 280 }}
                    helperText="Código interno (ex: CAM-BRANCO-M)"
                    size={isMobile ? "small" : "medium"}
                    disabled={saving}
                  />
                  <Divider sx={{ my: 2 }} />
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 2, display: "flex", alignItems: "center", color: "primary.main" }}
                  >
                    <LocalShippingIcon sx={{ mr: 1 }} /> Frete Nacional
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.nationalShipping}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, nationalShipping: e.target.checked }))
                        }
                        color="primary"
                        disabled={saving}
                      />
                    }
                    label="Habilitar frete para todo Moçambique"
                    sx={{ mb: 2 }}
                  />
                  {formData.nationalShipping && (
                    <>
                      <NumericFormat
                        value={formData.weight}
                        allowNegative={false}
                        decimalScale={2}
                        fixedDecimalScale
                        onValueChange={(values) => setFormData((prev) => ({ ...prev, weight: values.value }))}
                        customInput={TextField}
                        fullWidth
                        label="Peso (kg) *"
                        sx={{ mb: 2, minWidth: isMobile ? "100%" : 280 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <ScaleIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                        error={!!errors["weight"]}
                        helperText={errors["weight"] || "Ex: 0,50 para roupas leves"}
                        size={isMobile ? "small" : "medium"}
                        required
                        disabled={saving}
                      />
                      <NumericFormat
                        value={formData.height}
                        allowNegative={false}
                        decimalScale={2}
                        fixedDecimalScale
                        onValueChange={(values) => setFormData((prev) => ({ ...prev, height: values.value }))}
                        customInput={TextField}
                        fullWidth
                        label="Altura (cm) *"
                        sx={{ mb: 2, minWidth: isMobile ? "100%" : 280 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <StraightenIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                        error={!!errors["height"]}
                        helperText={errors["height"] || "Ex: 30,00"}
                        size={isMobile ? "small" : "medium"}
                        required
                        disabled={saving}
                      />
                      <NumericFormat
                        value={formData.width}
                        allowNegative={false}
                        decimalScale={2}
                        fixedDecimalScale
                        onValueChange={(values) => setFormData((prev) => ({ ...prev, width: values.value }))}
                        customInput={TextField}
                        fullWidth
                        label="Largura (cm) *"
                        sx={{ mb: 2, minWidth: isMobile ? "100%" : 280 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <StraightenIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                        error={!!errors["width"]}
                        helperText={errors["width"] || "Ex: 20,00"}
                        size={isMobile ? "small" : "medium"}
                        required
                        disabled={saving}
                      />
                      <NumericFormat
                        value={formData.length}
                        allowNegative={false}
                        decimalScale={2}
                        fixedDecimalScale
                        onValueChange={(values) => setFormData((prev) => ({ ...prev, length: values.value }))}
                        customInput={TextField}
                        fullWidth
                        label="Comprimento (cm) *"
                        sx={{ mb: 2, minWidth: isMobile ? "100%" : 280 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <StraightenIcon fontSize="small" />
                            </InputAdornment>
                          ),
                        }}
                        error={!!errors["length"]}
                        helperText={errors["length"] || "Ex: 5,00"}
                        size={isMobile ? "small" : "medium"}
                        required
                        disabled={saving}
                      />
                    </>
                  )}
                </>
              ) : (
                <TextField
                  label="SKU"
                  value={formData.sku}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sku: e.target.value }))}
                  fullWidth
                  sx={{ mb: 2, minWidth: isMobile ? "100%" : 280 }}
                  helperText="Código opcional para serviços"
                  size={isMobile ? "small" : "medium"}
                  disabled={saving}
                />
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="outlined"
            onClick={handleEditClose}
            disabled={saving}
            size={isMobile ? "small" : "medium"}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateProduct}
            disabled={Object.keys(errors).length > 0 || saving}
            size={isMobile ? "small" : "medium"}
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
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>Tem certeza que deseja remover este produto?</Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDeleteClose}
            variant="outlined"
            size={isMobile ? "small" : "medium"}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDeleteProduct}
            variant="contained"
            color="error"
            size={isMobile ? "small" : "medium"}
          >
            Remover
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de feedback */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: isMobile ? "bottom" : "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
          severity={feedback.severity}
          sx={{ width: "100%" }}
          variant="filled"
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProductPage;
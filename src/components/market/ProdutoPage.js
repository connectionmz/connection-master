import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ref, get, update } from "firebase/database";
import { db } from "../../fb";
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
  LinearProgress,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress
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
  Inventory as InventoryIcon
} from "@mui/icons-material";
import { formatPrice } from "../../utils/utils";
import BackButton from "../BackButton";

const ProductPage = ({ user }) => {
  const { id, loja } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [formData, setFormData] = useState({});
  const theme = useTheme();

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        const productRef = ref(db, `stores/${loja}/products/${id}`);
        const snapshot = await get(productRef);
        
        if (snapshot.exists()) {
          const productData = snapshot.val();
          setProduct(productData);
          setFormData({
            name: productData.name || '',
            price: productData.price || 0,
            description: productData.description || '',
            category: productData.category || '',
            sku: productData.sku || ''
          });
        } else {
          navigate(`/dashboard/${loja}/produtos`);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductData();
  }, [id, loja, navigate]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
        <Button variant="contained" sx={{ mt: 2 }} onClick={() => navigate(`/dashboard/${loja}/produtos`)}>
          Voltar para lista de produtos
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
                <BackButton sx={{ mb: 2 }} />

      {/* Cabeçalho com ações */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {product.name}
        </Typography>

      </Box>

      <Grid container spacing={3}>
        {/* Coluna da esquerda - Imagem e estatísticas básicas */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 3 }}>
            <CardMedia
              component="img"
              height="300"
              image={product.imageUrl}
              alt={product.name}
              sx={{ objectFit: 'contain', backgroundColor: theme.palette.grey[100] }}
            />
            <CardContent>
              <Typography variant="h5" gutterBottom>
                {formatPrice(product.price)}
              </Typography>
              
              <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                <Chip icon={<CategoryIcon />} label={`Categoria: ${product.category}`} />
                {product.sku && <Chip icon={<InventoryIcon />} label={`SKU: ${product.sku}`} />}
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
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <BarChartIcon sx={{ mr: 1 }} /> Métricas
            </Typography>
            
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2">Visualizações</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <VisibilityIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body1" sx={{ flexGrow: 1 }}>
                    {product.views}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, product.views)} 
                    sx={{ width: '100px', height: '8px', borderRadius: 1 }}
                  />
                </Box>
              </Box>
              
              <Box>
                <Typography variant="body2">Adições ao carrinho</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ShoppingCartIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body1" sx={{ flexGrow: 1 }}>
                    {product.cartAdds}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, product.cartAdds * 10)} 
                    sx={{ width: '100px', height: '8px', borderRadius: 1 }}
                  />
                </Box>
              </Box>
              
              <Box>
                <Typography variant="body2">Cliques</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MouseIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="body1" sx={{ flexGrow: 1 }}>
                    {product.clicks}
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(100, product.clicks)} 
                    sx={{ width: '100px', height: '8px', borderRadius: 1 }}
                  />
                </Box>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Coluna da direita - Conteúdo principal */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocalShippingIcon color="action" sx={{ mr: 1 }} />
                    <Typography>
                      Status: Disponível para envio
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
                  {/* Espaço reservado para gráficos */}
                  <Box sx={{ height: '300px', bgcolor: theme.palette.grey[100], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">
                      Visualização de desempenho será exibida aqui
                    </Typography>
                  </Box>
                </Box>
              )}
              
              {tabValue === 2 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Configurações Avançadas
                  </Typography>
                  <Typography paragraph>
                    Opções avançadas de gerenciamento do produto.
                  </Typography>
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
                onClick={() => {/* Lógica de compartilhamento */}}
              >
                Compartilhar Produto
              </Button>
            </Grid>
            
          </Grid>
        </Grid>
      </Grid>

      
    </Container>
  );
};

export default ProductPage;
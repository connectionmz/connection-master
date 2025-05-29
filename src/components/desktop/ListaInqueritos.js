import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  InputAdornment,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Avatar,
  Tooltip,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Grid,
  Card,
  CardContent,
  CardActions,
  Divider,
  Button
} from '@mui/material';
import {
  Search,
  FilterList,
  Visibility,
  Delete
} from '@mui/icons-material';
import { ref, get, remove } from 'firebase/database';
import { db } from '../../fb';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BackButton from '../BackButton';

const ListaInqueritos = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const [inqueritos, setInqueritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('Todos');
  const [page, setPage] = useState(1);
  const [hasRespondedIds, setHasRespondedIds] = useState(new Set());
  const itemsPerPage = isMobile ? 5 : 10;
  const navigate = useNavigate();

  const fetchInqueritos = useCallback(async () => {
    try {
      const surveysRef = ref(db, "surveys");
      const snapshot = await get(surveysRef);
      
      if (snapshot.exists()) {
        const surveysData = snapshot.val();
        const formattedSurveys = Object.entries(surveysData).map(([key, value]) => ({
          id: key,
          ...value
        }));
        setInqueritos(formattedSurveys);
      }
    } catch (err) {
      console.error("Erro ao carregar inquéritos:", err);
    }
  }, []);

  const fetchRespondedSurveys = useCallback(async () => {
    if (!user?.id || !user?.provincia || !user?.sector) return;

    try {
      const responsesRef = ref(db, "survey_responses");
      const responsesSnapshot = await get(responsesRef);

      if (responsesSnapshot.exists()) {
        const responsesData = responsesSnapshot.val();
        const respondedIds = new Set();

        Object.entries(responsesData).forEach(([surveyId, usersResponses]) => {
          if (usersResponses?.[user.id]) {
            respondedIds.add(surveyId);
          }
        });

        setHasRespondedIds(respondedIds);
      }
    } catch (err) {
      console.error("Erro ao carregar respostas:", err);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchInqueritos(), fetchRespondedSurveys()]);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [fetchInqueritos, fetchRespondedSurveys]);

  const inqueritosFiltrados = useMemo(() => {
    return inqueritos.filter(inquerito => {
      if (inquerito.company?.id === user?.id) {
        return false;
      }
      
      const isForUserProvince = !inquerito.provincias?.length || 
                              inquerito.provincias.includes(user?.provincia);
      
      const isForUserSector = !inquerito.sectores?.length || 
                            inquerito.sectores.includes(user?.sector);
      
      const notResponded = !hasRespondedIds.has(inquerito.id);
      
      return isForUserProvince && isForUserSector && notResponded && user;
    });
  }, [inqueritos, user, hasRespondedIds]);

  const filteredInqueritos = inqueritosFiltrados.filter(inquerito => {
    const matchesSearch = 
      inquerito.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquerito.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquerito.company?.nome?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = 
      filterTipo === 'Todos' || 
      inquerito.tipoInquerito === filterTipo;

    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredInqueritos.length / itemsPerPage);
  const paginatedInqueritos = filteredInqueritos.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const tiposInquerito = [
    'Todos',
    ...new Set(inqueritos.map(i => i.tipoInquerito).filter(Boolean))
  ];

  const handleOpenDetails = (inquerito) => {
    navigate(`/inquerito/${inquerito.id}`);
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este inquérito?')) {
      const inqueritoRef = ref(db, `inqueritos/${id}`);
      remove(inqueritoRef)
        .then(() => {
          console.log('Inquérito excluído com sucesso');
        })
        .catch(error => {
          console.error('Erro ao excluir inquérito:', error);
        });
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  // Render para dispositivos móveis
  const renderMobileView = () => (
    <Grid container spacing={2}>
      {paginatedInqueritos.map((inquerito) => (
        <Grid item xs={12} key={inquerito.id}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {inquerito.title || 'Sem título'}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Avatar 
                  src={inquerito.company?.logo} 
                  alt={inquerito.company?.nome}
                  sx={{ width: 32, height: 32, mr: 1 }}
                />
                <Typography variant="body2">
                  {inquerito.company?.nome || 'N/A'}
                </Typography>
              </Box>
              
              <Chip 
                label={inquerito.tipoInquerito || 'Outro'} 
                size="small" 
                color="primary"
                sx={{ mb: 1 }}
              />
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Províncias:</strong> {inquerito.provincias?.join(', ') || 'Todas'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>Setores:</strong> {inquerito.sectores?.join(', ') || 'Todos'}
              </Typography>
              
              <Typography variant="caption" color="text.secondary">
                Criado em: {formatDate(inquerito.createdAt)}
              </Typography>
            </CardContent>
            
            <Divider />
            
            <CardActions sx={{ justifyContent: 'space-between', px: 2 }}>
              <Button 
                size="small" 
                startIcon={<Visibility />}
                onClick={() => handleOpenDetails(inquerito)}
              >
                Visualizar
              </Button>
              
              {user?.id === inquerito.company?.id && (
                <Button 
                  size="small" 
                  startIcon={<Delete />}
                  color="error"
                  onClick={() => handleDelete(inquerito.id)}
                >
                  Excluir
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  // Render para desktop
  const renderDesktopView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Título</TableCell>
            <TableCell>Empresa</TableCell>
            {!isTablet && <TableCell>Tipo</TableCell>}
            {!isTablet && <TableCell>Províncias</TableCell>}
            {!isTablet && <TableCell>Setores</TableCell>}
            <TableCell>Criado em</TableCell>
            <TableCell>Ações</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedInqueritos.map((inquerito) => (
            <TableRow key={inquerito.id} hover>
              <TableCell>
                <Typography fontWeight="medium">
                  {inquerito.title || 'Sem título'}
                </Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <a href={`/perfil/${inquerito.company.id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
                    <Avatar 
                      src={inquerito.company?.logo} 
                      alt={inquerito.company?.nome}
                      sx={{ width: 32, height: 32 }}
                    />
                    {!isTablet && <Typography>{inquerito.company?.nome || 'N/A'}</Typography>}
                  </a>
                </Box>
              </TableCell>
              {!isTablet && (
                <TableCell>
                  <Chip 
                    label={inquerito.tipoInquerito || 'Outro'} 
                    size="small" 
                    color="primary"
                  />
                </TableCell>
              )}
              {!isTablet && (
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {inquerito.provincias?.slice(0, 2).map((p, i) => (
                      <Chip 
                        key={i} 
                        label={p} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                    {inquerito.provincias?.length > 2 && (
                      <Tooltip title={inquerito.provincias.slice(2).join(', ')}>
                        <Chip 
                          label={`+${inquerito.provincias.length - 2}`} 
                          size="small"
                        />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              )}
              {!isTablet && (
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {inquerito.sectores?.slice(0, 2).map((s, i) => (
                      <Chip 
                        key={i} 
                        label={s} 
                        size="small" 
                        variant="outlined"
                      />
                    ))}
                    {inquerito.sectores?.length > 2 && (
                      <Tooltip title={inquerito.sectores.slice(2).join(', ')}>
                        <Chip 
                          label={`+${inquerito.sectores.length - 2}`} 
                          size="small"
                        />
                      </Tooltip>
                    )}
                  </Box>
                </TableCell>
              )}
              <TableCell>
                {formatDate(inquerito.createdAt)}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Visualizar">
                    <IconButton 
                      color="primary"
                      onClick={() => handleOpenDetails(inquerito)}
                    >
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  {user?.id === inquerito.company?.id && (
                    <Tooltip title="Excluir">
                      <IconButton 
                        color="error"
                        onClick={() => handleDelete(inquerito.id)}
                      >
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <BackButton sx={{ mb: 2 }} />
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        Inquéritos Disponíveis
      </Typography>
      
      {/* Barra de busca e filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={8} md={9}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Pesquisar inquéritos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Inquérito</InputLabel>
              <Select
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
                label="Tipo de Inquérito"
                startAdornment={
                  <InputAdornment position="start">
                    <FilterList />
                  </InputAdornment>
                }
              >
                {tiposInquerito.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {tipo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabela de resultados */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : filteredInqueritos.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6">Nenhum inquérito disponível</Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            {searchTerm || filterTipo !== 'Todos' 
              ? 'Tente ajustar seus critérios de busca' 
              : 'Não há inquéritos disponíveis para seu perfil ou você já respondeu a todos'}
          </Typography>
        </Paper>
      ) : (
        <>
          {isMobile ? renderMobileView() : renderDesktopView()}

          {/* Paginação */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ListaInqueritos;
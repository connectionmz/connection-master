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
  CircularProgress
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
  const [inqueritos, setInqueritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('Todos');
  const [page, setPage] = useState(1);
  const [hasRespondedIds, setHasRespondedIds] = useState(new Set());
  const itemsPerPage = 10;
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

  // Filtrar inquéritos com useMemo
  const inqueritosFiltrados = useMemo(() => {
    return inqueritos.filter(inquerito => {
      // Verificar se o inquérito é para a província do usuário
      const isForUserProvince = !inquerito.provincias?.length || 
                              inquerito.provincias.includes(user?.provincia);
      
      // Verificar se o inquérito é para o setor do usuário
      const isForUserSector = !inquerito.sectores?.length || 
                            inquerito.sectores.includes(user?.sector);
      
      // Verificar se o usuário já respondeu
      const notResponded = !hasRespondedIds.has(inquerito.id);
      
      // Verificar se o inquérito não foi criado pelo próprio usuário
      const notOwnInquerito = inquerito.company?.id !== user?.id;
      
      return isForUserProvince && isForUserSector && notResponded && notOwnInquerito && user;
    });
  }, [inqueritos, user, hasRespondedIds]);

  // Aplicar filtros adicionais (pesquisa e tipo)
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

  // Paginação
  const totalPages = Math.ceil(filteredInqueritos.length / itemsPerPage);
  const paginatedInqueritos = filteredInqueritos.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  // Tipos de inquérito únicos para filtro
  const tiposInquerito = [
    'Todos',
    ...new Set(inqueritos.map(i => i.tipoInquerito).filter(Boolean))
  ];

  // Abrir página de detalhes
  const handleOpenDetails = (inquerito) => {
    navigate(`/inquerito/${inquerito.id}`);
  };

  // Excluir inquérito
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

  // Formatar data
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return format(new Date(timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  return (
    <Box sx={{ p: 3 }}>
      <BackButton sx={{ mb: 2 }} />
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Inquéritos Disponíveis
      </Typography>
      
      {/* Barra de busca e filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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
            sx={{ flex: '1 1 300px' }}
          />

          <FormControl sx={{ minWidth: 200 }}>
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
        </Box>
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
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Empresa</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Províncias</TableCell>
                  <TableCell>Setores</TableCell>
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
                        <Avatar 
                          src={inquerito.company?.logo} 
                          alt={inquerito.company?.nome}
                          sx={{ width: 32, height: 32 }}
                        />
                        <Typography>{inquerito.company?.nome || 'N/A'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={inquerito.tipoInquerito || 'Outro'} 
                        size="small" 
                        color="primary"
                      />
                    </TableCell>
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

          {/* Paginação */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ListaInqueritos;
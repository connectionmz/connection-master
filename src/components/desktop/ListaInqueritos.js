import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Avatar,
  Tooltip,
  CircularProgress,
  Grid
} from '@mui/material';
import {
  Search,
  FilterList,
  Visibility,
  Delete,
  Close,
  CheckCircle,
  Pending,
  ArrowForward
} from '@mui/icons-material';
import { ref, onValue, remove } from 'firebase/database';
import { db } from '../../fb';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ListaInqueritos = ({ user }) => {
  const [inqueritos, setInqueritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('Todos');
  const [selectedInquerito, setSelectedInquerito] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  // Buscar todos os inquéritos
  useEffect(() => {
    const inqueritosRef = ref(db, 'surveys');
    setLoading(true);

    onValue(inqueritosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const inqueritosArray = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }));
        setInqueritos(inqueritosArray);
      } else {
        setInqueritos([]);
      }
      setLoading(false);
    });

    return () => {
      // Limpar listener quando o componente desmontar
      onValue(inqueritosRef, () => {});
    };
  }, []);

  // Filtrar e pesquisar inquéritos
  const filteredInqueritos = inqueritos.filter(inquerito => {
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

  // Abrir modal de detalhes
  const handleOpenDetails = (inquerito) => {
    setSelectedInquerito(inquerito);
    setOpenDialog(true);
  };

  // Fechar modal
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInquerito(null);
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
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Inquéritos Cadastrados
      </Typography>

      {/* Barra de busca e filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
          <Typography variant="h6">Nenhum inquérito encontrado</Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>
            {searchTerm || filterTipo !== 'Todos' 
              ? 'Tente ajustar seus critérios de busca' 
              : 'Nenhum inquérito foi cadastrado ainda'}
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
                  <TableRow key={inquerito.id}>
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
                        {inquerito.provincia?.slice(0, 2).map((p, i) => (
                          <Chip 
                            key={i} 
                            label={p.provincia} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                        {inquerito.provincia?.length > 2 && (
                          <Tooltip 
                            title={inquerito.provincia
                              .slice(2)
                              .map(p => p.provincia)
                              .join(', ')}
                          >
                            <Chip 
                              label={`+${inquerito.provincia.length - 2}`} 
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
                            label={s.setor} 
                            size="small" 
                            variant="outlined"
                          />
                        ))}
                        {inquerito.sectores?.length > 2 && (
                          <Tooltip 
                            title={inquerito.sectores
                              .slice(2)
                              .map(s => s.setor)
                              .join(', ')}
                          >
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
                        <Tooltip title="Excluir">
                          <IconButton 
                            color="error"
                            onClick={() => handleDelete(inquerito.id)}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
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

      {/* Modal de detalhes */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Detalhes do Inquérito
            </Typography>
            <IconButton onClick={handleCloseDialog}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedInquerito && (
            <Box sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar 
                  src={selectedInquerito.company?.logo} 
                  alt={selectedInquerito.company?.nome}
                  sx={{ width: 64, height: 64, mr: 2 }}
                />
                <Box>
                  <Typography variant="h5" gutterBottom>
                    {selectedInquerito.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Criado por: {selectedInquerito.company?.nome || 'N/A'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(selectedInquerito.createdAt)}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Descrição
              </Typography>
              <Typography paragraph>
                {selectedInquerito.description || 'Nenhuma descrição fornecida.'}
              </Typography>

              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Províncias
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedInquerito.provincia?.map((p, i) => (
                      <Chip 
                        key={i} 
                        label={p.provincia} 
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Setores
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedInquerito.sectores?.map((s, i) => (
                      <Chip 
                        key={i} 
                        label={s.setor} 
                        color="secondary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Perguntas ({selectedInquerito.questions?.length || 0})
                  </Typography>
                  {selectedInquerito.questions?.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {selectedInquerito.questions.map((q, i) => (
                        <Paper key={i} sx={{ p: 2 }}>
                          <Typography fontWeight="medium">
                            {i + 1}. {q.texto}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Tipo: {q.tipo}
                          </Typography>
                          {q.opcoes?.length > 0 && (
                            <>
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                Opções:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                {q.opcoes.map((op, j) => (
                                  <Chip key={j} label={op} size="small" />
                                ))}
                              </Box>
                            </>
                          )}
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Typography>Nenhuma pergunta cadastrada</Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<ArrowForward />}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ListaInqueritos;
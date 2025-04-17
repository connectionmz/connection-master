import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Typography,
  Paper,
  Chip,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  useMediaQuery,
  Grid,
  useTheme,
  Avatar,
  TablePagination,
  Skeleton
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Edit, 
  Visibility, 
  Delete, 
  Close,
  FilterList
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import PropTypes from 'prop-types';

const StatusChip = React.memo(({ status }) => {
  const theme = useTheme();
  
  const statusConfig = {
    Ativa: { color: 'success', label: 'Ativa' },
    Pausada: { color: 'warning', label: 'Pausada' },
    Encerrada: { color: 'error', label: 'Encerrada' },
    default: { color: 'default', label: status }
  };

  const { color, label } = statusConfig[status] || statusConfig.default;

  return (
    <Chip 
      label={label} 
      size="small" 
      color={color}
      sx={{ 
        color: theme.palette[color]?.contrastText || 'inherit',
        fontWeight: 500,
        minWidth: 80,
        justifyContent: 'center'
      }}
    />
  );
});

StatusChip.propTypes = {
  status: PropTypes.string.isRequired
};

const VagaDetailsDialog = React.memo(({ vaga, open, onClose, onEdit }) => {
  const theme = useTheme();

  const handleEdit = useCallback(() => {
    onClose();
    onEdit();
  }, [onClose, onEdit]);

  const formatDate = useCallback((dateString) => {
    if (!dateString) return 'Não especificada';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
  }, []);

  if (!vaga) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
      aria-labelledby="vaga-details-title"
    >
      <DialogTitle sx={{ pb: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box display="flex" alignItems="flex-start" gap={2} flexGrow={1}>
            <Avatar 
              src={vaga.logoEmpresa} 
              alt={vaga.empresa}
              sx={{ width: 56, height: 56 }}
            />
            <Box flexGrow={1}>
              <Typography variant="h6" id="vaga-details-title" noWrap>
                {vaga.titulo}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {vaga.empresa || 'Empresa não especificada'}
              </Typography>
              <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                <StatusChip status={vaga.status} />
                {vaga.provincia && (
                  <Chip 
                    label={vaga.provincia} 
                    size="small" 
                    variant="outlined" 
                  />
                )}
                {vaga.tipoContrato && (
                  <Chip 
                    label={vaga.tipoContrato} 
                    size="small" 
                    color="secondary" 
                  />
                )}
              </Box>
            </Box>
          </Box>
          <IconButton 
            onClick={onClose} 
            aria-label="fechar detalhes da vaga"
            sx={{ 
              color: theme.palette.text.secondary,
              alignSelf: 'flex-start'
            }}
          >
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="subtitle1" gutterBottom fontWeight="600">
              Descrição da Vaga
            </Typography>
            <Box 
              sx={{ 
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 1, 
                p: 2,
                minHeight: 100,
                backgroundColor: theme.palette.background.paper
              }}
            >
              {vaga.descricao ? (
                <ReactQuill
                  value={vaga.descricao}
                  readOnly={true}
                  theme="bubble"
                  modules={{ toolbar: false }}
                />
              ) : (
                <Typography color="text.secondary" fontStyle="italic">
                  Nenhuma descrição fornecida
                </Typography>
              )}
            </Box>
            
            {vaga.requisitos && (
              <>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }} fontWeight="600">
                  Requisitos
                </Typography>
                <Box 
                  sx={{ 
                    border: '1px solid', 
                    borderColor: 'divider',
                    borderRadius: 1, 
                    p: 2,
                    backgroundColor: theme.palette.background.paper
                  }}
                >
                  <ReactQuill
                    value={vaga.requisitos}
                    readOnly={true}
                    theme="bubble"
                    modules={{ toolbar: false }}
                  />
                </Box>
              </>
            )}

            {vaga.beneficios && (
              <>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }} fontWeight="600">
                  Benefícios
                </Typography>
                <Box 
                  sx={{ 
                    border: '1px solid', 
                    borderColor: 'divider',
                    borderRadius: 1, 
                    p: 2,
                    backgroundColor: theme.palette.background.paper
                  }}
                >
                  <ReactQuill
                    value={vaga.beneficios}
                    readOnly={true}
                    theme="bubble"
                    modules={{ toolbar: false }}
                  />
                </Box>
              </>
            )}
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom fontWeight="600">
              Detalhes
            </Typography>
            
            <DetailItem 
              label="Data de Publicação" 
              value={formatDate(vaga.dataPublicacao)} 
            />
            
            <DetailItem 
              label="Áreas de Atuação" 
              value={vaga.areas?.length > 0 ? (
                <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
                  {vaga.areas.map((area, index) => (
                    <Chip key={index} label={area} size="small" />
                  ))}
                </Box>
              ) : 'Não especificadas'}
            />
            
            {vaga.subAreas?.length > 0 && (
              <DetailItem 
                label="Subáreas" 
                value={
                  <Box display="flex" flexWrap="wrap" gap={1} mt={0.5}>
                    {vaga.subAreas.map((subArea, index) => (
                      <Chip key={index} label={subArea} size="small" color="info" />
                    ))}
                  </Box>
                }
              />
            )}
            
            <DetailItem 
              label="Salário" 
              value={vaga.salario || 'A combinar'} 
            />
            
            <DetailItem 
              label="Experiência Necessária" 
              value={vaga.experiencia || 'Não especificado'} 
            />
            
            {vaga.dataLimite && (
              <DetailItem 
                label="Data Limite" 
                value={formatDate(vaga.dataLimite)} 
              />
            )}
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button 
          variant="outlined" 
          onClick={onClose}
          sx={{ mr: 2 }}
          aria-label="fechar"
        >
          Fechar
        </Button>
        <Button 
          variant="contained" 
          onClick={handleEdit}
          aria-label="editar vaga"
        >
          Editar Vaga
        </Button>
      </DialogActions>
    </Dialog>
  );
});

VagaDetailsDialog.propTypes = {
  vaga: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
};

const DetailItem = ({ label, value }) => (
  <Box sx={{ mb: 3 }}>
    <Typography variant="subtitle2" component="p" fontWeight="500">
      {label}
    </Typography>
    {typeof value === 'string' ? (
      <Typography variant="body2" color="text.secondary">
        {value}
      </Typography>
    ) : value}
  </Box>
);

DetailItem.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired
};

const VagasPublicadas = ({ 
  vagas, 
  loading, 
  searchTerm, 
  setSearchTerm, 
  onDeleteVaga,
  
}) => {
  const navigate = useNavigate();
  const [selectedVaga, setSelectedVaga] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const isMobile = useMediaQuery('(max-width:600px)');
  const theme = useTheme();

  const filteredVagas = useMemo(() => {
    if (!searchTerm) return vagas;
  
    const term = searchTerm.toLowerCase();
    return vagas.filter(vaga =>
      (vaga.titulo?.toLowerCase().includes(term)) ||
      (vaga.descricao?.toLowerCase().includes(term)) ||
      (vaga.empresa?.toLowerCase().includes(term)) ||
      (vaga.areas?.some(area => area?.toLowerCase().includes(term))) ||
      (vaga.subAreas?.some(subArea => subArea?.toLowerCase().includes(term)))
    );
  }, [vagas, searchTerm]);

  const paginatedVagas = useMemo(() => {
    return filteredVagas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredVagas, page, rowsPerPage]);

  const handleViewDetails = useCallback((vaga) => {
    setSelectedVaga(vaga);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
    setSelectedVaga(null);
  }, []);

  const handleDelete = useCallback(async (vagaId) => {
    try {
      if (window.confirm('Tem certeza que deseja excluir esta vaga permanentemente?')) {
        await onDeleteVaga(vagaId);
      }
    } catch (error) {
      console.error('Erro ao excluir vaga:', error);
    }
  }, [onDeleteVaga]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = useCallback((vagaId) => {
    navigate(`/vagas/editar/${vagaId}`);
  }, [navigate]);

  return (
    <Card sx={{ p: { xs: 2, md: 3 }, boxShadow: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight="bold" component="h2">
          Minhas Vagas Publicadas
          <Typography variant="body2" color="text.secondary" component="span" sx={{ ml: 1 }}>
            ({vagas.length} {vagas.length === 1 ? 'vaga' : 'vagas'})
          </Typography>
        </Typography>
        
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            placeholder="Buscar vagas..."
            size="small"
            InputProps={{ 
              startAdornment: <SearchIcon color="action" />,
              'aria-label': 'buscar vagas'
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: isMobile ? '100%' : 300 }}
          />
        </Box>
      </Box>

      {loading && !vagas.length ? (
        <Box>
          {[...Array(5)].map((_, index) => (
            <Skeleton 
              key={index} 
              variant="rectangular" 
              height={72} 
              sx={{ mb: 1, borderRadius: 1 }} 
            />
          ))}
        </Box>
      ) : filteredVagas.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            {searchTerm ? 'Nenhuma vaga encontrada para sua busca' : 'Você ainda não publicou nenhuma vaga'}
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} elevation={0} sx={{ mb: 2 }}>
            <Table aria-label="tabela de vagas publicadas">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: '600' }}>Título</TableCell>
                  {!isMobile && (
                    <>
                      <TableCell sx={{ fontWeight: '600' }}>Empresa</TableCell>
                      <TableCell sx={{ fontWeight: '600' }}>Áreas</TableCell>
                      <TableCell sx={{ fontWeight: '600' }}>Status</TableCell>
                    </>
                  )}
                  <TableCell align="right" sx={{ fontWeight: '600' }}>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedVagas.map(vaga => (
                  <TableRow key={vaga.id} hover>
                    <TableCell component="th" scope="row">
                      <Typography fontWeight="500" noWrap sx={{ maxWidth: 200 }}>
                        {vaga.titulo}
                      </Typography>
                      {isMobile && (
                        <Box sx={{ mt: 1 }} display="flex" flexWrap="wrap" gap={1}>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {vaga.empresa}
                          </Typography>
                          <Box display="flex" flexWrap="wrap" gap={1}>
                            {vaga.areas?.slice(0, 2).map((area, index) => (
                              <Chip key={index} label={area} size="small" />
                            ))}
                          </Box>
                          <StatusChip status={vaga.status} />
                        </Box>
                      )}
                    </TableCell>
                    
                    {!isMobile && (
                      <>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {vaga.empresa || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" flexWrap="wrap" gap={1}>
                            {vaga.areas?.slice(0, 3).map((area, index) => (
                              <Chip key={index} label={area} size="small" />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={vaga.status} />
                        </TableCell>
                      </>
                    )}
                    
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        <Tooltip title="Visualizar detalhes">
                          <IconButton 
                            onClick={() => handleViewDetails(vaga)}
                            aria-label={`visualizar ${vaga.titulo}`}
                            size="small"
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar vaga">
                          <IconButton 
                            onClick={() => handleEdit(vaga.id)}
                            aria-label={`editar ${vaga.titulo}`}
                            size="small"
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir vaga">
                          <IconButton 
                            onClick={() => handleDelete(vaga.id)}
                            aria-label={`excluir ${vaga.titulo}`}
                            size="small"
                          >
                            <Delete fontSize="small" color="error" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredVagas.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Vagas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />

          <VagaDetailsDialog
            vaga={selectedVaga}
            open={dialogOpen}
            onClose={handleCloseDialog}
            onEdit={() => handleEdit(selectedVaga?.id)}
          />
        </>
      )}
    </Card>
  );
};

VagasPublicadas.propTypes = {
  vagas: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  searchTerm: PropTypes.string.isRequired,
  setSearchTerm: PropTypes.func.isRequired,
  onDeleteVaga: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired
};

export default React.memo(VagasPublicadas);
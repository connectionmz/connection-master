import React, { useState, useMemo } from 'react';
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
  Badge,
  Card,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  useMediaQuery,
  Grid,
  useTheme
} from '@mui/material';
import { 
  Search as SearchIcon, 
  People, 
  Edit, 
  Visibility, 
  Delete, 
  Close 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import PropTypes from 'prop-types';

const StatusChip = ({ status }) => {
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
        fontWeight: 500 
      }}
    />
  );
};

StatusChip.propTypes = {
  status: PropTypes.string.isRequired
};

const VagaDetailsDialog = ({ vaga, open, onClose, onEdit }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  if (!vaga) return null;

  const handleEdit = () => {
    onClose();
    navigate(`/vagas/${vaga.id}`);
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
      aria-labelledby="vaga-details-title"
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" id="vaga-details-title">
            {vaga.titulo}
          </Typography>
          <IconButton 
            onClick={onClose} 
            aria-label="fechar detalhes da vaga"
            sx={{ color: theme.palette.text.secondary }}
          >
            <Close />
          </IconButton>
        </Box>
        <Box display="flex" gap={1} mt={1} flexWrap="wrap">
          <Chip label={vaga.tipo} color="secondary" size="small" />
          <StatusChip status={vaga.status} />
          <Chip 
            label={vaga.localizacao} 
            size="small" 
            variant="outlined" 
          />
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="subtitle1" gutterBottom component="h3">
              Descrição da Vaga
            </Typography>
            <Box 
              sx={{ 
                border: '1px solid #eee', 
                borderRadius: 1, 
                p: 2,
                minHeight: 200,
                backgroundColor: theme.palette.background.paper
              }}
            >
              <ReactQuill
                value={vaga.descricao}
                readOnly={true}
                theme="bubble"
                modules={{ toolbar: false }}
              />
            </Box>
            
            {vaga.requisitos && (
              <>
                <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }} component="h3">
                  Requisitos
                </Typography>
                <Box 
                  sx={{ 
                    border: '1px solid #eee', 
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
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom component="h3">
              Detalhes
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" component="p">
                Data de Publicação
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date(vaga.dataPublicacao).toLocaleDateString()}
              </Typography>
              
              {vaga.dataAtualizacao && (
                <>
                  <Typography variant="subtitle2" component="p" sx={{ mt: 1 }}>
                    Última Atualização
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(vaga.dataAtualizacao).toLocaleDateString()}
                  </Typography>
                </>
              )}
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" component="p">
                Área de Atuação
              </Typography>
              <Typography>{vaga.areaAtuacao || 'Não especificada'}</Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" component="p">
                Área de Formação
              </Typography>
              <Typography>{vaga.areaFormacao || 'Não especificada'}</Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" component="p">
                Salário
              </Typography>
              <Typography>{vaga.salario || 'A combinar'}</Typography>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" component="p">
                Candidatos
              </Typography>
              <Typography>
                {vaga.candidatos?.length || 0} candidatos inscritos
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ p: 3 }}>
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
};

VagaDetailsDialog.propTypes = {
  vaga: PropTypes.object,
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired
};

const VagasPublicadas = ({ vagas, loading, searchTerm, setSearchTerm, onDeleteVaga }) => {
  const navigate = useNavigate();
  const [selectedVaga, setSelectedVaga] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');
  const theme = useTheme();

  const filteredVagas = useMemo(() => {
    if (!searchTerm) return vagas;
    
    const term = searchTerm.toLowerCase();
    return vagas.filter(vaga =>
      vaga.titulo.toLowerCase().includes(term) ||
      vaga.descricao.toLowerCase().includes(term) ||
      (vaga.areaAtuacao?.toLowerCase().includes(term)) ||
      (vaga.areaFormacao?.toLowerCase().includes(term))
    );
  }, [vagas, searchTerm]);

  const handleViewDetails = (vaga) => {
    setSelectedVaga(vaga);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedVaga(null);
  };

  const handleDelete = async (vagaId) => {
    try {
      if (window.confirm('Tem certeza que deseja excluir esta vaga?')) {
        await onDeleteVaga(vagaId);
      }
    } catch (error) {
      console.error('Error deleting vaga:', error);
    }
  };

  return (
    <Card sx={{ p: 3, boxShadow: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }} component="h2">
          Minhas Vagas Publicadas ({vagas.length})
        </Typography>
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

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress aria-label="carregando vagas" />
        </Box>
      ) : filteredVagas.length === 0 ? (
        <Typography sx={{ p: 2, textAlign: 'center' }} component="p">
          Nenhuma vaga encontrada
        </Typography>
      ) : (
        <>
          <TableContainer component={Paper} elevation={0}>
            <Table aria-label="tabela de vagas publicadas">
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  {!isMobile && (
                    <>
                      <TableCell>Área</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Status</TableCell>
                    </>
                  )}
                  <TableCell>Candidatos</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVagas.map(vaga => (
                  <TableRow key={vaga.id} hover>
                    <TableCell component="th" scope="row">
                      <Typography fontWeight="500">{vaga.titulo}</Typography>
                      {isMobile && (
                        <Box sx={{ mt: 1 }} display="flex" flexWrap="wrap" gap={1}>
                          {vaga.areaAtuacao && (
                            <Chip 
                              label={vaga.areaAtuacao} 
                              size="small" 
                              sx={{ mr: 1 }} 
                            />
                          )}
                          {vaga.areaFormacao && (
                            <Chip 
                              label={vaga.areaFormacao} 
                              size="small" 
                              color="info" 
                            />
                          )}
                          <Chip 
                            label={vaga.tipo} 
                            size="small" 
                            color="secondary" 
                          />
                          <StatusChip status={vaga.status} />
                        </Box>
                      )}
                    </TableCell>
                    
                    {!isMobile && (
                      <>
                        <TableCell>
                          <Box display="flex" flexWrap="wrap" gap={1}>
                            {vaga.areaAtuacao && (
                              <Chip label={vaga.areaAtuacao} size="small" />
                            )}
                            {vaga.areaFormacao && (
                              <Chip label={vaga.areaFormacao} size="small" color="info" />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={vaga.tipo} size="small" color="secondary" />
                        </TableCell>
                        <TableCell>
                          <StatusChip status={vaga.status} />
                        </TableCell>
                      </>
                    )}
                    
                    <TableCell>
                      <Badge 
                        badgeContent={vaga.candidatos?.length || 0} 
                        color="primary"
                        overlap="rectangular"
                        aria-label={`${vaga.candidatos?.length || 0} candidatos`}
                      >
                        <People color="action" />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Visualizar">
                          <IconButton 
                            onClick={() => handleViewDetails(vaga)}
                            aria-label={`visualizar ${vaga.titulo}`}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton 
                            onClick={() => navigate(`/vagas/${vaga.id}`)}
                            aria-label={`editar ${vaga.titulo}`}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton 
                            onClick={() => handleDelete(vaga.id)}
                            aria-label={`excluir ${vaga.titulo}`}
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

          <VagaDetailsDialog
            vaga={selectedVaga}
            open={dialogOpen}
            onClose={handleCloseDialog}
            onEdit={() => navigate(`/vagas/${selectedVaga?.id}`)}
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
  onDeleteVaga: PropTypes.func.isRequired
};

export default VagasPublicadas;
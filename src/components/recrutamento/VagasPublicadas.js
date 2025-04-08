import React, { useState } from 'react';
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
  Grid
} from '@mui/material';
import { Search, People, Edit, Visibility, Delete, Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const VagasPublicadas = ({ vagas, loading, searchTerm, setSearchTerm, onDeleteVaga }) => {
  const navigate = useNavigate();
  const [selectedVaga, setSelectedVaga] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');

  const filteredVagas = vagas.filter(vaga =>
    vaga.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vaga.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vaga.areaAtuacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vaga.areaFormacao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = (vaga) => {
    setSelectedVaga(vaga);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedVaga(null);
  };

  const handleDelete = (vagaId) => {
    if (window.confirm('Tem certeza que deseja excluir esta vaga?')) {
      onDeleteVaga(vagaId);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case 'Ativa': return 'success';
      case 'Pausada': return 'warning';
      case 'Encerrada': return 'error';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ p: 3, boxShadow: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Minhas Vagas Publicadas ({vagas.length})
        </Typography>
        <TextField
          placeholder="Buscar vagas..."
          size="small"
          InputProps={{ startAdornment: <Search /> }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ width: isMobile ? '100%' : 300 }}
        />
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : filteredVagas.length === 0 ? (
        <Typography sx={{ p: 2, textAlign: 'center' }}>
          Nenhuma vaga encontrada
        </Typography>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
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
                    <TableCell>
                      <Typography fontWeight="500">{vaga.titulo}</Typography>
                      {isMobile && (
                        <Box sx={{ mt: 1 }}>
                          <Chip 
                            label={vaga.areaAtuacao || vaga.areaFormacao} 
                            size="small" 
                            sx={{ mr: 1 }} 
                          />
                          <Chip 
                            label={vaga.tipo} 
                            size="small" 
                            color="secondary" 
                            sx={{ mr: 1 }} 
                          />
                          <Chip 
                            label={vaga.status} 
                            size="small" 
                            color={statusColor(vaga.status)} 
                          />
                        </Box>
                      )}
                    </TableCell>
                    
                    {!isMobile && (
                      <>
                        <TableCell>
                          <Box>
                            {vaga.areaAtuacao && (
                              <Chip label={vaga.areaAtuacao} size="small" sx={{ mr: 1 }} />
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
                          <Chip label={vaga.status} size="small" color={statusColor(vaga.status)} />
                        </TableCell>
                      </>
                    )}
                    
                    <TableCell>
                      <Badge 
                        badgeContent={vaga.candidatos?.length || 0} 
                        color="primary"
                        overlap="rectangular"
                      >
                        <People />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Visualizar">
                          <IconButton onClick={() => handleViewDetails(vaga)}>
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Editar">
                          <IconButton onClick={() => navigate(`/vagas/${vaga.id}`)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Excluir">
                          <IconButton onClick={() => handleDelete(vaga.id)}>
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

          {/* Dialog de Detalhes da Vaga */}
          <Dialog 
            open={dialogOpen} 
            onClose={handleCloseDialog}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            {selectedVaga && (
              <>
                <DialogTitle>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{selectedVaga.titulo}</Typography>
                    <IconButton onClick={handleCloseDialog}>
                      <Close />
                    </IconButton>
                  </Box>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip label={selectedVaga.tipo} color="secondary" size="small" />
                    <Chip 
                      label={selectedVaga.status} 
                      color={statusColor(selectedVaga.status)} 
                      size="small" 
                    />
                    <Chip 
                      label={selectedVaga.localizacao} 
                      size="small" 
                      variant="outlined" 
                    />
                  </Box>
                </DialogTitle>
                
                <DialogContent dividers>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={8}>
                      <Typography variant="subtitle1" gutterBottom>
                        Descrição da Vaga
                      </Typography>
                      <Box 
                        sx={{ 
                          border: '1px solid #eee', 
                          borderRadius: 1, 
                          p: 2,
                          minHeight: 200 
                        }}
                      >
                        <ReactQuill
                          value={selectedVaga.descricao}
                          readOnly={true}
                          theme="bubble"
                          modules={{ toolbar: false }}
                        />
                      </Box>
                      
                      {selectedVaga.requisitos && (
                        <>
                          <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
                            Requisitos
                          </Typography>
                          <Box 
                            sx={{ 
                              border: '1px solid #eee', 
                              borderRadius: 1, 
                              p: 2 
                            }}
                          >
                            <ReactQuill
                              value={selectedVaga.requisitos}
                              readOnly={true}
                              theme="bubble"
                              modules={{ toolbar: false }}
                            />
                          </Box>
                        </>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle1" gutterBottom>
                        Detalhes
                      </Typography>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          Publicada em: {new Date(selectedVaga.dataPublicacao).toLocaleDateString()}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Atualizada em: {selectedVaga.dataAtualizacao ? 
                            new Date(selectedVaga.dataAtualizacao).toLocaleDateString() : 
                            'Não atualizada'}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2">Área de Atuação</Typography>
                        <Typography>{selectedVaga.areaAtuacao || 'Não especificada'}</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2">Área de Formação</Typography>
                        <Typography>{selectedVaga.areaFormacao || 'Não especificada'}</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2">Salário</Typography>
                        <Typography>{selectedVaga.salario || 'A combinar'}</Typography>
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2">Candidatos</Typography>
                        <Typography>
                          {selectedVaga.candidatos?.length || 0} candidatos inscritos
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </DialogContent>
                
                <DialogActions sx={{ p: 3 }}>
                  <Button 
                    variant="outlined" 
                    onClick={handleCloseDialog}
                    sx={{ mr: 2 }}
                  >
                    Fechar
                  </Button>
                  <Button 
                    variant="contained" 
                    onClick={() => {
                      handleCloseDialog();
                      navigate(`/vagas/${selectedVaga.id}`);
                    }}
                  >
                    Editar Vaga
                  </Button>
                </DialogActions>
              </>
            )}
          </Dialog>
        </>
      )}
    </Card>
  );
};

export default VagasPublicadas;
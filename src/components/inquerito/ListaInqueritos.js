import React from 'react';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Paper,
  Chip,
  Divider,
  Alert,
  IconButton
} from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';

const InqueritosListDesk = ({ 
  inqueritos, 
  loading, 
  searchTerm, 
  setSearchTerm, 
  selectedSector, 
  setSelectedSector, 
  sectores, 
  responsesCount, 
  handleDelete, 
  startEdit, 
  visualizarRespostas,
  canEditSurvey
}) => {
  const filteredInqueritos = inqueritos.filter((inq) => {
    const matchesSearch = inq.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector ? inq.sector === selectedSector : true;
    return matchesSearch && matchesSector;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', md: 'row' } }}>
        <TextField
          label="Pesquisar inquéritos..."
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flex: 2 }}
        />
        <FormControl fullWidth sx={{ flex: 1 }}>
          <InputLabel>Filtrar por setor</InputLabel>
          <Select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            label="Filtrar por setor"
          >
            <MenuItem value="">Todos os setores</MenuItem>
            {sectores.map((s) => (
              <MenuItem key={s.setor} value={s.setor}>
                {s.setor}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress size={60} />
        </Box>
      ) : filteredInqueritos.length === 0 ? (
        <Alert severity="info" sx={{ my: 2 }}>
          Nenhum inquérito encontrado com os critérios selecionados.
        </Alert>
      ) : (
        <List sx={{ width: '100%' }}>
          {filteredInqueritos.map((inq) => (
            <Paper key={inq.id} elevation={2} sx={{ mb: 2, borderRadius: 2 }}>
              <ListItem sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    {inq.title}
                  </Typography>
                  <Chip 
                    label={inq.sector} 
                    color="primary" 
                    size="small" 
                    sx={{ ml: 1 }} 
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {inq.description}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip
                      label={`${responsesCount[inq.id] || 0} respostas`}
                      variant="outlined"
                      size="small"
                      color={responsesCount[inq.id] ? 'primary' : 'default'}
                    />
                    <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                      Criado em: {new Date(inq.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton
                      onClick={() => startEdit(inq.id, inq)}
                      color="primary"
                      disabled={!canEditSurvey(inq.id)}
                      title={!canEditSurvey(inq.id) ? "Não é possível editar inquéritos com respostas" : "Editar"}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDelete(inq.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                    <IconButton
                      onClick={() => visualizarRespostas(inq.id)}
                      color="secondary"
                    >
                      <Visibility />
                    </IconButton>
                  </Box>
                </Box>
              </ListItem>
            </Paper>
          ))}
        </List>
      )}
    </Box>
  );
};

export default InqueritosListDesk;
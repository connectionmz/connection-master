import React from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { ArrowBack, Check, Close } from '@mui/icons-material';

const EditInqueritoDesk = ({ 
  editData, 
  setEditData, 
  sectores, 
  saveEdit, 
  setAbaAtiva 
}) => {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => setAbaAtiva('inqueritos')} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Editar Inquérito
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, maxWidth: 800, mx: 'auto' }}>
        <TextField
          label="Título do Inquérito"
          variant="outlined"
          fullWidth
          value={editData.title}
          onChange={(e) => setEditData({ ...editData, title: e.target.value })}
        />
        <TextField
          label="Descrição"
          variant="outlined"
          multiline
          rows={4}
          fullWidth
          value={editData.description}
          onChange={(e) => setEditData({ ...editData, description: e.target.value })}
        />
        <FormControl fullWidth>
          <InputLabel>Setor de Atividade</InputLabel>
          <Select
            value={editData.sector}
            onChange={(e) => setEditData({ ...editData, sector: e.target.value })}
            label="Setor de Atividade"
          >
            {sectores.map((s) => (
              <MenuItem key={s.setor} value={s.setor}>
                {s.setor}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
          <Button
            onClick={() => setAbaAtiva('inqueritos')}
            variant="outlined"
            color="inherit"
            startIcon={<Close />}
          >
            Cancelar
          </Button>
          <Button
            onClick={saveEdit}
            variant="contained"
            color="primary"
            startIcon={<Check />}
          >
            Salvar Alterações
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default EditInqueritoDesk;
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  IconButton
} from '@mui/material';
import { ArrowBack, Check, Close } from '@mui/icons-material';

const CriarInquerito = ({ user, sectores, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sector: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Lógica para criar o inquérito no Firebase
    // onSuccess() após sucesso
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={onCancel} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          Criar Novo Inquérito
        </Typography>
      </Box>
      
      <Paper elevation={0} sx={{ p: 3, mb: 3 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Preencha os campos abaixo para criar um novo inquérito.
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Título do Inquérito"
              name="title"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              required
            />
            
            <TextField
              label="Descrição"
              name="description"
              value={formData.description}
              onChange={handleChange}
              multiline
              rows={4}
              fullWidth
              required
            />
            
            <FormControl fullWidth required>
              <InputLabel>Setor de Atividade</InputLabel>
              <Select
                name="sector"
                value={formData.sector}
                onChange={handleChange}
                label="Setor de Atividade"
              >
                {sectores.map((s) => (
                  <MenuItem key={s.setor} value={s.setor}>
                    {s.setor}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
              <Button
                onClick={onCancel}
                variant="outlined"
                color="inherit"
                startIcon={<Close />}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<Check />}
              >
                Criar Inquérito
              </Button>
            </Box>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default CriarInquerito;
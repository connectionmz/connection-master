import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  TextField, 
  Chip,
  Autocomplete,
  Checkbox,
  ListItemText,
  OutlinedInput
} from '@mui/material';
import DatePicker from 'react-datepicker';

const PublicarVaga = ({ 
  user, 
  areasFormacao, 
  areasAtuacao, 
  onPublicarVaga, 
  loading 
}) => {
  const [open, setOpen] = useState(false);
  const [vagaData, setVagaData] = useState({
    titulo: '',
    descricao: '',
    areas: [],
    provincia: '',
    dataLimite: null,
    requisitos: '',
    beneficios: '',
    tipoContrato: '',
    experiencia: '',
    salario: '',
    subAreas: []
  });
  const [selectedArea, setSelectedArea] = useState('');
  const [availableSubAreas, setAvailableSubAreas] = useState([]);

  // Atualiza as subáreas disponíveis quando a área principal é selecionada
  useEffect(() => {
    if (selectedArea && areasAtuacao[selectedArea]) {
      setAvailableSubAreas(areasAtuacao[selectedArea]);
      // Limpa as subáreas selecionadas quando muda a área principal
      setVagaData(prev => ({ ...prev, subAreas: [] }));
    } else {
      setAvailableSubAreas([]);
    }
  }, [selectedArea, areasAtuacao]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    // Reset form when closing
    setVagaData({
      titulo: '',
      descricao: '',
      areas: [],
      provincia: '',
      dataLimite: null,
      requisitos: '',
      beneficios: '',
      tipoContrato: '',
      experiencia: '',
      salario: '',
      subAreas: []
    });
    setSelectedArea('');
  };

  const handleSubmit = () => {
   

    // Combine áreas principais e subáreas selecionadas
    const areasCompletas = [
      ...vagaData.areas,
      ...vagaData.subAreas
    ];

    onPublicarVaga({
      ...vagaData,
      areas: areasCompletas,
      dataLimite: vagaData.dataLimite ? vagaData.dataLimite.toISOString() : null
    });
    handleClose();
  };

  const handleChange = (field, value) => {
    setVagaData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleOpen}
        sx={{ mb: 3 }}
      >
        Publicar Nova Vaga
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>Publicar Nova Vaga</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            <TextField
              label="Título da Vaga *"
              value={vagaData.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              fullWidth
            />

            <TextField
              label="Descrição *"
              value={vagaData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              multiline
              rows={4}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Área Principal *</InputLabel>
              <Select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                label="Área Principal"
              >
                {Object.keys(areasAtuacao || {}).map((area) => (
                  <MenuItem key={area} value={area}>
                    {area}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedArea && (
              <FormControl fullWidth>
                <InputLabel>Subáreas (opcional)</InputLabel>
                <Select
                  multiple
                  value={vagaData.subAreas}
                  onChange={(e) => handleChange('subAreas', e.target.value)}
                  input={<OutlinedInput label="Subáreas (opcional)" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  {availableSubAreas.map((subArea) => (
                    <MenuItem key={subArea} value={subArea}>
                      <Checkbox checked={vagaData.subAreas.indexOf(subArea) > -1} />
                      <ListItemText primary={subArea} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Autocomplete
              multiple
              options={Object.keys(areasAtuacao || {})}
              value={vagaData.areas}
              onChange={(_, newValue) => handleChange('areas', newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Outras Áreas Relacionadas (opcional)"
                  placeholder="Selecione áreas adicionais"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
            />

            <TextField
              label="Província *"
              value={vagaData.provincia}
              onChange={(e) => handleChange('provincia', e.target.value)}
              fullWidth
            />

            <DatePicker
              label="Data Limite (opcional)"
              value={vagaData.dataLimite}
              onChange={(newValue) => handleChange('dataLimite', newValue)}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />

            <TextField
              label="Requisitos"
              value={vagaData.requisitos}
              onChange={(e) => handleChange('requisitos', e.target.value)}
              multiline
              rows={3}
              fullWidth
            />

            <TextField
              label="Benefícios"
              value={vagaData.beneficios}
              onChange={(e) => handleChange('beneficios', e.target.value)}
              multiline
              rows={3}
              fullWidth
            />

            <TextField
              label="Tipo de Contrato"
              value={vagaData.tipoContrato}
              onChange={(e) => handleChange('tipoContrato', e.target.value)}
              fullWidth
            />

            <TextField
              label="Experiência Necessária"
              value={vagaData.experiencia}
              onChange={(e) => handleChange('experiencia', e.target.value)}
              fullWidth
            />

            <TextField
              label="Salário (opcional)"
              value={vagaData.salario}
              onChange={(e) => handleChange('salario', e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
          >
            {loading ? 'Publicando...' : 'Publicar Vaga'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PublicarVaga;
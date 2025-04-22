import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Chip,
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Grid,
  Autocomplete
} from '@mui/material';
import { Work } from '@mui/icons-material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const PublicarVaga = ({ 
  user, 
  loading, 
  onPublicarVaga, 
  areasFormacao, 
  areasAtuacao 
}) => {
  const [open, setOpen] = useState(false);
  const [vagaData, setVagaData] = useState({
    titulo: '',
    descricao: '',
    areas: [],
    areasFormacao: [],
    provincia: '',
    distrito: '',
    tipo: 'Tempo Integral',
    dataLimite: null,
    tipoContrato: '',
    salario: '',
    subAreas: []
  });

  const [selectedArea, setSelectedArea] = useState('');
  const [availableSubAreas, setAvailableSubAreas] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);

  // Quill editor modules
  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'direction': 'rtl' }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],
      ['link', 'image']
    ],
  };

  // Buscar dados iniciais
  useEffect(() => {
    const buscarProvincias = async () => {
      const provinciasMock = [
        { id: '1', nome: 'Maputo' },
        { id: '2', nome: 'Gaza' },
        { id: '3', nome: 'Inhambane' },
        { id: '4', nome: 'Sofala' },
        { id: '5', nome: 'Manica' },
        { id: '6', nome: 'Tete' },
        { id: '7', nome: 'Zambézia' },
        { id: '8', nome: 'Nampula' },
        { id: '9', nome: 'Cabo Delgado' },
        { id: '10', nome: 'Niassa' }
      ];
      setProvincias(provinciasMock);
    };

    buscarProvincias();
  }, []);

  // Buscar distritos quando a provínia é selecionada
  useEffect(() => {
    if (vagaData.provincia) {
      const buscarDistritos = async () => {
        const distritosMock = {
          '1': [
            { id: '101', nome: 'Cidade de Maputo' },
            { id: '102', nome: 'Matola' },
            { id: '103', nome: 'Marracuene' }
          ],
          '2': [
            { id: '201', nome: 'Xai-Xai' },
            { id: '202', nome: 'Chókwè' },
            { id: '203', nome: 'Bilene' }
          ]
        };
        
        setDistritos(distritosMock[vagaData.provincia] || []);
        setVagaData(prev => ({ ...prev, distrito: '' }));
      };

      buscarDistritos();
    }
  }, [vagaData.provincia]);

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
      areasFormacao: [],
      provincia: '',
      distrito: '',
      tipo: 'Tempo Integral',
      dataLimite: null,
      tipoContrato: '',
      salario: '',
      subAreas: []
    });
    setSelectedArea('');
  };

  const handleChange = (field, value) => {
    setVagaData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field, itemValue) => {
    setVagaData(prev => {
      const currentValues = prev[field];
      const newValues = currentValues.includes(itemValue)
        ? currentValues.filter(v => v !== itemValue)
        : [...currentValues, itemValue];
      
      return { ...prev, [field]: newValues };
    });
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

  return (
    <>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleOpen}
        sx={{ mb: 3 }}
        startIcon={<Work />}
      >
        Publicar Nova Vaga
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: '1px solid #eee', pb: 2 }}>
          <Box display="flex" alignItems="center">
            <Work sx={{ mr: 1 }} />
            <Typography variant="h6">Publicar Nova Vaga</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            {/* Basic Information Section */}
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Informações Básicas
            </Typography>
            
            <TextField
              label="Título da Vaga *"
              value={vagaData.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
            />

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Descrição Completa da Vaga *
              </Typography>
              <ReactQuill
                value={vagaData.descricao}
                onChange={(value) => handleChange('descricao', value)}
                modules={quillModules}
                style={{ height: '200px', marginBottom: '50px' }}
                theme="snow"
              />
            </Box>

            {/* Job Details Section */}
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Detalhes da Vaga
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Vaga</InputLabel>
                  <Select
                    value={vagaData.tipo}
                    onChange={(e) => handleChange('tipo', e.target.value)}
                    label="Tipo de Vaga"
                  >
                    <MenuItem value="Tempo Integral">Tempo Integral</MenuItem>
                    <MenuItem value="Meio Período">Meio Período</MenuItem>
                    <MenuItem value="Remoto">Remoto</MenuItem>
                    <MenuItem value="Híbrido">Híbrido</MenuItem>
                    <MenuItem value="Freelance">Freelance</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label="Tipo de Contrato"
                  value={vagaData.tipoContrato}
                  onChange={(e) => handleChange('tipoContrato', e.target.value)}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>

            <TextField
              label="Salário (opcional)"
              value={vagaData.salario}
              onChange={(e) => handleChange('salario', e.target.value)}
              fullWidth
              size="small"
              placeholder="Ex: 20.000,00 MZN"
            />

            {/* Location Section */}
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Localização
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Província *</InputLabel>
                  <Select
                    value={vagaData.provincia}
                    onChange={(e) => handleChange('provincia', e.target.value)}
                    label="Província"
                  >
                    {provincias.map((provincia) => (
                      <MenuItem key={provincia.id} value={provincia.id}>
                        {provincia.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Distrito *</InputLabel>
                  <Select
                    value={vagaData.distrito}
                    onChange={(e) => handleChange('distrito', e.target.value)}
                    label="Distrito"
                    disabled={!vagaData.provincia}
                  >
                    {distritos.map((distrito) => (
                      <MenuItem key={distrito.id} value={distrito.id}>
                        {distrito.nome}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mt: 1 }}>
              <DatePicker
                selected={vagaData.dataLimite}
                onChange={(date) => handleChange('dataLimite', date)}
                minDate={new Date()}
                placeholderText="Data Limite (opcional)"
                customInput={
                  <TextField
                    fullWidth
                    size="small"
                    label="Data Limite (opcional)"
                    onFocus={(e) => e.target.blur()} // Prevent keyboard on mobile
                  />
                }
              />
            </Box>

            {/* Areas Section */}
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Áreas Relacionadas
            </Typography>

            <FormControl fullWidth size="small">
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
              <FormControl fullWidth size="small">
                <InputLabel>Subáreas (opcional)</InputLabel>
                <Select
                  multiple
                  value={vagaData.subAreas}
                  onChange={(e) => handleChange('subAreas', e.target.value)}
                  input={<OutlinedInput label="Subáreas (opcional)" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {availableSubAreas.map((subArea) => (
                    <MenuItem key={subArea} value={subArea}>
                      <Checkbox checked={vagaData.subAreas.indexOf(subArea) > -1} size="small" />
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
                  size="small"
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    label={option}
                    {...getTagProps({ index })}
                    key={option}
                    size="small"
                  />
                ))
              }
            />

            {/* Education Section */}
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Formação Requerida
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <FormGroup row>
                {areasFormacao.map((area, index) => (
                  <FormControlLabel
                    key={index}
                    control={
                      <Checkbox
                        checked={vagaData.areasFormacao.includes(area.nivel)}
                        onChange={() => handleCheckboxChange('areasFormacao', area.nivel)}
                        name={area.nivel}
                        size="small"
                      />
                    }
                    label={area.nivel}
                  />
                ))}
              </FormGroup>
            </Box>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ borderTop: '1px solid #eee', p: 2 }}>
          <Button onClick={handleClose} variant="outlined" size="medium">
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained" 
            disabled={loading || !vagaData.titulo || !vagaData.descricao || !vagaData.provincia || !vagaData.distrito || !selectedArea}
            size="medium"
            startIcon={<Work />}
          >
            {loading ? 'Publicando...' : 'Publicar Vaga'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PublicarVaga;
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
import { onValue, ref } from 'firebase/database';
import { db } from '../../fb';

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
    provincias: [],
    distritos: [],
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
  const [loadingProvincias, setLoadingProvincias] = useState(false);
  const [loadingDistritos, setLoadingDistritos] = useState(false);
  const [distritosEnabled, setDistritosEnabled] = useState(false);

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

  useEffect(() => {
    const buscarProvincias = async () => {
      setLoadingProvincias(true);
      try {
        const provinciasRef = ref(db, 'provincias');
        onValue(provinciasRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const provinciasArray = data.map((provincia, index) => ({
              id: index.toString(),
              nome: provincia.provincia
            }));
            setProvincias(provinciasArray);
          } else {
            setProvincias([]);
          }
          setLoadingProvincias(false);
        });
      } catch (error) {
        console.error('Erro ao buscar províncias:', error);
        setProvincias([]);
        setLoadingProvincias(false);
      }
    };

    buscarProvincias();
  }, []);

  useEffect(() => {
    if (vagaData.provincias.length === 1) {
      setDistritosEnabled(true);
      const buscarDistritos = async () => {
        setLoadingDistritos(true);
        try {
          const provinciasRef = ref(db, 'provincias');
          onValue(provinciasRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
              const provinciaId = vagaData.provincias[0];
              const provincia = data[provinciaId];
              const distritosArray = provincia?.distritos?.map((distrito, index) => ({
                id: `${provinciaId}-${index}`,
                nome: distrito,
                provinciaId: provinciaId
              })) || [];
              setDistritos(distritosArray);
            } else {
              setDistritos([]);
            }
            setLoadingDistritos(false);
          });
        } catch (error) {
          console.error('Erro ao buscar distritos:', error);
          setDistritos([]);
          setLoadingDistritos(false);
        }
      };
      buscarDistritos();
    } else if (vagaData.provincias.length > 1) {
      setDistritosEnabled(false);
      setDistritos([]);
      setVagaData(prev => ({ ...prev, distritos: [] }));
    } else {
      setDistritosEnabled(false);
      setDistritos([]);
      setVagaData(prev => ({ ...prev, distritos: [] }));
    }
  }, [vagaData.provincias]);

  useEffect(() => {
    if (selectedArea && areasAtuacao[selectedArea]) {
      setAvailableSubAreas(areasAtuacao[selectedArea]);
      setVagaData(prev => ({ ...prev, subAreas: [] }));
    } else {
      setAvailableSubAreas([]);
    }
  }, [selectedArea, areasAtuacao]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setVagaData({
      titulo: '',
      descricao: '',
      areas: [],
      areasFormacao: [],
      provincias: [],
      distritos: [],
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

  const handleProvinciaChange = (e) => {
    const value = e.target.value;
    if (value[value.length - 1] === 'select-all') {
      setVagaData(prev => ({
        ...prev,
        provincias: prev.provincias.length === provincias.length ? [] : provincias.map(p => p.id)
      }));
      return;
    }
    setVagaData(prev => ({ ...prev, provincias: value }));
  };

  const handleDistritoChange = (e) => {
    const value = e.target.value;
    if (value[value.length - 1] === 'select-all') {
      setVagaData(prev => ({
        ...prev,
        distritos: prev.distritos.length === distritos.length ? [] : distritos.map(d => d.id)
      }));
      return;
    }
    setVagaData(prev => ({ ...prev, distritos: value }));
  };

  const handleSubmit = () => {
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

            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Localização
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel>Províncias *</InputLabel>
              <Select
                multiple
                value={vagaData.provincias}
                onChange={handleProvinciaChange}
                input={<OutlinedInput label="Províncias *" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const provincia = provincias.find(p => p.id === value);
                      return <Chip key={value} label={provincia?.nome || value} size="small" />;
                    })}
                  </Box>
                )}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      width: 250,
                    },
                  },
                }}
              >
                <MenuItem value="select-all" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                  <Checkbox
                    checked={vagaData.provincias.length === provincias.length}
                    indeterminate={
                      vagaData.provincias.length > 0 && 
                      vagaData.provincias.length < provincias.length
                    }
                  />
                  <ListItemText primary="Selecionar todos" />
                </MenuItem>
                {provincias.map((provincia) => (
                  <MenuItem key={provincia.id} value={provincia.id}>
                    <Checkbox checked={vagaData.provincias.indexOf(provincia.id) > -1} />
                    <ListItemText primary={provincia.nome} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel>Distritos {vagaData.provincias.length === 1 ? '*' : '(selecione apenas uma província)'}</InputLabel>
              <Select
                multiple
                value={vagaData.distritos}
                onChange={handleDistritoChange}
                input={<OutlinedInput label={`Distritos ${vagaData.provincias.length === 1 ? '*' : '(selecione apenas uma província)'}`} />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const distrito = distritos.find(d => d.id === value);
                      return <Chip key={value} label={distrito?.nome || value} size="small" />;
                    })}
                  </Box>
                )}
                disabled={!distritosEnabled || loadingDistritos}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                      width: 250,
                    },
                  },
                }}
              >
                {vagaData.provincias.length > 1 ? (
                  <MenuItem disabled>
                    Selecione apenas uma província para escolher distritos específicos
                  </MenuItem>
                ) : (
                  <>
                    <MenuItem value="select-all" sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}>
                      <Checkbox
                        checked={vagaData.distritos.length === distritos.length}
                        indeterminate={
                          vagaData.distritos.length > 0 && 
                          vagaData.distritos.length < distritos.length
                        }
                      />
                      <ListItemText primary="Selecionar todos" />
                    </MenuItem>
                    {distritos.map((distrito) => (
                      <MenuItem key={distrito.id} value={distrito.id}>
                        <Checkbox checked={vagaData.distritos.indexOf(distrito.id) > -1} />
                        <ListItemText primary={distrito.nome} />
                      </MenuItem>
                    ))}
                  </>
                )}
              </Select>
            </FormControl>

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
                    onFocus={(e) => e.target.blur()}
                  />
                }
              />
            </Box>

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
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                        width: 250,
                      },
                    },
                  }}
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
            disabled={
              loading || 
              !vagaData.titulo || 
              !vagaData.descricao || 
              vagaData.provincias.length === 0 || 
              (distritosEnabled && vagaData.distritos.length === 0) || 
              !selectedArea
            }
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
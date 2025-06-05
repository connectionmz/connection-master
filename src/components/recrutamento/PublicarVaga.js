import React, { useState, useEffect, useMemo } from 'react';
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
  CircularProgress,
  Alert,
  Collapse,
  IconButton
} from '@mui/material';
import { Work, Close } from '@mui/icons-material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { onValue, ref } from 'firebase/database';
import { db } from '../../fb';

// Configuração do editor Quill
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

const initialVagaData = {
  titulo: '',
  descricao: '',
  areas: [],
  areasFormacao: [],
  provincias: [],
  distritosPorProvincia: {}, // { provinciaId: [distritoId1, distritoId2] }
  tipo: 'Tempo Integral',
  dataLimite: null,
  tipoContrato: '',
  salario: '',
  subAreas: []
};

const PublicarVaga = ({ 
  user, 
  loading, 
  onPublicarVaga, 
  areasFormacao, 
  areasAtuacao 
}) => {
  const [open, setOpen] = useState(false);
  const [vagaData, setVagaData] = useState(initialVagaData);
  const [selectedArea, setSelectedArea] = useState('');
  const [availableSubAreas, setAvailableSubAreas] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState({}); // { provinciaId: [distritos] }
  const [loadingProvincias, setLoadingProvincias] = useState(false);
  const [loadingDistritos, setLoadingDistritos] = useState(false);
  const [error, setError] = useState(null);

  // Carregar lista de províncias do Firebase
  useEffect(() => {
    const buscarProvincias = async () => {
      setLoadingProvincias(true);
      try {
        const provinciasRef = ref(db, 'provincias');
        onValue(provinciasRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const provinciasArray = Object.values(data).map((p) => ({
              id: p.provincia,
              nome: p.provincia
            }));
            setProvincias(provinciasArray);
          } else {
            setProvincias([]);
          }
          setLoadingProvincias(false);
        });
      } catch (error) {
        console.error('Erro ao carregar províncias:', error);
        setError('Erro ao carregar lista de províncias');
        setProvincias([]);
        setLoadingProvincias(false);
      }
    };
    buscarProvincias();
  }, []);

  // Carregar distritos quando províncias são selecionadas
  useEffect(() => {
    if (vagaData.provincias.length > 0) {
      const provinciasParaCarregar = vagaData.provincias.filter(
        provinciaId => !distritos[provinciaId]
      );

      if (provinciasParaCarregar.length > 0) {
        setLoadingDistritos(true);
        
        const buscarDistritos = async () => {
          try {
            const provinciasRef = ref(db, 'provincias');
            onValue(provinciasRef, (snapshot) => {
              const data = snapshot.val();
              if (data) {
                const novosDistritos = { ...distritos };
                
                provinciasParaCarregar.forEach(provinciaId => {
                  const provincia = Object.values(data).find(p => p.provincia === provinciaId);
                  if (provincia) {
                    novosDistritos[provinciaId] = provincia.distritos?.map((d, index) => ({
                      id: `${provinciaId}-${index}`,
                      nome: d
                    })) || [];
                  }
                });
                
                setDistritos(novosDistritos);
              }
              setLoadingDistritos(false);
            });
          } catch (error) {
            console.error('Erro ao carregar distritos:', error);
            setError('Erro ao carregar distritos');
            setLoadingDistritos(false);
          }
        };
        
        buscarDistritos();
      }
    }
  }, [vagaData.provincias]);

  // Atualizar subáreas com base na área principal
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
    setVagaData(initialVagaData);
    setSelectedArea('');
    setError(null);
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
    const selectedProvincias = e.target.value;
    
    // Se selecionou "Selecionar todos"
    if (selectedProvincias[selectedProvincias.length - 1] === 'select-all') {
      const allProvincias = provincias.map(p => p.id);
      setVagaData(prev => ({
        ...prev,
        provincias: prev.provincias.length === provincias.length ? [] : allProvincias,
        distritosPorProvincia: {}
      }));
      return;
    }
    
    setVagaData(prev => ({
      ...prev,
      provincias: selectedProvincias,
      // Limpa distritos de províncias que foram desmarcadas
      distritosPorProvincia: Object.fromEntries(
        Object.entries(prev.distritosPorProvincia).filter(([provinciaId]) => 
          selectedProvincias.includes(provinciaId)
        )
      )
    }));
  };

  const handleDistritoChange = (provinciaId, selectedDistritos) => {
    // Se selecionou "Selecionar todos" para esta província
    if (selectedDistritos[selectedDistritos.length - 1] === 'select-all') {
      const allDistritos = distritos[provinciaId]?.map(d => d.id) || [];
      setVagaData(prev => ({
        ...prev,
        distritosPorProvincia: {
          ...prev.distritosPorProvincia,
          [provinciaId]: prev.distritosPorProvincia[provinciaId]?.length === allDistritos.length 
            ? [] 
            : allDistritos
        }
      }));
      return;
    }
    
    setVagaData(prev => ({
      ...prev,
      distritosPorProvincia: {
        ...prev.distritosPorProvincia,
        [provinciaId]: selectedDistritos
      }
    }));
  };

  const handleSubmit = () => {
    // Validação
    if (!vagaData.titulo) {
      setError('O título da vaga é obrigatório');
      return;
    }
    
    if (!vagaData.descricao || vagaData.descricao === '<p><br></p>') {
      setError('A descrição da vaga é obrigatória');
      return;
    }
    
    if (vagaData.provincias.length === 0) {
      setError('Selecione pelo menos uma província');
      return;
    }
    
    if (!selectedArea) {
      setError('Selecione uma área principal');
      return;
    }
    
    setError(null);
    
    // Preparar dados para envio
    const areasCompletas = [
      selectedArea,
      ...vagaData.subAreas
    ];
    
    // Converter distritosPorProvincia para um formato mais simples
    const todosDistritos = Object.values(vagaData.distritosPorProvincia).flat();
    
    onPublicarVaga({
      ...vagaData,
      areas: areasCompletas,
      distritos: todosDistritos,
      dataLimite: vagaData.dataLimite ? vagaData.dataLimite.toISOString() : null
    });
    
    handleClose();
  };

  // Verifica se todos os distritos de uma província estão selecionados
  const isAllDistritosSelected = (provinciaId) => {
    const provinciaDistritos = distritos[provinciaId] || [];
    const selectedDistritos = vagaData.distritosPorProvincia[provinciaId] || [];
    return provinciaDistritos.length > 0 && 
           selectedDistritos.length === provinciaDistritos.length;
  };

  // Verifica se alguns distritos de uma província estão selecionados
  const isSomeDistritosSelected = (provinciaId) => {
    const provinciaDistritos = distritos[provinciaId] || [];
    const selectedDistritos = vagaData.distritosPorProvincia[provinciaId] || [];
    return selectedDistritos.length > 0 && 
           selectedDistritos.length < provinciaDistritos.length;
  };

  // Total de distritos selecionados
  const totalDistritosSelecionados = useMemo(() => {
    return Object.values(vagaData.distritosPorProvincia).reduce(
      (total, distritos) => total + distritos.length, 0
    );
  }, [vagaData.distritosPorProvincia]);

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
          <Collapse in={!!error}>
            <Alert 
              severity="error" 
              sx={{ mb: 2 }}
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setError(null)}
                >
                  <Close fontSize="inherit" />
                </IconButton>
              }
            >
              {error}
            </Alert>
          </Collapse>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
            {/* Informações Básicas */}
            <TextField
              label="Título da Vaga *"
              value={vagaData.titulo}
              onChange={(e) => handleChange('titulo', e.target.value)}
              fullWidth
              variant="outlined"
              size="small"
              error={!vagaData.titulo && !!error}
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

            {/* Detalhes da Vaga */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Vaga</InputLabel>
                <Select
                  value={vagaData.tipo}
                  onChange={(e) => handleChange('tipo', e.target.value)}
                  label="Tipo de Vaga"
                >
                  <MenuItem value="Permanente">Vaga Permanente</MenuItem>
                  <MenuItem value="Temporária">Vaga Temporária</MenuItem>
                  <MenuItem value="Sazonal">Vaga Sazonal</MenuItem>
                  <MenuItem value="Ocasional">Vaga Ocasional</MenuItem>
                  <MenuItem value="Tempo Parcial">Vaga a Tempo Parcial</MenuItem>
                  <MenuItem value="Tempo Inteiro">Vaga a Tempo Inteiro</MenuItem>
                </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Tipo de Contrato</InputLabel>
      <Select
  value={vagaData.tipoContrato}
  onChange={(e) => handleChange('tipoContrato', e.target.value)}
  label="Tipo de Contrato"
>
  <MenuItem value="Indeterminado">Contrato por tempo indeterminado</MenuItem>
  <MenuItem value="Prazo Certo">Contrato a prazo certo</MenuItem>
  <MenuItem value="Prazo Incerto">Contrato a prazo incerto</MenuItem>
  <MenuItem value="Tempo Parcial">Contrato de trabalho a tempo parcial</MenuItem>
  <MenuItem value="Obra Certa">Contrato de trabalho para tarefa ou obra certa</MenuItem>
</Select>

                </FormControl>
              </Grid>
            </Grid>
            
           <TextField
  label="Salário (opcional)"
  value={vagaData.salario}
  onChange={(e) => {
    const rawValue = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    if (!rawValue) {
      handleChange('salario', '');
      return;
    }

    const number = parseFloat(rawValue) / 100;

    const formatted = number.toLocaleString('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    handleChange('salario', formatted);
  }}
  fullWidth
  size="small"
  placeholder="Ex: 20.000,00 MZN"
/>
            {/* Localização */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Localização da Vaga *
              </Typography>
              
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
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
                  
                  {loadingProvincias ? (
                    <MenuItem disabled>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Carregando províncias...
                    </MenuItem>
                  ) : (
                    provincias.map((provincia) => (
                      <MenuItem key={provincia.id} value={provincia.id}>
                        <Checkbox checked={vagaData.provincias.indexOf(provincia.id) > -1} />
                        <ListItemText primary={provincia.nome} />
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>
              
              {/* Seção de Distritos por Província */}
              {vagaData.provincias.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Distritos Selecionados ({totalDistritosSelecionados})
                  </Typography>
                  
                  {loadingDistritos && (
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      <Typography variant="body2">Carregando distritos...</Typography>
                    </Box>
                  )}
                  
                  {vagaData.provincias.map(provinciaId => {
                    const provincia = provincias.find(p => p.id === provinciaId);
                    const provinciaDistritos = distritos[provinciaId] || [];
                    
                    return (
                      <FormControl 
                        key={provinciaId} 
                        fullWidth 
                        size="small" 
                        sx={{ mb: 2 }}
                      >
                        <InputLabel>
                          Distritos de {provincia?.nome || provinciaId}
                        </InputLabel>
                        <Select
                          multiple
                          value={vagaData.distritosPorProvincia[provinciaId] || []}
                          onChange={(e) => handleDistritoChange(provinciaId, e.target.value)}
                          input={<OutlinedInput label={`Distritos de ${provincia?.nome || provinciaId}`} />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => {
                                const distrito = provinciaDistritos.find(d => d.id === value);
                                return <Chip key={value} label={distrito?.nome || value} size="small" />;
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
                          <MenuItem 
                            value="select-all" 
                            sx={{ fontWeight: 'bold', backgroundColor: '#f5f5f5' }}
                          >
                            <Checkbox
                              checked={isAllDistritosSelected(provinciaId)}
                              indeterminate={isSomeDistritosSelected(provinciaId)}
                            />
                            <ListItemText primary="Selecionar todos" />
                          </MenuItem>
                          
                          {provinciaDistritos.length > 0 ? (
                            provinciaDistritos.map((distrito) => (
                              <MenuItem key={distrito.id} value={distrito.id}>
                                <Checkbox 
                                  checked={
                                    (vagaData.distritosPorProvincia[provinciaId] || []).includes(distrito.id)
                                  } 
                                />
                                <ListItemText primary={distrito.nome} />
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem disabled>
                              {loadingDistritos ? 'Carregando...' : 'Nenhum distrito disponível'}
                            </MenuItem>
                          )}
                        </Select>
                      </FormControl>
                    );
                  })}
                </Box>
              )}
            </Box>
            
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

            {/* Áreas */}
            <FormControl fullWidth size="small">
              <InputLabel>Área Principal *</InputLabel>
              <Select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                label="Área Principal"
                error={!selectedArea && !!error}
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

            {/* Formação Requerida */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Formação Requerida (opcional)
              </Typography>
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
            disabled={loading}
            size="medium"
            startIcon={loading ? <CircularProgress size={20} /> : <Work />}
          >
            {loading ? 'Publicando...' : 'Publicar Vaga'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PublicarVaga;
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Checkbox,
  ListItemText,
  FormGroup,
  FormControlLabel,
  TextField
} from '@mui/material';
import { Work, LocationOn, Category } from '@mui/icons-material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const PublicarVaga = ({ user, loading, onPublicarVaga, areasFormacao, areasAtuacao }) => {
  // Estados para os dados da vaga
  const [novaVaga, setNovaVaga] = useState({
    titulo: '',
    descricao: '',
    areas: [], // Alterado para array para múltiplas seleções
    areasFormacao: [], // Alterado para array para múltiplas seleções
    salario: '',
    provincia: '',
    distrito: '',
    tipo: 'Tempo Integral',
    requisitos: ''
  });

  // Estados para os dados de localização
  const [provincias, setProvincias] = useState([]);
  const [distritos, setDistritos] = useState([]);

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

  // Buscar distritos quando a província é selecionada
  useEffect(() => {
    if (novaVaga.provincia) {
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
        
        setDistritos(distritosMock[novaVaga.provincia] || []);
        setNovaVaga(prev => ({ ...prev, distrito: '' }));
      };

      buscarDistritos();
    }
  }, [novaVaga.provincia]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovaVaga(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (event, field) => {
    const { value } = event.target;
    setNovaVaga(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleCheckboxChange = (field, itemValue) => {
    setNovaVaga(prev => {
      const currentValues = prev[field];
      const newValues = currentValues.includes(itemValue)
        ? currentValues.filter(v => v !== itemValue)
        : [...currentValues, itemValue];
      
      return { ...prev, [field]: newValues };
    });
  };

  const handleDescricaoChange = (value) => {
    setNovaVaga(prev => ({ ...prev, descricao: value }));
  };

  const handleRequisitosChange = (value) => {
    setNovaVaga(prev => ({ ...prev, requisitos: value }));
  };

  const handleSubmit = () => {
    
    onPublicarVaga(novaVaga);
  };

  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'header': 1 }, { 'header': 2 }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'script': 'sub'}, { 'script': 'super' }],
      ['link'],
      ['clean']
    ]
  };

  return (
    <Card sx={{ p: 3, mb: 3, boxShadow: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Publicar Nova Vaga
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Título da Vaga*"
            name="titulo"
            fullWidth
            value={novaVaga.titulo}
            onChange={handleChange}
            required
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel>Áreas de Atuação*</InputLabel>
            <Select
              name="areas"
              multiple
              value={novaVaga.areas}
              onChange={(e) => handleMultiSelectChange(e, 'areas')}
              renderValue={(selected) => selected.join(', ')}
              required
            >
              {Object.keys(areasAtuacao).map((key) => (
                <MenuItem key={key} value={key}>
                  <Checkbox checked={novaVaga.areas.includes(key)} />
                  <ListItemText primary={key} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Descrição Completa*
          </Typography>
          <Box sx={{ border: '1px solid #ccc', borderRadius: 1 }}>
            <ReactQuill
              value={novaVaga.descricao}
              onChange={handleDescricaoChange}
              modules={quillModules}
              placeholder="Descreva detalhadamente a vaga..."
              style={{ height: '200px', marginBottom: '50px' }}
            />
          </Box>
        </Grid>
        
        <Grid item xs={12}>
          <Typography variant="subtitle2" gutterBottom>
            Áreas de Formação*
          </Typography>
          <FormGroup row>
            {areasFormacao.map((area, index) => (
              <FormControlLabel
                key={index}
                control={
                  <Checkbox
                    checked={novaVaga.areasFormacao.includes(area.nivel)}
                    onChange={() => handleCheckboxChange('areasFormacao', area.nivel)}
                    name={area.nivel}
                  />
                }
                label={area.nivel}
              />
            ))}
          </FormGroup>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Província*</InputLabel>
            <Select
              name="provincia"
              value={novaVaga.provincia}
              onChange={handleChange}
              required
              startAdornment={<LocationOn />}
            >
              <MenuItem value="">Selecione...</MenuItem>
              {provincias.map((provincia) => (
                <MenuItem key={provincia.id} value={provincia.id}>
                  {provincia.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Distrito*</InputLabel>
            <Select
              name="distrito"
              value={novaVaga.distrito}
              onChange={handleChange}
              disabled={!novaVaga.provincia}
            >
              <MenuItem value="">Selecione...</MenuItem>
              {distritos.map((distrito) => (
                <MenuItem key={distrito.id} value={distrito.id}>
                  {distrito.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <TextField
            label="Tipo de Vaga"
            name="tipo"
            select
            fullWidth
            value={novaVaga.tipo}
            onChange={handleChange}
          >
            <MenuItem value="Tempo Integral">Tempo Integral</MenuItem>
            <MenuItem value="Meio Período">Meio Período</MenuItem>
            <MenuItem value="Remoto">Remoto</MenuItem>
            <MenuItem value="Híbrido">Híbrido</MenuItem>
            <MenuItem value="Freelance">Freelance</MenuItem>
          </TextField>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            label="Salário (opcional)"
            name="salario"
            fullWidth
            value={novaVaga.salario}
            onChange={handleChange}
            placeholder="Ex: 20.000,00 MZN"
          />
        </Grid>
        
        <Grid item xs={12}>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={loading}
            startIcon={<Work />}
            sx={{ mt: 2 }}
            size="large"
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Publicar Vaga'}
          </Button>
        </Grid>
      </Grid>
    </Card>
  );
};

export default PublicarVaga;
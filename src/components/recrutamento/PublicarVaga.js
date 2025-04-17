import React, { useState } from 'react';
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
  Grid,
  useMediaQuery,
  useTheme,
  InputAdornment,
  IconButton,
  FormHelperText
} from '@mui/material';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Link as LinkIcon, Close as CloseIcon } from '@mui/icons-material';

// Configuração do ReactQuill
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
    ['clean']
  ]
};

const tiposContrato = [
  'Tempo Integral',
  'Meio Período',
  'Contrato',
  'Freelance',
  'Estágio',
  'Remoto',
  'Híbrido'
];

const initialVagaData = {
  titulo: '',
  descricao: '',
  provincia: '',
  dataLimite: null,
  tipoContrato: '',
  salario: '',
  linkCandidatura: ''
};

const PublicarVaga = ({ 
  onPublicarVaga, 
  loading 
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [open, setOpen] = useState(false);
  const [vagaData, setVagaData] = useState(initialVagaData);
  const [errors, setErrors] = useState({});

  // Validação dos campos
  const validate = () => {
    const newErrors = {};
    
    if (!vagaData.titulo.trim()) newErrors.titulo = 'Título é obrigatório';
    if (!vagaData.descricao.trim()) newErrors.descricao = 'Descrição é obrigatória';
    if (!vagaData.provincia) newErrors.provincia = 'Província é obrigatória';
    if (!vagaData.tipoContrato) newErrors.tipoContrato = 'Tipo de contrato é obrigatório';
    
    // Validação da data limite
    if (vagaData.dataLimite) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selectedDate = new Date(vagaData.dataLimite);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate <= today) {
        newErrors.dataLimite = 'A data deve ser posterior à data atual';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpen = () => setOpen(true);
  
  const handleClose = () => {
    setOpen(false);
    setVagaData(initialVagaData);
    setErrors({});
  };

  const handleSubmit = () => {
    if (!validate()) return;

    onPublicarVaga({
      ...vagaData,
      dataLimite: vagaData.dataLimite ? vagaData.dataLimite.toISOString() : null
    });
    handleClose();
  };

  const handleChange = (field, value) => {
    setVagaData(prev => ({ ...prev, [field]: value }));
    // Limpa o erro quando o campo é alterado
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Função para validar data no momento da seleção
  const handleDateChange = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (date) {
      const selectedDate = new Date(date);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate <= today) {
        setErrors(prev => ({ ...prev, dataLimite: 'A data deve ser posterior à data atual' }));
        return;
      }
    }
    
    handleChange('dataLimite', date);
  };

  // Filtro para desabilitar datas passadas
  const filterPassedDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  return (
    <>
      <Button 
        variant="contained" 
        color="primary" 
        onClick={handleOpen}
        sx={{ mb: 3 }}
        fullWidth={isMobile}
      >
        Publicar Nova Vaga
      </Button>

      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ pb: 2 }}>Publicar Nova Vaga</DialogTitle>
        
        <DialogContent dividers>
          <Grid container spacing={3}>
            {/* Título */}
            <Grid item xs={12}>
              <TextField
                label="Título da Vaga *"
                value={vagaData.titulo}
                onChange={(e) => handleChange('titulo', e.target.value)}
                fullWidth
                error={!!errors.titulo}
                helperText={errors.titulo}
                size="small"
              />
            </Grid>

            {/* Descrição completa da vaga */}
            <Grid item xs={12}>
              <FormControl fullWidth error={!!errors.descricao}>
                <InputLabel shrink>Descrição Completa da Vaga *</InputLabel>
                <Box sx={{ mt: 2, mb: 1 }}>
                  <ReactQuill
                    value={vagaData.descricao}
                    onChange={(value) => handleChange('descricao', value)}
                    modules={quillModules}
                    style={{ height: '300px' }}
                  />
<br/><br/>

                </Box>
                {errors.descricao && <FormHelperText error>{errors.descricao}</FormHelperText>}
              </FormControl>
            </Grid>

            {/* Tipo de Contrato */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.tipoContrato} size="small">
                <InputLabel>Tipo de Contrato *</InputLabel>
                <Select
                  value={vagaData.tipoContrato}
                  onChange={(e) => handleChange('tipoContrato', e.target.value)}
                  label="Tipo de Contrato *"
                >
                  {tiposContrato.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {tipo}
                    </MenuItem>
                  ))}
                </Select>
                {errors.tipoContrato && (
                  <FormHelperText error>{errors.tipoContrato}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Província */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.provincia} size="small">
                <InputLabel>Província *</InputLabel>
                <Select
                  value={vagaData.provincia}
                  onChange={(e) => handleChange('provincia', e.target.value)}
                  label="Província *"
                >
                  <MenuItem value="Remoto">Remoto</MenuItem>
                  <MenuItem value="Maputo">Maputo</MenuItem>
                  <MenuItem value="Gaza">Gaza</MenuItem>
                  <MenuItem value="Inhambane">Inhambane</MenuItem>
                  <MenuItem value="Sofala">Sofala</MenuItem>
                  <MenuItem value="Manica">Manica</MenuItem>
                  <MenuItem value="Tete">Tete</MenuItem>
                  <MenuItem value="Zambézia">Zambézia</MenuItem>
                  <MenuItem value="Nampula">Nampula</MenuItem>
                  <MenuItem value="Cabo Delgado">Cabo Delgado</MenuItem>
                  <MenuItem value="Niassa">Niassa</MenuItem>
                </Select>
                {errors.provincia && (
                  <FormHelperText error>{errors.provincia}</FormHelperText>
                )}
              </FormControl>
            </Grid>

            {/* Data Limite */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!errors.dataLimite}>
                <InputLabel shrink>Data Limite (opcional)</InputLabel>
                <DatePicker
                  selected={vagaData.dataLimite}
                  onChange={handleDateChange}
                  minDate={new Date()}
                  filterDate={filterPassedDate}
                  placeholderText="Selecione uma data"
                  customInput={
                    <TextField
                      fullWidth
                      size="small"
                      error={!!errors.dataLimite}
                      helperText={errors.dataLimite}
                    />
                  }
                  popperPlacement="bottom-start"
                  dateFormat="dd/MM/yyyy"
                  isClearable
                />
              </FormControl>
            </Grid>

            {/* Salário */}
            <Grid item xs={12} md={6}>
              <TextField
                label="Salário (opcional)"
                value={vagaData.salario}
                onChange={(e) => handleChange('salario', e.target.value)}
                fullWidth
                size="small"
                placeholder="Ex: 25.000 MZN"
              />
            </Grid>

            {/* Link para Candidatura */}
            <Grid item xs={12}>
              <TextField
                label="Link para Candidatura (opcional)"
                value={vagaData.linkCandidatura}
                onChange={(e) => handleChange('linkCandidatura', e.target.value)}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LinkIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: vagaData.linkCandidatura && (
                    <IconButton
                      onClick={() => handleChange('linkCandidatura', '')}
                      edge="end"
                      size="small"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )
                }}
                helperText="URL para candidatura externa (se aplicável)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose} variant="outlined" size={isMobile ? 'large' : 'medium'}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={loading}
            size={isMobile ? 'large' : 'medium'}
            sx={{ ml: 2 }}
          >
            {loading ? 'Publicando...' : 'Publicar Vaga'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PublicarVaga;
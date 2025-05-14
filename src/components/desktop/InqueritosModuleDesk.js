import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, update } from 'firebase/database';
import { db } from '../../fb';
import CriarInqueritoDesk from './CriarInqueritoDesk';
import VisualizarRespostasDesk from './VisualizarRespostasDesk';
import {
  Box,
  Typography,
  TextField,
  Button,
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  FormGroup,
  useMediaQuery,
  useTheme,
  Grid,
  Tabs,
  Tab,
  Stack
} from '@mui/material';
import { 
  Edit, 
  Delete, 
  Visibility, 
  ArrowBack, 
  Check, 
  Close, 
  FilterList, 
  Sort,
  Add
} from '@mui/icons-material';
import BackButton from '../BackButton';

// Lista de tipos de inquérito pré-definidos
const TIPOS_INQUERITO = [
  'Pesquisa de Mercado',
];

// Lista de províncias
const PROVINCIAS = [
  'Maputo Cidade',
  'Maputo Província',
  'Gaza',
  'Inhambane',
  'Sofala',
  'Manica',
  'Tete',
  'Zambézia',
  'Nampula',
  'Cabo Delgado',
  'Niassa'
];

const InqueritosModuleDesk = ({ user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [inqueritos, setInqueritos] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('inqueritos');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ 
    title: '', 
    description: '', 
    tipoInquerito: '', 
    provincias: [], 
    sectores: [] 
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [selectedProvincia, setSelectedProvincia] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const [sectores, setSectores] = useState([]);
  const [responsesCount, setResponsesCount] = useState({});
  const [sortBy, setSortBy] = useState('recentes');
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    content: '',
    onConfirm: () => {}
  });

  // Filtra e ordena os inquéritos
  const filteredInqueritos = inqueritos
    .filter((inq) => {
      const matchesSearch = inq.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSector = selectedSector ? inq.sectores.includes(selectedSector) : true;
      const matchesTipo = selectedTipo ? inq.tipoInquerito === selectedTipo : true;
      const matchesProvincia = selectedProvincia ? inq.provincias.includes(selectedProvincia) : true;
      return matchesSearch && matchesSector && matchesTipo && matchesProvincia;
    })
    .sort((a, b) => {
      if (sortBy === 'recentes') return b.createdAt - a.createdAt;
      if (sortBy === 'antigos') return a.createdAt - b.createdAt;
      if (sortBy === 'titulo') return a.title.localeCompare(b.title);
      return 0;
    });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch surveys
      const inqueritosRef = ref(db, 'surveys');
      onValue(inqueritosRef, (snapshot) => {
        const data = snapshot.val();
        const listaInqueritos = data
          ? Object.entries(data)
              .map(([id, details]) => ({ id, ...details }))
              .filter((inquerito) => inquerito.company.id === user.id)
          : [];
        setInqueritos(listaInqueritos);
      });

      // Fetch sectors
      onValue(ref(db, 'sectores_de_atividade'), (snapshot) => {
        const sectoresData = snapshot.val();
        if (sectoresData) {
          setSectores(sectoresData.map(s => s.setor));
        }
      });

      // Fetch responses count for each survey
      const responsesRef = ref(db, 'survey_responses');
      onValue(responsesRef, (snapshot) => {
        const responsesData = snapshot.val();
        const counts = {};
        
        if (responsesData) {
          Object.keys(responsesData).forEach(surveyId => {
            counts[surveyId] = Object.keys(responsesData[surveyId]).length;
          });
        }
        
        setResponsesCount(counts);
        setLoading(false);
      });
    };

    fetchData();
  }, [user.id]);

  const canEditSurvey = (surveyId) => {
    return !responsesCount[surveyId] || responsesCount[surveyId] === 0;
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      open: true,
      title: 'Confirmar Exclusão',
      content: 'Tem certeza que deseja excluir este inquérito? Todas as perguntas e respostas associadas serão perdidas.',
      onConfirm: async () => {
        try {
          await remove(ref(db, `surveys/${id}`));
          setConfirmDialog({ ...confirmDialog, open: false });
        } catch (error) {
          console.error('Erro ao excluir inquérito:', error);
        }
      }
    });
  };

  const startEdit = (id, currentData) => {
    if (!canEditSurvey(id)) {
      return;
    }
    setEditingId(id);
    setEditData({ 
      title: currentData.title, 
      description: currentData.description,
      tipoInquerito: currentData.tipoInquerito || '',
      provincias: currentData.provincias || [],
      sectores: currentData.sectores || []
    });
    setAbaAtiva('editar');
  };

  const saveEdit = async () => {
    if (!editData.title || !editData.description || editData.sectores.length === 0 || editData.provincias.length === 0) {
      setConfirmDialog({
        open: true,
        title: 'Campos obrigatórios',
        content: 'Preencha todos os campos obrigatórios antes de salvar (Título, Descrição, Setores e Províncias).',
        onConfirm: () => setConfirmDialog({ ...confirmDialog, open: false })
      });
      return;
    }

    try {
      await update(ref(db, `surveys/${editingId}`), {
        title: editData.title,
        description: editData.description,
        tipoInquerito: editData.tipoInquerito,
        provincias: editData.provincias,
        sectores: editData.sectores
      });
      setEditingId(null);
      setEditData({ title: '', description: '', tipoInquerito: '', provincias: [], sectores: [] });
      setAbaAtiva('inqueritos');
    } catch (error) {
      console.error('Erro ao atualizar inquérito:', error);
    }
  };

  const visualizarRespostas = (surveyId) => {
    setSelectedSurveyId(surveyId);
    setAbaAtiva('respostas');
  };

  const toggleProvincia = (provincia) => {
    setEditData(prev => ({
      ...prev,
      provincias: prev.provincias.includes(provincia)
        ? prev.provincias.filter(p => p !== provincia)
        : [...prev.provincias, provincia]
    }));
  };

  const toggleSector = (sector) => {
    setEditData(prev => ({
      ...prev,
      sectores: prev.sectores.includes(sector)
        ? prev.sectores.filter(s => s !== sector)
        : [...prev.sectores, sector]
    }));
  };

  const renderMobileTabs = () => (
    <Tabs
      value={abaAtiva}
      onChange={(e, newValue) => setAbaAtiva(newValue)}
      variant="fullWidth"
      indicatorColor="primary"
      textColor="primary"
      sx={{ mb: 2 }}
    >
      <Tab 
        value="inqueritos" 
        label={isMobile ? "Lista" : "Meus Inquéritos"} 
        icon={isMobile ? <Visibility /> : null} 
      />
      <Tab 
        value="novo" 
        label={isMobile ? "Novo" : "Criar Novo"} 
        icon={isMobile ? <Add /> : null} 
      />
    </Tabs>
  );

  return (
    <Paper elevation={3} sx={{ 
      p: isMobile ? 2 : 4, 
      borderRadius: 3, 
      backgroundColor: '#fff',
      minHeight: '70vh'
    }}>
              <BackButton/>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, flexDirection: isMobile ? 'column' : 'row' }}>
        <Typography variant={isMobile ? 'h5' : 'h4'} sx={{ 
          fontWeight: 'bold', 
          color: 'primary.main',
          mb: isMobile ? 1 : 0
        }}>
          Inquéritos
        </Typography>
      </Box>

      {isMobile ? (
        renderMobileTabs()
      ) : (
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={() => setAbaAtiva('inqueritos')}
                variant={abaAtiva === 'inqueritos' ? 'contained' : 'outlined'}
                startIcon={<Visibility />}
                sx={{ borderRadius: 2 }}
              >
                Meus Inquéritos
              </Button>
              <Button
                onClick={() => setAbaAtiva('novo')}
                variant={abaAtiva === 'novo' ? 'contained' : 'outlined'}
                color="success"
                startIcon={<Add />}
                sx={{ borderRadius: 2 }}
              >
                Criar Novo
              </Button>
            </Box>
            {abaAtiva === 'inqueritos' && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  startIcon={<FilterList />}
                  variant="outlined"
                  color="info"
                >
                  Filtros
                </Button>
                <Button
                  startIcon={<Sort />}
                  variant="outlined"
                  onClick={() => setSortBy(sortBy === 'recentes' ? 'antigos' : 'recentes')}
                >
                  {sortBy === 'recentes' ? 'Mais antigos' : 'Mais recentes'}
                </Button>
              </Box>
            )}
          </Box>
        </Box>
      )}

      {abaAtiva === 'inqueritos' && (
        <Box>
          <Box sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 3, 
            flexDirection: isMobile ? 'column' : 'row' 
          }}>
            <TextField
              label="Pesquisar inquéritos..."
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flex: 2 }}
            />
            {isMobile && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  startIcon={<FilterList />}
                  variant="outlined"
                  color="info"
                  fullWidth
                >
                  Filtros
                </Button>
                <Button
                  startIcon={<Sort />}
                  variant="outlined"
                  onClick={() => setSortBy(sortBy === 'recentes' ? 'antigos' : 'recentes')}
                  fullWidth
                >
                  {sortBy === 'recentes' ? 'Antigos' : 'Recentes'}
                </Button>
              </Box>
            )}
          </Box>

          {(showFilters || !isMobile) && (
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              mb: 3, 
              flexWrap: 'wrap',
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <FormControl sx={{ minWidth: isMobile ? '100%' : 200, flex: isMobile ? 1 : 'initial' }}>
                <InputLabel>Setor</InputLabel>
                <Select
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value)}
                  label="Setor"
                  size={isMobile ? 'small' : 'medium'}
                >
                  <MenuItem value="">Todos os setores</MenuItem>
                  {sectores.map((s) => (
                    <MenuItem key={s} value={s}>
                      {s}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: isMobile ? '100%' : 200, flex: isMobile ? 1 : 'initial' }}>
                <InputLabel>Tipo de Inquérito</InputLabel>
                <Select
                  value={selectedTipo}
                  onChange={(e) => setSelectedTipo(e.target.value)}
                  label="Tipo de Inquérito"
                  size={isMobile ? 'small' : 'medium'}
                >
                  <MenuItem value="">Todos os tipos</MenuItem>
                  {TIPOS_INQUERITO.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {tipo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: isMobile ? '100%' : 200, flex: isMobile ? 1 : 'initial' }}>
                <InputLabel>Província</InputLabel>
                <Select
                  value={selectedProvincia}
                  onChange={(e) => setSelectedProvincia(e.target.value)}
                  label="Província"
                  size={isMobile ? 'small' : 'medium'}
                >
                  <MenuItem value="">Todas as províncias</MenuItem>
                  {PROVINCIAS.map((prov) => (
                    <MenuItem key={prov} value={prov}>
                      {prov}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

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
                  <ListItem sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'stretch',
                    p: isMobile ? 2 : 3
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      width: '100%',
                      flexDirection: isMobile ? 'column' : 'row'
                    }}>
                      <Typography variant={isMobile ? 'subtitle1' : 'h6'} sx={{ fontWeight: 'bold' }}>
                        {inq.title}
                      </Typography>
                      <Box sx={{ mt: isMobile ? 1 : 0 }}>
                        {inq.tipoInquerito && (
                          <Chip 
                            label={inq.tipoInquerito} 
                            color="info" 
                            size="small" 
                            sx={{ ml: isMobile ? 0 : 1 }} 
                          />
                        )}
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {inq.description}
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 1, 
                      my: 1,
                      justifyContent: isMobile ? 'center' : 'flex-start'
                    }}>
                      {inq.sectores?.map((sector) => (
                        <Chip key={sector} label={sector} size="small" />
                      ))}
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 1, 
                      mb: 1,
                      justifyContent: isMobile ? 'center' : 'flex-start'
                    }}>
                      {inq.provincias?.map((provincia) => (
                        <Chip key={provincia} label={provincia} size="small" variant="outlined" />
                      ))}
                    </Box>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      width: '100%',
                      flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'center' : 'flex-start'
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        mb: isMobile ? 1 : 0,
                        flexWrap: 'wrap',
                        justifyContent: isMobile ? 'center' : 'flex-start'
                      }}>
                        <Chip
                          label={`${responsesCount[inq.id] || 0} respostas`}
                          variant="outlined"
                          size="small"
                          color={responsesCount[inq.id] ? 'primary' : 'default'}
                        />
                        <Chip
                          label={`${inq.questions?.length || 0} perguntas`}
                          variant="outlined"
                          size="small"
                          sx={{ ml: 1 }}
                        />
                        <Typography variant="caption" sx={{ 
                          ml: 1, 
                          color: 'text.secondary',
                          mt: isMobile ? 1 : 0
                        }}>
                          Criado em: {new Date(inq.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>
                      <Box sx={{
                        display: 'flex',
                        justifyContent: isMobile ? 'center' : 'flex-end'
                      }}>
                        <IconButton
                          onClick={() => startEdit(inq.id, inq)}
                          color="primary"
                          disabled={!canEditSurvey(inq.id)}
                          title={!canEditSurvey(inq.id) ? "Não é possível editar inquéritos com respostas" : "Editar"}
                          size={isMobile ? 'small' : 'medium'}
                        >
                          <Edit fontSize={isMobile ? 'small' : 'medium'} />
                        </IconButton>
                        <IconButton
                          onClick={() => handleDelete(inq.id)}
                          color="error"
                          size={isMobile ? 'small' : 'medium'}
                        >
                          <Delete fontSize={isMobile ? 'small' : 'medium'} />
                        </IconButton>
                        <IconButton
                          onClick={() => visualizarRespostas(inq.id)}
                          color="secondary"
                          size={isMobile ? 'small' : 'medium'}
                        >
                          <Visibility fontSize={isMobile ? 'small' : 'medium'} />
                        </IconButton>
                      </Box>
                    </Box>
                  </ListItem>
                </Paper>
              ))}
            </List>
          )}
        </Box>
      )}

      {abaAtiva === 'novo' && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => setAbaAtiva('inqueritos')} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
              Criar Novo Inquérito
            </Typography>
          </Box>
          <CriarInqueritoDesk 
            user={user} 
            onSuccess={() => setAbaAtiva('inqueritos')} 
            sectores={sectores}
            provincias={PROVINCIAS}
            tiposInquerito={TIPOS_INQUERITO}
            isMobile={isMobile}
          />
        </Box>
      )}

      {abaAtiva === 'editar' && (
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton onClick={() => setAbaAtiva('inqueritos')} sx={{ mr: 1 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant={isMobile ? 'h6' : 'h5'} sx={{ fontWeight: 'bold' }}>
              Editar Inquérito
            </Typography>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 3, 
            maxWidth: 800, 
            mx: 'auto',
            p: isMobile ? 1 : 0
          }}>
            <TextField
              label="Título do Inquérito *"
              variant="outlined"
              fullWidth
              size={isMobile ? 'small' : 'medium'}
              value={editData.title}
              onChange={(e) => setEditData({ ...editData, title: e.target.value })}
            />
            <TextField
              label="Descrição *"
              variant="outlined"
              multiline
              rows={4}
              fullWidth
              size={isMobile ? 'small' : 'medium'}
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            />
            
            <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
              <InputLabel>Tipo de Inquérito</InputLabel>
              <Select
                value={editData.tipoInquerito}
                onChange={(e) => setEditData({ ...editData, tipoInquerito: e.target.value })}
                label="Tipo de Inquérito"
              >
                <MenuItem value="">Selecione um tipo</MenuItem>
                {TIPOS_INQUERITO.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {tipo}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Províncias * (selecione pelo menos uma)
              </Typography>
              <FormGroup row sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1,
                justifyContent: isMobile ? 'center' : 'flex-start'
              }}>
                {PROVINCIAS.map((provincia) => (
                  <FormControlLabel
                    key={provincia}
                    control={
                      <Checkbox
                        checked={editData.provincias.includes(provincia)}
                        onChange={() => toggleProvincia(provincia)}
                        size={isMobile ? 'small' : 'medium'}
                      />
                    }
                    label={provincia}
                    sx={{ minWidth: isMobile ? '40%' : 'auto' }}
                  />
                ))}
              </FormGroup>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Setores de Atividade * (selecione pelo menos um)
              </Typography>
              <FormGroup row sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 1,
                justifyContent: isMobile ? 'center' : 'flex-start'
              }}>
                {sectores.map((sector) => (
                  <FormControlLabel
                    key={sector}
                    control={
                      <Checkbox
                        checked={editData.sectores.includes(sector)}
                        onChange={() => toggleSector(sector)}
                        size={isMobile ? 'small' : 'medium'}
                      />
                    }
                    label={sector}
                    sx={{ minWidth: isMobile ? '40%' : 'auto' }}
                  />
                ))}
              </FormGroup>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              gap: 2, 
              justifyContent: 'flex-end', 
              mt: 2,
              flexDirection: isMobile ? 'column' : 'row'
            }}>
              <Button
                onClick={() => setAbaAtiva('inqueritos')}
                variant="outlined"
                color="inherit"
                startIcon={<Close />}
                fullWidth={isMobile}
                size={isMobile ? 'small' : 'medium'}
              >
                Cancelar
              </Button>
              <Button
                onClick={saveEdit}
                variant="contained"
                color="primary"
                startIcon={<Check />}
                disabled={editData.provincias.length === 0 || editData.sectores.length === 0}
                fullWidth={isMobile}
                size={isMobile ? 'small' : 'medium'}
              >
                Salvar Alterações
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {abaAtiva === 'respostas' && selectedSurveyId && (
        <VisualizarRespostasDesk
          surveyId={selectedSurveyId}
          onBack={() => setAbaAtiva('inqueritos')}
          isMobile={isMobile}
        />
      )}

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
        fullScreen={isMobile}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <Typography>{confirmDialog.content}</Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}
            size={isMobile ? 'large' : 'medium'}
          >
            Cancelar
          </Button>
          <Button 
            onClick={confirmDialog.onConfirm} 
            color="primary" 
            autoFocus
            size={isMobile ? 'large' : 'medium'}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default InqueritosModuleDesk;
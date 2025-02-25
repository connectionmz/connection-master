import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, update } from 'firebase/database';
import { db } from '../../fb';
import CriarInqueritoDesk from './CriarInqueritoDesk';
import VisualizarRespostasDesk from './VisualizarRespostasDesk';
import { Box, Typography, TextField, Button, MenuItem, Select, FormControl, InputLabel, List, ListItem, ListItemText, CircularProgress } from '@mui/material';

const InqueritosModuleDesk = ({ user }) => {
  const [inqueritos, setInqueritos] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('inqueritos');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ title: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedSurveyId, setSelectedSurveyId] = useState(null);
  const itemsPerPage = 5;
  const [currentPage, setCurrentPage] = useState(1);
  const [sectores, setSectores] = useState([]);

  const filteredInqueritos = inqueritos.filter((inq) => {
    const matchesSearch = inq.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSector = selectedSector ? inq.sector === selectedSector : true;
    return matchesSearch && matchesSector;
  });

  const paginatedInqueritos = filteredInqueritos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    const inqueritosRef = ref(db, 'surveys');
    setLoading(true);
    onValue(inqueritosRef, (snapshot) => {
      const data = snapshot.val();
      const listaInqueritos = data
        ? Object.entries(data)
            .map(([id, details]) => ({ id, ...details }))
            .filter((inquerito) => inquerito.company.id === user.id)
        : [];
      setInqueritos(listaInqueritos);
      console.log(listaInqueritos)
      setLoading(false);
    });

    onValue(ref(db, 'sectores_de_atividade'), (snapshot) => {
      setSectores(snapshot.val() || []);
    });
  }, [user.id]);

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja excluir este inquérito?')) {
      remove(ref(db, `surveys/${id}`)).then(() => {
        alert('Inquérito excluído com sucesso.');
      });
    }
  };




  const startEdit = (id, currentData) => {
    setEditingId(id);
    setEditData({ title: currentData.title, description: currentData.description });
    setAbaAtiva('editar');
  };

  const saveEdit = () => {
    if (!editData.title || !editData.description) {
      alert('Preencha todos os campos.');
      return;
    }
    update(ref(db, `surveys/${editingId}`), editData).then(() => {
      alert('Inquérito atualizado com sucesso.');
      setEditingId(null);
      setEditData({ title: '', description: '' });
      setAbaAtiva('inqueritos');
    });
  };

  const visualizarRespostas = (surveyId) => {
    setSelectedSurveyId(surveyId);
    setAbaAtiva('respostas');
  };

  return (
<Box
  sx={{
    padding: 4,
    width:'100%',
  }}
>
  <Typography
    variant="h5"
    gutterBottom
    sx={{
      fontWeight: 'bold',
      color: '#333',
      textAlign: 'center',
      marginBottom: 4,
    }}
  >
    Painel de Inquéritos
  </Typography>

  <Box
    sx={{
      display: 'flex',
      gap: 2,
      borderBottom: '1px solid #ddd',
      marginBottom: 3,
      justifyContent: 'center',
    }}
  >
    <Button
      onClick={() => setAbaAtiva('inqueritos')}
      variant={abaAtiva === 'inqueritos' ? 'contained' : 'text'}
      sx={{
        flex: 1,
        padding: 1.5,
        backgroundColor: abaAtiva === 'inqueritos' ? '#007BFF' : 'transparent',
        color: abaAtiva === 'inqueritos' ? '#fff' : '#333',
        borderRadius: 2,
        '&:hover': {
          backgroundColor: abaAtiva === 'inqueritos' ? '#0056b3' : '#f0f0f0',
        },
      }}
    >
      Inquéritos
    </Button>
    <Button
      onClick={() => setAbaAtiva('novo')}
      variant={abaAtiva === 'novo' ? 'contained' : 'text'}
      sx={{
        flex: 1,
        padding: 1.5,
        backgroundColor: abaAtiva === 'novo' ? '#007BFF' : 'transparent',
        color: abaAtiva === 'novo' ? '#fff' : '#333',
        borderRadius: 2,
        '&:hover': {
          backgroundColor: abaAtiva === 'novo' ? '#0056b3' : '#f0f0f0',
        },
      }}
    >
      Novo
    </Button>
  </Box>

  {abaAtiva === 'inqueritos' && (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 'bold',
          marginBottom: 2,
          color: '#333',
        }}
      >
        Lista de Inquéritos
      </Typography>

      <Box
        sx={{
          display: 'flex',
          gap: 2,
          marginBottom: 3,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        <TextField
          label="Pesquisar por título..."
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <FormControl fullWidth>
          <InputLabel>Setor</InputLabel>
          <Select
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value)}
            label="Setor"
          >              <MenuItem value="">Todos</MenuItem>

             {sectores.map((s) => (
                <MenuItem key={s.setor} value={s.setor}>
                  {s.setor}
                </MenuItem>
              ))}
           
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 3 }}>
          <CircularProgress />
        </Box>
      ) : filteredInqueritos.length === 0 ? (
        <Typography variant="body1" color="textSecondary" sx={{ textAlign: 'center' }}>
          Nenhum inquérito encontrado.
        </Typography>
      ) : (
        <List>
          {paginatedInqueritos.map((inq) => (
            <ListItem
              key={inq.id}
              sx={{
                border: '1px solid #ddd',
                padding: 2,
                marginBottom: 2,
                borderRadius: 2,
                boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.1)',
                backgroundColor: '#fff',
              }}
            >
              <ListItemText
                primary={inq.title}
                secondary={inq.description}
                sx={{ color: '#555' }}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  onClick={() => startEdit(inq.id, inq)}
                  color="primary"
                  variant="text"
                  sx={{ '&:hover': { color: '#0056b3' } }}
                >
                  Editar
                </Button>
                <Button
                  onClick={() => handleDelete(inq.id)}
                  color="error"
                  variant="text"
                  sx={{ '&:hover': { color: '#c62828' } }}
                >
                  Excluir
                </Button>
                <Button
                  onClick={() => visualizarRespostas(inq.id)}
                  color="secondary"
                  variant="text"
                  sx={{ '&:hover': { color: '#6d4c41' } }}
                >
                  Visualizar Respostas
                </Button>
              </Box>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  )}

  {abaAtiva === 'novo' && (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 'bold',
          marginBottom: 2,
          color: '#333',
        }}
      >
        Criar Novo Inquérito
      </Typography>
      <CriarInqueritoDesk user={user} />
    </Box>
  )}

  {abaAtiva === 'editar' && (
    <Box>
      <Typography
        variant="h6"
        sx={{
          fontWeight: 'bold',
          marginBottom: 2,
          color: '#333',
        }}
      >
        Editar Inquérito
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Título"
          variant="outlined"
          fullWidth
          value={editData.title}
          onChange={(e) =>
            setEditData({ ...editData, title: e.target.value })
          }
        />
        <TextField
          label="Descrição"
          variant="outlined"
          multiline
          rows={4}
          fullWidth
          value={editData.description}
          onChange={(e) =>
            setEditData({ ...editData, description: e.target.value })
          }
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            onClick={saveEdit}
            variant="contained"
            color="success"
            sx={{
              flex: 1,
              backgroundColor: '#2e7d32',
              '&:hover': { backgroundColor: '#1b5e20' },
            }}
          >
            Salvar
          </Button>
          <Button
            onClick={() => {
              setEditingId(null);
              setEditData({ title: '', description: '' });
              setAbaAtiva('inqueritos');
            }}
            variant="outlined"
            sx={{ flex: 1, borderColor: '#bbb', '&:hover': { borderColor: '#888' } }}
          >
            Cancelar
          </Button>
        </Box>
      </Box>
    </Box>
  )}

  {abaAtiva === 'respostas' && selectedSurveyId && (
    <VisualizarRespostasDesk
      surveyId={selectedSurveyId}
      onBack={() => setAbaAtiva('inqueritos')}
    />
  )}
</Box>

  );
};

export default InqueritosModuleDesk;

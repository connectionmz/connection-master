import React, { useState, useEffect } from 'react';
import { ref, onValue, remove, update } from 'firebase/database';
import { db } from '../../fb';
import CriarInquerito from './CriarInqueritoDesk';
import { Box, Typography, TextField, Button, MenuItem, Select, FormControl, InputLabel, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import CriarInqueritoDesk from './CriarInqueritoDesk';

const InqueritosModuleDesk = ({ user }) => {
  const [inqueritos, setInqueritos] = useState([]);
  const [abaAtiva, setAbaAtiva] = useState('inqueritos');
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({ title: '', description: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

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
            .filter((inquerito) => inquerito.company == user.id) 
        : [];
      setInqueritos(listaInqueritos);
      setLoading(false);
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

  const handleLoadMore = () => {
    if (currentPage * itemsPerPage < filteredInqueritos.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <Box sx={{ padding: 4, maxWidth: 'lg', margin: '0 auto' }}>

      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Painel de Inquéritos
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, borderBottom: 1, marginBottom: 2 }}>
        <Button
          onClick={() => setAbaAtiva('inqueritos')}
          variant={abaAtiva === 'inqueritos' ? 'contained' : 'text'}
          sx={{ flex: 1 }}
        >
          Inquéritos
        </Button>
        <Button
          onClick={() => setAbaAtiva('novo')}
          variant={abaAtiva === 'novo' ? 'contained' : 'text'}
          sx={{ flex: 1 }}
        >
          Novo
        </Button>
      </Box>

      {abaAtiva === 'inqueritos' && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 2 }}>
            Lista de Inquéritos
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, marginBottom: 4 }}>
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
              >
                <MenuItem value="">Todos os setores</MenuItem>
                <MenuItem value="Saúde">Saúde</MenuItem>
                <MenuItem value="Educação">Educação</MenuItem>
                <MenuItem value="Tecnologia">Tecnologia</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {loading ? (
            <CircularProgress />
          ) : filteredInqueritos.length === 0 ? (
            <Typography variant="body1" color="textSecondary">
              Nenhum inquérito encontrado.
            </Typography>
          ) : (
            <List>
              {paginatedInqueritos.map((inq) => (
                <ListItem key={inq.id} sx={{ border: 1, padding: 2, marginBottom: 2, borderRadius: 1 }}>
                  <ListItemText
                    primary={inq.title}
                    secondary={inq.description}
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      onClick={() => startEdit(inq.id, inq)}
                      color="primary"
                      variant="text"
                    >
                      Editar
                    </Button>
                    <Button
                      onClick={() => handleDelete(inq.id)}
                      color="error"
                      variant="text"
                    >
                      Excluir
                    </Button>
                  </Box>
                </ListItem>
              ))}
              {currentPage * itemsPerPage < filteredInqueritos.length && (
                <Button
                  onClick={handleLoadMore}
                  variant="contained"
                  color="primary"
                  sx={{ marginTop: 2 }}
                >
                  Carregar Mais
                </Button>
              )}
            </List>
          )}
        </Box>
      )}

      {abaAtiva === 'novo' && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 2 }}>
            Criar Novo Inquérito
          </Typography>
          <CriarInqueritoDesk user={user} />
        </Box>
      )}

      {abaAtiva === 'editar' && (
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold', marginBottom: 2 }}>
            Editar Inquérito
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Título"
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
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                onClick={saveEdit}
                variant="contained"
                color="success"
                sx={{ flex: 1 }}
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
                sx={{ flex: 1 }}
              >
                Cancelar
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default InqueritosModuleDesk;

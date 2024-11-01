// EditarEmpresa.js
import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get, set } from 'firebase/database';
import { useParams, useNavigate } from 'react-router-dom';
import { Snackbar, Alert, Button, TextField, Select, MenuItem, InputLabel, FormControl } from '@mui/material';

const EditarEmpresa = () => {
  const { id } = useParams(); // Obtém o ID da URL
  const navigate = useNavigate();
  const [empresa, setEmpresa] = useState(null);
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [provincia, setProvincia] = useState('Cabo Delgado');
  const [contacto, setContacto] = useState('');
  const [email, setEmail] = useState('');
  const [descricao, setDescricao] = useState('');
  const [sector, setSector] = useState('Outras Actividades');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const db = getDatabase();

  useEffect(() => {
    const fetchEmpresa = async () => {
      try {
        const snapshot = await get(ref(db, `company/${id}`));
        const data = snapshot.val();
        if (data) {
          setEmpresa(data);
          setNome(data.nome);
          setEndereco(data.endereco);
          setProvincia(data.provincia);
          setContacto(data.contacto);
          setEmail(data.email);
          setDescricao(data.descricao);
          setSector(data.sector);
        }
      } catch (error) {
        console.error('Erro ao buscar empresa:', error);
      }
    };

    fetchEmpresa();
  }, [db, id]);

  const handleSave = async (e) => {
    e.preventDefault();

    try {
      await set(ref(db, `company/${id}`), {
        nome,
        endereco,
        provincia,
        contacto,
        email,
        descricao,
        sector,
        id,
      });
      setSnackbarMessage('Empresa atualizada com sucesso!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      navigate('/'); // Navega de volta para a página inicial após salvar
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      setSnackbarMessage('Ocorreu um erro ao atualizar a empresa.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto bg-white shadow-lg rounded-md">
      <h1 className="text-2xl font-semibold mb-6 text-center">Editar Empresa</h1>
      {empresa ? (
        <form onSubmit={handleSave}>
          <TextField
            label="Nome"
            variant="outlined"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            fullWidth
            className="mb-4"
          />
          <TextField
            label="Endereço"
            variant="outlined"
            value={endereco}
            onChange={(e) => setEndereco(e.target.value)}
            fullWidth
            className="mb-4"
          />
          <FormControl fullWidth variant="outlined" className="mb-4">
            <InputLabel>Província</InputLabel>
            <Select
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
            >
              <MenuItem value="Cabo Delgado">Cabo Delgado</MenuItem>
              <MenuItem value="Maputo">Maputo</MenuItem>
              <MenuItem value="Nampula">Nampula</MenuItem>
              <MenuItem value="Sofala">Sofala</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Contacto"
            variant="outlined"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            fullWidth
            className="mb-4"
          />
          <TextField
            label="Email"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            className="mb-4"
          />
          <TextField
            label="Descrição"
            variant="outlined"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            fullWidth
            className="mb-4"
            multiline
            rows={3}
          />
          <FormControl fullWidth variant="outlined" className="mb-4">
            <InputLabel>Sector</InputLabel>
            <Select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
            >
              <MenuItem value="Actividades Administrativas e Serviços de Apoio">Actividades Administrativas e Serviços de Apoio</MenuItem>
              <MenuItem value="Actividades Artísticas, de Espectáculos, Desportivas e Recreativas">Actividades Artísticas, de Espectáculos, Desportivas e Recreativas</MenuItem>
              <MenuItem value="Actividades de Saúde Humana e Apoio Social">Actividades de Saúde Humana e Apoio Social</MenuItem>
              <MenuItem value="Comércio por Grosso ou Retalho">Comércio por Grosso ou Retalho</MenuItem>
              <MenuItem value="Consultoria, Científicas, Técnicas e Similares">Consultoria, Científicas, Técnicas e Similares</MenuItem>
              <MenuItem value="Outras Actividades">Outras Actividades</MenuItem>
            </Select>
          </FormControl>
          <div className="flex justify-end space-x-2">
            <Button variant="outlined" onClick={() => navigate('/')}>Cancelar</Button>
            <Button variant="contained" color="primary" type="submit">Atualizar</Button>
          </div>
        </form>
      ) : (
        <p>Carregando dados da empresa...</p>
      )}

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default EditarEmpresa;

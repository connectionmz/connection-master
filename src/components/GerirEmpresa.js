import React, { useState, useEffect } from 'react';
import { getDatabase, ref, get, remove, set } from 'firebase/database';
import { Snackbar, Alert, Button, TextField, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { useNavigate } from 'react-router-dom'; // Importa o hook useNavigate

const GerirEmpresas = () => {
  const [empresas, setEmpresas] = useState([]);
  const [filteredEmpresas, setFilteredEmpresas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const db = getDatabase();
  const navigate = useNavigate(); // Hook para navegação

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const snapshot = await get(ref(db, 'company'));
        const data = snapshot.val();
        if (data) {
          const empresasList = Object.values(data);
          setEmpresas(empresasList);
          setFilteredEmpresas(empresasList); // Inicializa com todas as empresas
        }
      } catch (error) {
        console.error('Erro ao buscar empresas:', error);
      }
    };

    fetchEmpresas();
  }, [db]);

const handleSearch = (e) => {
  const term = e.target.value.toLowerCase();
  setSearchTerm(term);

  const filtered = empresas.filter((empresa) =>
    (empresa.nome && empresa.nome.toLowerCase().includes(term)) || 
    (empresa.nuit && empresa.nuit.includes(term))
  );

  setFilteredEmpresas(filtered);
};


  const handleFilterBySector = (e) => {
    const selectedSector = e.target.value;
    setFilterSector(selectedSector);

    const filtered = empresas.filter((empresa) => {
      return selectedSector === '' || empresa.sector === selectedSector;
    });

    setFilteredEmpresas(filtered);
  };



  const handleDelete = async (id) => {
    try {
      await remove(ref(db, `company/${id}`));
      setSnackbarMessage('Empresa excluída com sucesso!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setEmpresas(empresas.filter((empresa) => empresa.id !== id));
      setFilteredEmpresas(filteredEmpresas.filter((empresa) => empresa.id !== id)); // Remove também da lista filtrada
    } catch (error) {
      console.error('Erro ao excluir empresa:', error);
      setSnackbarMessage('Ocorreu um erro ao excluir a empresa.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto bg-white shadow-lg rounded-md">
      <h1 className="text-2xl font-semibold mb-6 text-center">Gerir Empresas</h1>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <TextField
          label="Pesquisar por Nome ou NUIT"
          variant="outlined"
          value={searchTerm}
          onChange={handleSearch}
          fullWidth
          className="md:w-1/2 mb-4 md:mb-0"
        />
        <FormControl fullWidth variant="outlined" className="md:w-1/2">
          <InputLabel>Filtrar por Sector</InputLabel>
          <Select
            label="Filtrar por Sector"
            value={filterSector}
            onChange={handleFilterBySector}
          >
            <MenuItem value="">Todos os sectores</MenuItem>
            <MenuItem value="Actividades Administrativas e Serviços de Apoio">Actividades Administrativas e Serviços de Apoio</MenuItem>
            <MenuItem value="Actividades Artísticas, de Espectáculos, Desportivas e Recreativas">Actividades Artísticas, de Espectáculos, Desportivas e Recreativas</MenuItem>
            <MenuItem value="Actividades de Saúde Humana e Apoio Social">Actividades de Saúde Humana e Apoio Social</MenuItem>
            <MenuItem value="Actividades Financeiras e de Seguros">Actividades Financeiras e de Seguros</MenuItem>
            <MenuItem value="Agricultura, Produção Animal, Caça, Floresta e Pesca">Agricultura, Produção Animal, Caça, Floresta e Pesca</MenuItem>
            <MenuItem value="Comércio por Grosso ou Retalho">Comércio por Grosso ou Retalho</MenuItem>
            <MenuItem value="Construção">Construção</MenuItem>
            <MenuItem value="Consultoria, Científicas, Técnicas e Similares">Consultoria, Científicas, Técnicas e Similares</MenuItem>
            <MenuItem value="Educação">Educação</MenuItem>
            <MenuItem value="Transportes e Armazenagem">Transportes e Armazenagem</MenuItem>
            <MenuItem value="Outras Actividades">Outras Actividades</MenuItem>
          </Select>
        </FormControl>
      </div>
      <h2 className="text-xl font-semibold mb-4">Empresas Cadastradas</h2>
      <div className="space-y-4">
        {filteredEmpresas.map((empresa) => (
          <div key={empresa.id} className="border p-4 rounded-md shadow-sm bg-gray-50">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">{empresa.nome}</h3>
                <p>{empresa.endereco}, {empresa.provincia}</p>
                <p>{empresa.contacto}</p>
                <p>{empresa.email}</p>
                {empresa.nuit && <p><strong>NUIT:</strong> {empresa.nuit}</p>}
                <p><strong>Sector:</strong> {empresa.sector}</p>
              </div>
              <div className="flex space-x-2">
                <a variant="outlined" color="primary" href={`/editar/${empresa.id}`}>Editar</a>
                <Button variant="outlined" color="secondary" onClick={() => handleDelete(empresa.id)}>Excluir</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default GerirEmpresas;

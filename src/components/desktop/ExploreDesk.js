import React, { useEffect, useState } from 'react';
import { get, ref, onValue } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Box,
  CardActionArea,
  Avatar,
  useMediaQuery,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { db } from '../../fb';

const Explore = ({ user }) => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedSubsector, setSelectedSubsector] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedTipoEntidade, setSelectedTipoEntidade] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [provincias, setProvincias] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [subsectores, setSubsectores] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [tiposEntidades, setTiposEntidades] = useState([]);
  const [sortOrder, setSortOrder] = useState('asc'); // Estado para ordenação
  const navigate = useNavigate();
  const defaultLogoUrl = 'https://via.placeholder.com/150';
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesRef = ref(db, 'company');
        const snapshot = await get(companiesRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const empresasList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setCompanies(empresasList);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
    };

    onValue(ref(db, 'provincias'), (snapshot) => {
      setProvincias(snapshot.val() || []);
    });

    onValue(ref(db, 'sectores_de_atividade'), (snapshot) => {
      setSectores(snapshot.val() || []);
    });

    onValue(ref(db, 'tipos_entidades'), (snapshot) => {
      setTiposEntidades(snapshot.val() || []);
    });

    fetchCompanies();
  }, []);

  const handleSectorChange = (e) => {
    const selectedSector = e.target.value;
    setSelectedSector(selectedSector);
    const foundSector = sectores.find((s) => s.setor === selectedSector);
    setSubsectores(foundSector ? foundSector.subsectores : []);
    setSelectedSubsector('');
  };

  const handleProvinceChange = (e) => {
    const selectedProvince = e.target.value;
    setSelectedProvince(selectedProvince);
    const foundProvince = provincias.find((p) => p.provincia === selectedProvince);
    setDistritos(foundProvince ? foundProvince.distritos : []);
    setSelectedDistrict('');
  };

  const handleSortOrderChange = (e) => {
    setSortOrder(e.target.value); // Atualiza o estado da ordenação
  };

  const filteredCompanies = companies
    .filter((company) => {
      const matchesSearch = company.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSector = selectedSector ? company.sector === selectedSector : true;
      const matchesSubsector = selectedSubsector ? company.subsector === selectedSubsector : true;
      const matchesProvince = selectedProvince ? company.provincia === selectedProvince : true;
      const matchesDistrict = selectedDistrict ? company.distrito === selectedDistrict : true;
      const matchesTipoEntidade = selectedTipoEntidade ? company.tipoEntidade === selectedTipoEntidade : true;
      return matchesSearch && matchesSector && matchesSubsector && matchesProvince && matchesDistrict && matchesTipoEntidade;
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' });
      } else {
        return b.nome.localeCompare(a.nome, 'pt', { sensitivity: 'base' });
      }
    });

  const handleCompanyClick = (companyId) => {
    navigate(`/perfil/${companyId}`);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box width="100%" minHeight="100vh" sx={{ backgroundColor: 'white' }} p={isMobile ? 2 : 4}>
      <br />
      <Typography variant="h4" gutterBottom textAlign="center" fontWeight="bold">
        Empresas
      </Typography>
      <Box
        display="flex"
        flexDirection={isMobile ? 'column' : 'row'}
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        mb={4}
      >
        <TextField
          variant="outlined"
          label="Pesquisar empresas"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon />,
          }}
          fullWidth
          sx={{ maxWidth: isMobile ? '100%' : 400 }}
        />
         {/* Seletor de Ordenação */}
      <Box  justifyContent="flex-end" mb={2}>
        <Select
          value={sortOrder}
          onChange={handleSortOrderChange}
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="asc">A-Z</MenuItem>
          <MenuItem value="desc">Z-A</MenuItem>
        </Select>
      </Box>
        <Button
          variant="contained"
          startIcon={<FilterListIcon />}
          onClick={openModal}
          fullWidth={isMobile}
          sx={{ maxWidth: isMobile ? '100%' : 'auto' }}
        >
          Filtros
        </Button>
      </Box>

     

      {/* Modal de Filtros */}
      <Dialog open={isModalOpen} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle>Filtros</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField
              select
              label="Setor"
              value={selectedSector}
              onChange={handleSectorChange}
            >
              <MenuItem value="">Todos</MenuItem>
              {sectores.map((s) => (
                <MenuItem key={s.setor} value={s.setor}>
                  {s.setor}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Subsector"
              value={selectedSubsector}
              onChange={(e) => setSelectedSubsector(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {subsectores.map((sub, index) => (
                <MenuItem key={index} value={sub}>
                  {sub}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Província"
              value={selectedProvince}
              onChange={handleProvinceChange}
            >
              <MenuItem value="">Todas</MenuItem>
              {provincias.map((prov) => (
                <MenuItem key={prov.provincia} value={prov.provincia}>
                  {prov.provincia}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Distrito"
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {distritos.map((dist, index) => (
                <MenuItem key={index} value={dist}>
                  {dist}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Tipo de Entidade"
              value={selectedTipoEntidade}
              onChange={(e) => setSelectedTipoEntidade(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {tiposEntidades.map((ent) => (
                <MenuItem key={ent.tipo} value={ent.tipo}>
                  {ent.tipo}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeModal}>Cancelar</Button>
          <Button variant="contained" onClick={closeModal}>
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Informação sobre o número de empresas encontradas */}
      <Typography variant="subtitle1" gutterBottom>
        {filteredCompanies.length === 0
          ? 'Nenhuma empresa encontrada.'
          : `Mostrando ${filteredCompanies.length} empresa(s) encontrada(s).`}
      </Typography>

      {/* Lista de Empresas */}
      <Grid container spacing={isMobile ? 2 : 4}>
        {filteredCompanies.map((store) => (
          <Grid item key={store.id} xs={6} sm={4} md={3} lg={2} display="flex" justifyContent="center">
            <Card
              sx={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid #ccc',
                p: 2,
                textAlign: 'center',
              }}
            >
              <CardActionArea onClick={() => handleCompanyClick(store.id)}>
                <Avatar
                  src={store.logoUrl || defaultLogoUrl}
                  alt={`Logotipo de ${store.nome}`}
                  sx={{
                    width: 64,
                    height: 64,
                    mb: 1,
                    margin: '0 auto',
                  }}
                />
                <CardContent sx={{ p: 0 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textTransform: 'capitalize',
                    }}
                  >
                    {store.sigla || store.nome}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      fontSize: 12,
                    }}
                  >
                    {store.sector || 'Setor não especificado'}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Explore;
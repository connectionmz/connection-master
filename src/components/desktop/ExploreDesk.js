import React, { useEffect, useState } from 'react';
import { get, ref, onValue } from 'firebase/database';
import { db } from '../../fb';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  CardMedia,
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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

const ExploreDesk = () => {
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
  const navigate = useNavigate();
  const defaultLogoUrl = 'https://via.placeholder.com/150';

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesRef = ref(db, 'company');
        const snapshot = await get(companiesRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const companyList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setCompanies(companyList);
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
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' }));

  const handleCompanyClick = (companyId) => {
    navigate(`/vperfil/${companyId}`);
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
    <Box width='100%' minHeight="100vh">
      <Typography variant="h4" gutterBottom>
        Empresas Disponíveis
      </Typography>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <TextField
          variant="outlined"
          label="Pesquisar empresas"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon />,
          }}
          fullWidth
          sx={{ maxWidth: 400 }}
        />
        <Button
          variant="contained"
          startIcon={<FilterListIcon />}
          onClick={openModal}
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

      {/* Lista de Empresas */}
      <Grid container spacing={4}>
        {filteredCompanies.map((company) => (
          <Grid item xs={12} sm={6} md={4} key={company.id}>
            <Card onClick={() => handleCompanyClick(company.id)} sx={{ cursor: 'pointer' }}>
              <Box
                sx={{
                  width: '100%',
                  height: '140px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#f5f5f5',
                  overflow: 'hidden',
                }}
              >
                <CardMedia
                  component="img"
                  image={company.logoUrl || defaultLogoUrl}
                  alt={`${company.nome} logo`}
                  sx={{
                    width: 'auto',
                    height: '100%',
                    objectFit: 'contain',
                  }}
                />
              </Box>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {company.nome}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {company.sector}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ExploreDesk;

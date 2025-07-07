import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
  Pagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { db2 } from '../../fb';

const Explore = React.memo(({ user }) => {
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
  const [sortOrder, setSortOrder] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const navigate = useNavigate();
  const defaultLogoUrl = 'https://via.placeholder.com/150';
  const isMobile = useMediaQuery('(max-width:600px)');

  // Carregar dados iniciais
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesRef = ref(db2, 'company');
        const snapshot = await get(companiesRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          console.log('Dados das empresas:', data);
          const empresasList = Object.keys(data)
            .map((key) => ({
              id: key,
              ...data[key],
            }))
            // Filter out the current user's company only if user exists and has an id
            .filter((empresa) => !user?.id || empresa.id !== user.id);
          setCompanies(empresasList);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
    };
    
    onValue(ref(db2, 'provincias'), (snapshot) => {
      setProvincias(snapshot.val() || []);
    });

    onValue(ref(db2, 'sectores_de_atividade'), (snapshot) => {
      setSectores(snapshot.val() || []);
    });

    onValue(ref(db2, 'tipos_entidades'), (snapshot) => {
      setTiposEntidades(snapshot.val() || []);
    });

    fetchCompanies();
  }, [user?.id]); // Only re-run if user.id changes

  // Atualizar subsectores quando o setor é alterado
  useEffect(() => {
    if (selectedSector) {
      const foundSector = sectores.find((s) => s.setor === selectedSector);
      setSubsectores(foundSector ? foundSector.subsectores : []);
    } else {
      setSubsectores([]);
    }
    setSelectedSubsector(''); // Resetar subsector ao mudar o setor
  }, [selectedSector, sectores]);

  // Atualizar distritos quando a província é alterada
  useEffect(() => {
    if (selectedProvince) {
      const foundProvince = provincias.find((p) => p.provincia === selectedProvince);
      setDistritos(foundProvince ? foundProvince.distritos : []);
    } else {
      setDistritos([]);
    }
    setSelectedDistrict(''); // Resetar distrito ao mudar a província
  }, [selectedProvince, provincias]);

  // Funções de filtro
  const filteredCompanies = useMemo(() => {
    return companies.filter((company) => {
      const matchesSearch = company.nome?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSector = selectedSector
        ? company.sector?.toLowerCase() === selectedSector.toLowerCase()
        : true;
      const matchesSubsector = selectedSubsector
        ? company.subsectores?.some((sub) => sub.toLowerCase() === selectedSubsector.toLowerCase())
        : true;
      const matchesProvince = selectedProvince
        ? company.provincia?.toLowerCase() === selectedProvince.toLowerCase()
        : true;
      const matchesDistrict = selectedDistrict
        ? company.distrito?.toLowerCase() === selectedDistrict.toLowerCase()
        : true;
      const matchesTipoEntidade = selectedTipoEntidade
        ? company.tipoEntidade?.toLowerCase() === selectedTipoEntidade.toLowerCase()
        : true;
      return (
        matchesSearch &&
        matchesSector &&
        matchesSubsector &&
        matchesProvince &&
        matchesDistrict &&
        matchesTipoEntidade
      );
    }).sort((a, b) => {
      if (sortOrder === 'asc') {
        return a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' });
      } else {
        return b.nome.localeCompare(a.nome, 'pt', { sensitivity: 'base' });
      }
    });
  }, [
    companies,
    searchTerm,
    selectedSector,
    selectedSubsector,
    selectedProvince,
    selectedDistrict,
    selectedTipoEntidade,
    sortOrder,
  ]);

  // Paginação
  const currentCompanies = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredCompanies.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredCompanies, currentPage, itemsPerPage]);

  // Navegação para o perfil da empresa
  const handleCompanyClick = useCallback((companyId) => {
    navigate(`/perfil/${companyId}`);
  }, [navigate]);

  // Abrir e fechar modal de filtros
  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

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
        <Box justifyContent="flex-end" mb={2}>
          <Select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
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
              onChange={(e) => setSelectedSector(e.target.value)}
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
              disabled={!selectedSector}
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
              onChange={(e) => setSelectedProvince(e.target.value)}
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
              disabled={!selectedProvince}
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

      {/* Resultados */}
      <Typography variant="subtitle1" gutterBottom>
        {filteredCompanies.length === 0
          ? 'Nenhuma empresa encontrada.'
          : `Mostrando ${filteredCompanies.length} empresa(s) encontrada(s).`}
      </Typography>

      <Grid container spacing={isMobile ? 2 : 4}>
        {currentCompanies.map((store) => (
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

      {/* Paginação */}
      <Box display="flex" justifyContent="center" mt={4}>
        <Pagination
          count={Math.ceil(filteredCompanies.length / itemsPerPage)}
          page={currentPage}
          onChange={(e, value) => setCurrentPage(value)}
          color="primary"
        />
      </Box>
    </Box>
  );
});

export default Explore;
import React, { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../fb';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  CircularProgress,
  Box,
  Button,
  useMediaQuery,
} from '@mui/material';
import BackButton from '../BackButton';

const ListaDeServicosDesk = ({ user }) => {
  const { categoriaId } = useParams();
  const [servicos, setServicos] = useState({});
  const [companies, setCompanies] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar dados da categoria
        const servicosRef = ref(db, 'categoriasExternas');
        const servicosSnapshot = await get(servicosRef);
        
        if (servicosSnapshot.exists()) {
          const data = servicosSnapshot.val();
          const categoriaSelecionada = Object.values(data).find(
            (categoria) => categoria.name === categoriaId
          );
          setServicos(categoriaSelecionada || {});
        } else {
          setServicos({});
        }

        // Buscar empresas
        const companiesRef = ref(db, 'company');
        const companiesSnapshot = await get(companiesRef);
        
        if (companiesSnapshot.exists()) {
          const data = companiesSnapshot.val();
          const allCompanies = Object.keys(data).map((key) => ({
            id: key,
            ...data[key]
          }));

          // Filtra empresas pela categoria
          const filteredCompanies = allCompanies.filter(
            (company) => company.categoriaExterna === categoriaId
          );

          // Filtro adicional por província se o usuário estiver logado
          const finalCompanies = user?.provincia 
            ? filteredCompanies.filter(company => company.provincia === user.provincia)
            : filteredCompanies;

          setCompanies(finalCompanies);
        } else {
          setCompanies([]);
        }
      } catch (error) {
        setError('Erro ao carregar dados.');
        console.error('Erro:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoriaId, user?.provincia]);

  const handleCompanyClick = (companyId) => {
    navigate(`/perfil/${companyId}`);
  };

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  const maxDescriptionLength = 200;
  const truncatedDescription =
    servicos.notes && servicos.notes.length > maxDescriptionLength
      ? servicos.notes.slice(0, maxDescriptionLength) + '...'
      : servicos.notes;

  return (
    <Box width="100%" minHeight="100vh" p={isMobile ? 2 : 4}>
      <br />
      <BackButton sx={{ mb: 2 }} />

      <Typography variant="h5" sx={{ fontWeight: 'bold', marginBottom: 2 }}>
        {servicos.name}
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: 2, whiteSpace: 'pre-line' }}>
        {showFullDescription ? servicos.notes : truncatedDescription}
      </Typography>
      {servicos.notes && servicos.notes.length > maxDescriptionLength && (
        <Box sx={{ textAlign: 'left', mt: 1 }}>
          <Button
            onClick={toggleDescription}
            sx={{
              color: '#1976d2',
              textTransform: 'none',
              fontWeight: 'bold',
              padding: 0,
              minHeight: 0,
              minWidth: 0,
            }}
          >
            {showFullDescription ? 'ver menos' : 'ver mais'}
          </Button>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ textAlign: 'center' }}>
          {error}
        </Typography>
      ) : companies.length > 0 ? (
        <Grid container spacing={isMobile ? 2 : 4}>
          {companies.map((company) => (
            <Grid item xs={12} sm={6} md={4} key={company.id}>
              <Card
                sx={{
                  padding: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  },
                }}
                onClick={() => handleCompanyClick(company.id)}
              >
                <Avatar
                  alt={company.nome}
                  src={company.logoUrl || '/images/default-logo.png'}
                  sx={{ width: 60, height: 60, marginBottom: 2 }}
                />
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                    {company.nome}
                  </Typography>
                  <Typography variant="body2" sx={{ textAlign: 'center', color: 'gray' }}>
                    {company.sector}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body2" sx={{ color: 'gray', textAlign: 'center', width: '100%', marginTop: 4 }}>
          Nenhuma empresa encontrada para esta categoria.
        </Typography>
      )}
    </Box>
  );
};

export default ListaDeServicosDesk;
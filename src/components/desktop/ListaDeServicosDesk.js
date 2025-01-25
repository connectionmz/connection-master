import React, { useEffect, useState } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../fb';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  CircularProgress,
  Button,
  Box,
} from '@mui/material';
import BackButton from '../BackButton';

const ListaDeServicosDesk = () => {
  const { categoriaId } = useParams();
  const [servicos, setServicos] = useState([]);
  const [companies, setCompanies] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Observa os serviços
    const servicosRef = ref(db, `servicosExternos/${categoriaId}`);
    const unsubscribe = onValue(servicosRef, (snapshot) => {
      const data = snapshot.val();
      console.log(data)
      if (data) {
        setServicos(data);
      } else {
        setServicos([]);
      }
      setLoading(false)

    });

    const fetchCompanies = async () => {
      try {
        const companiesRef = ref(db, 'company');
        const snapshot = await get(companiesRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const companyList = Object.keys(data)
            .map((key) => ({
              id: key,
              ...data[key],
            }))
            .filter((company) => company.categoriaExterna === categoriaId); // Filtra por categoria
          setCompanies(companyList);
        } else {
          setCompanies([]);
        }
      } catch (error) {
        console.error('Erro ao buscar empresas:', error);
      }
      setLoading(false)
    };

    fetchCompanies();

    // Cleanup para desinscrever listeners
    return () => unsubscribe();
  }, [categoriaId]);

  const handleCompanyClick = (companyId) => {
    navigate(`/vperfil/${companyId}`);
  };


  return (
    <Box width='100%' minHeight="100vh">
            <BackButton sx={{ mb: 2 }} />

      <Typography variant="h5" sx={{ fontWeight: 'bold', marginBottom: 2 }}>
        Empresas Relacionadas
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error" sx={{ textAlign: 'center' }}>
          {error}
        </Typography>
      ) : companies.length > 0 ? (
        <Grid container spacing={4}>
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

      <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#0a66c2',
            '&:hover': {
              backgroundColor: '#084b92',
            },
          }}
        >
          Ver todas as empresas
        </Button>
      </Box>
    </Box>
  );
};

export default ListaDeServicosDesk;

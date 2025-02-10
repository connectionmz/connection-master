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
  Box,
} from '@mui/material';
import BackButton from '../BackButton';

const ListaDeServicosDesk = ({ user }) => {
  const { categoriaId } = useParams();
  const [servicos, setServicos] = useState({});
  const [companies, setCompanies] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
   

    const servicosRef = ref(db, `categoriasExternas`);
    const unsubscribe = onValue(
      servicosRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const categoriaSelecionada = Object.values(data).find(
            (categoria) => categoria.name === categoriaId
          );
  
          if (categoriaSelecionada) {
            setServicos(categoriaSelecionada);
          } else {
            setServicos({});
          }
        } else {
          setServicos({});
        }
        setLoading(false);
      },
      (error) => {
        setError('Erro ao carregar categorias.');
        console.error('Erro ao carregar categorias:', error);
      }
    );

    const fetchCompanies = async () => {
      try {
        const companiesRef = ref(db, 'company');
        const snapshot = await get(companiesRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const companyList = Object.keys(data)
            .map((key) => ({
              id: key,
              nome: data[key].nome,
              logoUrl: data[key].logoUrl,
              sector: data[key].sector,
            }))
            .filter(
              (company) =>
                data[company.id].categoriaExterna === categoriaId &&
                data[company.id].provincia === user.provincia
            );
          setCompanies(companyList);
        } else {
          setCompanies([]);
        }
      } catch (error) {
        setError('Erro ao buscar empresas.');
        console.error('Erro ao buscar empresas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();

    return () => unsubscribe();
  }, [categoriaId, user.provincia]);

  const handleCompanyClick = (companyId) => {
    navigate(`/perfil/${companyId}`);
  };

  // Acessar a categoria específica com base no categoriaId
  const categoriaSelecionada = servicos[categoriaId] || {};




  return (
    <Box width='100%' minHeight="100vh">
      <br />
      <BackButton sx={{ mb: 2 }} />

      {/* Exibir o nome e as notas da categoria selecionada */}
      <Typography variant="h5" sx={{ fontWeight: 'bold', marginBottom: 2 }}>
        {servicos.name}
      </Typography>
      <Typography variant="body1" sx={{ marginBottom: 2, whiteSpace: 'pre-line' }}>
        {servicos.notes}
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
    </Box>
  );
};

export default ListaDeServicosDesk;
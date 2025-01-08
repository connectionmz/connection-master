import React, { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../fb';
import { Grid, Card, CardContent, Typography, Avatar, CircularProgress, Button } from '@mui/material';

const ListaDeServicosDesk = () => {
  const { categoriaId } = useParams();
  const [servicos, setServicos] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Função para buscar os serviços de forma pontual
    const fetchServices = async () => {
      try {
        const servicosRef = ref(db, 'servicosExternos/');
        const snapshot = await get(servicosRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const servicosList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
          setServicos(servicosList);
        } else {
          setServicos([]);
        }
      } catch (error) {
        console.error('Erro ao buscar serviços:', error);
      }
    };

    // Função para buscar empresas relacionadas à categoria
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
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
    fetchCompanies();
  }, [categoriaId]);

  const handleCompanyClick = (companyId) => {
    navigate(`/vperfil/${companyId}`);
  };

  return (
    <div className="p-4 bg-white">
      <h2 className="text-xl font-bold mb-4">Empresas Relacionadas</h2>
      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={4}>
          {companies.length > 0 ? (
            companies.map((company) => (
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
                    src={company.logoUrl || 'default-logo.png'}
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
            ))
          ) : (
            <Typography variant="body2" sx={{ color: 'gray', textAlign: 'center', width: '100%' }}>
              Nenhuma empresa encontrada para esta categoria.
            </Typography>
          )}
        </Grid>
      )}
      <Button
        variant="contained"
        sx={{
          marginTop: 2,
          backgroundColor: '#0a66c2',
          '&:hover': {
            backgroundColor: '#0a66c2',
          },
        }}
      >
        Ver todas as empresas
      </Button>
    </div>
  );
};

export default ListaDeServicosDesk;

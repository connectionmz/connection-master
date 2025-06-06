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
  Chip,
  Paper,
  Divider,
  useTheme,
  Skeleton
} from '@mui/material';
import {
  LocationOn,
  Star,
  Business,
  ExpandMore,
  ExpandLess,
  ArrowBack,
  SearchOff
} from '@mui/icons-material';
import BackButton from '../BackButton';

const ServiceListing = ({ user }) => {
  const { categoriaId } = useParams();
  const [category, setCategory] = useState({});
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');
  const theme = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch category data
        const categoryRef = ref(db, 'categoriasExternas');
        const categorySnapshot = await get(categoryRef);
        
        if (categorySnapshot.exists()) {
          const data = categorySnapshot.val();
          const selectedCategory = Object.values(data).find(
            cat => cat.name === categoriaId
          );
          setCategory(selectedCategory || {});
        }

        // Fetch companies
        const companiesRef = ref(db, 'company');
        const companiesSnapshot = await get(companiesRef);
        
        if (companiesSnapshot.exists()) {
          const data = companiesSnapshot.val();
          const allCompanies = Object.keys(data).map(key => ({
            id: key,
            ...data[key]
          }));

          // Filter by category and province
          const filteredCompanies = allCompanies.filter(company => {
            const matchesCategory = company.categoriaExterna === categoriaId;
            const matchesProvince = !user?.provincia || company.provincia === user.provincia;
            return matchesCategory && matchesProvince;
          });

          setCompanies(filteredCompanies);
        }
      } catch (err) {
        setError('Failed to load data. Please try again.');
        console.error('Error:', err);
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
    setExpanded(!expanded);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: theme.palette.background.default,
      py: 4,
      px: isMobile ? 2 : 4
    }}>
      <Box sx={{
        maxWidth: '1400px',
        mx: 'auto',
        position: 'relative'
      }}>
        {/* Back Button */}
      <BackButton/>
      <br/><br/>
        {/* Category Header */}
        <Paper elevation={0} sx={{
          p: 4,
          mb: 4,
          background: theme.palette.mode === 'light'
            ? 'linear-gradient(to right, #f5f7fa, #e4e8eb)'
            : 'linear-gradient(to right, #1a1a1a, #2a2a2a)',
          border: `1px solid ${theme.palette.divider}`
        }}>
          {loading ? (
            <>
              <Skeleton variant="text" width="60%" height={40} />
              <Skeleton variant="text" width="100%" height={24} />
              <Skeleton variant="text" width="100%" height={24} />
            </>
          ) : (
            <>
              <Typography variant="h6" sx={{
                mb: 2,
                background: 'linear-gradient(90deg, #1976d2, #00b4d8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                {category.name || categoriaId}
              </Typography>

              <Typography variant="body1" sx={{
                mb: 2,
                lineHeight: 1.7,
                display: '-webkit-box',
                WebkitLineClamp: expanded ? 'unset' : 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {category.notes || 'No description available'}
              </Typography>

              {category.notes?.length > 200 && (
                <Button
                  onClick={toggleDescription}
                  endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                  sx={{
                    color: theme.palette.primary.main,
                    textTransform: 'none',
                    fontWeight: 600,
                    px: 2,
                    py: 0.5,
                    '&:hover': {
                      backgroundColor: 'transparent'
                    }
                  }}
                >
                  {expanded ? 'Mostrar menos' : 'Mostrar Mais'}
                </Button>
              )}
            </>
          )}
        </Paper>

        <Box sx={{ mb: 6 }}>
          {loading ? (
            <Grid container spacing={3}>
              {[...Array(6)].map((_, index) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card sx={{ height: '100%' }}>
                    <Skeleton variant="rectangular" height={140} />
                    <CardContent>
                      <Skeleton variant="text" height={32} />
                      <Skeleton variant="text" height={24} width="60%" />
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : error ? (
            <Paper elevation={0} sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 4,
              backgroundColor: theme.palette.error.light,
              color: theme.palette.error.contrastText
            }}>
              <Typography variant="h6">{error}</Typography>
              <Button
                variant="contained"
                color="error"
                sx={{ mt: 2 }}
                onClick={() => window.location.reload()}
              >
                Recarregar
              </Button>
            </Paper>
          ) : companies.length > 0 ? (
            <>
              <Typography variant="h6" sx={{
                mb: 3,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                {companies.length} {companies.length === 1 ? 'Empresa Encontrada' : 'Empresa Encontradas'}
              </Typography>

              <Grid container spacing={3}>
                {companies.map((company) => (
                  <Grid item xs={12} sm={6} md={4} lg={3} key={company.id}>
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 3,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 10px 20px rgba(0,0,0,0.1)'
                        }
                      }}
                      onClick={() => handleCompanyClick(company.id)}
                    >
                      <Box sx={{
                        height: '140px',
                        position: 'relative',
                        background: company.logoUrl
                          ? `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url(${company.logoUrl}) center/cover`
                          : theme.palette.mode === 'light'
                            ? 'linear-gradient(135deg, #1976d2, #00b4d8)'
                            : 'linear-gradient(135deg, #0d47a1, #1976d2)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Avatar
                          alt={company.nome}
                          src={company.logoUrl}
                          sx={{
                            width: 80,
                            height: 80,
                            border: '3px solid white',
                            boxShadow: theme.shadows[3]
                          }}
                        />
                      </Box>

                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" sx={{
                          fontWeight: 700,
                          textAlign: 'center',
                          mb: 1,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          {company.nome}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          mt: 1.5
                        }}>
                          <LocationOn color="action" fontSize="small" />
                          <Typography variant="body2" color="text.secondary">
                            {company.provincia || 'Location not specified'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            <Paper elevation={0} sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 4,
              backgroundColor: theme.palette.background.paper}}>
              <Typography variant="h5" sx={{ mb: 1 }}>
               Nada Enconctrado
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
};
export default ServiceListing;
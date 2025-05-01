import React, { useState, useEffect } from 'react';
import {
  Tab,
  Tabs,
  Box,
  Typography,
  Grid,
  Avatar,
  Card,
  CardContent,
  useMediaQuery,
  CardMedia,
  Chip,
  Divider,
  Skeleton,
  useTheme
} from '@mui/material';
import { ref, get } from 'firebase/database';
import { db } from '../../fb';
import { useNavigate } from 'react-router-dom';
import {
  Business as BusinessIcon,
  AttachMoney as FinanciadorIcon,
  Handshake as ParceiroIcon,
  Star as PatrocinadorIcon
} from '@mui/icons-material';

// Componente para exibir um card de empresa
const CompanyCard = ({ item, categoryIndex, onClick }) => {
  const theme = useTheme();
  
  const getCategoryIcon = () => {
    switch (categoryIndex) {
      case 0: return <ParceiroIcon color="primary" />;
      case 1: return <FinanciadorIcon color="primary" />;
      case 2: return <PatrocinadorIcon color="primary" />;
      default: return <BusinessIcon color="primary" />;
    }
  };

  return (
    <Grid item xs={12} sm={6} md={4} lg={3}>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: theme.shadows[6],
            cursor: 'pointer'
          },
          borderRadius: 2,
          overflow: 'hidden',
          position: 'relative'
        }}
        onClick={onClick}
      >
        <CardMedia
          component="div"
          sx={{
            height: 100,
            backgroundColor: theme.palette.primary.light,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {getCategoryIcon()}
        </CardMedia>

        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '-40px',
          zIndex: 1
        }}>
          <Avatar
            src={item.logo}
            alt={item.nome}
            sx={{
              width: 80,
              height: 80,
              border: `3px solid ${theme.palette.background.paper}`,
              boxShadow: theme.shadows[3]
            }}
          />
        </Box>

        <CardContent sx={{
          flexGrow: 1,
          textAlign: 'center',
          pt: 6,
          pb: 2
        }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              mb: 1,
              color: theme.palette.text.primary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {item.nome}
          </Typography>

          {item.sector && (
            <Chip
              label={item.sector}
              size="small"
              sx={{
                mb: 1,
                backgroundColor: theme.palette.action.selected,
                color: theme.palette.text.secondary
              }}
            />
          )}

          <Divider sx={{ my: 1 }} />
        </CardContent>
      </Card>
    </Grid>
  );
};

// Componente para exibir skeleton loading
const CompanySkeleton = () => (
  <Grid item xs={12} sm={6} md={4} lg={3}>
    <Card sx={{ height: '100%' }}>
      <Skeleton variant="rectangular" width="100%" height={160} />
      <CardContent>
        <Skeleton width="60%" />
        <Skeleton width="40%" />
        <Skeleton width="80%" />
      </CardContent>
    </Card>
  </Grid>
);

// Componente para exibir quando não há dados
const EmptyState = ({ message }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{
      textAlign: 'center',
      py: 8,
      backgroundColor: theme.palette.background.default,
      borderRadius: 2
    }}>
      <Typography variant="h6" color="textSecondary">
        {message}
      </Typography>
    </Box>
  );
};

// Componente principal
const ParceirosInvestidoresDesk = () => {
  const [value, setValue] = useState(0);
  const [companies, setCompanies] = useState({
    parceiros: [],
    financiadores: [],
    patrocinadores: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const snapshot = await get(ref(db, 'parceiros'));
        
        if (snapshot.exists()) {
          const allCompanies = Object.values(snapshot.val());
          
          setCompanies({
            parceiros: allCompanies.filter(c => c.tipo === 'Parceiro'),
            financiadores: allCompanies.filter(c => c.tipo === 'Financiador'),
            patrocinadores: allCompanies.filter(c => c.tipo === 'Patrocinador' || c.tipo === 'Investidor')
          });
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  const handleTabChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleCompanyClick = (companyId) => {
    navigate(`/perfil/${companyId}`);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {[...Array(8)].map((_, index) => (
            <CompanySkeleton key={index} />
          ))}
        </Grid>
      );
    }

    switch (value) {
      case 0:
        return companies.parceiros.length > 0 ? (
          <Grid container spacing={3}>
            {companies.parceiros.map((parceiro) => (
              <CompanyCard
                key={parceiro.companyId}
                item={parceiro}
                categoryIndex={0}
                onClick={() => handleCompanyClick(parceiro.companyId)}
              />
            ))}
          </Grid>
        ) : <EmptyState message="Nenhum parceiro encontrado" />;
      
      case 1:
        return companies.financiadores.length > 0 ? (
          <Grid container spacing={3}>
            {companies.financiadores.map((financiador) => (
              <CompanyCard
                key={financiador.companyId}
                item={financiador}
                categoryIndex={1}
                onClick={() => handleCompanyClick(financiador.companyId)}
              />
            ))}
          </Grid>
        ) : <EmptyState message="Nenhum financiador encontrado" />;
      
      case 2:
        return companies.patrocinadores.length > 0 ? (
          <Grid container spacing={3}>
            {companies.patrocinadores.map((patrocinador) => (
              <CompanyCard
                key={patrocinador.companyId}
                item={patrocinador}
                categoryIndex={2}
                onClick={() => handleCompanyClick(patrocinador.companyId)}
              />
            ))}
          </Grid>
        ) : <EmptyState message="Nenhum patrocinador encontrado" />;
      
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 'lg',
        mx: 'auto',
        px: isMobile ? 2 : 4,
        py: 4
      }}
    >
      {/* Cabeçalho */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant={isMobile ? 'h5' : 'h4'}
          sx={{
            fontWeight: 'bold',
            mb: 2,
            color: theme.palette.primary.main
          }}
        >
          Nossos Parceiros e Apoiadores
        </Typography>
        <Typography
          variant="subtitle1"
          sx={{
            color: theme.palette.text.secondary,
            maxWidth: 700,
            mx: 'auto'
          }}
        >
          Conheça as empresas e organizações que fazem parte da nossa rede de colaboração
        </Typography>
      </Box>

      {/* Tabs */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Tabs
          value={value}
          onChange={handleTabChange}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons={isMobile ? 'auto' : false}
          allowScrollButtonsMobile
          sx={{
            '& .MuiTabs-indicator': {
              height: 4,
              borderRadius: 2
            },
            '& .MuiTab-root': {
              minWidth: 'unset',
              px: 3,
              py: 1,
              mx: 1,
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 'bold',
              fontSize: isMobile ? '0.875rem' : '1rem',
              '&.Mui-selected': {
                color: theme.palette.primary.contrastText,
                backgroundColor: theme.palette.primary.main,
                boxShadow: theme.shadows[2]
              }
            }
          }}
        >
          <Tab label="Parceiros" icon={isMobile ? null : <ParceiroIcon />} iconPosition="start" />
          <Tab label="Financiadores" icon={isMobile ? null : <FinanciadorIcon />} iconPosition="start" />
          <Tab label="Patrocinadores" icon={isMobile ? null : <PatrocinadorIcon />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Conteúdo */}
      <Box sx={{ mt: 2 }}>
        {renderContent()}
      </Box>
    </Box>
  );
};

export default ParceirosInvestidoresDesk;
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
  Button,
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

const ParceirosInvestidoresDesk = () => {
  const [value, setValue] = useState(0);
  const [parceiros, setParceiros] = useState([]);
  const [financiadores, setFinanciadores] = useState([]);
  const [investidores, setInvestidores] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Buscar dados de Parceiros, Financiadores e Investidores
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [parceirosSnapshot, financiadoresSnapshot, investidoresSnapshot] = await Promise.all([
          get(ref(db, 'parceiros')),
          get(ref(db, 'financiadores')),
          get(ref(db, 'investidores'))
        ]);

        if (parceirosSnapshot.exists()) {
          setParceiros(Object.values(parceirosSnapshot.val()));
        }
        if (financiadoresSnapshot.exists()) {
          setFinanciadores(Object.values(financiadoresSnapshot.val()));
        }
        if (investidoresSnapshot.exists()) {
          setInvestidores(Object.values(investidoresSnapshot.val()));
        }
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleCompanyClick = (companyId) => {
    navigate(`/perfil/${companyId}`);
  };

  const getCategoryIcon = (categoryIndex) => {
    switch (categoryIndex) {
      case 0: return <ParceiroIcon color="primary" />;
      case 1: return <FinanciadorIcon color="primary" />;
      case 2: return <PatrocinadorIcon color="primary" />;
      default: return <BusinessIcon color="primary" />;
    }
  };

  const renderSkeleton = () => (
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

  const renderCard = (item, categoryIndex) => (
    <Grid item xs={12} sm={6} md={4} lg={3} key={item.companyId}>
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
        onClick={() => handleCompanyClick(item.companyId)}
      >
        {/* Banner da empresa */}
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
          {getCategoryIcon(categoryIndex)}
        </CardMedia>

        {/* Logo da empresa */}
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
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        mb: 4
      }}>
        <Tabs
          value={value}
          onChange={handleChange}
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
        {loading ? (
          <Grid container spacing={3}>
            {[...Array(8)].map((_, index) => renderSkeleton(index))}
          </Grid>
        ) : (
          <>
            {value === 0 && (
              <Box>
                {parceiros.length > 0 ? (
                  <Grid container spacing={3}>
                    {parceiros.map((parceiro) => renderCard(parceiro, 0))}
                  </Grid>
                ) : (
                  <Box sx={{
                    textAlign: 'center',
                    py: 8,
                    backgroundColor: theme.palette.background.default,
                    borderRadius: 2
                  }}>
                    <Typography variant="h6" color="textSecondary">
                      Nenhum parceiro encontrado
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {value === 1 && (
              <Box>
                {financiadores.length > 0 ? (
                  <Grid container spacing={3}>
                    {financiadores.map((financiador) => renderCard(financiador, 1))}
                  </Grid>
                ) : (
                  <Box sx={{
                    textAlign: 'center',
                    py: 8,
                    backgroundColor: theme.palette.background.default,
                    borderRadius: 2
                  }}>
                    <Typography variant="h6" color="textSecondary">
                      Nenhum financiador encontrado
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {value === 2 && (
              <Box>
                {investidores.length > 0 ? (
                  <Grid container spacing={3}>
                    {investidores.map((investidor) => renderCard(investidor, 2))}
                  </Grid>
                ) : (
                  <Box sx={{
                    textAlign: 'center',
                    py: 8,
                    backgroundColor: theme.palette.background.default,
                    borderRadius: 2
                  }}>
                    <Typography variant="h6" color="textSecondary">
                      Nenhum patrocinador encontrado
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default ParceirosInvestidoresDesk;
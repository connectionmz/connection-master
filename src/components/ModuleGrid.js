import { useNavigate } from 'react-router-dom';
import { 
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  Chip,
  Tooltip
} from '@mui/material';
import { 
  Store as StoreIcon,
  LocalShipping as TruckIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useActiveModules } from '../context/ActiveModulesContext';
import { useLanguage } from '../context/LanguageContext';

// Configuração dos módulos com suas chaves correspondentes
export const allModules = [
  { 
    nameKey: 'modules.market.name',
    key: 'moduloMarket',
    link: '/market', 
    icon: <StoreIcon fontSize="large" />, 
    descriptionKey: 'modules.market.description'
  },
  { 
    nameKey: 'modules.alert.name',
    key: 'moduloSMS',
    link: '/cotacoes',
    icon: <TruckIcon fontSize="large" />, 
    descriptionKey: 'modules.alert.description'
  },

];

const ModuleGrid = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { isLoading, isModuleActive } = useActiveModules();
  const { t } = useLanguage();

  const handleModuleClick = (module) => {
    if (isModuleActive(module.key)) {
      navigate(module.link);
    } else {
      navigate(`/pagar/${module.key}`);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {t('modules.loading')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Grid container spacing={3} justifyContent="center">
        {allModules.map((module) => {
          const isActive = isModuleActive(module.key);
          const moduleName = t(module.nameKey);
          
          return (
            <Grid item xs={12} sm={6} md={4} key={module.key}>
              <Tooltip 
                title={t(isActive ? 'modules.open' : 'modules.subscribe', { name: moduleName })}
                arrow
              >
                <Card
                  onClick={() => handleModuleClick(module)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      handleModuleClick(module);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={t(isActive ? 'modules.open' : 'modules.subscribe', { name: moduleName })}
                  sx={{
                    height: '100%',
                    p: 3,
                    cursor: 'pointer',
                    borderRadius: 3,
                    textAlign: 'center',
                    transition: 'all 0.25s ease',
                    bgcolor: 'background.paper',
                    color: 'text.primary',
                    border: '1px solid',
                    borderColor: 'divider',
                    position: 'relative',
                    opacity: isActive ? 1 : 0.6,
                    ...(isActive ? {
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: theme.shadows[6],
                        borderColor: theme.palette.primary.main
                      }
                    } : {
                      '&:hover': {
                        boxShadow: 'none',
                      }
                    })
                  }}
                >
                  {/* Badge de status */}
                  <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
                    {isActive ? (
                      <Chip
                        icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
                        label={t('modules.active')}
                        size="small"
                        color="success"
                        sx={{ fontSize: '0.65rem' }}
                      />
                    ) : (
                      <Chip
                        icon={<LockIcon sx={{ fontSize: 14 }} />}
                        label={t('modules.locked')}
                        size="small"
                        color="error"
                        sx={{ fontSize: '0.65rem' }}
                      />
                    )}
                  </Box>

                  <CardContent>
                    <Box
                      sx={{
                        mb: 2,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: isActive ? 'action.hover' : 'action.disabledBackground',
                        borderRadius: '12px',
                        width: 64,
                        height: 64,
                        margin: '0 auto',
                        ...(isActive ? {} : { filter: 'grayscale(0.5)' })
                      }}
                    >
                      {module.icon}
                    </Box>

                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                      {moduleName}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {t(module.descriptionKey)}
                    </Typography>

                    {/* Indicador de status */}
                    <Box sx={{ mt: 2 }}>
                      {isActive ? (
                        <Typography variant="caption" color="success.main">
                          {t('modules.available')}
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="error.main">
                          {t('modules.unavailable')}
                        </Typography>
                      )}
                    </Box>
                  </CardContent>
                </Card>
              </Tooltip>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};

export default ModuleGrid;

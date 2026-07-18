import { useNavigate } from 'react-router-dom';
import { 
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  useTheme,
  Chip,
  Tooltip,
  Badge
} from '@mui/material';
import { 
  Store as StoreIcon,
  AdsClick as AdIcon,
  LocalShipping as TruckIcon,
  Event as EventIcon,
  Lock as LockIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { useActiveModules } from '../context/ActiveModulesContext';

// Configuração dos módulos com suas chaves correspondentes
export const allModules = [
  { 
    name: 'Produtos & Servicos', 
    key: 'moduloMarket',
    link: '/market', 
    icon: <StoreIcon fontSize="large" />, 
    description: 'Cadastre seus produtos & servicos'
  },
  { 
    name: 'Alerta', 
    key: 'moduloSMS',
    link: '/sms', 
    icon: <TruckIcon fontSize="large" />, 
    description: 'Receba solicitacoes e pedidos de cotacao'
  },

];

const ModuleGrid = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { activeModules, isLoading } = useActiveModules();

  // Verificar se um módulo está ativo (não expirado)
  const isModuleActive = (moduleKey) => {
    if (!activeModules) return false;
    
    const module = activeModules[moduleKey];
    if (!module) return false;
    
    // Verifica se o status é "active"
    if (module.status !== "active") return false;
    
    // Verifica se não expirou
    if (module.expiresAt) {
      const now = new Date();
      const expiryDate = new Date(module.expiresAt);
      if (expiryDate <= now) return false;
    }
    
    return true;
  };

  const handleModuleClick = (module) => {
    // Verifica se o módulo está ativo
    if (isModuleActive(module.key)) {
      navigate(module.link);
    } else {
      // Mostra um alerta ou snackbar
      navigate('/pagar'+module.key);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          Carregando módulos...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Grid container spacing={3} justifyContent="center">
        {allModules.map((module) => {
          const isActive = isModuleActive(module.key);
          
          return (
            <Grid item xs={12} sm={6} md={3} key={module.name}>
              <Tooltip 
                title={isActive ? `Acessar ${module.name}` : `Módulo ${module.name} não está ativo`}
                arrow
              >
                <Card
                  onClick={() => handleModuleClick(module)}
                  sx={{
                    height: '100%',
                    p: 3,
                    cursor: isActive ? 'pointer' : 'not-allowed',
                    borderRadius: 3,
                    textAlign: 'center',
                    transition: 'all 0.25s ease',
                    border: '1px solid #eee',
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
                        label="Ativo"
                        size="small"
                        color="success"
                        sx={{ fontSize: '0.65rem' }}
                      />
                    ) : (
                      <Chip
                        icon={<LockIcon sx={{ fontSize: 14 }} />}
                        label="Bloqueado"
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
                        backgroundColor: isActive ? theme.palette.grey[100] : theme.palette.grey[200],
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
                      {module.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {module.description}
                    </Typography>

                    {/* Indicador de status */}
                    <Box sx={{ mt: 2 }}>
                      {isActive ? (
                        <Typography variant="caption" color="success.main">
                          ✅ Disponível
                        </Typography>
                      ) : (
                        <Typography variant="caption" color="error.main">
                          🔒 Indisponível - Assine para acessar
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
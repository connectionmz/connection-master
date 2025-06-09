import { useNavigate } from 'react-router-dom';
import { 
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  useTheme,
  Tooltip
} from '@mui/material';
import { 
  Receipt as ReceiptIcon,
  Store as StoreIcon,
  AdsClick as AdIcon,
  Sms as SmsIcon,
  Phone as PhoneIcon,
  Poll as PollIcon,
  LocalShipping as TruckIcon,
  Star as StarIcon,
  ShowChart as ChartIcon,
  Person as PersonIcon
} from '@mui/icons-material';

export const allModules = [
  { name: 'Proforma', link: '/faturacao', icon: <ReceiptIcon fontSize="large" />, key: 'moduloProforma' },
  { name: 'Market', link: '/market', icon: <StoreIcon fontSize="large" />, key: 'moduloMarket' },
  { name: 'Anunciar', link: '/anunciar', icon: <AdIcon fontSize="large" />, key: 'moduloAnunciar', alwaysEnabled: true },
  { name: 'SMS', link: '/sms', icon: <SmsIcon fontSize="large" />, key: 'moduloSMS' },
  { name: 'Call Center', link: '/callcenter', icon: <PhoneIcon fontSize="large" />, key: 'moduloCallCenter', alwaysEnabled: true },
  { name: 'Procurement', link: '/procurement', icon: <TruckIcon fontSize="large" />, key: 'moduloProcurement', alwaysEnabled: true },
  { name: 'Inquéritos', link: '/inquerito', icon: <PollIcon fontSize="large" />, key: 'moduloInquerito' },
  { name: 'Recrutamento', link: '/recrutamento', icon: <PersonIcon fontSize="large" />, key: 'moduloRecrutamento', alwaysEnabled: true }
];

const ModuleGrid = ({ activeModules }) => {
  const navigate = useNavigate();
  const theme = useTheme();

  const handleAcquireModule = (module) => {
    navigate(`/pagamento-modulo/${module.key}`);
  };

  const handleModuleClick = (module) => {
    if (module.alwaysEnabled || activeModules[module.key]) {
      navigate(module.link);
    } else {
      handleAcquireModule(module);
    }
  };
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" component="h2" sx={{ fontWeight: 'medium', mb: 2 }}>
        Módulos Disponíveis
      </Typography>
      <Grid container spacing={3}>
        {allModules.map((module) => (
          <Grid item xs={6} sm={4} md={3} lg={2} xl={2} key={module.name}>
            <Tooltip 
              title={module.alwaysEnabled || activeModules[module.key] ? '' : 'Clique para adquirir este módulo'}
              arrow
            >
              <Card
                onClick={() => handleModuleClick(module)}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 2,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  opacity: module.alwaysEnabled || activeModules[module.key] ? 1 : 0.6,
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[6],
                    backgroundColor: module.alwaysEnabled || activeModules[module.key] 
                      ? theme.palette.action.hover 
                      : theme.palette.action.selected
                  }
                }}
              >
                <CardContent sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      backgroundColor: theme.palette.grey[100],
                      borderRadius: 1,
                      p: 2,
                      mb: 1,
                      display: 'inline-flex'
                    }}
                  >
                    {module.icon}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {module.name}
                  </Typography>
                </CardContent>
              </Card>
            </Tooltip>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ModuleGrid;
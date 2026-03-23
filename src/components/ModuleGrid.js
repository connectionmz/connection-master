import { useNavigate } from 'react-router-dom';
import { 
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  useTheme
} from '@mui/material';
import { 
  Store as StoreIcon,
  AdsClick as AdIcon,
  LocalShipping as TruckIcon,
  Event as EventIcon
} from '@mui/icons-material';

export const allModules = [
  { 
    name: 'Produtos & Servicos', 
    link: '/market', 
    icon: <StoreIcon fontSize="large" />, 
    description: 'Cadastre seus produtos & servicos'
  },
  { 
    name: 'Alerta', 
    link: '/sms', 
    icon: <TruckIcon fontSize="large" />, 
    description: 'Receba solicitacoes e pedidos de cotacao'
  },
];

const ModuleGrid = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  return (
    <Box sx={{ mt: 4 }}>
      <Grid container spacing={3} justifyContent="center">
        {allModules.map((module) => (
          <Grid item xs={12} sm={6} md={3} key={module.name}>
            <Card
              onClick={() => navigate(module.link)}
              sx={{
                height: '100%',
                p: 3,
                cursor: 'pointer',
                borderRadius: 3,
                textAlign: 'center',
                transition: 'all 0.25s ease',
                border: '1px solid #eee',
                '&:hover': {
                  transform: 'translateY(-6px)',
                  boxShadow: theme.shadows[6],
                  borderColor: theme.palette.primary.main
                }
              }}
            >
              <CardContent>
                <Box
                  sx={{
                    mb: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: theme.palette.grey[100],
                    borderRadius: '12px',
                    width: 64,
                    height: 64,
                    margin: '0 auto'
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
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ModuleGrid;
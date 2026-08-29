import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { useActiveModules } from '../context/ActiveModulesContext';
import { allModules } from './ModuleGrid';

const ProtectedRoute = ({
  authUser,
  profile,
  profileLoading = false,
  children,
  requiresAuth = true,
  requiresVerification = false,
  requiredModule = null,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoading: modulesLoading, isModuleActive } = useActiveModules();
  const mustBeAuthenticated = requiresAuth || requiresVerification || Boolean(requiredModule);
  const mustBeVerified = requiresVerification || Boolean(requiredModule);
  const isVerified = profile?.subscriptions?.isverify === true
    || profile?.subscriptions?.isverify === 'true';

  if (mustBeAuthenticated && !authUser) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (mustBeVerified && profileLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Carregando perfil...</Typography>
      </Box>
    );
  }

  if (mustBeVerified && !isVerified) {
    return <Navigate to="/app/verification" state={{ from: location }} replace />;
  }

  if (requiredModule && modulesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Verificando acesso ao módulo...</Typography>
      </Box>
    );
  }

  if (requiredModule && !isModuleActive(requiredModule)) {
    const moduleInfo = allModules.find((module) => module.key === requiredModule);

    return (
      <Box
        sx={{
          p: 4,
          textAlign: 'center',
          maxWidth: 500,
          margin: 'auto',
          mt: 8,
          bgcolor: '#FFF3E0',
          borderRadius: 2,
          border: '1px solid #FFB74D',
        }}
      >
        <Typography variant="h4" gutterBottom color="error.main">
          Acesso Bloqueado
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          O módulo <strong>{moduleInfo?.name || requiredModule}</strong> não está ativo para sua empresa.
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Por favor, adquira uma assinatura para acessar esta funcionalidade.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button variant="contained" color="primary" onClick={() => navigate('/app')}>
            Ver Módulos Disponíveis
          </Button>
          <Button variant="outlined" onClick={() => navigate(`/pagar/${requiredModule}`)}>
            Adquirir Módulo
          </Button>
        </Box>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute;

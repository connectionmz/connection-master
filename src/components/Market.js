import React, { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import ManageStore from './market/ManageStore';
import CreateStoreForm from './market/CreateStoreForm';
import CreateStoreFormDesk from './market/CreateStoreFormDesk';
import { db, auth } from '../fb';
import { useActiveModules } from '../context/ActiveModulesContext';
import { 
  Box, 
  Typography, 
  Button, 
  Card, 
  CardContent,
  Container,
  Alert,
  CircularProgress
} from '@mui/material';
import { 
  Lock as LockIcon,
  ShoppingCart as ShoppingCartIcon,
  Store as StoreIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Market = ({ user }) => {
  const navigate = useNavigate();
  const { activeModules, isLoading: modulesLoading } = useActiveModules();
  const [storeExists, setStoreExists] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);
  const [error, setError] = useState(null);



  const isMarketModuleActive = () => {
    
    if (!activeModules) {
      return false;
    }
    
    
    const marketModule = activeModules['moduloMarket'];
    
    if (!marketModule) {
      return false;
    }
    
    if (marketModule.status !== "active") {
      return false;
    }
    
    if (marketModule.expiresAt) {
      const now = new Date();
      const expiryDate = new Date(marketModule.expiresAt);
      
      if (expiryDate <= now) {
        return false;
      }
    }
    
    return true;
  };

  const isActive = isMarketModuleActive();

  useEffect(() => {
    
    const checkStoreExists = async (userId) => {
      try {
        const storeRef = ref(db, `stores/${userId}`);
        const storeSnapshot = await get(storeRef);

        if (storeSnapshot.exists()) {
          setStoreExists(true);
        } else {
          setStoreExists(false);
        }
      } catch (err) {
        setError('Ocorreu um erro ao carregar as informações da loja. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setStoreId(user.uid);
        checkStoreExists(user.uid);
      } else {
        setStoreId(null);
        setStoreExists(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Se estiver carregando os módulos ou a loja
  if (modulesLoading || loading) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="60vh"
      >
        <CircularProgress />
        <Typography variant="body1" color="textSecondary" sx={{ mt: 2 }}>
          {modulesLoading ? 'Carregando módulos...' : 'Carregando informações da loja...'}
        </Typography>
      </Box>
    );
  }

  // Verificar se o usuário tem acesso ao módulo Market
  if (!isActive) {
    return (
      <Container maxWidth="md">
        <Box 
          sx={{ 
            mt: 8, 
            textAlign: 'center',
            p: 4,
            borderRadius: 2,
            bgcolor: '#FFF3E0',
            border: '1px solid #FFB74D'
          }}
        >
          <LockIcon sx={{ fontSize: 64, color: '#FF6F00' }} />
          <Typography variant="h5" sx={{ mt: 2, fontWeight: 600, color: '#E65100' }}>
            Acesso Bloqueado
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, color: '#BF360C' }}>
            O módulo Market não está ativo para sua empresa.
          </Typography>
          <Typography variant="body2" sx={{ mt: 1, color: '#BF360C' }}>
            Por favor, adquira uma assinatura do módulo Market para acessar esta funcionalidade.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<ShoppingCartIcon />}
            onClick={() => navigate('/dashboard')}
            sx={{ mt: 3 }}
          >
            Ver Módulos Disponíveis
          </Button>
        </Box>
      </Container>
    );
  }

  // Se houver erro
  if (error) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  // Se não estiver autenticado
  if (!storeId) {
    return (
      <Container maxWidth="md">
        <Box sx={{ mt: 8, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Por favor, faça login para acessar o Market.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/auth')}
            sx={{ mt: 2 }}
          >
            Fazer Login
          </Button>
        </Box>
      </Container>
    );
  }

  // Renderizar conteúdo principal
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header com status do módulo */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 2,
            mb: 3,
            p: 2,
            bgcolor: '#E8F5E9',
            borderRadius: 2,
            border: '1px solid #A5D6A7'
          }}
        >
          <StoreIcon sx={{ color: '#2E7D32' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#1B5E20' }}>
              Market - Módulo Ativo
            </Typography>
            <Typography variant="body2" sx={{ color: '#2E7D32' }}>
              {storeExists ? 'Gerenciando sua loja' : 'Crie sua loja agora'}
            </Typography>
          </Box>
        </Box>

        {/* Conteúdo principal */}
        <Card>
          <CardContent>
            {storeExists ? (
              <ManageStore storeId={storeId} user={user} />
            ) : (
              <CreateStoreFormDesk storeId={storeId} user={user} />
            )}
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default Market;
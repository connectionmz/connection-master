import React, { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../fb';
import { 
  CircularProgress, 
  Typography, 
  Box, 
  Paper, 
  Alert,
  Container,
  Fade,
  Zoom,
  Avatar,
  Button,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  Storefront as StoreIcon,
  ShoppingBag as ShoppingBagIcon,
  AddCircle as AddIcon,
  CheckCircle as CheckIcon,
  Business as BusinessIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import CreateStoreFormDesk from '../market/CreateStoreFormDesk';
import ManageStoreDesk from '../market/ManageStoreDesk';
import BackButton from '../BackButton';

/* ── Design Tokens (mesmos da hero) ───────────────────────────────────── */
const T = {
  navy:     '#08192E',
  navyMid:  '#0E2849',
  navyLight:'#183A63',
  gold:     '#C8903A',
  goldLight:'#E8B96A',
  goldPale: '#FDF3E3',
  cream:    '#FAFAF7',
  white:    '#FFFFFF',
  text:     '#0F1C2D',
  textMid:  '#3D5A7A',
  textSub:  '#6B89A5',
  border:   '#E0E8F0',
  borderMid:'#C5D4E3',
  surface:  '#F4F7FB',
};

/* ── Keyframes (mesmos da hero) ───────────────────────────────────────── */
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes pulse-gold {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.8; transform: scale(0.98); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .animate-fade-up {
    animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) both;
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease both;
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  .animate-pulse-gold {
    animation: pulse-gold 2s ease-in-out infinite;
  }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.22s; }
  .delay-3 { animation-delay: 0.34s; }
  .delay-4 { animation-delay: 0.46s; }
  .delay-5 { animation-delay: 0.58s; }
  
  .market-card {
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .market-card:hover {
    transform: translateY(-4px);
    border-color: ${T.gold} !important;
    box-shadow: 0 16px 48px rgba(8,25,46,0.1) !important;
  }
`;

const MarketDesk = ({ user }) => {
  const [storeExists, setStoreExists] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeId, setStoreId] = useState(null);
  const [error, setError] = useState(null);
  const [storeData, setStoreData] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const checkStoreExists = async (userId) => {
      try {
        const storeRef = ref(db, `stores/${userId}`);
        const storeSnapshot = await get(storeRef);

        if (storeSnapshot.exists()) {
          setStoreExists(true);
          setStoreData(storeSnapshot.val());
        } else {
          setStoreExists(false);
        }
      } catch (err) {
        console.error('Erro ao verificar loja:', err);
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

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          background: T.cream,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontFamily: '"Plus Jakarta Sans", sans-serif'
        }}
      >
        <style>{KEYFRAMES}</style>
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 48, height: 48,
              borderRadius: '50%',
              border: `3px solid ${T.border}`,
              borderTopColor: T.gold,
              animation: 'fadeUp 0.8s infinite linear',
              mx: 'auto',
              mb: 2
            }}
          />
          <Typography sx={{ color: T.textSub }}>Carregando Market...</Typography>
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          background: T.cream,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 2
        }}
      >
        <style>{KEYFRAMES}</style>
        <Fade in={true}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              borderRadius: '24px',
              border: `1px solid ${T.border}`,
              background: T.white,
              textAlign: 'center',
              maxWidth: 500
            }}
          >
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: '12px',
                '& .MuiAlert-icon': { color: '#ef4444' }
              }}
            >
              {error}
            </Alert>
            <Button
              variant="contained"
              onClick={() => window.location.reload()}
              sx={{
                mt: 3,
                bgcolor: T.gold,
                color: T.white,
                '&:hover': { bgcolor: T.goldLight },
                borderRadius: '10px',
                textTransform: 'none',
                px: 4,
              }}
            >
              Tentar novamente
            </Button>
          </Paper>
        </Fade>
      </Box>
    );
  }

  if (!storeId) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          background: T.cream,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          p: 2
        }}
      >
        <style>{KEYFRAMES}</style>
        <Fade in={true}>
          <Paper 
            elevation={0}
            className="market-card"
            sx={{ 
              p: { xs: 3, md: 5 },
              borderRadius: '32px',
              border: `1px solid ${T.border}`,
              background: T.white,
              textAlign: 'center',
              maxWidth: 500
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: T.goldPale,
                color: T.gold,
                mx: 'auto',
                mb: 2,
                border: `2px solid ${T.gold}`,
              }}
            >
              <StoreIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 700, 
                color: T.text,
                fontFamily: '"Playfair Display", serif',
                mb: 1
              }}
            >
              Acesso Restrito
            </Typography>
            <Typography sx={{ color: T.textSub, mb: 3 }}>
              Por favor, faça login para acessar o Market e gerenciar sua loja.
            </Typography>
            <Button
              variant="contained"
              onClick={() => window.location.href = '/auth'}
              startIcon={<ArrowBackIcon />}
              sx={{
                bgcolor: T.navy,
                color: T.white,
                '&:hover': { bgcolor: T.navyLight },
                borderRadius: '12px',
                px: 4,
                py: 1.5,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Ir para Login
            </Button>
          </Paper>
        </Fade>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        backgroundColor: T.cream, 
        minHeight: '100vh',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        py: 4
      }}
    >
      <style>{KEYFRAMES}</style>

      <Container maxWidth="lg">
        {/* Header com design da hero */}
        <Paper
          className="animate-fade-up"
          sx={{
            background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyLight} 100%)`,
            borderRadius: '24px',
            p: { xs: 3, md: 4 },
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background decorations */}
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 80% 60% at 90% 10%, rgba(200,144,58,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 50% 50% at 5% 90%, rgba(200,144,58,0.07) 0%, transparent 50%)
            `,
          }} />
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.035,
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
          }} />

          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  bgcolor: T.gold,
                  color: T.white,
                  border: `2px solid ${T.white}`,
                }}
              >
                <StoreIcon sx={{ fontSize: 28 }} />
              </Avatar>
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 800, 
                    color: T.white,
                    fontFamily: '"Playfair Display", serif',
                  }}
                >
                  {storeExists ? 'Gerenciar Loja' : 'Criar Loja'}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {storeExists 
                    ? 'Gerencie seus produtos, pedidos e configurações' 
                    : 'Comece a vender seus produtos e serviços'}
                </Typography>
              </Box>
            </Box>

            {/* Indicador de status */}
            <Box sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 1,
              px: 2,
              py: 0.8,
              bgcolor: 'rgba(200,144,58,0.12)',
              borderRadius: '100px',
              border: `1px solid rgba(200,144,58,0.25)`,
              mt: 1
            }}>
              {storeExists ? (
                <>
                  <CheckIcon sx={{ color: T.gold, fontSize: 18 }} />
                  <Typography sx={{ color: T.goldLight, fontSize: '0.85rem', fontWeight: 500 }}>
                    Loja já criada
                  </Typography>
                </>
              ) : (
                <>
                  <AddIcon sx={{ color: T.gold, fontSize: 18 }} />
                  <Typography sx={{ color: T.goldLight, fontSize: '0.85rem', fontWeight: 500 }}>
                    Comece agora mesmo
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </Paper>

        {/* Conteúdo Principal */}
        <Fade in={true} timeout={500}>
          <Paper
            elevation={0}
            className="market-card"
            sx={{
              borderRadius: '24px',
              border: `1px solid ${T.border}`,
              background: T.white,
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: { xs: 2, md: 4 } }}>
              {storeExists ? (
                <ManageStoreDesk storeId={storeId} storeData={storeData} />
              ) : (
                <CreateStoreFormDesk storeId={storeId} user={user} />
              )}
            </Box>
          </Paper>
        </Fade>

        {/* Footer informativo */}
        <Box 
          className="animate-fade-up delay-2"
          sx={{ 
            mt: 4, 
            textAlign: 'center',
            color: T.textSub,
            fontSize: '0.85rem'
          }}
        >
          <Typography variant="caption" sx={{ color: T.textSub }}>
            {storeExists 
              ? '✧ Gerencie sua loja, produtos e pedidos com facilidade ✧'
              : '✧ Crie sua loja e alcance milhares de clientes em Moçambique ✧'}
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default MarketDesk;
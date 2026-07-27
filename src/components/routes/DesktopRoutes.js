import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import CotacoesDesk from '../desktop/CotacoesDesk';
import HeaderDesk from '../desktop/HeaderDesk';
import { Box, Button, createTheme, ThemeProvider, Typography, useMediaQuery, CircularProgress } from '@mui/material';
import NovaCotacaoDesk from '../desktop/NovaCotacaoDesk';
import CompanyProfileDesk from '../desktop/CompanyProfileDesk';
import ExploreDesk from '../desktop/ExploreDesk';
import ApxDesk from '../desktop/ApxDesk';
import MarketDesk from '../desktop/MarketDesk';
import ProductFormDesk from '../market/ProductFormDesk';
import StoresDesk from '../desktop/StoresDesk';
import StoreDetailDesk from '../desktop/StoreDetailsDesk';
import FooterDesk from '../desktop/FooterDesk';
import ProductDetailsDesk from '../market/ProductDetailsDesk';
import Sobre from '../Sobre';
import EmailVerification from '../EmailVerification';
import CompanyVerificationNotice from '../CompanyVerificationNotice';
import AuthDesk from '../AuthDesk';
import ProfileDesk from '../desktop/ProfileDesk';
import EditProfileDesk from '../desktop/EditProfileDesk';
import CotacoesPDF from '../pdf/CotacoesPDF';
import TermsAndPrivacy from '../modal/TermsAndPrivacy';
import EmpresaNaoEncontrada from '../desktop/EmpresaNaoEncontrada';
import ForgetPassword from '../password/ForgetPassword';
import ChangePassword from '../password/ChangePassword';
import Terms from '../Termos';
import Politicas from '../desktop/Politicas';
import CompanyDataFormDesk from '../CompanyDataFormDesk';
import AuthCreateDesk from '../AuthCreateDesk';
import ProdutoPage from '../market/ProdutoPage';
import MinhaPropostaDesk from '../desktop/MinhaPropostaDesk';
import DetalhesPropostaDesk from '../desktop/DetalhesPropostaDesk';
import CotacaoDetalhesDesk from '../desktop/CotacaoDetalhesDesk';
import PropostasDesk from '../desktop/PropostasDesk';
import EnviarPropostaDesk from '../desktop/EnviarPropostaDesk';
import PagamentoModulo from '../PagamentoModulo';
import { allModules } from '../ModuleGrid';
import UserDataFormDesk from '../UserDataFormDesk';
import HeaderDeskSingular from '../desktop/HeaderDeskSingular';
import ProfileDeskSingular from '../desktop/ProfileDeskSingular';
import EditProfileDeskSingular from '../desktop/EditProfileDeskSingular';
import { ActiveModulesProvider, useActiveModules } from '../../context/ActiveModulesContext';
import GuestRoute from './GuestRoute';
import Checkout from '../checkout/Checkout';
import SelectAccountType from '../SelectAccountType';
import Dashboard from '../Dashboard';
import SearchResultsPage from '../SearchResultsPage';
import ListaDeServicosDesk from '../desktop/ListaDeServicosDesk';
import Feed from '../Feed';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})

// Lista de rotas protegidas com seus módulos requeridos
const protectedRoutesWithModules = {
  '/addProduct': 'moduloMarket',
  '/market': 'moduloMarket',
  '/cotacao': 'moduloSMS',
  '/cotacaoPdf': 'moduloSMS',
  '/cotacao/': 'moduloSMS',
  '/enviar-proposta': 'moduloSMS',
  '/propostas': 'moduloSMS',
  '/minha_proposta': 'moduloSMS',
  '/callcenter': 'moduloCallCenter',
  '/anunciar': 'moduloAnunciar',
  '/procurement': 'moduloProcurement',
  '/inqueritos': 'moduloInquerito',
  '/analises': 'moduloAnalises',
  '/proforma': 'moduloProforma',
};

// Padrões dinâmicos com módulos requeridos
const dynamicProtectedPatterns = [
  { pattern: /^\/cotacao\/.+/, module: 'moduloSMS' },
  { pattern: /^\/cotacaoPdf\/.+/, module: 'moduloSMS' },
  { pattern: /^\/minha_proposta\/.+/, module: 'moduloSMS' },
  { pattern: /^\/enviar-proposta\/.+/, module: 'moduloSMS' },
  { pattern: /^\/propostas\/.+/, module: 'moduloSMS' },
  { pattern: /^\/pagamento-modulo\/.+/, module: null }, // Não requer módulo
];

// Componente ProtectedRoute
const ProtectedRoute = ({ user, children, requiredModule }) => {
  const { activeModules, isLoading: modulesLoading } = useActiveModules();
  const location = useLocation();
  const navigate = useNavigate();



  // Função para verificar se um módulo está ativo
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

  if (modulesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Verificando acesso ao módulo...</Typography>
      </Box>
    );
  }

  // Verificar se a rota atual requer um módulo específico
  const getRequiredModule = (pathname) => {
    // Verificar rotas exatas
    for (const [route, module] of Object.entries(protectedRoutesWithModules)) {
      if (pathname === route || pathname.startsWith(route + '/')) {
        return module;
      }
    }

    // Verificar padrões dinâmicos
    for (const { pattern, module } of dynamicProtectedPatterns) {
      if (pattern.test(pathname)) {
        return module;
      }
    }

    return null;
  };

  const moduleRequired = requiredModule || getRequiredModule(location.pathname);

  // Se não requer módulo, permite acesso
  if (!moduleRequired) {
    return children;
  }

  // Verificar se o módulo está ativo
  const moduleActive = isModuleActive(moduleRequired);
  const moduleInfo = allModules.find(m => m.key === moduleRequired);

  if (!moduleActive) {
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
          border: '1px solid #FFB74D'
        }}
      >
        <Typography variant="h4" gutterBottom color="error.main">
          Acesso Bloqueado
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          O módulo <strong>{moduleInfo?.name || moduleRequired}</strong> não está ativo para sua empresa.
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, color: 'text.secondary' }}>
          Por favor, adquira uma assinatura para acessar esta funcionalidade.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/app')}
          >
            Ver Módulos Disponíveis
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate(`/pagamento-modulo/${moduleRequired}`)}
          >
            Adquirir Módulo
          </Button>
        </Box>
      </Box>
    );
  }
  return children;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

const DesktopRoutes = ({ user }) => {
  const [showTerms, setShowTerms] = useState(false)
  const navigate = useNavigate();
  const currentLocation = useLocation();
  const isMobile = useMediaQuery('(max-width:600px)');

  const fullScreenRoutes = [
    '/auth', '/email-verification', '/create', '/setup', '/setupUser', '/forget-password',
  ];

  const isFullScreenRoute = fullScreenRoutes.includes(currentLocation.pathname);

  const renderProtectedRoute = (path, element, requiredModule = null) => (
    <Route
      path={path}
      element={
        <ProtectedRoute user={user} requiredModule={requiredModule}>
          {element}
        </ProtectedRoute>
      }
    />
  );

  useEffect(() => {
    const acceptedTerms = localStorage.getItem('acceptedTerms');
    if (!acceptedTerms && user) {
      setShowTerms(true);
    }
  }, [user]);

  return (
    <ThemeProvider theme={theme}>
      <ActiveModulesProvider userId={user?.id}>
        <ScrollToTop />
        <Box>
          {!isFullScreenRoute && (
            <>
              {!user ? (
                <HeaderDesk />
              ) : user.type === 'singular' ? (
                <HeaderDeskSingular user={user} />
              ) : (
                <HeaderDesk user={user} />
              )}
            </>
          )}
          <Box>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/explorar" element={<ExploreDesk user={user} />} />
              <Route path="/empresa/:id" element={<CompanyProfileDesk user={user} />} />
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/produto/:id/loja/:loja" element={<ProdutoPage user={user}/>} />
              <Route path="/lojas" element={<StoresDesk user={user} />} />
              <Route path="/loja/:storeId" element={<StoreDetailDesk user={user} />} />
              <Route path="/product/:productId/store/:store" element={<ProductDetailsDesk user={user}/>} />
              <Route path="/empresa-nao-encontrada" element={<EmpresaNaoEncontrada />} />
              <Route path="/termos" element={<Terms />} />
              <Route path="/politicas" element={<Politicas />} />
              <Route path="/auth" element={<GuestRoute user={user}><AuthDesk user={user} /></GuestRoute>} />
              <Route path="/create" element={<GuestRoute user={user}><AuthCreateDesk user={user} /></GuestRoute>} />
              <Route path="/select-account-type" element={<GuestRoute user={user}><SelectAccountType /></GuestRoute>} />
              <Route path="/setup" element={<CompanyDataFormDesk />} />
              <Route path="/setupUser" element={<UserDataFormDesk />} />
              <Route path="/forget-password" element={<ForgetPassword />} />
              <Route path="/change-password" element={<ChangePassword user={user} />} />
              <Route path="/email-verification" element={<EmailVerification />} />
              <Route path="/app/verification" element={<CompanyVerificationNotice user={user} />} />
              <Route path="/search" element={<SearchResultsPage />} />

              {/* Rotas protegidas - ESPECIFICANDO O MÓDULO REQUERIDO */}
              {renderProtectedRoute("/addProduct", <ProductFormDesk user={user} />, "moduloMarket")}
              {renderProtectedRoute("/market", <MarketDesk user={user} />, "moduloMarket")}
              {renderProtectedRoute("/app", <ApxDesk user={user} />)}
              {renderProtectedRoute("/perfil", <ProfileDesk user={user} />)}
              {renderProtectedRoute("/meuperfil", <ProfileDeskSingular user={user} />)}
              {renderProtectedRoute("/editar-perfil", <EditProfileDesk user={user} />)}
              {renderProtectedRoute("/editar-meuperfil", <EditProfileDeskSingular user={user} />)}
              {renderProtectedRoute("/cotacoes", <CotacoesDesk user={user} />)}
              {renderProtectedRoute("/cotacao", <NovaCotacaoDesk user={user} />, "moduloSMS")}
              {renderProtectedRoute("/cotacaoPdf/:id", <CotacoesPDF user={user}/>, "moduloSMS")}
              {renderProtectedRoute("/pagar/:moduleKey", <PagamentoModulo user={user} />)}
              {renderProtectedRoute("/enviar-proposta/:id/:companyId", <EnviarPropostaDesk user={user} />, "moduloSMS")}
              {renderProtectedRoute("/propostas/:id/propostas", <PropostasDesk user={user} />, "moduloSMS")}
              {renderProtectedRoute("/cotacao/:id/proposta/:propostaId", <DetalhesPropostaDesk user={user} />, "moduloSMS")}
              {renderProtectedRoute("/minha_proposta/cotacao/:id/proposta/:propostaId", <MinhaPropostaDesk user={user} />, "moduloSMS")}
              {renderProtectedRoute("/cotacao/:id", <CotacaoDetalhesDesk user={user} />, "moduloSMS")}

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>

          {!isFullScreenRoute && <FooterDesk sx={{ flexShrink: 0, marginTop: 'auto' }} />}
        </Box>
      </ActiveModulesProvider>
    </ThemeProvider>
  );
};

export default DesktopRoutes;
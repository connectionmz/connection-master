import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import DashboardComponent from '../Dashboard';
import CotacoesDesk from '../desktop/CotacoesDesk';
import HeaderDesk from '../desktop/HeaderDesk';
import { Box, Button, createTheme, Fab, IconButton, Menu, MenuItem, TextField, ThemeProvider, Typography, useMediaQuery, Modal, Snackbar, Alert } from '@mui/material';
import FeedbackIcon from '@mui/icons-material/Feedback';
import NovaCotacaoDesk from '../desktop/NovaCotacaoDesk';
import CompanyProfileDesk from '../desktop/CompanyProfileDesk';
import ExploreDesk from '../desktop/ExploreDesk';
import ApxDesk from '../desktop/ApxDesk';
import FaturacaoDesk from '../desktop/FaturacaoDesk';
import MarketDesk from '../desktop/MarketDesk';
import ProductFormDesk from '../market/ProductFormDesk';
import AnunciarDesk from '../desktop/AnunciarDesk';
import SmsDesk from '../sms/SmsDesk';
import CallCenterModuleDesk from '../desktop/CallCenterModuleDesk';
import InqueritosModuleDesk from '../desktop/InqueritosModuleDesk';
import LogisticaModuleDesk from '../desktop/LogisticaModuleDesk';
import InboxDesk from '../desktop/InboxDesk';
import StoresDesk from '../desktop/StoresDesk';
import StoreDetailDesk from '../desktop/StoreDetailsDesk';
import ConnectionsSearchDesk from '../desktop/ConnectionsSearchDesk';
import FooterDesk from '../desktop/FooterDesk';
import ProposalDesk from '../desktop/ProposalDesk';
import ProductDetailsDesk from '../market/ProductDetailsDesk';
import Sobre from '../Sobre';
import EmailVerification from '../EmailVerification';
import CompanyVerificationNotice from '../CompanyVerificationNotice';
import AuthDesk from '../AuthDesk';
import ProfileDesk from '../desktop/ProfileDesk';
import EditProfileDesk from '../desktop/EditProfileDesk';
import FeedDesk from '../desktop/FeedDesk';
import CotacoesPDF from '../pdf/CotacoesPDF';
import NoticiadosDesk from '../desktop/NoticiadosDesk';
import NoticiaDetalheDesk from '../desktop/NoticiaDetalheDesk';
import ParceirosInvestidoresDesk from '../desktop/ParceirosInvestidoresDesk';
import ConcursoDesk from '../desktop/ConcursoDesk';
import ConnectionsDesk from '../desktop/ConnectionsDesk';
import PostDetailPageDesk from '../desktop/PostDetailPageDesk';
import TermsAndPrivacy from '../modal/TermsAndPrivacy';
import BlogDetalheDesk from '../desktop/BlogDetalheDesk';
import EmpresaNaoEncontrada from '../desktop/EmpresaNaoEncontrada';
import Blogs from '../desktop/Blogs';
import { onValue, push, ref, set, update } from 'firebase/database';
import { db } from '../../fb';
import ForgetPassword from '../password/ForgetPassword';
import ChangePassword from '../password/ChangePassword';
import Terms from '../Termos';
import Politicas from '../desktop/Politicas';
import { Close } from '@mui/icons-material';
import CompanyUpdateDesk from '../CompanyUpdateDesk';
import ReceiptsPage from '../desktop/ReceiptsPage';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import CompanyDataFormDesk from '../CompanyDataFormDesk';
import AuthCreateDesk from '../AuthCreateDesk';
import RecrutamentoDesk from '../desktop/RecrutamentoDesk';
import ListaInqueritos from '../desktop/ListaInqueritos';
import ProdutoPage from '../market/ProdutoPage';
import MinhaPropostaDesk from '../desktop/MinhaPropostaDesk';
import DetalhesPropostaDesk from '../desktop/DetalhesPropostaDesk';
import CotacaoDetalhesDesk from '../desktop/CotacaoDetalhesDesk';
import PropostasDesk from '../desktop/PropostasDesk';
import EnviarPropostaDesk from '../desktop/EnviarPropostaDesk';
import EditarFaturaDesk from '../desktop/EditarFaturaDesk';
import AnalyticsDesk from '../desktop/AnalyticsDesk';
import PublicarConcursoDesk from '../desktop/PublicarConcursoDesk';
import ConcursoDetalhesDesk from '../desktop/ConcursoDetalhesDesk';
import ContactForm from '../desktop/Mailer';
import CreditCardCheckoutDesk from '../checkout/CreditCardCheckoutDesk';
import SurveyPageDesk from '../desktop/SurveyPageDesk';
import DestacarModule from '../desktop/DestacarModule';
import SendMail from '../sms/SendMail';
import PortalDesk from '../desktop/PortalDesk';
import ListaDeServicosDesk from '../desktop/ListaDeServicosDesk';
import PostInputDesk from '../desktop/PostInputDesk';
import PagamentoModulo from '../PagamentoModulo';
import CriarProformaDesk from '../desktop/CriarProformaDesk';
import FaturaDesk from '../desktop/FaturaDesk';
import VerificationAccountModal from '../modal/VerificationAccountModal';
import VerFaturaDesk from '../desktop/VerFaturaDesk';
import { allModules } from '../ModuleGrid';
import EditalConcursoPDF from '../pdf/EditalConcursoPDF';
import UserDataFormDesk from '../UserDataFormDesk';
import HeaderDeskSingular from '../desktop/HeaderDeskSingular';
import ProfileDeskSingular from '../desktop/ProfileDeskSingular';
import ApxDeskSingular from '../desktop/ApxDeskSingular';
import EditProfileDeskSingular from '../desktop/EditProfileDeskSingular';
import Teste from '../Teste';
import { ActiveModulesProvider, useActiveModules } from '../../context/ActiveModulesContext';
import GuestRoute from './GuestRoute';

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

const DesktopRoutes = ({ user }) => {

  const [language, setLanguage] = useState('pt')
const [anchorEl, setAnchorEl] = useState(null)
const [showTerms, setShowTerms] = useState(false)
const [showFeedbackModal, setShowFeedbackModal] = useState(false)
const [hasFeedback, setHasFeedback] = useState(false)
const [feedbackText, setFeedbackText] = useState('')
const [isLoading, setIsLoading] = useState(false)
const [showReferrerModal, setShowReferrerModal] = useState(false)
const [referrerData, setReferrerData] = useState(null)
const [feedbackForm, setFeedbackForm] = useState({
  nome: '',
  email: '',
  contacto: '',
  feedback: ''
});

const [showVerificationAlert, setShowVerificationAlert] = useState(false);

  const isVerify = user?.subscriptions?.isverify

  const navigate = useNavigate();

  const currentLocation = useLocation();

  const isMobile = useMediaQuery('(max-width:600px)');
  
  const fullScreenRoutes = [
    '/auth',
    '/email-verification',
    '/create',
    '/setup',
    '/setupUser',
    '/forget-password',
  ];

const isFullScreenRoute = fullScreenRoutes.includes(currentLocation.pathname);

const protectedRoutes = [
  '/cotacoes',
  '/cotacao',
  '/proposta',
  '/enviar-proposta',
  '/propostas',
  '/minha_proposta',
  '/cotacaoPdf',
  '/concursos',
  '/concurso',
  '/faturacao',
  '/proforma',
  '/edit-proforma',
  '/faturas',
  '/checkout',
  '/pagamento-modulo',
  '/post',
  '/anunciar',
  '/sms',
  '/callcenter',
  '/procurement',
  '/inquerito',
  '/destacar',
  '/analises',
  '/recrutamento',
  '/addProduct',
  '/conexoes',
  '/inbox',
  '/perfil',
  '/editar-perfil',
  '/painel'
];

const dynamicProtectedPatterns = [
  /^\/proposta\/.+/,
  /^\/cotacao\/.+/,
  /^\/concurso\/.+/,
  /^\/proforma\/.+/,
  /^\/faturas\/.+/,
  /^\/inquerito\/.+/
];

// Create a custom hook for module checking
  const useModuleCheck = () => {
    const { activeModules } = useActiveModules();
    
    const isActiveModule = (moduleKey) => {
      return !!activeModules[moduleKey];
    };

    return { isActiveModule };
  };

  const ProtectedRoute = ({ children, requiredModule }) => {
    const { isActiveModule } = useModuleCheck();
    const currentLocation = useLocation();
    const navigate = useNavigate();
    const isVerify = user?.subscriptions?.isverify;

    const isProtected = protectedRoutes.some(route => 
      currentLocation.pathname.startsWith(route) ||
      dynamicProtectedPatterns.some(pattern => pattern.test(currentLocation.pathname))
    );

    // Case 1: User not logged in and route is protected
    if (!user && isProtected) {
      return <Navigate to="/auth" replace />;
    }

    // Case 2: Route requires a specific module that user doesn't have
    if (requiredModule && !isActiveModule(requiredModule)) {
      const module = allModules.find(m => m.key === requiredModule);
      return (
        <Box
          sx={{
            p: 4,
            maxWidth: 500,
            margin: 'auto',
            mt: 8,
            textAlign: 'center',
            backgroundColor: 'background.paper',
            boxShadow: 3,
          }}
        >
          <Typography variant="h4" gutterBottom color="error.main" fontWeight={600}>
            Módulo não disponível
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            Você não tem acesso ao módulo <strong>{module?.name || requiredModule}</strong>.<br />
            {module?.description && (
              <span>{module.description}</span>
            )}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            sx={{ borderRadius: 3, textTransform: 'none', px: 4 }}
            onClick={() => navigate(`/pagamento-modulo/${requiredModule}`)}
          >
            Ativar Módulo
          </Button>
        </Box>
      );
    }

    // Case 3: User not verified and route is protected
    if (!isVerify && isProtected) {
      return (
        <>
          {children}
          <Snackbar
            open={true}
            autoHideDuration={6000}
            onClose={() => {}}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          >
            <Alert 
              severity="warning"
              sx={{ width: '100%' }}
            >
              Sua conta precisa ser verificada para acessar esta funcionalidade.
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => navigate('/app/verification')}
                sx={{ ml: 1 }}
              >
                Verificar agora
              </Button>
            </Alert>
          </Snackbar>
        </>
      );
    }

    return children;
  };

const renderProtectedRoute = (path, element) => (
  <Route 
    path={path} 
    element={
      <ProtectedRoute>
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

  useEffect(() => {
    if (user?.id) {
      const feedbackRef = ref(db, `feedback/${user.id}`);
      onValue(feedbackRef, (snapshot) => {
        if (snapshot.exists()) {
          setHasFeedback(true);
        } else {
          setHasFeedback(false);
        }
      });

      if(user.referer && !user.isComplete){
        setShowReferrerModal(true); 
      }
    }
  }, [user]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('selectedLanguage', lang);
  };

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleAcceptTerms = () => {
    setShowTerms(false);
  };

  const handleOpenFeedbackModal = () => {
    setShowFeedbackModal(true);
  };

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
    setFeedbackForm({
      nome: '',
      email: '',
      contacto: '',
      feedback: ''
    });
  };

  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setFeedbackForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFeedbackEditorChange = (value) => {
    setFeedbackForm(prev => ({
      ...prev,
      feedback: value
    }));
  };

const handleSubmitFeedback = async () => {
  if (!feedbackForm.feedback.trim()) {
    alert('Por favor, insira seu feedback.');
    return;
  }

  if (!user) {
    if (!feedbackForm.nome.trim() || !feedbackForm.email.trim()) {
      alert('Por favor, preencha seu nome e email.');
      return;
    }

    const isEmailValid = /\S+@\S+\.\S+/.test(feedbackForm.email.trim());
    if (!isEmailValid) {
      alert('Por favor, insira um email válido.');
      return;
    }
  }

  setIsLoading(true);

  try {
    const feedbackData = user ? {
      nome: user.displayName || 'Usuário Anônimo',
      email: user.email || 'anonimo@exemplo.com',
      userId: user.id,
      feedback: feedbackForm.feedback,
      timestamp: new Date().toISOString(),
    } : {
      nome: feedbackForm.nome,
      email: feedbackForm.email,
      contacto: feedbackForm.contacto || '',
      feedback: feedbackForm.feedback,
      timestamp: new Date().toISOString(),
    };

    const feedbackRef = user 
      ? ref(db, `feedback/${user.id}`) 
      : ref(db, 'feedback/anonymousFeedbacks');

    const newFeedbackRef = push(feedbackRef);
    await set(newFeedbackRef, feedbackData);

    setHasFeedback(true);
    setFeedbackForm({
      nome: '',
      email: '',
      contacto: '',
      feedback: ''
    });
    handleCloseFeedbackModal();
  } catch (error) {
    console.error('Erro ao salvar feedback:', error);
    alert('Erro ao enviar feedback. Tente novamente.');
  } finally {
    setIsLoading(false);
  }
};

  const handleCloseReferrerModal = () => {
    setShowReferrerModal(false);
  };
  
  return (
    <ThemeProvider theme={theme}>
      <ActiveModulesProvider userId={user?.id}>
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#F1F1F1',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
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

   <Box
    component="main"
    sx={{
      flex: 1,
      width: '100%',
      maxWidth: isFullScreenRoute ? '100%' : isMobile ? '100%' : '1200px',
      margin: '0 auto',
      padding: isFullScreenRoute ? '0' : isMobile ? '8px' : '24px',
      boxSizing: 'border-box',
      pb: 4, 
    }}>
          <Routes>
  <Route path="/" element={<DashboardComponent user={user} />} />
  <Route path="/feed" element={<FeedDesk user={user} />} />
  <Route path="/teste" element={<Teste user={user} />} />
  <Route path="/perfil/:id" element={<CompanyProfileDesk user={user} />} />
  <Route path="/empresas" element={<ExploreDesk user={user} />} />
  <Route path="/post/:postId" element={<PostDetailPageDesk user={user} />} />
  <Route path="/sobre" element={<Sobre />} />
  <Route path="/noticias" element={<NoticiadosDesk />} />
  <Route path="/noticia/:id" element={<NoticiaDetalheDesk user={user} />} />
  <Route path="/blog" element={<Blogs />} />
  <Route path="/blog/:id" element={<BlogDetalheDesk user={user} />} />
  <Route path="/produto/:id/loja/:loja" element={<ProdutoPage user={user}/>} />
  <Route path="/recibos" element={<ReceiptsPage user={user} />} />
  <Route path="/lojas" element={<StoresDesk user={user} />} />
  <Route path="/loja/:storeId" element={<StoreDetailDesk />} />
  <Route path="/product/:productId/store/:store" element={<ProductDetailsDesk user={user}/>} />
  <Route path="/empresa-nao-encontrada" element={<EmpresaNaoEncontrada />} />
  <Route path="/inqueritos" element={<ListaInqueritos user={user}/>} />
  <Route path="/termos" element={<Terms />} />
  <Route path="/politicas" element={<Politicas />} />


    <Route 
  path="/auth" 
  element={
    <GuestRoute user={user}>
      <AuthDesk user={user} />
    </GuestRoute>
  } 
/>
  <Route 
    path="/create" 
    element={
      <GuestRoute user={user}>
        <AuthCreateDesk user={user} />
      </GuestRoute>
    } 
  />
  <Route path="/setup" element={<CompanyDataFormDesk />} />
  <Route path="/setupUser" element={<UserDataFormDesk />} />
  <Route path="/forget-password" element={<ForgetPassword />} />
  <Route path="/change-password" element={<ChangePassword user={user} />} />
  <Route path="/email-verification" element={<EmailVerification />} />
  <Route path="/app/verification" element={<CompanyVerificationNotice user={user} />} />

  <Route path="/addProduct" element={
    <ProtectedRoute requiredModule={"moduloProforma"}>
      <ProductFormDesk user={user} />
    </ProtectedRoute>
  } />
  
  <Route path="/conexoes" element={
    <ProtectedRoute>
      <ConnectionsDesk user={user} />
    </ProtectedRoute>
  } />

  <Route path="/search" element={
    <ProtectedRoute>
      <ConnectionsSearchDesk />
    </ProtectedRoute>
  } />

  <Route path="/parceiros-investidores" element={
    <ProtectedRoute>
      <ParceirosInvestidoresDesk />
    </ProtectedRoute>
  } />

  <Route path="/app" element={
    <ProtectedRoute>
      <ApxDesk user={user} />
    </ProtectedRoute>
  } />
  
  <Route path="/inbox" element={
    <ProtectedRoute>
      <InboxDesk user={user} />
    </ProtectedRoute>
  } />

  <Route path="/perfil" element={
    <ProtectedRoute>
      <ProfileDesk user={user} />
    </ProtectedRoute>
  } />

  
  <Route path="/meuperfil" element={
    <ProtectedRoute>
      <ProfileDeskSingular user={user} />
    </ProtectedRoute>
  } />

  

  <Route path="/editar-perfil" element={
    <ProtectedRoute>
      <EditProfileDesk user={user} />
    </ProtectedRoute>
  } />

    <Route path="/editar-meuperfil" element={
    <ProtectedRoute>
      <EditProfileDeskSingular user={user} />
    </ProtectedRoute>
  } />

  {/* Cotações e propostas */}
  <Route path="/cotacoes" element={
    <ProtectedRoute>
      <CotacoesDesk user={user} />
    </ProtectedRoute>
  } />

  <Route path="/cotacao" element={
    <ProtectedRoute requiredModule="moduloSMS">
      <NovaCotacaoDesk user={user} />
    </ProtectedRoute>
  } />

  <Route path="/proposta/:id/:cotId" element={
    <ProtectedRoute>
      <ProposalDesk user={user} />
    </ProtectedRoute>
  } />

  <Route path="/cotacaoPdf/:id" element={
    <ProtectedRoute requiredModule="moduloSMS">
      <CotacoesPDF user={user}/>
    </ProtectedRoute>
  } />
  <Route path="/proposta/:id/:cotId" element={
  <ProtectedRoute requiredModule="moduloSMS">
    <ProposalDesk user={user} />
  </ProtectedRoute>
} />


<Route path="/edit-proforma/:numeroProforma" element={
  <ProtectedRoute requiredModule="moduloProforma">
    <EditarFaturaDesk user={user} />
  </ProtectedRoute>
} />

<Route
  path="/verproforma/:numeroProforma/sender/:sender"
  element={
    <ProtectedRoute>
      <VerFaturaDesk user={user} />
    </ProtectedRoute>
  }
/>

<Route path="/proforma/:numeroProforma" element={
  <ProtectedRoute>
    <FaturaDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/concurso" element={
  <ProtectedRoute requiredModule="moduloSMS">
    <PublicarConcursoDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/concurso/:id" element={
  <ProtectedRoute>
    <ConcursoDetalhesDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/concursoPdf/:id" element={
  <ProtectedRoute>
    <EditalConcursoPDF user={user} />
  </ProtectedRoute>
} />

<Route path="/inquerito/:surveyId" element={
  <ProtectedRoute>
    <SurveyPageDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/painel" element={
  <ProtectedRoute>
    <PortalDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/categoria/:categoriaId" element={
  <ProtectedRoute>
    <ListaDeServicosDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/post" element={
  <ProtectedRoute>
    <PostInputDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/pagamento-modulo/:moduleKey" element={
  <ProtectedRoute>
    <PagamentoModulo user={user} />
  </ProtectedRoute>
} />

<Route path="/proforma" element={
  <ProtectedRoute>
    <CriarProformaDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/faturas/:id" element={
  <ProtectedRoute>
    <FaturaDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/enviar-proposta/:id/:companyId" element={
  <ProtectedRoute>
    <EnviarPropostaDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/propostas/:id/propostas" element={
  <ProtectedRoute>
    <PropostasDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/cotacao/:id/proposta/:propostaId" element={
  <ProtectedRoute requiredModule="moduloSMS">
    <DetalhesPropostaDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/minha_proposta/cotacao/:id/proposta/:propostaId" element={
  <ProtectedRoute requiredModule="moduloSMS">
    <MinhaPropostaDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/cotacao/:id" element={
  <ProtectedRoute requiredModule="moduloSMS">
    <CotacaoDetalhesDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/cotacaoPdf/:id" element={
  <ProtectedRoute requiredModule="moduloSMS">
    <CotacoesPDF user={user} />
  </ProtectedRoute>
} />

  {/* Concursos */}
  <Route path="/concursos" element={
    <ProtectedRoute>
      <ConcursoDesk user={user} />
    </ProtectedRoute>
  } />

<Route path="/faturacao" element={
  <ProtectedRoute>
    <FaturacaoDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/market" element={
  <ProtectedRoute requiredModule="moduloMarket">
    <MarketDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/anunciar" element={
  <ProtectedRoute>
    <AnunciarDesk user={user} />
  </ProtectedRoute>
} />
<Route path="/analises" element={
  <ProtectedRoute>
    <AnalyticsDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/callcenter" element={
  <ProtectedRoute>
    <CallCenterModuleDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/procurement" element={
  <ProtectedRoute>
    <LogisticaModuleDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/inquerito" element={
  <ProtectedRoute>
    <InqueritosModuleDesk user={user} />
  </ProtectedRoute>
} />

<Route path="/recrutamento" element={
  <ProtectedRoute>
    <RecrutamentoDesk user={user} />
  </ProtectedRoute>
} />
<Route path="/sms" element={
  <ProtectedRoute>
    <SmsDesk user={user} />
  </ProtectedRoute>
} />

</Routes>
        </Box>
        {!isFullScreenRoute && <FooterDesk sx={{ 
            flexShrink: 0,
            marginTop: 'auto' 
          }} />}
        <Fab
          color="primary"
          aria-label="feedback"
          sx={{
            position: 'fixed',
            bottom: isMobile ? 16 : 24,
            right: isMobile ? 16 : 24,
            zIndex: 1000,
            width: isMobile ? 40 : 56,
            height: isMobile ? 40 : 56,
            animation: !hasFeedback ? 'pulse 2s infinite' : 'none',
          }}
          onClick={handleOpenFeedbackModal}
        >
          <FeedbackIcon />
        </Fab>

        {showFeedbackModal && (
          <Box
            sx={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#fff',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: 3,
              zIndex: 1001,
              width: isMobile ? '90%' : '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <IconButton
              aria-label="fechar"
              onClick={handleCloseFeedbackModal}
              sx={{
                position: 'absolute',
                right: '8px',
                top: '8px',
                color: 'text.secondary',
              }}
            >
              <Close />
            </IconButton>

            <Typography variant="h6" sx={{ mb: 2 }}>
              Enviar Feedback
            </Typography>

            {!user && (
              <>
                <TextField
                  label="Seu nome"
                  fullWidth
                  name="nome"
                  value={feedbackForm.nome}
                  onChange={handleFeedbackChange}
                  sx={{ mb: 2 }}
                  required
                />
                <TextField
                  label="Seu email"
                  fullWidth
                  name="email"
                  type="email"
                  value={feedbackForm.email}
                  onChange={handleFeedbackChange}
                  sx={{ mb: 2 }}
                  required
                />
                <TextField
                  label="Seu contacto (opcional)"
                  fullWidth
                  name="contacto"
                  value={feedbackForm.contacto}
                  onChange={handleFeedbackChange}
                  sx={{ mb: 2 }}
                />
              </>
            )}

            <Typography variant="body2" sx={{ mb: 1 }}>
              Seu feedback:
            </Typography>
            <Box sx={{ mb: 2 }}>
              <ReactQuill
                value={feedbackForm.feedback}
                onChange={handleFeedbackEditorChange}
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ['link'],
                    ['clean']
                  ],
                }}
                formats={[
                  'bold', 'italic', 'underline', 'strike',
                  'list', 'bullet',
                  'link'
                ]}
                style={{ height: '200px', marginBottom: '40px' }}
              />
            </Box>

            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSubmitFeedback}
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar Feedback'}
            </Button>
          </Box>
        )}

        {showReferrerModal && (
          <Modal
            open={showReferrerModal}
            onClose={handleCloseReferrerModal}
            aria-labelledby="referrer-modal-title"
            aria-describedby="referrer-modal-description"
          >
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: '#fff',
                padding: '24px',
                borderRadius: '8px',
                boxShadow: 3,
                width: isMobile ? '90%' : '80%',
              }}>
                 <CompanyUpdateDesk/>
            </Box>
          </Modal>
        )}
      </Box>
   </ActiveModulesProvider>
    </ThemeProvider>
  );
};

export default DesktopRoutes;
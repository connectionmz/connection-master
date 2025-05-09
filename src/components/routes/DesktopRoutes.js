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
import PagamentoModulo from '../PagamentoModulo';
import FaturacaoDesk from '../desktop/FaturacaoDesk';
import CriarProformaDesk from '../desktop/CriarProformaDesk';
import FaturaDesk from '../desktop/FaturaDesk';
import MarketDesk from '../desktop/MarketDesk';
import ProductFormDesk from '../market/ProductFormDesk';
import AnunciarDesk from '../desktop/AnunciarDesk';
import PostInputDesk from '../desktop/PostInputDesk';
import Sms from '../sms/Sms';
import SmsDesk from '../sms/SmsDesk';
import CallCenterModuleDesk from '../desktop/CallCenterModuleDesk';
import InqueritosModuleDesk from '../desktop/InqueritosModuleDesk';
import LogisticaModuleDesk from '../desktop/LogisticaModuleDesk';
import ListaDeServicosDesk from '../desktop/ListaDeServicosDesk';
import InboxDesk from '../desktop/InboxDesk';
import StoresDesk from '../desktop/StoresDesk';
import StoreDetailDesk from '../desktop/StoreDetailsDesk';
import ConnectionsSearchDesk from '../desktop/ConnectionsSearchDesk';
import FooterDesk from '../desktop/FooterDesk';
import PropostasDesk from '../desktop/PropostasDesk';
import EnviarPropostaDesk from '../desktop/EnviarPropostaDesk';
import ProposalDesk from '../desktop/ProposalDesk';
import DetalhesPropostaDesk from '../desktop/DetalhesPropostaDesk';
import CotacaoDetalhesDesk from '../desktop/CotacaoDetalhesDesk';
import PortalDesk from '../desktop/PortalDesk';
import ProductDetailsDesk from '../market/ProductDetailsDesk';
import SendMail from '../sms/SendMail';
import Sobre from '../Sobre';
import SurveyPageDesk from '../desktop/SurveyPageDesk';
import DestacarModule from '../desktop/DestacarModule';
import EmailVerification from '../EmailVerification';
import CompanyVerificationNotice from '../CompanyVerificationNotice';
import CreditCardCheckoutDesk from '../checkout/CreditCardCheckoutDesk';
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
import AnalyticsDesk from '../desktop/AnalyticsDesk';
import LandingPage from '../LandingPage';
import PublicarConcursoDesk from '../desktop/PublicarConcursoDesk';
import ConcursoDetalhesDesk from '../desktop/ConcursoDetalhesDesk';
import ContactForm from '../desktop/Mailer';
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
import ProductForm from '../market/ProductForm';
import EditarFaturaDesk from '../desktop/EditarFaturaDesk';
import ReceiptsPage from '../desktop/ReceiptsPage';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import CompanyDataFormDesk from '../CompanyDataFormDesk';
import AuthCreateDesk from '../AuthCreateDesk';
import RecrutamentoDesk from '../desktop/RecrutamentoDesk';
import MinhaPropostaDesk from '../desktop/MinhaPropostaDesk';
import ListaInqueritos from '../desktop/ListaInqueritos';
import ProdutoPage from '../market/ProdutoPage';
import VerificationAccountModal from '../modal/VerificationAccountModal';

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
    '/forget-password',
  ];

  const isFullScreenRoute = fullScreenRoutes.includes(currentLocation.pathname);

  // Lista de rotas protegidas
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

// Padrões de rotas dinâmicas protegidas
const dynamicProtectedPatterns = [
  /^\/proposta\/.+/,
  /^\/cotacao\/.+/,
  /^\/concurso\/.+/,
  /^\/proforma\/.+/,
  /^\/faturas\/.+/,
  /^\/inquerito\/.+/
];

// Componente para verificação de rotas protegidas
// Componente para verificação de rotas protegidas
const ProtectedRoute = ({ children }) => {
  const currentLocation = useLocation();
  
  const isProtected = protectedRoutes.some(route => 
    currentLocation.pathname.startsWith(route) ||
    dynamicProtectedPatterns.some(pattern => pattern.test(currentLocation.pathname))
  );

  // Se não há usuário logado, permite acesso sem verificação
  if (!user) {
    return children;
  }

  // Se há usuário logado mas não está verificado e a rota é protegida
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

// Função auxiliar para renderizar rotas protegidas
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

    if (!user && (!feedbackForm.nome.trim() || !feedbackForm.email.trim())) {
      alert('Por favor, preencha seu nome e email.');
      return;
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
        contacto: feedbackForm.contacto,
        feedback: feedbackForm.feedback,
        timestamp: new Date().toISOString(),
      };

      const feedbackRef = user ? ref(db, `feedback/${user.id}`) : ref(db, 'feedback/anonymous');
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

  useEffect(() => {
    if (user===null) {
    }
  }, [user, navigate]);
  

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#F1F1F1',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
   {/* Renderiza o HeaderDesk apenas para rotas que não estão em fullScreenRoutes */}
   {!isFullScreenRoute && <HeaderDesk user={user} />}
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
          {showTerms && <TermsAndPrivacy onAccept={handleAcceptTerms} />}
          <Routes>
  {/* Rotas públicas */}
  <Route path="/" element={<DashboardComponent user={user} />} />
  <Route path="/feed" element={<FeedDesk user={user} />} />
  <Route path="/perfil/:id" element={<CompanyProfileDesk user={user} />} />
  <Route path="/empresas" element={<ExploreDesk user={user} />} />
  <Route path="/post/:postId" element={<PostDetailPageDesk user={user} />} />
  <Route path="/sobre" element={<Sobre />} />
  <Route path="/noticias" element={<NoticiadosDesk />} />
  <Route path="/noticia/:id" element={<NoticiaDetalheDesk user={user} />} />
  <Route path="/blog" element={<Blogs />} />
  <Route path="/blog/:id" element={<BlogDetalheDesk user={user} />} />
  <Route path="/market" element={<MarketDesk user={user} />} />
  <Route path="/produto/:id/loja/:loja" element={<ProdutoPage user={user}/>} />
  <Route path="/recibos" element={<ReceiptsPage user={user} />} />
  <Route path="/lojas" element={<StoresDesk user={user} />} />
  <Route path="/loja/:storeId" element={<StoreDetailDesk />} />
  <Route path="/product/:productId/store/:store" element={<ProductDetailsDesk user={user}/>} />
  <Route path="/empresa-nao-encontrada" element={<EmpresaNaoEncontrada />} />
  <Route path="/inqueritos" element={<ListaInqueritos />} />
  <Route path="/termos" element={<Terms />} />
  <Route path="/politicas" element={<Politicas />} />

  {/* Rotas de autenticação */}
  <Route path="/auth" element={<AuthDesk user={user} />} />
  <Route path="/create" element={<AuthCreateDesk user={user} />} />
  <Route path="/setup" element={<CompanyDataFormDesk />} />
  <Route path="/forget-password" element={<ForgetPassword />} />
  <Route path="/change-password" element={<ChangePassword user={user} />} />
  <Route path="/email-verification" element={<EmailVerification />} />
  <Route path="/app/verification" element={<CompanyVerificationNotice user={user} />} />

  {/* Rotas protegidas */}
  <Route path="/addProduct" element={
    <ProtectedRoute>
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

  {/* Rotas de perfil */}
  <Route path="/perfil" element={
    <ProtectedRoute>
      <ProfileDesk user={user} />
    </ProtectedRoute>
  } />

  <Route path="/editar-perfil" element={
    <ProtectedRoute>
      <EditProfileDesk user={user} />
    </ProtectedRoute>
  } />

  {/* Cotações e propostas */}
  <Route path="/cotacoes" element={
    <ProtectedRoute>
      <CotacoesDesk user={user} />
    </ProtectedRoute>
  } />

  <Route path="/cotacao" element={
    <ProtectedRoute>
      <NovaCotacaoDesk user={user} />
    </ProtectedRoute>
  } />

  <Route path="/proposta/:id/:cotId" element={
    <ProtectedRoute>
      <ProposalDesk user={user} />
    </ProtectedRoute>
  } />

  {/* ... (continuar com o mesmo padrão para todas as outras rotas protegidas) */}

  <Route path="/cotacaoPdf/:id" element={
    <ProtectedRoute>
      <CotacoesPDF user={user}/>
    </ProtectedRoute>
  } />

  {/* Concursos */}
  <Route path="/concursos" element={
    <ProtectedRoute>
      <ConcursoDesk user={user} />
    </ProtectedRoute>
  } />

  {/* ... (proteger todas as demais rotas seguindo o mesmo padrão) */}

  {/* Rotas administrativas/protegidas restantes */}
  <Route path="/sms" element={
    <ProtectedRoute>
      <SmsDesk user={user} />
    </ProtectedRoute>
  } />

  <Route path="/analises" element={
    <ProtectedRoute>
      <AnalyticsDesk user={user} />
    </ProtectedRoute>
  } />

  <Route path="*" element={<Navigate to="/" />} />
</Routes>
        </Box>

        {!isFullScreenRoute && <FooterDesk sx={{ 
  flexShrink: 0,
  marginTop: 'auto' 
}} />}

        {/* Botão flutuante de feedback */}
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
    </ThemeProvider>
  );
};

export default DesktopRoutes;
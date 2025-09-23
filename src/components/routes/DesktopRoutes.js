import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import DashboardComponent from '../Dashboard';
import CotacoesDesk from '../desktop/CotacoesDesk';
import HeaderDesk from '../desktop/HeaderDesk';
import { Box, Button, createTheme, Fab, IconButton, Menu, MenuItem, TextField, ThemeProvider, Typography, useMediaQuery, Modal, Snackbar, Alert, CircularProgress } from '@mui/material';
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
import Eventos from '../desktop/Eventos';
import Checkout from '../checkout/Checkout';
import VerEvento from '../desktop/VerEvento';
import SelectAccountType from '../SelectAccountType';

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

// Lista de rotas protegidas simplificada (removida duplicação)
const protectedRoutes = [
  '/cotacoes', '/cotacao', '/proposta', '/enviar-proposta', '/propostas', '/minha_proposta',
  '/cotacaoPdf', '/concursos', '/concurso', '/faturacao', '/proforma', '/edit-proforma',
  '/faturas', '/checkout', '/pagamento-modulo', '/post', '/anunciar', '/sms', '/callcenter',
  '/procurement', '/inquerito', '/destacar', '/analises', '/recrutamento', '/addProduct',
  '/conexoes', '/inbox', '/perfil', '/editar-perfil', '/painel', '/app', '/meuperfil',
  '/editar-meuperfil', '/evento', '/market'
];

// Padrões dinâmicos simplificados
const dynamicProtectedPatterns = [
  /^\/proposta\/.+/,
  /^\/cotacao\/.+/,
  /^\/concurso\/.+/,
  /^\/proforma\/.+/,
  /^\/faturas\/.+/,
  /^\/inquerito\/.+/,
  /^\/perfil\/.+/,
  /^\/produto\/.+/,
  /^\/loja\/.+/,
  /^\/product\/.+/,
  /^\/verproforma\/.+/,
  /^\/concursoPdf\/.+/,
  /^\/categoria\/.+/,
  /^\/pagamento-modulo\/.+/,
  /^\/minha_proposta\/.+/
];

// Componente ProtectedRoute movido para fora do DesktopRoutes
const ProtectedRoute = ({ user, children, requiredModule }) => {
  const { activeModules, isLoading: modulesLoading } = useActiveModules();
  const location = useLocation();
  const navigate = useNavigate();
  
  if (modulesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
        <CircularProgress />
      </Box>
    );
  }

  // Função para verificar se uma rota está protegida
  const isRouteProtected = (pathname) => {
    return protectedRoutes.some(route => pathname.startsWith(route)) ||
           dynamicProtectedPatterns.some(pattern => pattern.test(pathname));
  };

  const isProtected = isRouteProtected(location.pathname);

  // Caso 2: Módulo requerido não está ativo
  if (requiredModule && !activeModules[requiredModule]) {
    const module = allModules.find(m => m.key === requiredModule);
    return (
      <Box sx={{ p: 4, textAlign: 'center', maxWidth: 500, margin: 'auto', mt: 8 }}>
        <Typography variant="h4" gutterBottom color="error.main">
          Módulo não disponível
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Você não tem acesso ao módulo <strong>{module?.name || requiredModule}</strong>.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(`/pagamento-modulo/${requiredModule}`)}
        >
          Ativar Módulo
        </Button>
      </Box>
    );
  }


  return children;
};

const DesktopRoutes = ({ user }) => {

  const [language, setLanguage] = useState('pt')
  const [anchorEl, setAnchorEl] = useState(null)
  const [showTerms, setShowTerms] = useState(false)
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [hasFeedback, setHasFeedback] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showReferrerModal, setShowReferrerModal] = useState(false)
  const [feedbackForm, setFeedbackForm] = useState({
    nome: '',
    email: '',
    contacto: '',
    feedback: ''
  });

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

  useEffect(() => {
    if (user?.id) {
      const feedbackRef = ref(db, `feedback/${user.id}`);
      onValue(feedbackRef, (snapshot) => {
        setHasFeedback(snapshot.exists());
      });

      if(user.referer && !user.isComplete){
        setShowReferrerModal(true); 
      }
    }
  }, [user]);

  const handleOpenFeedbackModal = () => {
    setShowFeedbackModal(true);
  };

  const handleCloseFeedbackModal = () => {
    setShowFeedbackModal(false);
    setFeedbackForm({ nome: '', email: '', contacto: '', feedback: '' });
  };

  const handleFeedbackChange = (e) => {
    const { name, value } = e.target;
    setFeedbackForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFeedbackEditorChange = (value) => {
    setFeedbackForm(prev => ({ ...prev, feedback: value }));
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
        contacto: feedbackForm.contacto || '',
        feedback: feedbackForm.feedback,
        timestamp: new Date().toISOString(),
      };

      const feedbackRef = user 
        ? ref(db, `feedback/${user.id}`) 
        : ref(db, 'feedback/anonymousFeedbacks');

      const newFeedbackRef = push(feedbackRef);
      await set(newFeedbackRef, feedbackData); 

      alert('Feedback enviado com sucesso!');
      setHasFeedback(true);
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
        <Box sx={{ minHeight: '100vh', backgroundColor: '#F1F1F1', display: 'flex', flexDirection: 'column' }}>
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
          
          <Box component="main" sx={{ flex: 1, width: '100%', maxWidth: isFullScreenRoute ? '100%' : isMobile ? '100%' : '1200px', margin: '0 auto', padding: isFullScreenRoute ? '0' : isMobile ? '8px' : '24px', boxSizing: 'border-box', pb: 4 }}>
            <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<DashboardComponent user={user} />} />
              <Route path="/feed" element={<FeedDesk user={user} />} />
              <Route path="/verEvento/:id" element={<VerEvento user={user} />} />
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
               <Route path="/checkout" element={<Checkout user={user}/>} />
              <Route path="/empresa-nao-encontrada" element={<EmpresaNaoEncontrada />} />
              <Route path="/inqueritos" element={<ListaInqueritos user={user}/>} />
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

              {/* Rotas protegidas */}
              {renderProtectedRoute("/addProduct", <ProductFormDesk user={user} />, "moduloMarket")}
              {renderProtectedRoute("/conexoes", <ConnectionsDesk user={user} />)}
              {renderProtectedRoute("/search", <ConnectionsSearchDesk />)}
              {renderProtectedRoute("/parceiros-investidores", <ParceirosInvestidoresDesk />)}
              {renderProtectedRoute("/app", <ApxDesk user={user} />)}
              {renderProtectedRoute("/inbox", <InboxDesk user={user} />)}
              {renderProtectedRoute("/perfil", <ProfileDesk user={user} />)}
              {renderProtectedRoute("/meuperfil", <ProfileDeskSingular user={user} />)}
              {renderProtectedRoute("/editar-perfil", <EditProfileDesk user={user} />)}
              {renderProtectedRoute("/editar-meuperfil", <EditProfileDeskSingular user={user} />)}
              {renderProtectedRoute("/cotacoes", <CotacoesDesk user={user} />)}
              {renderProtectedRoute("/cotacao", <NovaCotacaoDesk user={user} />, "moduloSMS")}
              {renderProtectedRoute("/evento", <Eventos user={user} />, "moduloEventos")}
              {renderProtectedRoute("/proposta/:id/:cotId", <ProposalDesk user={user} />, "moduloSMS")}
              {renderProtectedRoute("/cotacaoPdf/:id", <CotacoesPDF user={user}/>, "moduloSMS")}
              {renderProtectedRoute("/edit-proforma/:numeroProforma", <EditarFaturaDesk user={user} />, "moduloProforma")}
              {renderProtectedRoute("/verproforma/:numeroProforma/sender/:sender", <VerFaturaDesk user={user} />)}
              {renderProtectedRoute("/proforma/:numeroProforma", <FaturaDesk user={user} />)}
              {renderProtectedRoute("/concurso", <PublicarConcursoDesk user={user} />, "moduloSMS")}
              {renderProtectedRoute("/concurso/:id", <ConcursoDetalhesDesk user={user} />)}
              {renderProtectedRoute("/concursoPdf/:id", <EditalConcursoPDF user={user} />)}
              {renderProtectedRoute("/inquerito/:surveyId", <SurveyPageDesk user={user} />)}
              {renderProtectedRoute("/painel", <PortalDesk user={user} />)}
              {renderProtectedRoute("/categoria/:categoriaId", <ListaDeServicosDesk user={user} />)}
              {renderProtectedRoute("/post", <PostInputDesk user={user} />)}
              {renderProtectedRoute("/pagamento-modulo/:moduleKey", <PagamentoModulo user={user} />)}
              {renderProtectedRoute("/proforma", <CriarProformaDesk user={user} />)}
              {renderProtectedRoute("/faturas/:id", <FaturaDesk user={user} />)}
              {renderProtectedRoute("/enviar-proposta/:id/:companyId", <EnviarPropostaDesk user={user} />)}
              {renderProtectedRoute("/propostas/:id/propostas", <PropostasDesk user={user} />)}
              {renderProtectedRoute("/cotacao/:id/proposta/:propostaId", <DetalhesPropostaDesk user={user} />, "moduloSMS")}
              {renderProtectedRoute("/minha_proposta/cotacao/:id/proposta/:propostaId", <MinhaPropostaDesk user={user} />, "moduloSMS")}
              {renderProtectedRoute("/cotacao/:id", <CotacaoDetalhesDesk user={user} />, "moduloSMS")}
              {renderProtectedRoute("/cotacaoPdf/:id", <CotacoesPDF user={user} />, "moduloSMS")}
              {renderProtectedRoute("/concursos", <ConcursoDesk user={user} />)}
              {renderProtectedRoute("/faturacao", <FaturacaoDesk user={user} />)}
              {renderProtectedRoute("/market", <MarketDesk user={user} />, "moduloMarket")}
              {renderProtectedRoute("/anunciar", <AnunciarDesk user={user} />)}
              {renderProtectedRoute("/analises", <AnalyticsDesk user={user} />)}
              {renderProtectedRoute("/callcenter", <CallCenterModuleDesk user={user} />)}
              {renderProtectedRoute("/procurement", <LogisticaModuleDesk user={user} />)}
              {renderProtectedRoute("/inquerito", <InqueritosModuleDesk user={user} />)}
              {renderProtectedRoute("/recrutamento", <RecrutamentoDesk user={user} />)}
              {renderProtectedRoute("/sms", <SmsDesk user={user} />)}

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
          
          {!isFullScreenRoute && <FooterDesk sx={{ flexShrink: 0, marginTop: 'auto' }} />}
          
          <Fab color="primary" aria-label="feedback" sx={{ position: 'fixed', bottom: isMobile ? 16 : 24, right: isMobile ? 16 : 24, zIndex: 1000, width: isMobile ? 40 : 56, height: isMobile ? 40 : 56, animation: !hasFeedback ? 'pulse 2s infinite' : 'none' }} onClick={handleOpenFeedbackModal}>
            <FeedbackIcon />
          </Fab>

          {showFeedbackModal && (
            <Box sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: 3, zIndex: 1001, width: isMobile ? '90%' : '500px', maxHeight: '90vh', overflowY: 'auto' }}>
              <IconButton aria-label="fechar" onClick={handleCloseFeedbackModal} sx={{ position: 'absolute', right: '8px', top: '8px', color: 'text.secondary' }}>
                <Close />
              </IconButton>
              <Typography variant="h6" sx={{ mb: 2 }}>Enviar Feedback</Typography>
              {!user && (
                <>
                  <TextField label="Seu nome" fullWidth name="nome" value={feedbackForm.nome} onChange={handleFeedbackChange} sx={{ mb: 2 }} required />
                  <TextField label="Seu email" fullWidth name="email" type="email" value={feedbackForm.email} onChange={handleFeedbackChange} sx={{ mb: 2 }} required />
                  <TextField label="Seu contacto (opcional)" fullWidth name="contacto" value={feedbackForm.contacto} onChange={handleFeedbackChange} sx={{ mb: 2 }} />
                </>
              )}
              <Typography variant="body2" sx={{ mb: 1 }}>Seu feedback:</Typography>
              <Box sx={{ mb: 2 }}>
                <ReactQuill value={feedbackForm.feedback} onChange={handleFeedbackEditorChange} modules={{ toolbar: [['bold', 'italic', 'underline', 'strike'], [{ 'list': 'ordered'}, { 'list': 'bullet' }], ['link'], ['clean']] }} formats={['bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link']} style={{ height: '200px', marginBottom: '40px' }} />
              </Box>
              <Button variant="contained" color="primary" fullWidth onClick={handleSubmitFeedback} disabled={isLoading}>
                {isLoading ? 'Enviando...' : 'Enviar Feedback'}
              </Button>
            </Box>
          )}

          {showReferrerModal && (
            <Modal open={showReferrerModal} onClose={handleCloseReferrerModal}>
              <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: 3, width: isMobile ? '90%' : '80%' }}>
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
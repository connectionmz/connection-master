import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DashboardComponent from '../Dashboard';
import CotacoesDesk from '../desktop/CotacoesDesk';
import HeaderDesk from '../desktop/HeaderDesk';
import { Box, Button, createTheme, Fab, IconButton, Menu, MenuItem, TextField, ThemeProvider, Typography, useMediaQuery, Modal } from '@mui/material';
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
});

const DesktopRoutes = ({ user }) => {
  const [language, setLanguage] = useState('pt');
  const [anchorEl, setAnchorEl] = useState(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [hasFeedback, setHasFeedback] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showReferrerModal, setShowReferrerModal] = useState(false); 
  const [referrerData, setReferrerData] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({
    nome: '',
    email: '',
    contacto: '',
    feedback: ''
  });

  const currentLocation = useLocation(); // Rename to avoid conflicts

  const isMobile = useMediaQuery('(max-width:600px)');


  const fullScreenRoutes = [
    '/auth',
    '/email-verification',
    '/create',
    '/setup',
    '/forget-password',
  ];

  // Verifica se a rota atual é uma das rotas especiais
  const isFullScreenRoute = fullScreenRoutes.includes(currentLocation.pathname);

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
      pb: 4, // Adiciona padding na parte inferior para evitar sobreposição com o footer
    }}
  >
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
            <Route path="/addProduct" element={<ProductFormDesk user={user} />} />
            <Route path="/recibos" element={<ReceiptsPage user={user} />} />
            
            <Route path="/lojas" element={<StoresDesk user={user} />} />
            <Route path="/loja/:storeId" element={<StoreDetailDesk />} />
            <Route path="/product/:productId/store/:store" element={<ProductDetailsDesk user={user}/>} />
            <Route path="/empresa-nao-encontrada" element={<EmpresaNaoEncontrada />} />
            <Route path="/website" element={<LandingPage />} />

            {/* Rotas relacionadas a conexões e interações */}
            <Route path="/conexoes" element={<ConnectionsDesk user={user} />} />
            <Route path="/search" element={<ConnectionsSearchDesk />} />
            <Route path="/parceiros-investidores" element={<ParceirosInvestidoresDesk />} />
            <Route path="/app" element={<ApxDesk user={user} />} />
            <Route path="/inbox" element={<InboxDesk user={user} />} />

            {/* Rotas de perfil e configurações */}
            <Route path="/perfil" element={<ProfileDesk user={user} />} />
            <Route path="/editar-perfil" element={<EditProfileDesk user={user} />} />

            {/* Rotas de cotações e propostas */}
            <Route path="/cotacoes" element={<CotacoesDesk user={user} />} />
            <Route path="/cotacao" element={<NovaCotacaoDesk user={user} />} />
            <Route path="/proposta/:id/:cotId" element={<ProposalDesk user={user} />} />
            <Route path="/enviar-proposta/:id/:companyId" element={<EnviarPropostaDesk user={user} />} />
            <Route path="/propostas/:id/propostas" element={<PropostasDesk />} />
            <Route path="/cotacao/:id/proposta/:propostaId" element={<DetalhesPropostaDesk user={user} />} />
            <Route path="/minha_proposta/cotacao/:id/proposta/:propostaId" element={<MinhaPropostaDesk user={user} />} />
            <Route path="/cotacao/:id" element={<CotacaoDetalhesDesk user={user} />} />
            <Route path="/cotacaoPdf/:id" element={<CotacoesPDF user={user}/>} />

            {/* Rotas de concursos e serviços */}
            <Route path="/concursos" element={<ConcursoDesk user={user} />} />
            <Route path="/concurso" element={<PublicarConcursoDesk user={user} />} />
            <Route path="/concurso/:id" element={<ConcursoDetalhesDesk user={user} />} />
            <Route path="/categoria/:categoriaId" element={<ListaDeServicosDesk user={user} />} />

            {/* Rotas de faturação e pagamentos */}
            <Route path="/faturacao" element={<FaturacaoDesk user={user} />} />
            <Route path="/proforma" element={<CriarProformaDesk user={user} />} />
            <Route path="/proforma/:numeroProforma" element={<FaturaDesk user={user} />} />
            <Route path="/edit-proforma/:numeroProforma" element={<EditarFaturaDesk user={user} />} />
            <Route path="/faturas/:id" element={<FaturaDesk user={user} />} />
            <Route path="/checkout" element={<CreditCardCheckoutDesk user={user} />} />
            <Route path="/pagamento-modulo/:moduleKey" element={<PagamentoModulo user={user} />} />

            {/* Rotas de anúncios e postagens */}
            <Route path="/post" element={<PostInputDesk user={user} />} />
            <Route path="/anunciar" element={<AnunciarDesk user={user} />} />

            {/* Outras funcionalidades */}
            <Route path="/sms" element={<SmsDesk user={user} />} />
            <Route path="/callcenter" element={<CallCenterModuleDesk />} />
            <Route path="/procurement" element={<LogisticaModuleDesk />} />
            <Route path="/inqueritos" element={<InqueritosModuleDesk user={user} />} />
            <Route path="/inquerito/:surveyId" element={<SurveyPageDesk user={user} />} />
            <Route path="/painel" element={<PortalDesk user={user} />} />
            <Route path="/sendmail" element={<SendMail user={user} />} />
            <Route path="/destacar" element={<DestacarModule user={user} />} />
            <Route path="/analises" element={<AnalyticsDesk user={user} />} />
            <Route path="/termos" element={<Terms />} />
            <Route path="/recrutamento" element={<RecrutamentoDesk user={user}/>} />
            <Route path="/politicas" element={<Politicas />} />

            <Route path="/change-password" element={<ChangePassword user={user} />} />
            
            {/* Rotas de autenticação */}
            <Route path="/auth" element={<AuthDesk user={user} />} />
            <Route path="/create" element={<AuthCreateDesk user={user} />} />
            <Route path="/setup" element={<CompanyDataFormDesk />} />
            <Route path="/forget-password" element={<ForgetPassword />} />

            {/* Rota de fallback para redirecionamento */}
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
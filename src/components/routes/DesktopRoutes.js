import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardComponent from '../Dashboard';
import CotacoesDesk from '../desktop/CotacoesDesk';
import HeaderDesk from '../desktop/HeaderDesk';
import { Box, Button, createTheme, Fab, IconButton, Menu, MenuItem, TextField, ThemeProvider, Typography, useMediaQuery, Modal } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
import FeedbackIcon from '@mui/icons-material/Feedback';
import NovaCotacaoDesk from '../desktop/NovaCotacaoDesk';
import CompanyProfileDesk from '../desktop/CompanyProfileDesk';
import ExploreDesk from '../desktop/ExploreDesk';
import ApxDesk from '../desktop/ApxDesk';
import PagamentoModulo from '../PagamentoModulo';
import Profile from '../Profile';
import FaturacaoDesk from '../desktop/FaturacaoDesk';
import CriarProformaDesk from '../desktop/CriarProformaDesk';
import FaturaDesk from '../desktop/FaturaDesk';
import Market from '../Market';
import MarketDesk from '../desktop/MarketDesk';
import ProductFormDesk from '../market/ProductFormDesk';
import AnunciarDesk from '../desktop/AnunciarDesk';
import PostInputDesk from '../desktop/PostInputDesk';
import Sms from '../sms/Sms';
import SmsDesk from '../sms/SmsDesk';
import CallCenterModule from '../CallCenterModule';
import LogisticaModule from '../LogisticaModule';
import InqueritosModule from '../InqueritosModule';
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
import { onValue, ref, set, update } from 'firebase/database';
import { db } from '../../fb';
import ForgetPassword from '../password/ForgetPassword';
import ChangePassword from '../password/ChangePassword';
import Terms from '../Termos';
import Politicas from '../desktop/Politicas';
import { Close } from '@mui/icons-material';
import CompanyUpdateDesk from '../CompanyUpdateDesk';

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
  const [showReferrerModal, setShowReferrerModal] = useState(false); // Estado para controlar o modal de referrer
  const [referrerData, setReferrerData] = useState(null); // Estado para armazenar os dados do referrer

  const isMobile = useMediaQuery('(max-width:600px)');

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

      if(user.referer){
        setShowReferrerModal(true); // Abre o modal de verificação
      }
    }
  }, [user]);

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('selectedLanguage', lang);
    console.log(`Language switched to: ${lang}`);
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
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      alert('Por favor, insira seu feedback.');
      return;
    }

    setIsLoading(true);

    try {
      const feedbackRef = ref(db, `feedback/${user.id}`);
      await set(feedbackRef, {
        nome: user.displayName || 'Usuário Anônimo',
        email: user.email || 'anonimo@exemplo.com',
        userId: user.id,
        feedback: feedbackText,
        timestamp: new Date().toISOString(),
      });

      setHasFeedback(true);
      setFeedbackText('');
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

  const handleConfirmReferrerData = async () => {
    // Lógica para confirmar os dados do referrer
    try {
      const referrerRef = ref(db, `users/${user.id}`);
      await update(referrerRef, { isComplete: true });
      setShowReferrerModal(false); // Fecha o modal
    } catch (error) {
      console.error('Erro ao confirmar dados do referrer:', error);
      alert('Erro ao confirmar dados. Tente novamente.');
    }
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
        <HeaderDesk user={user} />

        <Box
          sx={{
            flex: 1,
            width: '100%',
            maxWidth: isMobile ? '100%' : '1200px',
            margin: '0 auto',
            padding: isMobile ? '8px' : '24px',
            boxSizing: 'border-box',
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
            <Route path="/lojas" element={<StoresDesk user={user} />} />
            <Route path="/loja/:storeId" element={<StoreDetailDesk />} />
            <Route path="/product/:productId/store/:store" element={<ProductDetailsDesk />} />
            <Route path="/empresa-nao-encontrada" element={<EmpresaNaoEncontrada />} />
            <Route path="/website" element={<LandingPage />} />

            {/* Rotas relacionadas a conexões e interações */}
            <Route path="/conexoes" element={<ConnectionsDesk user={user} />} />
            <Route path="/search" element={<ConnectionsSearchDesk />} />
            <Route path="/parceiros-investidores" element={<ParceirosInvestidoresDesk />} />
            <Route path="/app" element={<ApxDesk user={user} />} />
            <Route path="/inbox" element={<InboxDesk user={user} />} />

            {/* Rotas de perfil e configurações */}
            <Route path="/profile" element={<ProfileDesk user={user} />} />
            <Route path="/editar-perfil" element={<EditProfileDesk user={user} />} />

            {/* Rotas de cotações e propostas */}
            <Route path="/cotacoes" element={<CotacoesDesk user={user} />} />
            <Route path="/cotacao" element={<NovaCotacaoDesk user={user} />} />
            <Route path="/proposta/:id/:cotId" element={<ProposalDesk />} />
            <Route path="/enviar-proposta/:id/:companyId" element={<EnviarPropostaDesk user={user} />} />
            <Route path="/propostas/:id/propostas" element={<PropostasDesk />} />
            <Route path="/cotacao/:id/proposta/:propostaId" element={<DetalhesPropostaDesk user={user} />} />
            <Route path="/cotacao/:id" element={<CotacaoDetalhesDesk user={user} />} />
            <Route path="/cotacaoPdf/:id" element={<CotacoesPDF />} />

            {/* Rotas de concursos e serviços */}
            <Route path="/concursos" element={<ConcursoDesk user={user} />} />
            <Route path="/concurso" element={<PublicarConcursoDesk user={user} />} />
            <Route path="/concurso/:id/:companyId" element={<ConcursoDetalhesDesk user={user} />} />
            <Route path="/categoria/:categoriaId" element={<ListaDeServicosDesk user={user} />} />

            {/* Rotas de faturação e pagamentos */}
            <Route path="/faturacao" element={<FaturacaoDesk user={user} />} />
            <Route path="/proforma" element={<CriarProformaDesk user={user} />} />
            <Route path="/proforma/:numeroProforma" element={<FaturaDesk user={user} />} />
            <Route path="/edit-proforma/:numeroProforma" element={<FaturaDesk user={user} />} />
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
            <Route path="/politicas" element={<Politicas />} />

            <Route path="/forget-password" element={<ForgetPassword />} />
            <Route path="/change-password" element={<ChangePassword user={user} />} />
            {/* Rota de fallback para redirecionamento */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Box>

        <FooterDesk />

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

        {/* Modal de feedback */}
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
              width: isMobile ? '90%' : '400px',
            }}
          >
            <IconButton
              aria-label="fechar"
              onClick={() => setShowFeedbackModal(false)}
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
            <TextField
              label="Seu feedback"
              multiline
              rows={4}
              fullWidth
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleSubmitFeedback}
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar'}
            </Button>
          </Box>
        )}

        {/* Modal de verificação de referrer */}
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
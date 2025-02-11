import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardComponent from '../Dashboard';
import CotacoesDesk from '../desktop/CotacoesDesk';
import HeaderDesk from '../desktop/HeaderDesk';
import { createTheme, Fab, Menu, MenuItem, ThemeProvider } from '@mui/material';
import LanguageIcon from '@mui/icons-material/Language';
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

  if (user?.subscriptions?.isverify==='false') {
    console.log(user?.subscriptions?.isverify);
    // Use Navigate para redirecionar ou encapsule o Route em Routes
    return (
      <Routes>
        <Route path="/verify" element={<CompanyVerificationNotice user={user} />} />
        <Route path="/auth" element={<AuthDesk user={user} />} />
        <Route path="*" element={<Navigate to="/verify" />} />
      </Routes>
    );
  }

  return (
    <div
    style={{
      minHeight: '100vh',
      backgroundColor:"#F1F1F1"

    }}
  >
    <ThemeProvider theme={theme}>
      <HeaderDesk user={user} />
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '80%', 
          margin: '0 auto', 
        }}>
        <Routes>
        <Route path="/" element={<DashboardComponent user={user} />} />
        <Route path="/parceiros-investidores" element={<ParceirosInvestidoresDesk />} />
        <Route path="/perfil/:id" element={<CompanyProfileDesk user={user} />} />
        <Route path="/explore" element={<ExploreDesk user={user} />} />
        <Route path="/conexoes" element={<ConnectionsDesk user={user} />} />
        <Route path="/app" element={<ApxDesk user={user} />} />
        <Route path="/feed" element={<FeedDesk user={user} />} />
        <Route path="/post/:postId" element={<PostDetailPageDesk user={user}/>} />
        <Route path="/pagamento-modulo/:moduleKey" element={<PagamentoModulo user={user}/>} />
        <Route path="/profile" element={<ProfileDesk userI={user}/>} />
        <Route path="/servicos/:categoriaId" element={<ListaDeServicosDesk user={user}/>} />
        <Route path="/inbox" element={<InboxDesk user={user}/>} />
        <Route path="/search" element={<ConnectionsSearchDesk />} />
        <Route path="/sobre" element={<Sobre />} />
        <Route path="/email-verification" element={<EmailVerification />} />
        <Route path="/editar-perfil" element={<EditProfileDesk user={user} />} />
        <Route path="/cotacoes" element={<CotacoesDesk user={user} />} />
        <Route path="/cotacao" element={<NovaCotacaoDesk user={user} />} />
        <Route path="/proposta/:id/:cotId" element={<ProposalDesk />} />
        <Route path="/enviar-proposta/:id/:companyId" element={<EnviarPropostaDesk user={user} />} />
        <Route path="/propostas/:id/propostas" element={<PropostasDesk />} />
        <Route path="/cotacao/:id/proposta/:propostaId" element={<DetalhesPropostaDesk  user={user}/>} />
        <Route path="/cotacao/:id/:companyId" element={<CotacaoDetalhesDesk  user={user}/>} />
        <Route path="/cotacaoPdf/:id" element={<CotacoesPDF />} />
        <Route path="/website" element={<LandingPage user={user} />} />
        <Route path="/noticiados" element={<NoticiadosDesk />} />
        <Route path="/noticia/:id" element={<NoticiaDetalheDesk />} />
      {/* Concursos */}
      <Route path="/concursos" element={<ConcursoDesk user={user} />} />
      <Route path="/concurso" element={<PublicarConcursoDesk user={user} />} />
      <Route path="/concurso/:id/:companyId" element={<ConcursoDetalhesDesk user={user} />} />

        {/* Faturação e Proforma */}
        <Route path="/faturacao" element={<FaturacaoDesk user={user} />} />
        <Route path="/proforma" element={<CriarProformaDesk user={user} />} />
        <Route path="/proforma/:numeroProforma" element={<FaturaDesk user={user} />} />
        <Route path="/edit-proforma/:numeroProforma" element={<FaturaDesk user={user} />} />
        <Route path="/faturas/:id" element={<FaturaDesk user={user} />} />
        {/* Mercado e Produtos */}
        <Route path="/market" element={<MarketDesk user={user} />} />
        <Route path="/addProduct/:storeId" element={<ProductFormDesk user={user} />} />
        <Route path="/stores" element={<StoresDesk user={user}/>} />
        <Route path="/stores/:storeId" element={<StoreDetailDesk />} />
        <Route path="/product/:productId/store/:store" element={<ProductDetailsDesk />} />
        <Route path="/checkout" element={<CreditCardCheckoutDesk user={user}/>} />
        {/* Campanha e Posts */}
        <Route path="/post" element={<PostInputDesk user={user} />} />
        <Route path="/anunciar" element={<AnunciarDesk user={user} />} />
        <Route path="/sms" element={<SmsDesk user={user}/>} /> 
          {/* Módulos */}
        <Route path="/callcenter" element={<CallCenterModuleDesk />} />
        <Route path="/procurement" element={<LogisticaModuleDesk />} />
        <Route path="/inqueritos" element={<InqueritosModuleDesk user={user}/>} />
        <Route path="/inquerito/:surveyId" element={<SurveyPageDesk user={user}/>} />
        <Route path="/painel" element={<PortalDesk user={user}/>} />
        <Route path="/sendmail" element={<SendMail user={user}/>} />
        <Route path="/destacar" element={<DestacarModule user={user}/>} />
        <Route path="/analises" element={<AnalyticsDesk />} />  
        <Route path="/email" element={<ContactForm />} />  
        
       <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
      <FooterDesk />
      <Fab
        color="primary"
        aria-label="change language"
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
        }}
        onClick={handleMenuOpen}
      >
        <LanguageIcon />
      </Fab>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleLanguageChange('en')}>English</MenuItem>
        <MenuItem onClick={() => handleLanguageChange('pt')}>Português</MenuItem>
        <MenuItem onClick={() => handleLanguageChange('fr')}>Français</MenuItem>
      </Menu>
    </ThemeProvider>
  </div>
  );
};

export default DesktopRoutes;

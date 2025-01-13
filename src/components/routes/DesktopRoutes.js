import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardComponent from '../Dashboard';
import CotacoesDesk from '../desktop/CotacoesDesk';
import HeaderDesk from '../desktop/HeaderDesk';
import { createTheme, ThemeProvider } from '@mui/material';
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

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      }}
    >
      <ThemeProvider theme={theme}>
      <HeaderDesk user={user}/>
      <div
    style={{
      flex: 1, 
    }}
  >    
        <Routes>
        <Route path="/" element={<DashboardComponent user={user} />} />
      
        <Route path="/vperfil/:id" element={<CompanyProfileDesk user={user} />} />
        <Route path="/explore" element={<ExploreDesk user={user.provincia} />} />
        <Route path="/app" element={<ApxDesk user={user.provincia} />} />
        <Route path="/pagamento-modulo/:moduleKey" element={<PagamentoModulo user={user}/>} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/servicos/:categoriaId" element={<ListaDeServicosDesk />} />
        <Route path="/inbox" element={<InboxDesk />} />
        <Route path="/search" element={<ConnectionsSearchDesk />} />
        <Route path="/sobre" element={<Sobre />} />

        <Route path="/cotacoes" element={<CotacoesDesk user={user} />} />
        <Route path="/cotacao" element={<NovaCotacaoDesk user={user} />} />
        <Route path="/proposta/:id/:cotId" element={<ProposalDesk />} />
        <Route path="/enviar-proposta/:id/:companyId" element={<EnviarPropostaDesk user={user} />} />
        <Route path="/propostas/:id/propostas" element={<PropostasDesk />} />
        <Route path="/cotacao/:id/proposta/:propostaId" element={<DetalhesPropostaDesk />} />
        <Route path="/cotacao/:id/:companyId" element={<CotacaoDetalhesDesk />} />


        {/* Faturação e Proforma */}
        <Route path="/faturacao" element={<FaturacaoDesk user={user} />} />
        <Route path="/proforma" element={<CriarProformaDesk user={user} />} />
        <Route path="/proforma/:numeroProforma" element={<FaturaDesk user={user} />} />
        <Route path="/faturas/:id" element={<FaturaDesk user={user} />} />

        {/* Mercado e Produtos */}
        <Route path="/market" element={<MarketDesk user={user} />} />
        <Route path="/addProduct/:storeId" element={<ProductFormDesk user={user} />} />
        <Route path="/stores" element={<StoresDesk user={user}/>} />
        <Route path="/stores/:storeId" element={<StoreDetailDesk />} />
        <Route path="/product/:productId/store/:store" element={<ProductDetailsDesk />} />

        {/* Campanha e Posts */}
        <Route path="/post" element={<PostInputDesk user={user?.id} />} />
        <Route path="/anunciar" element={<AnunciarDesk user={user} />} />
        <Route path="/sms" element={<SmsDesk user={user}/>} /> 

          {/* Módulos */}
        <Route path="/callcenter" element={<CallCenterModuleDesk />} />
        <Route path="/logistica" element={<LogisticaModuleDesk />} />
        <Route path="/inqueritos" element={<InqueritosModuleDesk user={user}/>} />
        <Route path="/painel" element={<PortalDesk user={user}/>} />
        <Route path="/sendmail" element={<SendMail user={user}/>} />
        
        <Route path="*" element={<Navigate to="/" />} />

        </Routes>
        </div>
        <FooterDesk/>
        </ThemeProvider>
    </div>
  );
};

export default DesktopRoutes;

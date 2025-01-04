import React from 'react';
import { Routes, Route } from 'react-router-dom';
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
    <div>
       <ThemeProvider theme={theme}>
      <HeaderDesk />
        <Routes>
        <Route path="/" element={<DashboardComponent user={user} />} />
        <Route path="/cotacoes" element={<CotacoesDesk user={user} />} />
        <Route path="/cotacao" element={<NovaCotacaoDesk user={user} />} />
        <Route path="/vperfil/:id" element={<CompanyProfileDesk user={user} />} />
        <Route path="/explore" element={<ExploreDesk user={user.provincia} />} />
        <Route path="/app" element={<ApxDesk user={user.provincia} />} />
        <Route path="/pagamento-modulo/:moduleKey" element={<PagamentoModulo user={user}/>} />
        <Route path="/profile" element={<Profile />} />

          {/* Faturação e Proforma */}
          <Route path="/faturacao" element={<FaturacaoDesk user={user} />} />
          <Route path="/proforma" element={<CriarProformaDesk user={user} />} />
          <Route path="/proforma/:numeroProforma" element={<FaturaDesk user={user} />} />
          <Route path="/faturas/:id" element={<FaturaDesk user={user} />} />


            {/* Mercado e Produtos */}
          <Route path="/market" element={<MarketDesk user={user} />} />
          <Route path="/addProduct/:storeId" element={<ProductFormDesk user={user} />} />


                  {/* Campanha e Posts */}
        <Route path="/post" element={<PostInputDesk user={user?.id} />} />
        <Route path="/anunciar" element={<AnunciarDesk user={user} />} />
        <Route path="/sms" element={<SmsDesk user={user}/>} /> 

          {/* Módulos */}
        <Route path="/callcenter" element={<CallCenterModuleDesk />} />
        <Route path="/logistica" element={<LogisticaModuleDesk />} />
        <Route path="/inqueritos" element={<InqueritosModuleDesk user={user}/>} />

        </Routes>
        </ThemeProvider>
    </div>
  );
};

export default DesktopRoutes;

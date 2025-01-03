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

  console.log(user)

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
        <Route path="/apx" element={<ApxDesk user={user.provincia} />} />
        <Route path="/pagamento-modulo/:moduleKey" element={<PagamentoModulo user={user}/>} />
        <Route path="/profile" element={<Profile />} />

        </Routes>
        </ThemeProvider>
    </div>
  );
};

export default DesktopRoutes;

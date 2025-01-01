import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardComponent from '../Dashboard';
import CotacoesDesk from '../desktop/CotacoesDesk';
import HeaderDesk from '../desktop/HeaderDesk';
import { createTheme, ThemeProvider } from '@mui/material';


const theme = createTheme({
  palette: {
    mode: 'light', // ou 'dark'
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
        </Routes>
        </ThemeProvider>
    </div>
  );
};

export default DesktopRoutes;

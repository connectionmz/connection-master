import React from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardComponent from '../Dashboard';

const DesktopRoutes = ({ user }) => {
  return (
    <Routes>
      <Route path="/" element={<DashboardComponent user={user} />} />
      {/* Adicione mais rotas específicas para desktop */}
    </Routes>
  );
};

export default DesktopRoutes;

import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom'; 
import Home from '../Home';
import Auth from '../Auth';
import AuthCreate from '../AuthCreate';
import Market from '../Market';
import Campaign from '../Campaign';
import PostInput from '../PostInput';
import Concurso from '../Concurso';
import Cotacoes from '../Cotacoes';
import Proposal from '../Proposal';
import PublicarCotacao from '../PublicarCotacao';
import CotacaoDetalhes from '../CotacaoDetalhes';
import EnviarProposta from '../EnviarProposta';
import Explore from '../Explore';
import Profile from '../Profile';
import Apx from '../Apx';
import Faturacao from '../Faturacao';
import Sms from '../Sms';
import Feed from '../Feed';
import Stores from '../Stores';
import StoreDetails from '../StoreDetails';
import CotacoesPDF from '../pdf/CotacoesPDF';
import FaturaDetalhes from '../FaturaDetalhes';
import Inbox from '../Inbox';
import ListaDeServicos from '../ListaDeServicos';
import CompanyProfile from '../CompanyProfile';
import EditProfile from '../EditProfile';
import Terms from '../Termos';
import CriarProforma from '../CriarProfoma';
import ProformaDetalhes from '../ProformaDetalhes';
import Analytics from '../Analytics';
import Fatura from '../pdf/Fatura';
import ProductForm from '../market/ProductForm';
import PublicarConcurso from '../PublicarConcurso';
import CompanyDataForm from '../CompanyDataForm';
import Teste from '../Teste';
import Anunciar from '../Anunciar';
import Propostas from '../Propostas';
import DetalhesProposta from '../DetalhesProposta';
import ConcursoDetalhes from '../ConcursoDetalhes';
import CallCenterModule from '../CallCenterModule';
import LogisticaModule from '../LogisticaModule';
import InqueritosModule from '../InqueritosModule';
import ConnectionsSearch from '../ConnectionsSearch';
import CreateUsers from '../CreateUsers';

const UserRoutes = ({ user }) => (
  <Routes>
          <Route path="/createUsers" element={<CreateUsers/>} />

    <Route path="/" element={<Home user={user} />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/search" element={<ConnectionsSearch />} />
    <Route path="/create" element={<AuthCreate />} />
    <Route path="/market" element={<Market user={user}/>} />
    <Route path="/campaign" element={<Campaign />} />
    <Route path="/post" element={<PostInput user={user?.id} />} />
    <Route path="/concurso" element={<Concurso />} />
    <Route path="/cotacao" element={<Cotacoes />} />
    <Route path="/proposta/:id/:cotId" element={<Proposal />} />
    <Route path="/publicar-cotacao" element={<PublicarCotacao user={user}/>} />
    <Route path="/cotacao/:id/:companyId" element={<CotacaoDetalhes />} />
    <Route path="/concurso/:id/:companyId" element={<ConcursoDetalhes />} />
    <Route path="/enviar-proposta/:id/:companyId" element={<EnviarProposta  user={user}/>} />
    <Route path="/publicar-concurso" element={<PublicarConcurso user={user}/>} />
    <Route path="/explore" element={<Explore user={user.provincia}/>} /> 
    <Route path="/profile" element={<Profile />} />
    <Route path="/apx" element={<Apx />} />
    <Route path="/faturacao" element={<Faturacao user={user}/>} />
    <Route path="/proforma" element={<CriarProforma user={user}/>} />
    <Route path="/anunciar" element={<Anunciar user={user}/>} />
    <Route path="/proforma/:numeroProforma" element={<Fatura user={user}/>} />
    <Route path="/sms" element={<Sms />} />
    <Route path="/feed" element={<Feed />} />
    <Route path="/terms" element={<Terms />} />
    <Route path="/stores" element={<Stores />} />
    <Route path="/editar-perfil" element={<EditProfile  user={user}/>} />
    <Route path="/stores/:storeId" element={<StoreDetails />} />
    <Route path="/addProduct/:storeId" element={<ProductForm user={user}/>} />
    <Route path="/cotacaoPdf/:id" element={<CotacoesPDF />} />
    <Route path="/servicos/:categoriaId" element={<ListaDeServicos />} />
    <Route path="/faturas/:id" element={<Fatura user={user}/>} />
    <Route path="/vperfil/:id" element={<CompanyProfile user={user} />} />
    <Route path="/rfq" element={<Teste />} />
    <Route path="/inbox" element={<Inbox />} />
    <Route path="/propostas/:id/propostas" element={<Propostas />} />
    <Route path="/analytics" element={<Analytics />} />
    <Route path="/cotacao/:id/proposta/:propostaId" element={<DetalhesProposta />} />
    <Route path="/setup" element={<Home user={user} />} />
    <Route path="/callcenter" element={<CallCenterModule />} />
    <Route path="/logistica" element={<LogisticaModule />} />
    <Route path="/inqueritos" element={<InqueritosModule />} />
    <Route path="/auth" element={<Auth user={user} />} />
    <Route path="/create" element={<AuthCreate user={user} />} />
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
)
export default UserRoutes
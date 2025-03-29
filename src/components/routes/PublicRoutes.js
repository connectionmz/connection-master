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
import ProductForm from '../market/ProductForm';
import EditarFaturaDesk from '../desktop/EditarFaturaDesk';
import ReceiptsPage from '../desktop/ReceiptsPage';
const PublicRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<FeedDesk />} />
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
    </Routes>
  );
};

export default PublicRoutes;
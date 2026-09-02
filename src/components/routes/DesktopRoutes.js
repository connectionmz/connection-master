import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import CotacoesDesk from '../desktop/CotacoesDesk';
import NovaCotacaoDesk from '../desktop/NovaCotacaoDesk';
import CompanyProfileDesk from '../desktop/CompanyProfileDesk';
import ExploreDesk from '../desktop/ExploreDesk';
import ApxDesk from '../desktop/ApxDesk';
import MarketDesk from '../desktop/MarketDesk';
import ProductFormDesk from '../market/ProductFormDesk';
import StoresDesk from '../desktop/StoresDesk';
import StoreDetailDesk from '../desktop/StoreDetailsDesk';
import ProductDetailsDesk from '../market/ProductDetailsDesk';
import Sobre from '../Sobre';
import EmailVerification from '../EmailVerification';
import CompanyVerificationNotice from '../CompanyVerificationNotice';
import AuthDesk from '../AuthDesk';
import CotacoesPDF from '../pdf/CotacoesPDF';
import EmpresaNaoEncontrada from '../desktop/EmpresaNaoEncontrada';
import ForgetPassword from '../password/ForgetPassword';
import ChangePassword from '../password/ChangePassword';
import Terms from '../Termos';
import Politicas from '../desktop/Politicas';
import CompanyDataFormDesk from '../CompanyDataFormDesk';
import AuthCreateDesk from '../AuthCreateDesk';
import ProdutoPage from '../market/ProdutoPage';
import MinhaPropostaDesk from '../desktop/MinhaPropostaDesk';
import DetalhesPropostaDesk from '../desktop/DetalhesPropostaDesk';
import CotacaoDetalhesDesk from '../desktop/CotacaoDetalhesDesk';
import PropostasDesk from '../desktop/PropostasDesk';
import EnviarPropostaDesk from '../desktop/EnviarPropostaDesk';
import PagamentoModulo from '../PagamentoModulo';
import UserDataFormDesk from '../UserDataFormDesk';
import { AccountEditProfileRoute, AccountProfileRoute } from './AccountProfileRoute';
import { ActiveModulesProvider } from '../../context/ActiveModulesContext';
import GuestRoute from './GuestRoute';
import SelectAccountType from '../SelectAccountType';
import Dashboard from '../Dashboard';
import SearchResultsPage from '../SearchResultsPage';
import Feed from '../Feed';
import PostDetailPageDesk from '../desktop/PostDetailPageDesk';
import PostInputDesk from '../desktop/PostInputDesk';
import ProtectedRoute from '../ProtectedRoute';
import DesktopLayout from '../layout/DesktopLayout';
import LegacyProductRedirect from './LegacyProductRedirect';
import SentStoreQuotesDesk from '../desktop/SentStoreQuotesDesk';

const DesktopRoutes = ({ user, authUser, profileLoading }) => {
  const renderProtectedRoute = (
    path,
    element,
    { requiresVerification = false, requiresProfile = false, requiredModule = null } = {},
  ) => (
    <Route
      path={path}
      element={
        <ProtectedRoute
          authUser={authUser}
          profile={user}
          profileLoading={profileLoading}
          requiresVerification={requiresVerification}
          requiresProfile={requiresProfile}
          requiredModule={requiredModule}
        >
          {element}
        </ProtectedRoute>
      }
    />
  );

  return (
    <ActiveModulesProvider userId={user?.id}>
      <DesktopLayout authUser={authUser} profile={user} profileLoading={profileLoading}>
        <Routes>
              {/* Rotas públicas */}
              <Route path="/" element={<Dashboard user={user} />} />
              <Route path="/explorar" element={<ExploreDesk user={user} />} />
              <Route path="/empresa/:id" element={<CompanyProfileDesk user={user} />} />
              <Route path="/sobre" element={<Sobre />} />
              <Route path="/feed" element={<Feed user={user} />} />
              <Route path="/post/:postId" element={<PostDetailPageDesk user={user} />} />
              {renderProtectedRoute("/post", <PostInputDesk user={user} />)}
              <Route path="/produto/:id/loja/:loja" element={<LegacyProductRedirect />} />
              <Route path="/lojas" element={<StoresDesk user={user} />} />
              <Route path="/loja/:storeId" element={<StoreDetailDesk user={user} />} />
              <Route path="/product/:productId/store/:store" element={<ProductDetailsDesk user={user}/>} />
              <Route path="/empresa-nao-encontrada" element={<EmpresaNaoEncontrada />} />
              <Route path="/termos" element={<Terms />} />
              <Route path="/politicas" element={<Politicas />} />
              <Route path="/auth" element={<GuestRoute user={authUser} loading={profileLoading} redirectTo={user?.type ? '/' : '/select-account-type'}><AuthDesk user={user} /></GuestRoute>} />
              <Route path="/create" element={<GuestRoute user={authUser} loading={profileLoading} redirectTo={user?.type ? '/' : '/select-account-type'}><AuthCreateDesk user={user} /></GuestRoute>} />
              {renderProtectedRoute("/select-account-type", <SelectAccountType />)}
              {renderProtectedRoute("/setup", <CompanyDataFormDesk />)}
              {renderProtectedRoute("/setupUser", <UserDataFormDesk />)}
              <Route path="/forget-password" element={<ForgetPassword />} />
              {renderProtectedRoute("/change-password", <ChangePassword user={user} />)}
              {renderProtectedRoute("/email-verification", <EmailVerification />)}
              {renderProtectedRoute("/app/verification", <CompanyVerificationNotice user={user} />)}
              <Route path="/search" element={<SearchResultsPage />} />

              {/* Rotas protegidas - ESPECIFICANDO O MÓDULO REQUERIDO */}
              <Route path="/addProduct" element={<Navigate to="/market/products/new" replace />} />
              {renderProtectedRoute("/market/products/new", <ProductFormDesk user={user} />, { requiredModule: "moduloMarket" })}
              {renderProtectedRoute("/market", <MarketDesk user={user} />, { requiredModule: "moduloMarket" })}
              {renderProtectedRoute("/market/products/:id/edit", <ProdutoPage user={user} />, { requiredModule: "moduloMarket" })}
              {renderProtectedRoute("/app", <ApxDesk user={user} />, { requiresVerification: true })}
              {renderProtectedRoute("/perfil", <AccountProfileRoute user={user} />, { requiresProfile: true })}
              {renderProtectedRoute("/editar-perfil", <AccountEditProfileRoute user={user} />, { requiresProfile: true })}
              <Route path="/meuperfil" element={<Navigate to="/perfil" replace />} />
              <Route path="/editar-meuperfil" element={<Navigate to="/editar-perfil" replace />} />
              {renderProtectedRoute("/cotacoes", <CotacoesDesk user={user} />, { requiresVerification: true })}
              {renderProtectedRoute("/minhas-cotacoes", <SentStoreQuotesDesk userId={authUser?.uid} />)}
              {renderProtectedRoute("/cotacao", <NovaCotacaoDesk user={user} />, { requiredModule: "moduloSMS" })}
              {renderProtectedRoute("/cotacaoPdf/:id", <CotacoesPDF user={user}/>, { requiredModule: "moduloSMS" })}
              {renderProtectedRoute("/pagar/:moduleKey", <PagamentoModulo />)}
              {renderProtectedRoute("/enviar-proposta/:id/:companyId", <EnviarPropostaDesk user={user} />, { requiredModule: "moduloSMS" })}
              {renderProtectedRoute("/propostas/:id/propostas", <PropostasDesk user={user} />, { requiredModule: "moduloSMS" })}
              {renderProtectedRoute("/cotacao/:id/proposta/:propostaId", <DetalhesPropostaDesk user={user} />, { requiredModule: "moduloSMS" })}
              {renderProtectedRoute("/minha_proposta/cotacao/:id/proposta/:propostaId", <MinhaPropostaDesk user={user} />, { requiredModule: "moduloSMS" })}
              {renderProtectedRoute("/cotacao/:id", <CotacaoDetalhesDesk user={user} />, { requiredModule: "moduloSMS" })}

              <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DesktopLayout>
    </ActiveModulesProvider>
  );
};

export default DesktopRoutes;

import { logEvent, setUserId, setUserProperties } from 'firebase/analytics';
import { analytics } from '../fb';

// `analytics` fica null até isSupported() resolver (ver fb.js) e em browsers
// sem suporte (ex: alguns in-app browsers) — todas as funções aqui são no-op
// nesse caso, para nunca rebentar o resto da app por causa de tracking.
export const trackPageView = (path, title) => {
  if (!analytics) return;
  logEvent(analytics, 'page_view', { page_path: path, page_title: title });
};

export const trackEvent = (eventName, params = {}) => {
  if (!analytics) return;
  logEvent(analytics, eventName, params);
};

// Liga os eventos seguintes ao utilizador (empresa) autenticado, para
// segmentar relatórios por sector/província/tipo de conta no GA4.
export const identifyUser = (userId, properties = {}) => {
  if (!analytics) return;
  if (userId) setUserId(analytics, userId);
  if (Object.keys(properties).length) setUserProperties(analytics, properties);
};

export const trackSignUp = (method = 'email') => trackEvent('sign_up', { method });
export const trackLogin = (method = 'email') => trackEvent('login', { method });

export const trackCotacaoPublicada = ({ id, sector, tipo }) =>
  trackEvent('cotacao_publicada', { cotacao_id: id, sector, tipo });

export const trackPropostaEnviada = ({ cotacaoId, valor }) =>
  trackEvent('proposta_enviada', { cotacao_id: cotacaoId, value: valor, currency: 'MZN' });

export const trackPropostaAceite = ({ cotacaoId, valor }) =>
  trackEvent('proposta_aceite', { cotacao_id: cotacaoId, value: valor, currency: 'MZN' });

export const trackConcursoPublicado = ({ id, setor, modalidade }) =>
  trackEvent('concurso_publicado', { concurso_id: id, setor, modalidade });

export const trackConcursoVisualizado = ({ id, fonte }) =>
  trackEvent('concurso_visualizado', { concurso_id: id, fonte });

export const trackModuloAtivado = ({ moduleKey, valor }) =>
  trackEvent('purchase', { items: [{ item_id: moduleKey, item_name: moduleKey }], value: valor, currency: 'MZN' });

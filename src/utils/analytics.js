import { getDatabase, ref, push, set, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../fb';

// Tipos de eventos que podemos rastrear
export const AnalyticsEvents = {
  PAGE_VIEW: 'page_view',
  EVENT_VIEW: 'event_view',
  BUTTON_CLICK: 'button_click',
  LINK_CLICK: 'link_click',
  SHARE: 'share',
  PHONE_CLICK: 'phone_click',
  EMAIL_CLICK: 'email_click',
  FORM_SUBMIT: 'form_submit',
  ERROR: 'error',
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',
  MODULE_ACCESS: 'module_access',
  PAYMENT: 'payment',
  SEARCH: 'search',
  DOWNLOAD: 'download'
};

// Categorias de eventos
export const EventCategories = {
  NAVIGATION: 'navigation',
  ENGAGEMENT: 'engagement',
  CONVERSION: 'conversion',
  ERROR: 'error',
  AUTHENTICATION: 'authentication',
  MONETIZATION: 'monetization'
};

// Rastrear evento
export const trackEvent = (eventName, category, data = {}) => {
  try {
    const eventData = {
      event: eventName,
      category: category,
      timestamp: new Date().toISOString(),
      page: window.location.pathname,
      userAgent: navigator.userAgent,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      ...data
    };

    // Salvar no Firebase
    const analyticsRef = ref(db, 'analytics/events');
    const newEventRef = push(analyticsRef);
    set(newEventRef, eventData);
    
    // Também registrar no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', eventName, eventData);
    }
  } catch (error) {
    console.error('Error tracking event:', error);
  }
};

// Rastrear visualização de página
export const trackPageView = (pageName, additionalData = {}) => {
  trackEvent(
    AnalyticsEvents.PAGE_VIEW, 
    EventCategories.NAVIGATION, 
    { 
      page_name: pageName, 
      ...additionalData 
    }
  );
};

// Rastrear visualização de evento
export const trackEventView = (eventId, eventTitle, additionalData = {}) => {
  trackEvent(
    AnalyticsEvents.EVENT_VIEW, 
    EventCategories.ENGAGEMENT, 
    { 
      event_id: eventId, 
      event_title: eventTitle,
      ...additionalData 
    }
  );
};

// Rastrear clique em botão
export const trackButtonClick = (buttonName, additionalData = {}) => {
  trackEvent(
    AnalyticsEvents.BUTTON_CLICK, 
    EventCategories.ENGAGEMENT, 
    { 
      button_name: buttonName,
      ...additionalData 
    }
  );
};

// Rastrear clique em link
export const trackLinkClick = (linkUrl, linkText, additionalData = {}) => {
  trackEvent(
    AnalyticsEvents.LINK_CLICK, 
    EventCategories.ENGAGEMENT, 
    { 
      link_url: linkUrl,
      link_text: linkText,
      ...additionalData 
    }
  );
};

// Rastrear compartilhamento
export const trackShare = (platform, contentId, additionalData = {}) => {
  trackEvent(
    AnalyticsEvents.SHARE, 
    EventCategories.ENGAGEMENT, 
    { 
      platform: platform,
      content_id: contentId,
      ...additionalData 
    }
  );
};

// Rastrear login
export const trackLogin = (userId, method = 'email') => {
  trackEvent(
    AnalyticsEvents.LOGIN,
    EventCategories.AUTHENTICATION,
    { user_id: userId, method }
  );
};

// Rastrear logout
export const trackLogout = (userId) => {
  trackEvent(
    AnalyticsEvents.LOGOUT,
    EventCategories.AUTHENTICATION,
    { user_id: userId }
  );
};

// Rastrear cadastro
export const trackSignup = (userId, method = 'email') => {
  trackEvent(
    AnalyticsEvents.SIGNUP,
    EventCategories.AUTHENTICATION,
    { user_id: userId, method }
  );
};

// Rastrear acesso a módulo
export const trackModuleAccess = (moduleName, userId) => {
  trackEvent(
    AnalyticsEvents.MODULE_ACCESS,
    EventCategories.ENGAGEMENT,
    { module_name: moduleName, user_id: userId }
  );
};

// Rastrear pagamento
export const trackPayment = (amount, currency, product, userId) => {
  trackEvent(
    AnalyticsEvents.PAYMENT,
    EventCategories.MONETIZATION,
    { amount, currency, product, user_id: userId }
  );
};

// Rastrear erro
export const trackError = (errorMessage, errorType, additionalData = {}) => {
  trackEvent(
    AnalyticsEvents.ERROR, 
    EventCategories.ERROR, 
    { 
      error_message: errorMessage,
      error_type: errorType,
      ...additionalData 
    }
  );
};

// Obter estatísticas de visualização de um evento
export const getEventViewCount = (eventId, callback) => {
  const viewsRef = ref(db, `analytics/event_views/${eventId}`);
  onValue(viewsRef, (snapshot) => {
    const data = snapshot.val();
    const count = data ? Object.keys(data).length : 0;
    if (callback) callback(count);
  });
};

// Registrar visualização de evento
export const registerEventView = (eventId, eventTitle) => {
  const viewData = {
    event_id: eventId,
    event_title: eventTitle,
    timestamp: new Date().toISOString(),
    user_agent: navigator.userAgent,
    language: navigator.language
  };

  const viewsRef = ref(db, `analytics/event_views/${eventId}`);
  const newViewRef = push(viewsRef);
  set(newViewRef, viewData);
  
  // Também rastrear como evento
  trackEventView(eventId, eventTitle);
};

// Obter analytics para dashboard
export const getAnalyticsData = (startDate, endDate, callback) => {
  const analyticsRef = ref(db, 'analytics/events');
  const analyticsQuery = query(
    analyticsRef,
    orderByChild('timestamp'),
    equalTo(startDate) // Esta é uma simplificação, na prática precisaria de range
  );
  
  onValue(analyticsQuery, (snapshot) => {
    const data = snapshot.val();
    if (callback) callback(data);
  });
};

// Hook personalizado para analytics
export const useAnalytics = () => {
  return {
    trackEvent,
    trackPageView,
    trackButtonClick,
    trackLinkClick,
    trackShare,
    trackLogin,
    trackLogout,
    trackSignup,
    trackModuleAccess,
    trackPayment,
    trackError,
    getEventViewCount,
    registerEventView
  };
};
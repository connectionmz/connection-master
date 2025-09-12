import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from 'firebase/auth';
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from '@firebase/app-check';

// 🔵 Configuração do Projeto 1 - Connection Mozambique
const firebaseConfig1 = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY_1,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN_1,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID_1,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET_1,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID_1,
  appId: process.env.REACT_APP_FIREBASE_APP_ID_1,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID_1
};

// 🔴 Configuração do Projeto 2 - Connections
const firebaseConfig2 = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY_2,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN_2,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL_2,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID_2,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET_2,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID_2,
  appId: process.env.REACT_APP_FIREBASE_APP_ID_2,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID_2
};

// Debug: Verificar se variáveis de ambiente estão carregando
console.log('Modo:', process.env.NODE_ENV);
console.log('API Key 1 carregada:', !!process.env.REACT_APP_FIREBASE_API_KEY_1);
console.log('reCAPTCHA Key carregada:', !!process.env.REACT_APP_RECAPTCHA_V3_KEY_1);

// ✅ Inicializar apps
let app, app2;

try {
  app = initializeApp(firebaseConfig1, {
    automaticDataCollectionEnabled: true
  });
  console.log('App 1 inicializado com sucesso');
} catch (error) {
  console.error('Erro ao inicializar App 1:', error);
  // Fallback: inicializar app padrão sem configuração
  app = initializeApp({ 
    apiKey: "dev-key-dummy",
    authDomain: "dummy.firebaseapp.com",
    projectId: "dummy-project"
  }, "fallback-app-1");
}

try {
  app2 = initializeApp(firebaseConfig2, "appSecundario");
  console.log('App 2 inicializado com sucesso');
} catch (error) {
  console.error('Erro ao inicializar App 2:', error);
  // Fallback para desenvolvimento
  app2 = initializeApp({ 
    apiKey: "dev-key-dummy-2",
    authDomain: "dummy2.firebaseapp.com",
    projectId: "dummy-project-2"
  }, "fallback-app-2");
}

// 🔵 App Check APENAS em produção e se a chave existir
let appCheck1 = null;
if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_RECAPTCHA_V3_KEY_1) {
  try {
    appCheck1 = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_V3_KEY_1),
      isTokenAutoRefreshEnabled: true
    });
    console.log('App Check inicializado com sucesso (produção)');
  } catch (error) {
    console.warn('Erro ao inicializar App Check:', error);
  }
} else {
  console.log('App Check desativado (desenvolvimento ou chave não encontrada)');
  
  // Mock do App Check para desenvolvimento
  if (typeof window !== 'undefined') {
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
}

// 🔵 Serviços do App 1 - Connection Mozambique
let auth, db, storage;
try {
  auth = getAuth(app);
  db = getDatabase(app);
  storage = getStorage(app);
  console.log('Serviços do App 1 inicializados');
} catch (error) {
  console.error('Erro ao inicializar serviços do App 1:', error);
}

// 🔴 Serviços do App 2 - Connections
let db2, storage2;
try {
  db2 = getDatabase(app2);
  storage2 = getStorage(app2);
  console.log('Serviços do App 2 inicializados');
} catch (error) {
  console.error('Erro ao inicializar serviços do App 2:', error);
}

// Providers
const googleProvider = new GoogleAuthProvider();
const emailProvider = EmailAuthProvider;

// ⚠️ Configurações de desenvolvimento
if (process.env.NODE_ENV === 'development') {
  if (auth) {
    auth.settings.appVerificationDisabledForTesting = true;
    console.log('Modo desenvolvimento: verificação de app desativada');
  }
  
  // Debug token para App Check em desenvolvimento
  if (typeof window !== 'undefined') {
    window.self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
}

// ✅ Exportações com fallbacks
export { 
  auth, 
  googleProvider, 
  emailProvider 
};

export { 
  db, 
  storage 
};

export { 
  db2, 
  storage2 
};

export default app;
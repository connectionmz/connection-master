import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from 'firebase/auth';
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from '@firebase/app-check';

const firebaseConfig1 = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY_1,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN_1,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL_1, 
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID_1,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET_1,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID_1,
  appId: process.env.REACT_APP_FIREBASE_APP_ID_1,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID_1
};

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

let app, app2;

try {
  app = initializeApp(firebaseConfig1);
} catch (error) {
  console.error('Erro ao inicializar App 1:', error);
  throw new Error('Falha na inicialização do Firebase');
}

try {
  app2 = initializeApp(firebaseConfig2, "appSecundario");
} catch (error) {
  console.warn('App 2 não inicializado - usando apenas app principal:', error.message);
  app2 = null;
}

let appCheck1 = null;
if (process.env.REACT_APP_RECAPTCHA_V3_KEY_1) {
  try {
    appCheck1 = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_V3_KEY_1),
      isTokenAutoRefreshEnabled: false 
    });
  } catch (error) {
    console.warn('Erro ao inicializar App Check:', error);
  }
}

let auth, db, storage;
try {
  auth = getAuth(app);
  db = getDatabase(app);
  storage = getStorage(app);
} catch (error) {
  console.error('Erro ao inicializar serviços do App 1:', error);
  throw new Error('Falha na inicialização dos serviços Firebase');
}

let db2 = null, storage2 = null;
if (app2) {
  try {
    db2 = getDatabase(app2);
    storage2 = getStorage(app2);
  } catch (error) {
    console.warn('Erro ao inicializar serviços do App 2:', error);
  }
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

const emailProvider = EmailAuthProvider;

if (process.env.NODE_ENV === 'development') {
  
  if (typeof window !== 'undefined' && !window.FIREBASE_APPCHECK_DEBUG_TOKEN) {
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
}

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
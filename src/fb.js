// firebase/config.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  EmailAuthProvider, 
  setPersistence, 
  browserLocalPersistence 
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaV3Provider } from "@firebase/app-check";

/**
 * ======================
 * Firebase Configs
 * ======================
 */
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

/**
 * ======================
 * Inicialização com Singleton Pattern
 * ======================
 */

// App 1 (DEFAULT)
const app = getApps().length === 0 
  ? initializeApp(firebaseConfig1, { automaticDataCollectionEnabled: true })
  : getApp();

// App 2 (Secundário)
let app2 = null;
try {
  app2 = getApps().find(app => app.name === 'appSecundario') 
    ? getApp('appSecundario')
    : initializeApp(firebaseConfig2, "appSecundario");
} catch (error) {
  console.warn("⚠️ App 2 não inicializado:", error.message);
  app2 = null;
}

/**
 * ======================
 * Debug App Check (DEV)
 * ======================
 */
if (process.env.NODE_ENV === "development") {
  if (typeof window !== "undefined") {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
}

/**
 * ======================
 * App Check
 * ======================
 */
let appCheck1 = null;
if (process.env.REACT_APP_RECAPTCHA_V3_KEY_1) {
  try {
    appCheck1 = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_V3_KEY_1),
      isTokenAutoRefreshEnabled: true,
    });
  } catch (error) {
    console.warn("⚠️ Erro ao inicializar App Check:", error);
  }
}

/**
 * ======================
 * Serviços App 1
 * ======================
 */
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

// 🔐 Configurar persistência de sessão
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log("🔥 Persistência configurada: browserLocalPersistence");
  })
  .catch((error) => {
    console.error("⚠️ Erro ao definir persistência:", error);
  });

/**
 * ======================
 * Serviços App 2
 * ======================
 */
let db2 = null, storage2 = null;
if (app2) {
  db2 = getDatabase(app2);
  storage2 = getStorage(app2);
}

/**
 * ======================
 * Providers de Autenticação
 * ======================
 */
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

const emailProvider = EmailAuthProvider;

/**
 * ======================
 * Exports
 * ======================
 */
export { 
  auth, 
  googleProvider, 
  emailProvider, 
  db, 
  storage, 
  db2, 
  storage2, 
  appCheck1 
};

export default app;

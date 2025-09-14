// firebase/config.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  EmailAuthProvider 
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
 * Inicialização dos Apps
 * ======================
 */
let app, app2;

try {
  app = initializeApp(firebaseConfig1);
} catch (error) {
  console.error("❌ Erro ao inicializar App 1:", error);
  throw new Error("Falha na inicialização do Firebase");
}

try {
  app2 = initializeApp(firebaseConfig2, "appSecundario");
} catch (error) {
  console.warn("⚠️ App 2 não inicializado:", error.message);
  app2 = null;
}

/**
 * ======================
 * App Check (Segurança)
 * ======================
 */
let appCheck1 = null;
if (process.env.REACT_APP_RECAPTCHA_V3_KEY_1) {
  try {
    appCheck1 = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(process.env.REACT_APP_RECAPTCHA_V3_KEY_1),
      isTokenAutoRefreshEnabled: true, // sempre atualizar o token
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
 * Debug App Check (somente DEV)
 * ======================
 */
if (process.env.NODE_ENV === "development") {
  if (typeof window !== "undefined" && !window.FIREBASE_APPCHECK_DEBUG_TOKEN) {
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
}

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

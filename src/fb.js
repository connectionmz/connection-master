import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  EmailAuthProvider, 
  setPersistence, 
  browserLocalPersistence,
  inMemoryPersistence 
} from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

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

/**
 * ======================
 * Inicialização
 * ======================
 */
const app = getApps().length === 0 
  ? initializeApp(firebaseConfig1, { automaticDataCollectionEnabled: true })
  : getApp();

/**
 * ======================
 * Serviços App 1
 * ======================
 */
const auth = getAuth(app);
const db = getDatabase(app);
const storage = getStorage(app);

// Configurar persistência de forma mais robusta
const initializeAuthPersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    return true;
  } catch (error) {
    console.error("Erro ao definir persistência", error);
    
    // Fallback: tentar persistência em memória
    try {
      await setPersistence(auth, inMemoryPersistence);
    } catch (fallbackError) {
      console.error("Erro no fallback de persistência", fallbackError);
    }
    return false;
  }
};

// Inicializar imediatamente
initializeAuthPersistence();

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
  initializeAuthPersistence
};

export default app;
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
const firebaseConfig = {
  apiKey: "AIzaSyCvIGkglL_zZwudy7VRHyhH0YkGYC1omB8",
  authDomain: "connectionmz.firebaseapp.com",
  databaseURL: "https://connectionmz-default-rtdb.firebaseio.com",
  projectId: "connectionmz",
  storageBucket: "connectionmz.firebasestorage.app",
  messagingSenderId: "1063227375294",
  appId: "1:1063227375294:web:441e446bc00d2ac8ade8ef",
  measurementId: "G-YJFX10V2TZ"
};

/**
 * ======================
 * Inicialização
 * ======================
 */
const app = getApps().length === 0 
  ? initializeApp(firebaseConfig, { automaticDataCollectionEnabled: true })
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

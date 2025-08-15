import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from 'firebase/auth';
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

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

// Inicializar os dois apps
const app = initializeApp(firebaseConfig1); // padrão
const app2 = initializeApp(firebaseConfig2, "appSecundario"); // nome personalizado

// 🔵 App 1 - Connection Mozambique
const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

// 🔴 App 2 - Connections
export const db2 = getDatabase(app2);
export const storage2 = getStorage(app2);

// Providers (usando o app1 por padrão)
auth.settings.appVerificationDisabledForTesting = true;
const googleProvider = new GoogleAuthProvider();
const emailProvider = EmailAuthProvider;

export { auth, googleProvider, emailProvider };
export default app;
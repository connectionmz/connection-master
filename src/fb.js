import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from 'firebase/auth';
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

/** 🔵 Configuração do Projeto 1 - Connection Mozambique */
const firebaseConfig1 = {
  apiKey: "AIzaSyCKyu8Z2AENSyFP4Jw3z7ewL6xXJlGZ374",
  authDomain: "connectionmozambique-23a1b.firebaseapp.com",
  databaseURL: "https://connectionmozambique-23a1b-default-rtdb.firebaseio.com",
  projectId: "connectionmozambique-23a1b",
  storageBucket: "connectionmozambique-23a1b.firebasestorage.app",
  messagingSenderId: "179916616869",
  appId: "1:179916616869:web:eef1d27091fc6527a9094c",
  measurementId: "G-BY02RMLJKW"
};

/** 🔴 Configuração do Projeto 2 - Connections */
const firebaseConfig2 = {
  apiKey: "AIzaSyChEniFx32nBnrcOvditSwLTglTBPTCWVQ",
  authDomain: "connections-d1be1.firebaseapp.com",
  databaseURL: "https://connections-d1be1-default-rtdb.firebaseio.com",
  projectId: "connections-d1be1",
  storageBucket: "connections-d1be1.appspot.com",
  messagingSenderId: "89340878669",
  appId: "1:89340878669:web:83a91ab3aab71257c66104",
  measurementId: "G-HZRYF1DR6N"
};

// Inicializar os dois apps com nomes diferentes
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

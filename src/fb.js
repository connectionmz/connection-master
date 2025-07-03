import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, EmailAuthProvider } from 'firebase/auth';
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

/** 🔵 Configuração do Projeto 1 - Connection Mozambique */
const firebaseConfig1 = {
  apiKey: "AIzaSyCNNNmVpL9mmwPwighQkz53YlOadIvdRas",
  authDomain: "connectionmz.firebaseapp.com",
  projectId: "connectionmz",
  storageBucket: "connectionmz.firebasestorage.app",
  messagingSenderId: "1063227375294",
  appId: "1:1063227375294:web:4d494e2d9951302fade8ef",
  measurementId: "G-FDXBJWJ0M4"
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

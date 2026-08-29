import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ref, onValue } from 'firebase/database';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db, initializeAuthPersistence } from '../fb';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isDisposed = false;
    let sessionVersion = 0;
    let unsubscribeAuth = null;
    let unsubscribeProfile = null;

    const clearProfileListener = () => {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }
    };

    const initializeSession = async () => {
      try {
        await initializeAuthPersistence();
        if (isDisposed) return;

        unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
          sessionVersion += 1;
          const currentVersion = sessionVersion;
          clearProfileListener();
          setError(null);

          if (!firebaseUser) {
            setAuthUser(null);
            setProfile(null);
            setIsProfileLoading(false);
            setIsSessionLoading(false);
            return;
          }

          setAuthUser(firebaseUser);
          setProfile(null);
          setIsProfileLoading(true);
          setIsSessionLoading(false);

          const profileRef = ref(db, `company/${firebaseUser.uid}`);
          unsubscribeProfile = onValue(profileRef, (snapshot) => {
            if (isDisposed || currentVersion !== sessionVersion) return;

            const profileData = snapshot.val();
            setProfile(profileData ? {
              ...profileData,
              id: firebaseUser.uid,
              email: firebaseUser.email || null,
              photoURL: profileData.logoUrl || 'https://via.placeholder.com/150',
              displayName: profileData.nome || 'Nome da Empresa',
              endereco: profileData.endereco || 'Endereço não informado',
            } : null);
            setIsProfileLoading(false);
          }, (profileError) => {
            if (isDisposed || currentVersion !== sessionVersion) return;

            console.error('Erro ao carregar perfil:', profileError);
            setProfile(null);
            setIsProfileLoading(false);
            setError(profileError);
          });
        }, (authError) => {
          if (isDisposed) return;

          console.error('Erro na autenticação:', authError);
          sessionVersion += 1;
          clearProfileListener();
          setAuthUser(null);
          setProfile(null);
          setIsProfileLoading(false);
          setIsSessionLoading(false);
          setError(authError);
        });
      } catch (persistenceError) {
        if (isDisposed) return;

        console.error('Erro ao inicializar persistência:', persistenceError);
        setIsSessionLoading(false);
        setError(persistenceError);
      }
    };

    initializeSession();

    return () => {
      isDisposed = true;
      sessionVersion += 1;
      clearProfileListener();
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  const signOut = useCallback(() => firebaseSignOut(auth), []);

  const value = useMemo(() => ({
    authUser,
    profile,
    isSessionLoading,
    isProfileLoading,
    error,
    signOut,
    // Aliases temporários para consumidores legados.
    user: profile,
    userData: profile,
    loading: isSessionLoading || isProfileLoading,
  }), [authUser, profile, isSessionLoading, isProfileLoading, error, signOut]);

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

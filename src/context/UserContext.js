import React, { createContext, useContext, useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db, auth } from '../fb'; // Importe também o auth do seu arquivo fb
import { onAuthStateChanged } from 'firebase/auth';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userRef = ref(db, `company/${firebaseUser.uid}`);
        
        const unsubscribeDB = onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          
          if (userData) {
            setUser({
              ...userData,
              id: firebaseUser.uid, // Garantimos que o id vem do auth
              email: firebaseUser.email // Se precisar do email do auth
            });
          } else {
            // Usuário autenticado mas sem dados na company
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email
            });
          }
          setLoading(false);
        });

        return unsubscribeDB; // Retorna a função para desinscrever do DB
      } else {
        // Usuário não autenticado
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth(); // Desinscreve do auth quando o componente desmontar
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
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
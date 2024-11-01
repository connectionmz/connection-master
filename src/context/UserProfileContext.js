import { createContext, useState, useEffect, useContext } from 'react';
import { ref, get } from "firebase/database";
import { auth, db } from '../fb';
import { onAuthStateChanged } from "firebase/auth";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const companyRef = ref(db, `company/${user.uid}`);
          const companySnapshot = await get(companyRef);

          if (companySnapshot.exists()) {
            const companyData = companySnapshot.val();
            setUserData({
              ...companyData,
              photoURL: companyData.logoUrl || "https://via.placeholder.com/150",
              coverPhotoURL: companyData.coverUrl || "https://via.placeholder.com/600x200",
              displayName: companyData.nome || 'Nome da Empresa',
              username: companyData.id || 'ID da Empresa',
              endereco: companyData.endereco || 'Endereço da Empresa',
            });
          } else {
            //window.location='/setup'
          }
        } catch (error) {
          console.error('Error fetching data: ', error);
          //window.location='/auth'
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false); // Evita o loop, carregamento deve terminar antes de redirecionar
        //window.location='/auth'

      }
    });

    return () => unsubscribe();
  }, []); // Certifica-te de adicionar o hook navigate às dependências

  return (
    <UserContext.Provider value={{ userData, loading }}>
      {!loading && children} {/* Só renderiza os filhos quando o carregamento terminar */}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};

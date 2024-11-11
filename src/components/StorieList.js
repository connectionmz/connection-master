import { onValue, ref } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { db } from '../fb';
import { useNavigate } from 'react-router-dom';

const StorieList = ({ user }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);  
  const [error, setError] = useState(null);      
  const navigate = useNavigate();

  const defaultLogoUrl = 'https://via.placeholder.com/150'; 

  useEffect(() => {
    const companiesRef = ref(db, 'company');
    const unsubscribe = onValue(
      companiesRef,
      (snapshot) => {
        const companiesData = snapshot.val();
        if (companiesData) {
          const companiesArray = Object.entries(companiesData)
            .map(([key, value]) => ({
              id: key,
              ...value,
            }))
            .filter(company => company?.provincia === user.provincia && company?.subscriptions?.status);

          setStories(companiesArray);
        }
        setLoading(false); 
      },
      (error) => {
        setError('Erro ao carregar as empresas.'); 
        setLoading(false); 
      }
    );
    return () => unsubscribe();  
  }, [user.provincia]);

  const handleCompanyClick = (companyId) => {
    navigate(`/vperfil/${companyId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p>Carregando empresas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-40 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex space-x-4 p-4 bg-white rounded-lg overflow-x-auto" style={{ margin: '6px' }}>
      {stories.map(store => (
        <div 
          key={store.id} 
          className="flex flex-col items-center space-y-2 w-24 sm:w-32 lg:w-40 cursor-pointer"
          onClick={() => handleCompanyClick(store.id)}
        >
          <img
            src={store.logoUrl || defaultLogoUrl}
            alt={`Logotipo de ${store.nome}`}
            className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full border-2 border-blue-500"
          />
          <span className="text-xs sm:text-sm lg:text-base text-gray-800 text-center truncate max-w-[120px] uppercase">
            <marquee>{store.nome}</marquee>
          </span>
        </div>
      ))}
    </div>
  );
};

export default StorieList;

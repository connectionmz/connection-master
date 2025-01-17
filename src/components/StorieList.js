import { ref, get } from 'firebase/database';
import React, { useEffect, useState } from 'react';
import { db } from '../fb';
import { useNavigate } from 'react-router-dom';
import { Add } from '@mui/icons-material';

const StorieList = ({ user }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const defaultLogoUrl = 'https://via.placeholder.com/150';

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesRef = ref(db, 'company');
        const snapshot = await get(companiesRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const companyList = Object.keys(data)
            .map((key) => ({
              id: key,
              ...data[key],
            }))
            .filter(company => company.provincia === user);

          const randomCompanies = companyList.sort(() => Math.random() - 0.5).slice(0, 5);
          setStories(randomCompanies);
        }
      } catch (error) {
        setError('Erro ao carregar empresas: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [user]);

  const handleCompanyClick = (companyId) => {
    navigate(`/vperfil/${companyId}`);
  };

  const handleExploreClick = () => {
    navigate('/explore');
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
    <div className="flex space-x-4 p-4 rounded-lg overflow-x-auto">
      {stories.map(store => (
        <div
          key={store.id}
          className="flex flex-col items-center space-y-2 w-24 sm:w-32 lg:w-40 cursor-pointer"
          onClick={() => handleCompanyClick(store.id)}
        >
          <img
            src={store.logoUrl || defaultLogoUrl}
            alt={`Logotipo de ${store.nome}`}
            className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full border-2 border-blue-500 object-cover"
          />
 
          <span className="text-xs sm:text-sm lg:text-base text-gray-800 text-center truncate max-w-[120px] uppercase">
            {store.sigla || store.nome}
          </span>
        </div>
      ))}

      {/* Botão Ver Mais */}
      <div
        className="flex flex-col items-center space-y-2 w-24 sm:w-32 lg:w-40 cursor-pointer"
        onClick={handleExploreClick} // Corrigido para invocar a função
      >
        <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full border-2 border-gray-400 bg-gray-200">
          <Add style={{ fontSize: '2rem', color: 'gray' }} />
        </div>
        <span className="text-xs sm:text-sm lg:text-base text-gray-800 text-center truncate max-w-[120px] uppercase">
          Ver mais
        </span>
      </div>
    </div>
  );
};

export default StorieList;

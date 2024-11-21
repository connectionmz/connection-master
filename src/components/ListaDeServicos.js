import React, { useEffect, useState } from 'react';
import { ref, onValue, get } from 'firebase/database';
import { db } from '../fb';
import { useNavigate, useParams } from 'react-router-dom';

const ListaDeServicos = () => {
  const { categoriaId } = useParams();
  const [servicos, setServicos] = useState([]);
  const [companies, setCompanies] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Observa os serviços
    const servicosRef = ref(db, `servicosExternos/`);
    const unsubscribe = onValue(servicosRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const servicosList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setServicos(servicosList);
      } else {
        setServicos([]);
      }
    });

    // Busca as empresas relacionadas à categoria
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
            .filter((company) => company.categoriaExterna === categoriaId); // Filtra por categoria
          setCompanies(companyList);
        } else {
          setCompanies([]);
        }
      } catch (error) {
        console.error('Erro ao buscar empresas:', error);
      }
    };

    fetchCompanies();

    // Cleanup para desinscrever listeners
    return () => unsubscribe();
  }, [categoriaId]);

  const handleCompanyClick = (companyId) => {
    navigate(`/vperfil/${companyId}`);
  };

  return (
    <div className="p-4 bg-white">
      <h2 className="text-xl font-bold mb-4">Empresas Relacionadas</h2>
      <div className="company-list grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {companies.length > 0 ? (
          companies.map((company) => (
            <div
              key={company.id}
              className="company-card bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              onClick={() => handleCompanyClick(company.id)}
            >
              <img
                src={company.logoUrl || 'default-logo.png'}
                alt={`${company.nome} logo`}
                className="h-16 w-16 object-cover mb-4 rounded-full mx-auto"
              />
              <h3 className="font-semibold text-center text-gray-800">{company.nome}</h3>
              <p className="text-gray-600 text-center">
                <small>{company.sector}</small>
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center col-span-full">
            Nenhuma empresa encontrada para esta categoria.
          </p>
        )}
      </div>
    </div>
  );
};

export default ListaDeServicos;

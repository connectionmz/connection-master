import React, { useEffect, useState } from 'react';
import { db } from '../fb';
import { ref, get } from 'firebase/database';
import '../styles/main.css';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '@mui/material';

const MarqueeParceiros = () => {
  const [parceiros, setParceiros] = useState([]);
  const navigate = useNavigate();

  const fetchParceiros = async () => {
    try {
      const snapshot = await get(ref(db, 'parceiros'));
      if (snapshot.exists()) {
        setParceiros(Object.values(snapshot.val()));
      }
    } catch (error) {
      console.error('Erro ao buscar parceiros:', error);
    }
  };

  useEffect(() => {
    fetchParceiros();
  }, []);

  const handleNavigateToTabs = () => {
    navigate('/parceiros-investidores'); // Redireciona para o componente com tabs
  };

  const handleCompanyClick = (companyId) => {
    navigate(`/vperfil/${companyId}`);
  };

  return (
    <>
      <div className="flex items-center bg-blue-600 text-white p-4 mb-6">
        <div className="ml-4 flex-shrink-0">
          <button
            className="bg-white text-blue-600 px-4 py-2 rounded shadow hover:bg-gray-200 transition"
            onClick={handleNavigateToTabs} // Navega para o novo componente
          >
            Parceiros / Investidores
          </button>
        </div>
        <div className="flex-grow overflow-hidden">
          <div className="whitespace-nowrap animate-marquee">
          {parceiros.map((parceiro, index) => (
  <a
    key={index}
    className="mx-8 cursor-pointer flex items-center space-x-2"
    onClick={() => handleCompanyClick(parceiro.companyId)}
  >
    <Avatar
      src={parceiro.logo}
      alt={parceiro.nome || 'Logo da Empresa'}
      sx={{ width: 40, height: 40, marginRight: 2 }}
    />
    <span className="flex items-center">
      <strong>{parceiro.nome || 'Empresa Desconhecida'}:</strong>
    </span>
  </a>
))}

          </div>
        </div>
      </div>
    </>
  );
};

export default MarqueeParceiros;

import React, { useEffect, useState } from 'react';
import { db } from '../fb';
import { ref, get } from 'firebase/database';
import '../styles/main.css';
import { useNavigate } from 'react-router-dom';

const MarqueeParceiros = () => {
  const [parceiros, setParceiros] = useState([]);
  const [selectedParceiro, setSelectedParceiro] = useState(null);
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

  const handleOpenModal = (parceiro) => {
    setSelectedParceiro(parceiro);
  };

  const handleCloseModal = () => {
    setSelectedParceiro(null);
  };
  const handleCompanyClick = (companyId) => {
    navigate(`/vperfil/${companyId}`);
  };
  return (
    <div>
      <div className="overflow-hidden  p-4 mb-6">
        <div className="whitespace-nowrap animate-marquee">
          {parceiros.map((parceiro, index) => (
            <a
              key={index}
              className="mx-8 cursor-pointer flex items-center space-x-2"
              onClick={() => handleCompanyClick(parceiro.companyId)}
            >
              {parceiro.logoUrl && (
                <img
                  src={parceiro.logoUrl}
                  alt={`Logo de ${parceiro.nome}`}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <strong>{parceiro.nome || 'Nome desconhecido'}</strong>
            </a>
          ))}
        </div>
      </div>

      {selectedParceiro && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/2 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{selectedParceiro.nome}</h2>
            <p>
              <strong>Email:</strong> {selectedParceiro.email || 'Não informado'}
            </p>
            <p>
              <strong>Telefone:</strong> {selectedParceiro.telefone || 'Não informado'}
            </p>
            <p>
              <strong>Tipo:</strong> {selectedParceiro.tipo || 'Desconhecido'}
            </p>
            {selectedParceiro.mensagem && (
              <p className="mt-4 text-gray-700">
                <strong>Mensagem:</strong> {selectedParceiro.mensagem}
              </p>
            )}

            {selectedParceiro.logoUrl && (
              <img
                src={selectedParceiro.logoUrl}
                alt={`Logo de ${selectedParceiro.nome}`}
                className="w-full h-auto rounded-lg mt-4"/>
            )}

            <button
              onClick={handleCloseModal}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarqueeParceiros;

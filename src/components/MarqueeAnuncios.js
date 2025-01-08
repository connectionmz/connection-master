import React, { useEffect, useState } from 'react';
import { db } from '../fb';
import { ref, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom'; // Navegação com React Router
import '../styles/main.css';
import { Avatar } from '@mui/material';

export const fetchAnuncios = async () => {
  try {
    const snapshot = await get(ref(db, 'publicAnnouncements'));
    if (snapshot.exists()) {
      
      return Object.values(snapshot.val());
      
    } else {
      return [];
    }
  } catch (error) {
    console.error('Erro ao buscar anúncios:', error);
    throw error; // Repassa o erro para ser tratado pelo componente que chamou

    //POXA TO CANSADO SENTADO DESDE 21H DE ONTEM, ESPERO QUE GANHE MUITA GRANA COM ISSO
  }
};


const MarqueeAnuncios = () => {
  const [anuncios, setAnuncios] = useState([]);
  const [selectedAnuncio, setSelectedAnuncio] = useState(null);
  const navigate = useNavigate();


  useEffect(() => {
    const loadAnuncios = async () => {
      try {
        const data = await fetchAnuncios();
        setAnuncios(data);
      } catch (error) {
        console.error('Erro ao carregar os anúncios:', error);
      }
    };

    loadAnuncios();
  }, []);

  const handleOpenModal = (anuncio) => {
    setSelectedAnuncio(anuncio);
  };

  const handleCloseModal = () => {
    setSelectedAnuncio(null);
  };

  const handleVerMais = () => {
    navigate('/noticiados');
  };

  return (
    <div className="flex items-center bg-blue-600 text-white p-4 mb-6">
      {/* Marquee */}
      <div className="flex-grow overflow-hidden">
        <div className="whitespace-nowrap animate-marquee">
          {anuncios.map((anuncio, index) => (
            <span
              key={index}
              className="mx-8 cursor-pointer flex items-center space-x-2"
              onClick={() => handleOpenModal(anuncio)}>
            <Avatar
              src={anuncio.company.logo}
              alt={anuncio.company.nome || 'Logo da Empresa'}
              sx={{ width: 40, height: 40, marginRight: 2 }} // Tamanho e margem
            />
              <strong>{anuncio.company.nome || 'Empresa Desconhecida'}:</strong>              <span>{anuncio.title}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="ml-4 flex-shrink-0">
        <button
          onClick={handleVerMais}
          className="bg-white text-blue-600 px-4 py-2 rounded shadow hover:bg-gray-200 transition"
        >
          Ver Mais
        </button>
      </div>
      {selectedAnuncio && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/2 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-2">
              {selectedAnuncio.title} - {selectedAnuncio.company.nome || 'Empresa Desconhecida'}
            </h2>
            {selectedAnuncio.contentType === 'image' && (
              <img
                src={selectedAnuncio.contentUrl}
                alt="Anúncio"
                className="w-full h-auto rounded-lg mt-4"
              />
            )}
            {selectedAnuncio.fileUrl && (
              <a
                href={selectedAnuncio.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline mt-4 inline-block"
              >
                Baixar o documento
              </a>
            )}

            {selectedAnuncio.contentType === 'text' && (
              <p className="mt-4 text-gray-700">{selectedAnuncio.contentText}</p>
            )}

            <button
              onClick={handleCloseModal}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarqueeAnuncios;

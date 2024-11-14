import React, { useEffect, useState } from 'react';
import { db } from '../fb';
import { ref, get } from 'firebase/database';
import { FaBuilding } from 'react-icons/fa';
import '../styles/main.css';

const MarqueeAnuncios = () => {
  const [anuncios, setAnuncios] = useState([]);
  const [selectedAnuncio, setSelectedAnuncio] = useState(null);

  const fetchAnuncios = async () => {
    try {
      const snapshot = await get(ref(db, 'publicAnnouncements'));
      if (snapshot.exists()) {
        setAnuncios(Object.values(snapshot.val()));
      }
    } catch (error) {
      console.error('Erro ao buscar anúncios:', error);
    }
  };

  useEffect(() => {
    fetchAnuncios();
  }, []);

  const handleOpenModal = (anuncio) => {
    setSelectedAnuncio(anuncio);
  };

  const handleCloseModal = () => {
    setSelectedAnuncio(null);
  };

  return (
    <div>
      <div className="overflow-hidden bg-blue-600 text-white p-4 mb-6">
        <div className="whitespace-nowrap animate-marquee">
          {anuncios.map((anuncio, index) => (
            <span
              key={index}
              className="mx-8 cursor-pointer flex items-center space-x-2"
              onClick={() => handleOpenModal(anuncio)}
            >
              <FaBuilding className="text-yellow-400" />
              <strong>{anuncio.empresa || 'Empresa Desconhecida'}:</strong> 
              <span>{anuncio.title}</span>
            </span>
          ))}
        </div>
      </div>

      {selectedAnuncio && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 md:w-1/2 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-2">
              {selectedAnuncio.title} - {selectedAnuncio.empresa}
            </h2>

            {selectedAnuncio.contentType === 'image' && (
              <img src={selectedAnuncio.contentUrl} alt="Anúncio" className="w-full h-auto rounded-lg mt-4" />
            )}

            {selectedAnuncio.contentType === 'pdf' && (
              <a
                href={selectedAnuncio.contentUrl}
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

import React, { useEffect, useState } from 'react';
import { getDatabase, ref, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { db } from '../fb';
import { FaFileDownload } from 'react-icons/fa';

const Noticiados = () => {
  const [anuncios, setAnuncios] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Função para buscar anúncios
  const fetchAnuncios = async () => {
    try {
      const snapshot = await get(ref(db, 'publicAnnouncements'));
      if (snapshot.exists()) {
        const data = Object.values(snapshot.val());
        setAnuncios(data);
      }
    } catch (error) {
      console.error('Erro ao buscar anúncios:', error);
    } finally {
      setLoading(false);
    }
  };

  // Formatar data
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  useEffect(() => {
    fetchAnuncios();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">Todos os Anúncios</h1>

      {loading ? (
        <p className="text-gray-600">Carregando anúncios...</p>
      ) : anuncios.length > 0 ? (
        <ul className="bg-white rounded shadow-md divide-y">
          {anuncios.map((anuncio, index) => (
            <li key={index} className="p-4 hover:bg-gray-50 transition">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">{anuncio.title}</h2>
              <p className="text-sm text-gray-600 mb-2">
                <strong>Empresa:</strong> {anuncio.company || 'Desconhecida'}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                <strong>Data:</strong> {formatDate(anuncio.date)}
              </p>
              {anuncio.fileUrl && (
                <a
                  href={anuncio.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                >
                  <FaFileDownload className="mr-2" /> Baixar Documento
                </a>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">Nenhum anúncio disponível.</p>
      )}
    </div>
  );
};

export default Noticiados;

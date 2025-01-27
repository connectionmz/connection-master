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
      {/* Mapeamento dos anúncios */}
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
          <strong>{anuncio.company.nome || 'Empresa Desconhecida'}:</strong>              
          <span>{anuncio.title}</span>
        </span>
      ))}
      
      {/* Mensagem "Saiba tudo" que aparece após os anúncios */}
      <span className="mx-8">{/* Adiciona o espaço entre os anúncios e a mensagem */}
        <strong>Saiba tudo sobre regulamentos e notícias essenciais para empresas e cidadãos</strong>
      </span>
    </div>
  </div>

  {/* Botão "Ver Mais" */}
  <div className="ml-4 flex-shrink-0">
    <button
      onClick={handleVerMais}
      className="bg-white text-blue-600 px-4 py-2 rounded shadow hover:bg-gray-200 transition"
    >
      Ver Mais
    </button>
  </div>
</div>

  );
};

export default MarqueeAnuncios;

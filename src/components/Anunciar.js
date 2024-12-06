import React, { useState, useEffect } from 'react';
import { FaUpload } from 'react-icons/fa';
import { getDownloadURL, ref as createStorageRef, uploadBytes } from 'firebase/storage';
import { db, storage } from '../fb';
import { ref, push, set, onValue, remove, update } from 'firebase/database';
import Checkout from './checkout/Checkout';

const Anunciar = ({ user }) => {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('meusAnuncios');
  const [anuncios, setAnuncios] = useState([]);
  const [selectedAnuncio, setSelectedAnuncio] = useState(null);
  const [days, setDays] = useState(1); 
  const [totalCost, setTotalCost] = useState(30);

  const MAX_DAYS = 30; 
  const COST_PER_DAY = 30; 
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  useEffect(() => {
    const anunciosRef = ref(db, 'banners');
    onValue(anunciosRef, (snapshot) => {
      const data = snapshot.val();
      const anunciosList = Object.keys(data || {}).map((id) => ({
        id,
        ...data[id],
      }));
      setAnuncios(
        anunciosList
          .filter((anuncio) => anuncio.companyId === user.id)
          .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      );
    });
  }, [user.id]);

  useEffect(() => {
    setTotalCost(days * COST_PER_DAY);
  }, [days]);

  const handleFileChange = (e) => {
    if (e.target.files[0]) setFile(e.target.files[0]);
  };

  const handlePaymentSuccess = (paymentDetails) => {
    setIsCheckoutOpen(false);
    handleUpload();
  };

  const handleUpload = () => {
    if (!file) {
      alert('Por favor, selecione uma imagem primeiro!');
      return;
    }
    setUploading(true);
    const fileRef = createStorageRef(storage, `images/${file.name}`);
    uploadBytes(fileRef, file)
      .then((snapshot) => {
        getDownloadURL(fileRef).then((url) => {
          setImageUrl(url);
          saveToDatabase(url);
          setUploading(false);
          alert('Imagem carregada com sucesso!');
        });
      })
      .catch((error) => {
        setUploading(false);
        console.error('Erro ao fazer upload da imagem:', error);
        alert('Erro ao carregar a imagem. Tente novamente.');
      });
  };

  const saveToDatabase = (url) => {
    const anuncioRef = push(ref(db, 'banners'));
    set(anuncioRef, {
      title,
      description,
      imageUrl: url,
      link,
      uploadedAt: new Date().toISOString(),
      companyId: user.id,
      days,
      totalCost,
    });
    setTitle('');
    setDescription('');
    setLink('');
    setFile(null);
    setDays(1);
    setPhoneNumber('');
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza de que deseja eliminar este anúncio?')) {
      remove(ref(db, `banners/${id}`));
    }
  };

  const handleEdit = (anuncio) => {
    setSelectedAnuncio(anuncio);
  };

  const updateAnuncio = () => {
    const anuncioRef = ref(db, `banners/${selectedAnuncio.id}`);
    update(anuncioRef, {
      title: selectedAnuncio.title,
      description: selectedAnuncio.description,
      link: selectedAnuncio.link,
    });
    setSelectedAnuncio(null);
  };

  return (
    <div className="p-6 bg-white shadow-md rounded-md max-w-md mx-auto">
      <div className="tabs flex justify-center">
        <button
          onClick={() => setActiveTab('meusAnuncios')}
          className={`px-4 py-2 ${activeTab === 'meusAnuncios' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
          Meus Anúncios
        </button>
        <button
          onClick={() => setActiveTab('anunciar')}
          className={`px-4 py-2 ${activeTab === 'anunciar' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
          Anunciar
        </button>
      </div>
      {activeTab === 'meusAnuncios' && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-4">Meus Anúncios</h2>
          {anuncios.length === 0 ? (
            <p>Nenhum anúncio encontrado.</p>
          ) : (
            anuncios.map((anuncio) => (
              <div key={anuncio.id} className="p-3 border rounded mb-2">
                <h3 className="font-semibold">{anuncio.title}</h3>
                <p className="text-sm text-gray-600">{new Date(anuncio.uploadedAt).toLocaleDateString()}</p>
                <button onClick={() => handleEdit(anuncio)} className="text-blue-500 mr-2">
                  Editar
                </button>
                <button onClick={() => handleDelete(anuncio.id)} className="text-red-500">
                  Eliminar
                </button>
              </div>
            ))
          )}
        </div>
      )}
      {activeTab === 'anunciar' && (
        <div className="mt-4">
          <h2 className="text-2xl font-bold mb-4">Anunciar</h2>
          <input
            type="text"
            placeholder="Título do anúncio"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 mb-3 rounded"/>
          <textarea
            placeholder="Descrição do anúncio"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border p-2 mb-3 rounded"/>
          <input
            type="text"
            placeholder="Link externo (opcional)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="w-full border p-2 mb-3 rounded"/>
          <input type="file" onChange={handleFileChange} className="mb-3" />
          <label className="block mb-3">
            <span>Tempo do anúncio (1 a {MAX_DAYS} dias):</span>
            <input
              type="number"
              min="1"
              max={MAX_DAYS}
              value={days}
              onChange={(e) => setDays(Math.min(Math.max(Number(e.target.value), 1), MAX_DAYS))}
              className="border p-2 rounded w-full"
            />
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Valor total: <strong>{totalCost} Mt</strong>
          </p>
          <label className="block mb-3">
            <span>Número de celular:</span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Insira seu número de telefone"
              className="w-full border p-2 rounded"
            />
          </label>
          <button
            onClick={() => setIsCheckoutOpen(true)}
            disabled={!phoneNumber}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Avançar para Pagamento
          </button>
        </div>
      )}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Checkout
            user={user}
            planPrice={totalCost}
            phoneNumber={phoneNumber}
            onPaymentSuccess={handlePaymentSuccess}
          />
        </div>
      )}
    </div>
  );
};

export default Anunciar;

import React, { useState, useEffect } from 'react';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ref, set, push, get, onValue } from 'firebase/database'; 
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; 
import { db } from '../fb';
import { useNavigate, useParams } from 'react-router-dom';
import { saveContentToInbox } from './SaveToInbox'; 
import { CircularProgress, TextField, Autocomplete } from '@mui/material'; 

const EnviarProposta = ({ user }) => {
  const { id, companyId } = useParams();
  const [description, setDescription] = useState('');
  const [anexo, setAnexo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [hasProposal, setHasProposal] = useState(false); 
  const navigate = useNavigate();

  const storage = getStorage();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRef = ref(db, `stores/${user.id}`);
        const snapshot = await get(productsRef);

        if (snapshot.exists()) {
          const fetchedProducts = snapshot.val().products;
          const productsWithIds = Array.isArray(fetchedProducts)
            ? fetchedProducts.map((product, index) => ({
                ...product,
                id: product.id || `product-${index}`,
              }))
            : Object.keys(fetchedProducts || {}).map((key) => ({
                ...fetchedProducts[key],
                id: key,
              }));

          setProducts(productsWithIds);
        }
      } catch (error) {
        console.error('Erro ao buscar produtos:', error);
      }
    };
    fetchProducts();
  }, [user.id]);

  useEffect(() => {
    const checkProposal = async () => {
      const proposalsRef = ref(db, `cotacoes/${id}/proposals`);
      onValue(proposalsRef, (snapshot) => {
        const proposals = snapshot.val();
        const userProposal = Object.values(proposals || {}).find(
          (proposal) => proposal.from?.id === user.id
        );
        if (userProposal) {
          setHasProposal(true);
        }
      });
    };
    checkProposal();
  }, [id, user.id]);

  const handleAnexoChange = (e) => {
    setAnexo(e.target.files[0]);
  };

  const handleSubmitProposal = (e) => {
    e.preventDefault();

    if (!user) {
      alert('Usuário não autenticado. Por favor, faça login.');
      return;
    }

    if (description.trim() === '' && !anexo) {
      alert('Por favor, insira uma proposta ou carregue um documento.');
      return;
    }

    setUploading(true);

    if (anexo) {
      const uniqueFileName = `${anexo.name}-${Date.now()}`;
      const storageReference = storageRef(storage, `proposals/${uniqueFileName}`);
      const uploadTask = uploadBytesResumable(storageReference, anexo);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Erro ao carregar o arquivo:', error);
          alert('Erro ao carregar o arquivo. Por favor, tente novamente.');
          setUploading(false);
        },
        () => getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => submitProposal(downloadURL))
      );
    } else {
      submitProposal(null);
    }
  };

  const submitProposal = async (fileUrl) => {
    const proposalsRef = ref(db, `cotacoes/${id}/proposals`);
    const newProposalRef = push(proposalsRef);

    const newProposal = {
      id: newProposalRef.key,
      cotationId: id,
      from: user,
      proposal: description,
      fileUrl,
      selectedProducts: selectedProducts.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        url: `/product/${user.id}/${product.id}`,
      })),
      submittedAt: new Date().toISOString(),
      status: 'wait',
      url: `/cotacao/${id}/${companyId}`,
    };

    try {
      await set(newProposalRef, newProposal);
      await saveContentToInbox(newProposal, companyId, 'Nova Resposta à Cotação', 'cotacao-response', `/cotacao/${id}`);
      alert('Proposta enviada com sucesso!');
      setDescription('');
      setAnexo(null);
      setSelectedProducts([]);
      setHasProposal(true);
    } catch (error) {
      console.error('Erro ao submeter a proposta:', error);
      alert('Erro ao submeter a proposta. Por favor, tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  if (hasProposal) {
    return (
      <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg text-center">
        <h2 className="text-2xl font-semibold mb-4">Proposta Já Enviada</h2>
        <p className="text-gray-700 mb-4">Você já enviou uma proposta para esta cotação.</p>
        <button
          onClick={() => navigate(`/cotacao/${id}/${companyId}`)}
          className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
          Ver Proposta Enviada
        </button>
      </div>
    );
  }
  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-semibold mb-4">Enviar Proposta para Cotação</h2>
      <form onSubmit={handleSubmitProposal} className="space-y-4">
        <div>
          <label className="block text-gray-700">Mensagem</label>
          <ReactQuill
            value={description}
            onChange={setDescription}
            className="bg-white"
            theme="snow"
            placeholder="Descreva os detalhes da proposta"
            modules={{
              toolbar: [
                [{ 'header': '1'}, {'header': '2'}, { 'font': [] }],
                [{ size: [] }],
                ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                [{'list': 'ordered'}, {'list': 'bullet'}, 
                {'indent': '-1'}, {'indent': '+1'}],
                ['link', 'image', 'video'],
                ['clean']
              ],
            }}
          />
        </div>
        <div>
          <label className="block text-gray-700">Buscar Itens</label>
          <Autocomplete
            multiple
            options={products}
            getOptionLabel={(option) => option.name}
            value={selectedProducts}
            onChange={(event, newValue) => {
              setSelectedProducts(newValue);
            }}
            renderInput={(params) => <TextField {...params} variant="outlined" placeholder="Buscar itens..." />}
          />
        </div>
        <div>
          <label className="block text-gray-700">Anexo</label>
          <input
            type="file"
            onChange={handleAnexoChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </div>
        <button
          type="submit"
          className={`w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition ${uploading ? 'opacity-50' : ''}`}
          disabled={uploading}>
          {uploading ? (
            <div className="flex justify-center items-center">
              <CircularProgress size={20} className="text-white mr-2" />
              Enviando...
            </div>
          ) : (
            'Enviar Proposta'
          )}
        </button>     
        {uploadProgress > 0 && (
          <p className="text-center text-gray-700 mt-4">Progresso do upload: {Math.round(uploadProgress)}%</p>
        )}
      </form>
    </div>
  );
};

export default EnviarProposta;

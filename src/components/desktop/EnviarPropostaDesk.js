import React, { useState, useEffect } from 'react';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ref, set, push, get, onValue } from 'firebase/database';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { db } from '../../fb';
import { useNavigate, useParams } from 'react-router-dom';
import { CircularProgress, TextField, Autocomplete, Button, Box, Typography } from '@mui/material';
import BackButton from '../BackButton';

const EnviarPropostaDesk = ({ user }) => {
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
      <Box sx={{ maxWidth: 1000, margin: 'auto', padding: 3, backgroundColor: 'white', borderRadius: 2, boxShadow: 3 }}>
      <BackButton sx={{ mb: 2 }} />

        <Typography variant="h6" gutterBottom>
          Proposta Já Enviada
        </Typography>
        <Typography variant="body1" paragraph>
          Você já enviou uma proposta para esta cotação.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(`/cotacao/${id}/${companyId}`)}
          sx={{ marginTop: 2 }}
        >
          Ver Proposta Enviada
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, margin: 'auto', padding: 3, backgroundColor: 'white', borderRadius: 2, boxShadow: 3 }}>
            <BackButton sx={{ mb: 2 }} />

      <Typography variant="h6" gutterBottom>
        Enviar Proposta para Cotação
      </Typography>
      <form onSubmit={handleSubmitProposal} noValidate autoComplete="off">
        <Box mb={2}>
          <Typography variant="body1">Mensagem</Typography>
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
                [{ 'list': 'ordered'}, { 'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
                ['link', 'image', 'video'],
                ['clean']
              ],
            }}
          />
        </Box>

        <Box mb={2}>
          <Typography variant="body1">Buscar Itens</Typography>
          <Autocomplete
            multiple
            options={products}
            getOptionLabel={(option) => option.name}
            value={selectedProducts}
            onChange={(event, newValue) => setSelectedProducts(newValue)}
            renderInput={(params) => <TextField {...params} variant="outlined" placeholder="Buscar itens..." />}
          />
        </Box>

        <Box mb={2}>
          <Typography variant="body1">Anexo</Typography>
          <input
            type="file"
            onChange={handleAnexoChange}
            className="w-full p-2 border border-gray-300 rounded-lg"
          />
        </Box>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ marginTop: 2 }}
          disabled={uploading}
        >
          {uploading ? (
            <Box display="flex" justifyContent="center" alignItems="center">
              <CircularProgress size={20} sx={{ color: 'white', marginRight: 1 }} />
              Enviando...
            </Box>
          ) : (
            'Enviar Proposta'
          )}
        </Button>

        {uploadProgress > 0 && (
          <Typography variant="body2" color="textSecondary" sx={{ marginTop: 1, textAlign: 'center' }}>
            Progresso do upload: {Math.round(uploadProgress)}%
          </Typography>
        )}
      </form>
    </Box>
  );
};

export default EnviarPropostaDesk;

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Autocomplete,
  CircularProgress,
  Alert,
  Snackbar,
  useMediaQuery,
} from '@mui/material';
import { ref, set, push, get, onValue } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { db } from '../../fb';
import { useNavigate, useParams } from 'react-router-dom';
import BackButton from '../BackButton';
import sendEmail from '../sms/SendMail';
import { saveContentToInbox } from '../SaveToInbox';

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
  const isMobile = useMediaQuery('(max-width:600px)'); 

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
      const proposalsRef = ref(db, `cotacoes/${id}/proposals/${user.id}`);
      try {
        onValue(proposalsRef, (snapshot) => {
          const proposals = snapshot.val();
          const userProposal = Object.values(proposals || []);
          if (userProposal.length > 0) {
            setHasProposal(true); 
          } else {
            setHasProposal(false); 
          }
        });
      } catch (error) {
        console.error('Erro ao verificar proposta:', error);
      }
    };

    checkProposal();

    return () => {
      setHasProposal(false); 
    };
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
    if (!description) {
      alert('Por favor, preencha todos os campos obrigatórios antes de enviar.');
      return;
    }

    const proposalsRef = ref(db, `cotacoes/${id}/proposals/${user.id}`);

    const newProposal = {
      cotacaoId: id,
      from: {
        nome: user.nome,
        logo: user.logoUrl,
        provincia: user.provincia,
        distrito: user.distrito,
        id: user.id,
        email: user.email,
      },
      proposal: description,
      fileUrl,
      selectedProducts: selectedProducts.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        url: `/product/${product.id}/store${user.id}`,
      })),
      submittedAt: new Date().toISOString(),
      status: 'wait',
      url: `/cotacao/${id}/${companyId}`,
    };

    const notification = {
      type: 'cotation_reply',
      message: `${user.nome} enviou uma proposta para você`,
      fromUserId: user.id,
      fromUserName: user.nome,
      timestamp: new Date().toISOString(),
      status: 'unread',
      url: `/cotacao/${id}/${companyId}`,
    };

    try {
      setUploading(true);
      await set(proposalsRef, newProposal);
      saveContentToInbox(companyId, notification);
      alert('Proposta enviada com sucesso!');
      setDescription('');
      setAnexo(null);
      setSelectedProducts([]);
      setHasProposal(true);
    } catch (error) {
      console.error('Erro ao submeter a proposta:', error);
      alert(error?.message || 'Erro ao submeter a proposta. Por favor, tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  if (hasProposal) {
    return (
      <Box
        sx={{
          width: '100%',
          maxWidth: isMobile ? '100%' : '800px', 
          margin: '0 auto',
          p: isMobile ? 2 : 4, 
        }}
      >
        <Typography variant="h5" align="center" gutterBottom>
          Proposta Já Enviada
        </Typography>
        <Typography variant="body1" align="center" color="textSecondary" sx={{ mb: 4 }}>
          Olá, <br />
          Agradecemos o seu interesse e a proposta enviada para o nosso pedido de cotação.
          Informamos que a sua proposta está em fase de verificação.
          <br />
          Lembre-se de que este é um pedido público e estamos avaliando as melhores propostas.
          Caso sua cotação seja aprovada, você será notificado, e o status do pedido será atualizado para Fechado.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(`/cotacao/${id}/${companyId}`)}
          fullWidth={!isMobile} 
          sx={{
            mt: 2,
            py: isMobile ? 1 : 1.5, 
          }}
        >
          Ver Proposta Enviada
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: isMobile ? '100%' : '800px', 
        margin: '0 auto',
        p: isMobile ? 2 : 4, 
      }}
    >
      <BackButton sx={{ mb: 2 }} />
      <Typography
        variant="h4"
        align="center"
        gutterBottom
        sx={{
          fontSize: isMobile ? '1.5rem' : '2rem', 
          fontWeight: 'bold',
        }}
      >
        Enviar Proposta para Cotação
      </Typography>

      <form onSubmit={handleSubmitProposal}>
        <ReactQuill
          value={description}
          onChange={setDescription}
          placeholder="Escreva sua proposta aqui..."
          modules={{
            toolbar: [
              [{ header: [1, 2, false] }],
              ['bold', 'italic', 'underline'],
              ['link', 'image'],
            ],
          }}
          formats={['header', 'bold', 'italic', 'underline', 'link', 'image']}
          style={{
            height: isMobile ? '150px' : '200px', 
            marginBottom: '16px',
          }}
        />

        <Autocomplete
          multiple
          options={products}
          getOptionLabel={(option) => option.name}
          value={selectedProducts}
          onChange={(event, newValue) => setSelectedProducts(newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Buscar Itens"
              variant="outlined"
              fullWidth
              sx={{
                mb: 2,
                fontSize: isMobile ? '0.875rem' : '1rem', 
              }}
            />
          )}
        />

        <Box sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            component="label"
            fullWidth={!isMobile} 
            sx={{
              textTransform: 'none',
              fontSize: isMobile ? '0.875rem' : '1rem', 
            }}
          >
            Anexar Arquivo
            <input hidden accept="*" multiple type="file" onChange={handleAnexoChange} />
          </Button>
        </Box>

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth={!isMobile} 
          disabled={uploading}
          sx={{
            mt: 2,
            py: isMobile ? 1 : 1.5, 
          }}
        >
          {uploading ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            'Enviar Proposta'
          )}
        </Button>

        {uploadProgress > 0 && (
          <Typography
            variant="body1"
            align="center"
            sx={{
              mt: 2,
              fontSize: isMobile ? '0.875rem' : '1rem', 
            }}
          >
            Progresso do upload: {Math.round(uploadProgress)}%
          </Typography>
        )}
      </form>
    </Box>
  );
};

export default EnviarPropostaDesk;
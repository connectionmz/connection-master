import React, { useState, useEffect } from 'react';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { ref, set, push, get, onValue } from 'firebase/database';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { db } from '../../fb';
import { useNavigate, useParams } from 'react-router-dom';
import { CircularProgress, TextField, Autocomplete, Button, Box, Typography } from '@mui/material';
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
          
          // Verifica se existe alguma proposta do usuário
          const userProposal = Object.values(proposals || {});
          
          if (userProposal.length > 0) {
            setHasProposal(true);  // Se houver propostas, atualiza o estado
          } else {
            setHasProposal(false);  // Caso contrário, garante que o estado seja false
          }
        });
      } catch (error) {
        console.error("Erro ao verificar proposta:", error);
        // Você pode adicionar uma lógica de fallback caso haja erro
      }
    };
  
    checkProposal();
  
    // Função de cleanup para remover o listener quando o componente desmontar
    return () => {
      setHasProposal(false);  // Reseta o estado caso o componente seja desmontado
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
    // Validação antes de enviar
    if (!description) {
      alert('Por favor, preencha todos os campos obrigatorios antes de enviar.');
      return;
    }
  
    const proposalsRef = ref(db, `cotacoes/${id}/proposals/${user.id}`);
  
    const newProposal = {
      cotationId: id,
      from:{
        nome:user.nome,
        logo:user.logoUrl,
        provincia:user.provincia,
        distrito:user.distrito,
        id:user.id,
        email:user.email
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
      type: "cotation_reply",
      message: `${user.nome} enviou uma proposta para voce`,
      fromUserId: user.id,
      fromUserName: user.nome,
      timestamp: new Date().toISOString(),
      status: "unread",
      url: `/cotacao/${id}/${companyId}`,
    };
      saveContentToInbox(companyId,notification)

    try {
      setUploading(true); 
      await set(proposalsRef, newProposal);
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
      <Box sx={{ width: '100%',height:'100vh', margin: 'auto', padding: 3, backgroundColor: 'white', borderRadius: 2, boxShadow: 3 }}>
      <BackButton sx={{ mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        Proposta Já Enviada
      </Typography>
      <Typography variant="body1" paragraph>
        Olá,
      </Typography>
      <Typography variant="body1" paragraph>
        Agradecemos o seu interesse e a proposta enviada para o nosso pedido de cotação. 
        Informamos que a sua proposta está em fase de verificação.
      </Typography>
      <Typography variant="body1" paragraph>
        Lembre-se de que este é um pedido público e estamos avaliando as melhores propostas. 
        Caso sua cotação seja aprovada, você será notificado, e o status do pedido será atualizado para <strong>Fechado</strong>.
      </Typography>
      <Typography variant="body1" paragraph>
        Por enquanto, ainda não recebemos a sua resposta oficialmente. 
        Continue acompanhando a situação e, se necessário, esteja disponível para fornecer mais informações ou ajustes.
      </Typography>
      <Typography variant="body1" paragraph>
        Acreditamos no seu potencial e estamos torcendo pelo seu sucesso! 
        Grandes oportunidades surgem para quem se prepara e persiste. 
        Siga em frente com confiança!
      </Typography>
      <Typography variant="body1" paragraph>
        Boa sorte!
      </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate(`/cotacao/${id}/${companyId}`)}
          sx={{ marginTop: 2 }}>
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

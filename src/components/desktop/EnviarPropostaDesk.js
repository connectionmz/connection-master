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
  Card,
  CardContent,
  Paper,
  Divider,
  Chip,
  LinearProgress,
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
  const [successAlert, setSuccessAlert] = useState(false);
  const [errorAlert, setErrorAlert] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
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
        setErrorMessage('Erro ao carregar produtos. Tente novamente.');
        setErrorAlert(true);
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
        setErrorMessage('Erro ao verificar proposta existente.');
        setErrorAlert(true);
      }
    };
    checkProposal();
    return () => {
      setHasProposal(false);
    };
  }, [id, user.id]);

  const handleAnexoChange = (e) => {
    if (e.target.files[0]) {
      setAnexo(e.target.files[0]);
    }
  };

  const handleSubmitProposal = (e) => {
    e.preventDefault();

    if (!user) {
      setErrorMessage('Usuário não autenticado. Por favor, faça login.');
      setErrorAlert(true);
      return;
    }

    if (description.trim() === '' && !anexo) {
      setErrorMessage('Por favor, insira uma proposta ou carregue um documento.');
      setErrorAlert(true);
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
          setErrorMessage('Erro ao carregar o arquivo. Por favor, tente novamente.');
          setErrorAlert(true);
          setUploading(false);
        },
        () => getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => submitProposal(downloadURL))
      );
    } else {
      submitProposal(null);
    }
  };

  const submitProposal = async (fileUrl) => {
    if (!description && !fileUrl) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios antes de enviar.');
      setErrorAlert(true);
      return;
    }

    const proposalsRef = ref(db, `cotacoes/${id}/proposals/${user.id}`);
const newProposalRef = push(proposalsRef);
const proposalId = newProposalRef.key;

const newProposal = {
  id: proposalId,
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
    url: `/product/${product.id}/store/${user.id}`,
  })),
  submittedAt: new Date().toISOString(),
  status: 'wait',
};

const notification = {
  type: 'cotation_reply',
  message: `${user.nome} enviou uma proposta para você`,
  fromUserId: user.id,
  fromUserName: user.nome,
  timestamp: new Date().toISOString(),
  status: 'unread',
  url: `/cotacao/${id}/proposta/${proposalId}`,
  cotacaoId: id,
  proposalId: proposalId,
};

  // Agora salva a proposta
  await set(newProposalRef, newProposal);

    try {
      await set(proposalsRef, newProposal);
      saveContentToInbox(companyId, notification);
      setSuccessAlert(true);
      setDescription('');
      setAnexo(null);
      setSelectedProducts([]);
      setHasProposal(true);
    } catch (error) {
      console.error('Erro ao submeter a proposta:', error);
      setErrorMessage(error?.message || 'Erro ao submeter a proposta. Por favor, tente novamente.');
      setErrorAlert(true);
    } finally {
      setUploading(false);
    }
  };

  if (hasProposal) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          px: 2,
        }}
      >
        <Card
          sx={{
            width: '100%',
            maxWidth: isMobile ? '100%' : '600px',
            p: 3,
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            borderRadius: 2,
          }}
        >
          <CardContent>
            <Typography
              variant="h5"
              align="center"
              gutterBottom
              sx={{
                fontWeight: 'bold',
                color: 'primary.main',
                mb: 3,
              }}
            >
              Proposta Enviada com Sucesso!
            </Typography>
            
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                mb: 3,
              }}
            >
              <img
                src="/success-icon.svg"
                alt="Success"
                style={{ width: 80, height: 80 }}
              />
            </Box>
            
            <Typography
              variant="body1"
              align="center"
              color="text.secondary"
              sx={{ mb: 3, lineHeight: 1.6 }}
            >
              Agradecemos o seu interesse e a proposta enviada para o nosso pedido de cotação.
              <br />
              Sua proposta está em fase de análise e você será notificado assim que houver uma atualização.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate(`/cotacao/${id}`)}
                sx={{
                  px: 4,
                  py: 1.5,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1rem',
                }}
              >
                Retornar
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        p: isMobile ? 2 : 4,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: isMobile ? '100%' : '800px',
          p: isMobile ? 2 : 4,
          borderRadius: 2,
        }}
      >
        <BackButton 
          onClick={() => navigate(-1)}
          sx={{ 
            mb: 3,
            '&:hover': {
              backgroundColor: 'action.hover',
            }
          }} 
        />
        
        <Typography
          variant="h4"
          align="center"
          gutterBottom
          sx={{
            fontSize: isMobile ? '1.5rem' : '2rem',
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 4,
          }}
        >
          Enviar Proposta para Cotação
        </Typography>

        <form onSubmit={handleSubmitProposal}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', mb: 1 }}>
              Descrição da Proposta *
            </Typography>
            <Paper variant="outlined" sx={{ borderRadius: 1 }}>
              <ReactQuill
                value={description}
                onChange={setDescription}
                placeholder="Descreva sua proposta detalhadamente..."
                modules={{
                  toolbar: [
                    [{ header: [1, 2, false] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['link', 'image'],
                    ['clean'],
                  ],
                }}
                formats={[
                  'header',
                  'bold',
                  'italic',
                  'underline',
                  'strike',
                  'list',
                  'bullet',
                  'link',
                  'image'
                ]}
                style={{
                  height: isMobile ? '200px' : '250px',
                  border: 'none',
                }}
              />
            </Paper>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', mb: 1 }}>
              Produtos Relacionados
            </Typography>
            <Autocomplete
              multiple
              options={products}
              getOptionLabel={(option) => option.name}
              value={selectedProducts}
              onChange={(event, newValue) => setSelectedProducts(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Selecione produtos da sua loja"
                  variant="outlined"
                  fullWidth
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.name}
                    size="small"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))
              }
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', mb: 1 }}>
              Anexar Documento (Opcional)
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{
                py: 2,
                borderStyle: 'dashed',
                '&:hover': {
                  borderStyle: 'dashed',
                  backgroundColor: 'action.hover',
                }
              }}
            >
              <Box sx={{ textAlign: 'center', width: '100%' }}>
                {anexo ? (
                  <Typography variant="body2">{anexo.name}</Typography>
                ) : (
                  <>
                    <Typography variant="body1" sx={{ mb: 0.5 }}>
                      Clique para selecionar um arquivo
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Formatos suportados: PDF, DOC, XLS, JPG, PNG
                    </Typography>
                  </>
                )}
                <input hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png" type="file" onChange={handleAnexoChange} />
              </Box>
            </Button>
            {anexo && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Button
                  size="small"
                  color="error"
                  onClick={() => setAnexo(null)}
                  sx={{ textTransform: 'none' }}
                >
                  Remover arquivo
                </Button>
              </Box>
            )}
          </Box>

          {uploadProgress > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" display="block" gutterBottom>
                Enviando arquivo: {Math.round(uploadProgress)}%
              </Typography>
              <LinearProgress variant="determinate" value={uploadProgress} />
            </Box>
          )}

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={uploading}
            size="large"
            sx={{
              py: 2,
              borderRadius: 1,
              fontSize: '1rem',
              fontWeight: 'medium',
              mt: 2,
              '&:hover': {
                boxShadow: 2,
              }
            }}
          >
            {uploading ? (
              <>
                <CircularProgress size={24} color="inherit" sx={{ mr: 2 }} />
                Enviando...
              </>
            ) : (
              'Enviar Proposta'
            )}
          </Button>

          <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.secondary', textAlign: 'center' }}>
            * Campos obrigatórios
          </Typography>
        </form>
      </Paper>

      <Snackbar
        open={successAlert}
        autoHideDuration={6000}
        onClose={() => setSuccessAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccessAlert(false)} severity="success" sx={{ width: '100%' }}>
          Proposta enviada com sucesso!
        </Alert>
      </Snackbar>

      <Snackbar
        open={errorAlert}
        autoHideDuration={6000}
        onClose={() => setErrorAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setErrorAlert(false)} severity="error" sx={{ width: '100%' }}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EnviarPropostaDesk;
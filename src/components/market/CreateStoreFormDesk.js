import React, { useState } from 'react';
import { ref as dbRef, set } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../fb';
import {
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
  Alert,
  IconButton,
  FormControlLabel,
  Checkbox,
  FormGroup,
  Tooltip,
  LinearProgress,
  Paper,
  Avatar,
  Divider,
  Stack,
  Chip,
  InputAdornment,
  useMediaQuery,
  useTheme,
  Fade,
  Zoom
} from '@mui/material';
import { 
  PhotoCamera, 
  Info, 
  Storefront, 
  Payment, 
  CheckCircle,
  Upload,
  Business,
  Description,
  LocationOn,
  AttachMoney,
  Warning,
  ArrowForward
} from '@mui/icons-material';

/* ── Design Tokens (mesmos da hero) ───────────────────────────────────── */
const T = {
  navy:     '#08192E',
  navyMid:  '#0E2849',
  navyLight:'#183A63',
  gold:     '#C8903A',
  goldLight:'#E8B96A',
  goldPale: '#FDF3E3',
  cream:    '#FAFAF7',
  white:    '#FFFFFF',
  text:     '#0F1C2D',
  textMid:  '#3D5A7A',
  textSub:  '#6B89A5',
  border:   '#E0E8F0',
  borderMid:'#C5D4E3',
  surface:  '#F4F7FB',
  success:  '#10b981',
  warning:  '#f59e0b',
  error:    '#ef4444',
};

/* ── Keyframes (mesmos da hero) ───────────────────────────────────────── */
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes pulse-gold {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.8; transform: scale(0.98); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  .animate-fade-up {
    animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) both;
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease both;
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  .animate-pulse-gold {
    animation: pulse-gold 2s ease-in-out infinite;
  }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.22s; }
  .delay-3 { animation-delay: 0.34s; }
  .delay-4 { animation-delay: 0.46s; }
  .delay-5 { animation-delay: 0.58s; }
  
  .form-card {
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .form-card:hover {
    transform: translateY(-2px);
    border-color: ${T.gold} !important;
    box-shadow: 0 16px 48px rgba(8,25,46,0.1) !important;
  }
  .upload-area {
    transition: all 0.2s ease;
  }
  .upload-area:hover {
    border-color: ${T.gold} !important;
    background: ${T.goldPale};
  }
`;

const CreateStoreFormDesk = ({ storeId, planPrice = 800, user }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [store, setStore] = useState({
    name: '',
    description: '',
    company: {
      nome: user?.nome || '',
      provincia: user?.provincia || '',
      distrito: user?.distrito || '',
      logo: user?.logoUrl || '',
      id: user?.id || '',
      paysIVA: false,
    },
  });
  const [logoFile, setLogoFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setStore({ ...store, [name]: value });
  };

  const handleCompanyInputChange = (e) => {
    const { name, value } = e.target;
    setStore({
      ...store,
      company: {
        ...store.company,
        [name]: value
      }
    });
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setStore({
      ...store,
      company: {
        ...store.company,
        [name]: checked
      }
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setStore({
        ...store,
        company: {
          ...store.company,
          logo: URL.createObjectURL(file),
        },
      });
    }
  };

  const handlePayment = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setProgress(50);
      return true;
    } catch (error) {
      setError('A transação falhou. Por favor, tente novamente.');
      console.error('Erro no pagamento:', error.message);
      return false;
    }
  };

  const createStore = async () => {
    setIsLoading(true);
    setProgress(0);
    setError(null);
    setStep(2);

    if (!user) {
      setError('Usuário não definido. Não é possível criar a loja.');
      setIsLoading(false);
      return;
    }

    if (!storeId) {
      setError('ID da loja não definido. Não é possível criar a loja.');
      setIsLoading(false);
      return;
    }

    try {
      setProgress(10);
      const paymentSuccessful = await handlePayment();

      if (!paymentSuccessful) {
        setProgress(0);
        return;
      }

      let logoUrl = store.company.logo;
      if (logoFile) {
        setProgress(30);
        const logoStorageRef = storageRef(storage, `store-logos/${storeId}/${logoFile.name}`);
        const uploadTask = uploadBytes(logoStorageRef, logoFile);

        uploadTask.then(async (snapshot) => {
          setProgress(60);
          logoUrl = await getDownloadURL(snapshot.ref);

          setProgress(80);
          const storeRef = dbRef(db, `stores/${storeId}`);
          await set(storeRef, {
            ...store,
            company: {
              ...store.company,
              logo: logoUrl,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });

          setProgress(100);
          setStep(3);
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }).catch(error => {
          setError('Erro ao fazer upload do logo.');
          console.error('Erro no upload:', error);
        });
      } else {
        setProgress(60);
        const storeRef = dbRef(db, `stores/${storeId}`);
        await set(storeRef, {
          ...store,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });

        setProgress(100);
        setStep(3);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      setError('Erro ao criar a loja. Por favor, tente novamente.');
      console.error('Erro:', error);
    } finally {
      if (error) {
        setIsLoading(false);
        setProgress(0);
      }
    }
  };

  return (
    <Fade in={true} timeout={500}>
      <Box
        sx={{
          maxWidth: '600px',
          margin: '0 auto',
          py: 4
        }}
      >
        <style>{KEYFRAMES}</style>

        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: T.gold,
              color: T.white,
              mx: 'auto',
              mb: 2,
              border: `2px solid ${T.white}`,
              boxShadow: '0 8px 24px rgba(200,144,58,0.2)',
            }}
          >
            <Storefront sx={{ fontSize: 32 }} />
          </Avatar>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: T.text,
              fontFamily: '"Playfair Display", serif',
              mb: 1
            }}
          >
            Criar Minha Loja
          </Typography>
          <Typography sx={{ color: T.textSub, fontSize: '0.9rem' }}>
            Comece a vender seus produtos e serviços online
          </Typography>
        </Box>

        {/* Alert de preço */}
        <Paper
          className="animate-fade-up delay-1"
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '16px',
            border: `1px solid ${T.border}`,
            background: `linear-gradient(135deg, ${T.goldPale} 0%, ${T.white} 100%)`,
          }}
        >
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
            <AttachMoney sx={{ color: T.gold, fontSize: 32 }} />
            <Box>
              <Typography sx={{ fontWeight: 600, color: T.text, mb: 0.5 }}>
                Subscrição única de <strong style={{ color: T.gold }}>{planPrice} MT</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: T.textSub }}>
                Este valor é pago apenas uma vez e garante acesso vitalício à sua loja online,
                incluindo gestão de produtos, pedidos e muito mais.
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Progress Steps */}
        <Box sx={{ mb: 4, position: 'relative' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            {[
              { step: 1, label: 'Dados da Loja', icon: <Business sx={{ fontSize: 16 }} /> },
              { step: 2, label: 'Pagamento', icon: <Payment sx={{ fontSize: 16 }} /> },
              { step: 3, label: 'Confirmação', icon: <CheckCircle sx={{ fontSize: 16 }} /> },
            ].map((item) => (
              <Box key={item.step} sx={{ textAlign: 'center', flex: 1 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: step >= item.step ? T.gold : T.borderMid,
                    color: T.white,
                    mx: 'auto',
                    mb: 1,
                    fontSize: '0.8rem',
                  }}
                >
                  {step > item.step ? <CheckCircle sx={{ fontSize: 16 }} /> : item.step}
                </Avatar>
                <Typography
                  variant="caption"
                  sx={{
                    color: step >= item.step ? T.gold : T.textSub,
                    fontWeight: step >= item.step ? 600 : 400,
                    display: { xs: 'none', sm: 'block' }
                  }}
                >
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
          <LinearProgress
            variant="determinate"
            value={(step / 3) * 100}
            sx={{
              height: 4,
              borderRadius: 2,
              bgcolor: T.border,
              '& .MuiLinearProgress-bar': {
                bgcolor: T.gold,
                borderRadius: 2,
              },
            }}
          />
        </Box>

        {/* Formulário */}
        <Paper
          className="form-card"
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: '24px',
            border: `1px solid ${T.border}`,
            background: T.white,
          }}
        >
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: '12px',
                '& .MuiAlert-icon': { color: T.error }
              }}
              onClose={() => setError(null)}
            >
              {error}
            </Alert>
          )}

          {isLoading && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ color: T.textSub }}>
                  Processando...
                </Typography>
                <Typography variant="body2" sx={{ color: T.gold, fontWeight: 600 }}>
                  {progress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  bgcolor: T.border,
                  '& .MuiLinearProgress-bar': {
                    bgcolor: T.gold,
                    borderRadius: 3,
                  },
                }}
              />
            </Box>
          )}

          {step === 1 && (
            <Zoom in={true}>
              <Box>
              <TextField
  fullWidth
  name="name"
  label="Nome da Loja"
  variant="outlined"
  value={store.name}
  onChange={handleInputChange}
  required
  disabled={isLoading}
  InputProps={{
    startAdornment: (
      <InputAdornment position="start">
        <Storefront sx={{ color: T.gold }} />
      </InputAdornment>
    ),
  }}
  InputLabelProps={{ sx: { color: T.textSub } }}
  sx={{
    mb: 3,
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      '&:hover fieldset': { borderColor: T.gold },
      '&.Mui-focused fieldset': {
        borderColor: T.gold,
        borderWidth: '2px',
      },
    },
  }}
/>

            <TextField
              fullWidth
              name="description"
              label="Descrição da Loja"
              variant="outlined"
              value={store.description}
              onChange={handleInputChange}
              multiline
              rows={3}
              disabled={isLoading}
              placeholder="Conte um pouco sobre sua loja, os produtos que oferece e sua missão..."
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Description sx={{ color: T.gold }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 3,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '&:hover fieldset': { borderColor: T.gold },
                  '&.Mui-focused fieldset': {
                    borderColor: T.gold,
                    borderWidth: '2px',
                  },
                },
              }}
            />
                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: T.text, mb: 2 }}>
                  Informações da Empresa
                </Typography>

                <TextField
                  fullWidth
                  name="nome"
                  label="Nome da Empresa"
                  variant="outlined"
                  value={store.company.nome}
                  onChange={handleCompanyInputChange}
                  sx={{ mb: 2 }}
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Business sx={{ color: T.gold }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  fullWidth
                  name="provincia"
                  label="Província"
                  variant="outlined"
                  value={store.company.provincia}
                  onChange={handleCompanyInputChange}
                  sx={{ mb: 2 }}
                  disabled
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationOn sx={{ color: T.gold }} />
                      </InputAdornment>
                    ),
                  }}
                />

                <FormGroup sx={{ mb: 3 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={store.company.paysIVA}
                        onChange={handleCheckboxChange}
                        name="paysIVA"
                        disabled={isLoading}
                        sx={{
                          color: T.gold,
                          '&.Mui-checked': { color: T.gold },
                        }}
                      />
                    }
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: T.text }}>
                          Esta loja paga IVA
                        </Typography>
                        <Tooltip title="Esta informação não poderá ser alterada posteriormente">
                          <Info sx={{ fontSize: 16, color: T.textSub, ml: 1 }} />
                        </Tooltip>
                      </Box>
                    }
                  />
                </FormGroup>

                {/* Upload de Logo */}
                <Box
                  className="upload-area"
                  sx={{
                    border: `2px dashed ${store.company.logo ? T.gold : T.borderMid}`,
                    borderRadius: '16px',
                    p: 3,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    bgcolor: store.company.logo ? T.goldPale : T.surface,
                    mb: 3,
                  }}
                  onClick={() => document.getElementById('logo-upload').click()}
                >
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleLogoChange}
                    disabled={isLoading}
                  />
                  {store.company.logo ? (
                    <Box>
                      <Avatar
                        src={store.company.logo}
                        alt="Logo Preview"
                        sx={{
                          width: 80,
                          height: 80,
                          mx: 'auto',
                          mb: 2,
                          border: `2px solid ${T.gold}`,
                        }}
                      />
                      <Typography variant="body2" sx={{ color: T.gold, fontWeight: 500 }}>
                        Logotipo carregado
                      </Typography>
                      <Typography variant="caption" sx={{ color: T.textSub }}>
                        Clique para alterar
                      </Typography>
                    </Box>
                  ) : (
                    <Box>
                      <Upload sx={{ fontSize: 48, color: T.borderMid, mb: 1 }} />
                      <Typography variant="body2" sx={{ color: T.textSub, mb: 0.5 }}>
                        Clique para fazer upload do logotipo
                      </Typography>
                      <Typography variant="caption" sx={{ color: T.textSub }}>
                        Formatos aceitos: PNG, JPG, WEBP (máx. 5MB)
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => createStore()}
                  disabled={isLoading || !store.name}
                  endIcon={<ArrowForward />}
                  sx={{
                    bgcolor: T.gold,
                    color: T.white,
                    '&:hover': { bgcolor: T.goldLight },
                    borderRadius: '12px',
                    py: 1.5,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                  }}
                >
                  {isLoading ? `Processando...` : 'Continuar para Pagamento'}
                </Button>
              </Box>
            </Zoom>
          )}

          {step === 2 && (
            <Zoom in={true}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: T.goldPale,
                    color: T.gold,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <Payment sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, color: T.text, mb: 1 }}>
                  Processando Pagamento
                </Typography>
                <Typography sx={{ color: T.textSub, mb: 3 }}>
                  Aguarde enquanto processamos seu pagamento de <strong>{planPrice} MT</strong>
                </Typography>
                <CircularProgress size={48} sx={{ color: T.gold }} />
              </Box>
            </Zoom>
          )}

          {step === 3 && (
            <Zoom in={true}>
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    bgcolor: T.success,
                    color: T.white,
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <CheckCircle sx={{ fontSize: 40 }} />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, color: T.text, mb: 1 }}>
                  Loja Criada com Sucesso!
                </Typography>
                <Typography sx={{ color: T.textSub, mb: 3 }}>
                  Sua loja está pronta para começar a vender. Redirecionando...
                </Typography>
                <CircularProgress size={32} sx={{ color: T.gold }} />
              </Box>
            </Zoom>
          )}
        </Paper>

        {/* Informações adicionais */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="caption" sx={{ color: T.textSub, display: 'block' }}>
            Ao criar sua loja, você concorda com nossos Termos de Serviço e Política de Privacidade.
          </Typography>
          <Typography variant="caption" sx={{ color: T.textSub, mt: 1, display: 'block' }}>
            Precisa de ajuda? <span style={{ color: T.gold, cursor: 'pointer' }}>Contacte o suporte</span>
          </Typography>
        </Box>
      </Box>
    </Fade>
  );
};

export default CreateStoreFormDesk;
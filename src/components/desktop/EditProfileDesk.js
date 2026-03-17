import { useState, useEffect } from 'react';
import { ref, update } from 'firebase/database';
import { db } from '../../fb';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { 
  Tabs, 
  Tab, 
  Box, 
  Button, 
  IconButton, 
  TextField, 
  InputAdornment, 
  useMediaQuery, 
  Typography,
  Paper,
  Container,
  Divider,
  Chip,
  Card,
  CardContent,
  Fade,
  Zoom
} from '@mui/material';
import { EditorText } from '../../utils/formUtils';
import ChangePassword from '../password/ChangePassword';
import DadosBancarios from '../DadosBancarios';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import YouTubeIcon from '@mui/icons-material/YouTube';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import XIcon from '@mui/icons-material/X';
import LanguageIcon from '@mui/icons-material/Language';
import PostInputFileDesk from './PostInputFileDesk';
import BackButton from '../BackButton';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  Save, 
  Edit, 
  Lock, 
  CreditCard, 
  Share, 
  Store, 
  Info, 
  MapPin, 
  Phone, 
  FileText,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react';

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
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.85); }
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
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.22s; }
  .delay-3 { animation-delay: 0.34s; }
  .delay-4 { animation-delay: 0.46s; }
  .delay-5 { animation-delay: 0.58s; }
  .delay-6 { animation-delay: 0.70s; }
  
  .edit-card {
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .edit-card:hover {
    transform: translateY(-2px);
    border-color: ${T.gold} !important;
    box-shadow: 0 16px 48px rgba(8,25,46,0.1) !important;
  }
  .tab-indicator {
    background: ${T.gold} !important;
    height: 3px !important;
  }
  .social-input:hover {
    border-color: ${T.gold} !important;
  }
`;

const InputField = ({ label, name, value, onChange, type = "text", disabled = false, endAdornment, placeholder, icon }) => (
  <div className="mb-4 animate-fade-up">
    <TextField
      label={label}
      name={name}
      value={value || ''}
      onChange={onChange}
      type={type}
      disabled={disabled}
      fullWidth
      variant="outlined"
      placeholder={placeholder}
      InputProps={{
        startAdornment: icon ? (
          <InputAdornment position="start">
            {icon}
          </InputAdornment>
        ) : null,
        endAdornment: endAdornment ? (
          <InputAdornment position="end">
            {endAdornment}
          </InputAdornment>
        ) : null,
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '12px',
          backgroundColor: T.white,
          transition: 'all 0.2s ease',
          '&:hover fieldset': {
            borderColor: T.gold,
          },
          '&.Mui-focused fieldset': {
            borderColor: T.gold,
            borderWidth: '2px',
          },
        },
        '& .MuiInputLabel-root': {
          color: T.textSub,
          '&.Mui-focused': {
            color: T.gold,
          },
        },
      }}
    />
  </div>
);

const SocialMediaForm = ({ formData, handleInputChange, handleSubmit }) => (
  <Fade in={true}>
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputField 
        label="Facebook" 
        name="facebook" 
        value={formData.facebook} 
        onChange={handleInputChange} 
        placeholder="https://facebook.com/sua-empresa"
        icon={<FacebookIcon sx={{ color: '#1877F2' }} />}
      />
      <InputField 
        label="WhatsApp" 
        name="whatsapp" 
        value={formData.whatsapp} 
        onChange={handleInputChange}
        placeholder="https://wa.me/258XXXXXXXXX"
        icon={<WhatsAppIcon sx={{ color: '#25D366' }} />}
      />
      <InputField 
        label="Instagram" 
        name="instagram" 
        value={formData.instagram} 
        onChange={handleInputChange} 
        placeholder="https://instagram.com/sua-empresa"
        icon={<InstagramIcon sx={{ color: '#C13584' }} />}
      />
      <InputField 
        label="LinkedIn" 
        name="linkedin" 
        value={formData.linkedin} 
        onChange={handleInputChange} 
        placeholder="https://linkedin.com/company/sua-empresa"
        icon={<LinkedInIcon sx={{ color: '#0077b5' }} />}
      />
      <InputField 
        label="X (Twitter)" 
        name="x" 
        value={formData.x} 
        onChange={handleInputChange} 
        placeholder="https://twitter.com/sua-empresa"
        icon={<XIcon sx={{ color: '#000000' }} />}
      />
      <InputField
        label="Website"
        name="website"
        value={formData.website}
        onChange={handleInputChange}
        placeholder="https://sua-empresa.com"
        icon={<LanguageIcon sx={{ color: '#4285F4' }} />}
      />
      <InputField
        label="YouTube Video"
        name="youtubeVideo"
        value={formData.youtubeVideo}
        onChange={handleInputChange}
        placeholder="https://youtube.com/watch?v=SEU_VIDEO_ID"
        icon={<YouTubeIcon sx={{ color: '#FF0000' }} />}
        endAdornment={
          formData.youtubeVideo ? (
            <IconButton
              size="small"
              onClick={() => window.open(formData.youtubeVideo, '_blank')}
              sx={{ color: T.gold }}
            >
              <Eye fontSize="small" />
            </IconButton>
          ) : null
        }
      />
      <Typography variant="caption" sx={{ color: T.textSub, display: 'block', mt: -2, mb: 2, fontSize: '0.75rem' }}>
        Cole o link completo do vídeo do YouTube que deseja destacar
      </Typography>
      
      <Button 
        type="submit" 
        variant="contained" 
        fullWidth
        startIcon={<Save size={18} />}
        sx={{
          bgcolor: T.gold,
          color: T.white,
          '&:hover': { bgcolor: T.goldLight },
          borderRadius: '12px',
          py: 1.5,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
          mt: 2
        }}
      >
        Salvar Redes Sociais
      </Button>
    </form>
  </Fade>
);

const EditProfileDesk = ({ user }) => {

  // Estado inicial com tratamento adequado
  const getInitialData = () => {
    if (!user) return {};
    
    return {
      // Dados básicos
      nome: user.nome || user.companyName || '',
      sigla: user.sigla || '',
      bio: user.bio || '',
      contacto: user.contacto || '',
      endereco: user.endereco || '',
      capacidadeDeProducao: user.capacidadeDeProducao || '',
      provincia: user.provincia || user.provinciaTemp || '',
      missaoVisaoValores: user.missaoVisaoValores || '',
      
      // Redes sociais - tratamento correto
      facebook: user.social?.facebook || '',
      whatsapp: user.social?.whatsapp || '',
      instagram: user.social?.instagram || '',
      linkedin: user.social?.linkedin || '',
      x: user.social?.x || '',
      website: user.social?.website || '',
      youtubeVideo: user.social?.youtubeVideo || '',
    };
  };

  const [formData, setFormData] = useState(getInitialData);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [tabIndex, setTabIndex] = useState(0);
  const [bioLength, setBioLength] = useState(0);
  const isMobile = useMediaQuery('(max-width:600px)');
  const isTablet = useMediaQuery('(max-width:960px)');

  // Atualizar formData quando user mudar
  useEffect(() => {
    setFormData(getInitialData());
  }, [user]);

  // Atualizar bioLength quando bio mudar
  useEffect(() => {
    if (formData.bio) {
      const plainText = formData.bio.replace(/<[^>]*>/g, '');
      setBioLength(plainText.length);
    } else {
      setBioLength(0);
    }
  }, [formData.bio]);

  const bioModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'list': 'bullet' }],
      ['link'],
      ['clean']
    ],
  };

  const bioFormats = [
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link'
  ];

  const MAX_BIO_LENGTH = 300;

  const handleBioChange = (content) => {
    const plainText = content.replace(/<[^>]*>/g, '');
    
    if (plainText.length <= MAX_BIO_LENGTH) {
      setFormData(prev => ({ ...prev, bio: content }));
      setBioLength(plainText.length);
    }
  };

  const handleTabChange = (event, newValue) => setTabIndex(newValue);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditorChange = (content) => {
    setFormData((prev) => ({ ...prev, missaoVisaoValores: content }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.id) {
      setSnackbar({ open: true, message: 'Erro: Usuário não encontrado.', severity: 'error' });
      return;
    }

    // Preparar dados para atualização
    const companyUpdate = {
      // Dados básicos
      nome: formData.nome || '',
      sigla: formData.sigla || '',
      bio: formData.bio || '',
      contacto: formData.contacto || '',
      endereco: formData.endereco || '',
      capacidadeDeProducao: formData.capacidadeDeProducao || '',
      provincia: formData.provincia || '',
      missaoVisaoValores: formData.missaoVisaoValores || '',
      
      // Redes sociais - garantir estrutura correta
      social: {
        facebook: formData.facebook || '',
        whatsapp: formData.whatsapp || '',
        instagram: formData.instagram || '',
        linkedin: formData.linkedin || '',
        x: formData.x || '',
        website: formData.website || '',
        youtubeVideo: formData.youtubeVideo || '',
      },
    };

    try {
      await update(ref(db, `company/${user.id}`), companyUpdate);
      setSnackbar({ open: true, message: 'Dados atualizados com sucesso!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao atualizar os dados.', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  // Função para extrair o ID do vídeo do YouTube para preview (opcional)
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? match[1] : null;
  };

  const youtubeVideoId = getYouTubeVideoId(formData.youtubeVideo);

  if (!user) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          background: T.cream,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontFamily: '"Plus Jakarta Sans", sans-serif'
        }}
      >
        <style>{KEYFRAMES}</style>
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 48, height: 48,
              borderRadius: '50%',
              border: `3px solid ${T.border}`,
              borderTopColor: T.gold,
              animation: 'fadeUp 0.8s infinite linear',
              mx: 'auto',
              mb: 2
            }}
          />
          <Typography sx={{ color: T.textSub }}>Carregando editor de perfil...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        backgroundColor: T.cream, 
        minHeight: '100vh',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        py: 4
      }}
    >
      <style>{KEYFRAMES}</style>
      
      <Container maxWidth="lg">
        {/* Header com design da hero */}
        <Paper
          className="animate-fade-up"
          sx={{
            background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyLight} 100%)`,
            borderRadius: '24px',
            p: { xs: 3, md: 4 },
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background decorations (mesmos da hero) */}
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 80% 60% at 90% 10%, rgba(200,144,58,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 50% 50% at 5% 90%, rgba(200,144,58,0.07) 0%, transparent 50%)
            `,
          }} />
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.035,
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
          }} />

          <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
            <BackButton sx={{ color: T.white }} />
            <Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 800, 
                  color: T.white,
                  fontFamily: '"Playfair Display", serif',
                  mb: 1
                }}
              >
                Editar Perfil
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Gerencie as informações da sua empresa
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Tabs com estilo refinado */}
        <Paper
          className="animate-fade-up delay-1"
          sx={{
            borderRadius: '20px',
            border: `1px solid ${T.border}`,
            background: T.white,
            overflow: 'hidden',
            mb: 3
          }}
        >
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            variant={isMobile ? "scrollable" : "fullWidth"}
            scrollButtons="auto"
            TabIndicatorProps={{
              sx: {
                background: T.gold,
                height: 3,
              }
            }}
            sx={{
              bgcolor: T.surface,
              borderBottom: `1px solid ${T.border}`,
              '& .MuiTab-root': {
                color: T.textSub,
                fontWeight: 600,
                fontSize: '0.9rem',
                textTransform: 'none',
                py: 2,
                '&.Mui-selected': {
                  color: T.gold,
                },
              },
            }}
          >
            <Tab icon={<Edit size={18} />} iconPosition="start" label="Editar Perfil" />
            <Tab icon={<Lock size={18} />} iconPosition="start" label="Mudar Senha" />
            <Tab icon={<CreditCard size={18} />} iconPosition="start" label="Dados Bancários" />
            <Tab icon={<Share size={18} />} iconPosition="start" label="Redes Sociais" />
            <Tab icon={<Store size={18} />} iconPosition="start" label="Vitrine" />
          </Tabs>

          <Box sx={{ p: { xs: 2, md: 4 } }}>
            {tabIndex === 0 && (
              <Fade in={true}>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <InputField 
                    label="Nome da Empresa" 
                    name="nome" 
                    value={formData.nome} 
                    onChange={handleInputChange}
                    icon={<Info size={18} color={T.gold} />}
                  />
                  
                  <InputField 
                    label="Sigla" 
                    name="sigla" 
                    value={formData.sigla} 
                    onChange={handleInputChange}
                    icon={<FileText size={18} color={T.gold} />}
                  />
                  
                  <div className="mb-4">
                    <Typography variant="body2" sx={{ color: T.textSub, mb: 1, fontWeight: 500 }}>
                      Bio (máximo {MAX_BIO_LENGTH} caracteres) 
                      <Chip 
                        label={`${bioLength}/${MAX_BIO_LENGTH}`}
                        size="small"
                        sx={{ 
                          ml: 1,
                          bgcolor: bioLength >= MAX_BIO_LENGTH ? '#FEE2E2' : T.goldPale,
                          color: bioLength >= MAX_BIO_LENGTH ? '#DC2626' : T.gold,
                          fontWeight: 600,
                        }}
                      />
                    </Typography>
                    <Paper sx={{ 
                      border: `1px solid ${T.border}`,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      '& .quill': {
                        '& .ql-toolbar': {
                          borderTop: 'none',
                          borderLeft: 'none',
                          borderRight: 'none',
                          borderBottom: `1px solid ${T.border}`,
                          borderTopLeftRadius: '12px',
                          borderTopRightRadius: '12px',
                        },
                        '& .ql-container': {
                          border: 'none',
                          minHeight: '120px',
                        },
                        '& .ql-editor': {
                          minHeight: '120px',
                          fontFamily: '"Plus Jakarta Sans", sans-serif',
                        }
                      }
                    }}>
                      <ReactQuill
                        value={formData.bio || ''}
                        onChange={handleBioChange}
                        modules={bioModules}
                        formats={bioFormats}
                        placeholder="Escreva uma breve descrição sobre sua empresa..."
                      />
                    </Paper>
                  </div>
                  
                  <InputField 
                    label="Contacto" 
                    name="contacto" 
                    value={formData.contacto} 
                    onChange={handleInputChange}
                    icon={<Phone size={18} color={T.gold} />}
                  />
                  
                  <InputField 
                    label="Endereço" 
                    name="endereco" 
                    value={formData.endereco} 
                    onChange={handleInputChange}
                    icon={<MapPin size={18} color={T.gold} />}
                  />
                  
                  <InputField 
                    label="Província" 
                    name="provincia" 
                    value={formData.provincia} 
                    onChange={handleInputChange}
                    icon={<MapPin size={18} color={T.gold} />}
                  />
                  
                  <InputField
                    label="Capacidade de Produção da actividade Principal"
                    name="capacidadeDeProducao"
                    value={formData.capacidadeDeProducao}
                    onChange={handleInputChange}
                    icon={<Store size={18} color={T.gold} />}
                  />

                  <div className="mb-4">
                    <Typography variant="body2" sx={{ color: T.textSub, mb: 1, fontWeight: 500 }}>
                      Missão, Visão e Valores
                    </Typography>
                    <Paper sx={{ 
                      border: `1px solid ${T.border}`,
                      borderRadius: '12px',
                      overflow: 'hidden',
                    }}>
                      <EditorText 
                        description={formData.missaoVisaoValores || ''} 
                        setDescription={handleEditorChange} 
                      />
                    </Paper>
                  </div>

                  <Button 
                    type="submit" 
                    variant="contained" 
                    fullWidth
                    startIcon={<Save size={18} />}
                    sx={{
                      bgcolor: T.gold,
                      color: T.white,
                      '&:hover': { bgcolor: T.goldLight },
                      borderRadius: '12px',
                      py: 1.8,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '1rem',
                      mt: 3
                    }}
                  >
                    Salvar Alterações
                  </Button>
                </form>
              </Fade>
            )}

            {tabIndex === 1 && (
              <Zoom in={true}>
                <Box>
                  <ChangePassword />
                </Box>
              </Zoom>
            )}
            
            {tabIndex === 2 && (
              <Zoom in={true}>
                <Box>
                  <DadosBancarios user={user} />
                </Box>
              </Zoom>
            )}
            
            {tabIndex === 3 && (
              <Box>
                <SocialMediaForm 
                  formData={formData} 
                  handleInputChange={handleInputChange} 
                  handleSubmit={handleSubmit} 
                />
                
                {/* Preview do vídeo do YouTube (opcional) */}
                {youtubeVideoId && (
                  <Fade in={true}>
                    <Card 
                      className="edit-card"
                      sx={{ 
                        mt: 4, 
                        borderRadius: '20px',
                        border: `1px solid ${T.border}`,
                      }}
                    >
                      <CardContent>
                        <Typography 
                          variant="h6" 
                          gutterBottom
                          sx={{ 
                            fontWeight: 700, 
                            color: T.text,
                            fontFamily: '"Playfair Display", serif',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 2
                          }}
                        >
                          <YouTubeIcon sx={{ color: '#FF0000' }} /> Preview do Vídeo:
                        </Typography>
                        <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                          <iframe
                            src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              border: 'none',
                              borderRadius: '12px'
                            }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title="YouTube video preview"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Fade>
                )}
              </Box>
            )}
            
            {tabIndex === 4 && (
              <Zoom in={true}>
                <Box>
                  <PostInputFileDesk user={user} />
                </Box>
              </Zoom>
            )}
          </Box>
        </Paper>
      </Container>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          icon={snackbar.severity === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          sx={{ 
            width: '100%',
            borderRadius: '12px',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EditProfileDesk;
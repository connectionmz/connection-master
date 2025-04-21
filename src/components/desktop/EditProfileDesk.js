import { useState } from 'react';
import { ref, update } from 'firebase/database';
import { db } from '../../fb';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { Tabs, Tab, Box, Button, IconButton, TextField, InputAdornment, useMediaQuery, Typography } from '@mui/material';
import { EditorText } from '../../utils/formUtils';
import ChangePassword from '../password/ChangePassword';
import DadosBancarios from '../DadosBancarios';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import PostInputFileDesk from './PostInputFileDesk';
import BackButton from '../BackButton';
import ReactQuill from 'react-quill';

const InputField = ({ label, name, value, onChange, type = "text", disabled = false, endAdornment }) => (
  <div className="mb-4">
    <TextField
      label={label}
      name={name}
      value={value}
      onChange={onChange}
      type={type}
      disabled={disabled}
      fullWidth
      variant="outlined"
      InputProps={{
        endAdornment: endAdornment ? (
          <InputAdornment position="end">
            {endAdornment}
          </InputAdornment>
        ) : null,
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          '&:hover fieldset': {
            borderColor: '#1976d2',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#1976d2',
          },
        },
      }}
    />
  </div>
);

const EndAdornmentExample = ({ value }) => (
  <InputField
    label="WhatsApp"
    name="whatsappUrl"
    value={value}
    onChange={() => {}}
    endAdornment={
      <IconButton
        size="small"
        onClick={() => window.open(value, '_blank')}
      >
        <WhatsAppIcon fontSize="small" />
      </IconButton>
    }
  />
);

const SocialMediaForm = ({ formData, handleInputChange, handleSubmit }) => (
  <form onSubmit={handleSubmit} className="space-y-4">
    <InputField label="Facebook" name="facebook" value={formData.facebook} onChange={handleInputChange} />
    <InputField
      label="WhatsApp"
      name="whatsappUrl"
      value={formData.whatsappUrl}
      onChange={handleInputChange} />
    <InputField label="Instagram" name="instagram" value={formData.instagram} onChange={handleInputChange} />
    <InputField label="LinkedIn" name="linkedin" value={formData.linkedin} onChange={handleInputChange} />
    <InputField label="x" name="x" value={formData.x} onChange={handleInputChange} />
    <InputField
      label="Website"
      name="website"
      value={formData.website}
      onChange={handleInputChange}
    />
    <Button type="submit" variant="contained" color="primary" fullWidth>
      Salvar Redes Sociais
    </Button>
  </form>
);

const EditProfileDesk = ({ user }) => {
  const initialData = {
    nome: user?.nome || '',
    sigla: user?.sigla || '',
    bio: user?.bio || '',
    contacto: user?.contacto || '',
    endereco: user?.endereco || '',
    capacidadeDeProducao: user?.capacidadeDeProducao || '',
    provincia: user?.provincia || '',
    missaoVisaoValores: user?.missaoVisaoValores || '',
    facebook: user.social?.facebook || '',
    whatsappUrl: user.social?.whatsapp || `https://wa.me/${user.contacto}`,
    instagram: user.social?.instagram || '',
    linkedin: user.social?.linkedin || '',
    x: user.social?.x || '',
    website: user.social?.website || '',
  };

  const [formData, setFormData] = useState(initialData);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [tabIndex, setTabIndex] = useState(0);
  const [bioLength, setBioLength] = useState(initialData.bio ? initialData.bio.length : 0);
  const isMobile = useMediaQuery('(max-width:600px)');

    // ReactQuill modules configuration
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
      const plainText = content.replace(/<[^>]*>/g, ''); // Remove tags HTML
      setBioLength(plainText.length); // Atualiza sempre o contador
    
      if (plainText.length <= MAX_BIO_LENGTH) {
        setFormData(prev => ({ ...prev, bio: content }));
      }
    };
    

  const handleTabChange = (event, newValue) => setTabIndex(newValue);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'contacto' && { whatsappUrl: `https://wa.me/${value}` }),
    }));
  };

  const handleEditorChange = (content) => {
    setFormData((prev) => ({ ...prev, missaoVisaoValores: content }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const companyUpdate = {
      nome: formData.nome,
      sigla: formData.sigla,
      bio: formData.bio,
      contacto: formData.contacto,
      endereco: formData.endereco,
      capacidadeDeProducao: formData.capacidadeDeProducao, // Campo adicionado
      provincia: formData.provincia,
      missaoVisaoValores: formData.missaoVisaoValores,
      social: {
        facebook: formData.facebook,
        whatsapp: formData.whatsappUrl,
        instagram: formData.instagram,
        linkedin: formData.linkedin,
        x: formData.x,
        website: formData.website,
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

  return (
    <div className={`max-w-4xl mx-auto p-4 bg-white shadow-md rounded ${isMobile ? 'w-full' : ''}`}>
            <BackButton sx={{ mb: 2 }} />

      <Tabs
        value={tabIndex}
        onChange={handleTabChange}
        variant={isMobile ? "scrollable" : "standard"}
        scrollButtons="auto"
      >
        <Tab label="Editar Perfil" />
        <Tab label="Mudar Senha" />
        <Tab label="Dados Bancários" />
        <Tab label="Redes Sociais" />
        <Tab label="Vertrine" />
      </Tabs>

      <Box mt={2}>
        {tabIndex === 0 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField label="Nome" name="nome" value={formData.nome} onChange={handleInputChange} />
            <InputField label="sigla" name="sigla" value={formData.sigla} onChange={handleInputChange} />
            <div className="mb-4">
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Bio (máximo {MAX_BIO_LENGTH} caracteres) - {bioLength}/{MAX_BIO_LENGTH}
              </Typography>
              <ReactQuill
                value={formData.bio}
                onChange={handleBioChange}
                modules={bioModules}
                formats={bioFormats}
                placeholder="Escreva uma breve descrição sobre sua empresa..."
                style={{ minHeight: '120px' }}
              />
              {bioLength >= MAX_BIO_LENGTH && (
                <Typography variant="caption" color="error">
                  Você atingiu o limite máximo de caracteres
                </Typography>
              )}
            </div>         
               <InputField label="Contacto" name="contacto" value={formData.contacto} onChange={handleInputChange} />
            <InputField label="Endereço" name="endereco" value={formData.endereco} onChange={handleInputChange} />
            <InputField label="Província" name="provincia" value={formData.provincia} onChange={handleInputChange} />
            <InputField
              label="Capacidade de Produção da actividade Principal"
              name="capacidadeDeProducao"
              value={formData.capacidadeDeProducao}
              onChange={handleInputChange}
            />

            <div>
              <label className="block font-medium mb-1">Missão, Visão e Valores</label>
              <EditorText description={formData.missaoVisaoValores} setDescription={handleEditorChange} />
            </div>

            <Button type="submit" variant="contained" color="primary" fullWidth>
              Salvar
            </Button>
          </form>
        )}

        {tabIndex === 1 && <ChangePassword />}
        {tabIndex === 2 && <DadosBancarios user={user} />}
        {tabIndex === 3 && <SocialMediaForm formData={formData} handleInputChange={handleInputChange} handleSubmit={handleSubmit} />}
        {tabIndex === 4 && <PostInputFileDesk user={user} />}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default EditProfileDesk;
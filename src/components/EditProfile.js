import { useState } from 'react';
import { ref, update } from 'firebase/database';
import { db } from '../fb';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { EditorText } from '../utils/formUtils';

const EditProfile = ({ user }) => {
  const initialData = {
    nome: user.nome || '',
    bio: user.bio || '',
    contacto: user.contacto || '',
    endereco: user.endereco || '',
    provincia: user.provincia || '',
    missaoVisaoValores: user.missaoVisaoValores || '',
    facebook: user.facebook || '',
    whatsappUrl: user.contacto ? `https://wa.me/${user.contacto}` : '',
    instagram: user.instagram || '',
    linkedin: user.linkedin || '',
    website: user.website || ''
  };
  const [formData, setFormData] = useState(initialData);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'contacto' && { whatsappUrl: `https://wa.me/${value}` }) // Atualiza o WhatsApp URL quando 'contacto' muda
    }));
  };

  const handleEditorChange = (content) => {
    setFormData((prev) => ({ ...prev, missaoVisaoValores: content }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const companyUpdate = {
      nome: formData.nome,
      bio: formData.bio,
      contacto: formData.contacto,
      endereco: formData.endereco,
      provincia: formData.provincia,
      missaoVisaoValores: formData.missaoVisaoValores,
      social: {
        facebook: formData.facebook,
        whatsapp: formData.whatsappUrl, 
        instagram: formData.instagram,
        linkedin: formData.linkedin,
        website: formData.website
      }
    };

    try {
      await update(ref(db, `company/${user.id}`), companyUpdate);
      setSnackbar({ open: true, message: 'Dados atualizados com sucesso', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao atualizar dados', severity: 'error' });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const renderInput = (label, name, type = "text", disabled = false) => (
    <div>
      <label>{label}</label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleInputChange}
        className="border p-2 w-full"
        disabled={disabled}
      />
    </div>
  );

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        {renderInput("Nome", "nome")}
        {renderInput("Bio", "bio")}
        {renderInput("Contacto", "contacto")}
        {renderInput("Endereço", "endereco")}
        {renderInput("Província", "provincia")}

        <div>
          <label>Missão, Visão e Valores</label>
          <EditorText
            description={formData.missaoVisaoValores}
            setDescription={handleEditorChange}
          />
        </div>

        {renderInput("Facebook URL", "facebook")}
        {renderInput("WhatsApp URL", "whatsappUrl", "text", true)}
        {renderInput("Instagram URL", "instagram")}
        {renderInput("LinkedIn URL", "linkedin")}
        {renderInput("Website", "website")}

        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Salvar
        </button>
      </form>

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

export default EditProfile;

import { useState } from 'react';
import { ref, update } from 'firebase/database';
import { db } from '../fb';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import { EditorText } from '../utils/formUtils';

const InputField = ({ label, name, value, onChange, type = "text", disabled = false }) => (
  <div className="mb-4">
    <label className="block font-medium mb-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className={`border p-2 w-full rounded ${disabled ? 'bg-gray-100' : ''}`}
      disabled={disabled}
    />
  </div>
)

const EditProfile = ({ user }) => {

  const initialData = {
    nome: user?.nome || '',
    bio: user?.bio || '',
    contacto: user?.contacto || '',
    endereco: user?.endereco || '',
    provincia: user?.provincia || '',
    missaoVisaoValores: user?.missaoVisaoValores || '',
    facebook: user?.social?.facebook || '',
    whatsappUrl: user?.contacto ? `https://wa.me/${user.contacto}` : '',
    instagram: user?.social?.instagram || '',
    linkedin: user?.social?.linkedin || '',
    website: user?.social?.website || '',
  };

  const [formData, setFormData] = useState(initialData);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

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

  const validateForm = () => {
    if (!formData.nome.trim()) return 'O campo "Nome" é obrigatório.';
    if (!formData.contacto.trim()) return 'O campo "Contacto" é obrigatório.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errorMessage = validateForm();
    if (errorMessage) {
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      return;
    }

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

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  return (
    <div className="max-w-lg mx-auto p-4 bg-white shadow-md rounded">
      <form onSubmit={handleSubmit} className="space-y-4">
        <InputField label="Nome" name="nome" value={formData.nome} onChange={handleInputChange} />
        <InputField label="Bio" name="bio" value={formData.bio} onChange={handleInputChange} />
        <InputField label="Contacto" name="contacto" value={formData.contacto} onChange={handleInputChange} />
        <InputField label="Endereço" name="endereco" value={formData.endereco} onChange={handleInputChange} />
        <InputField label="Província" name="provincia" value={formData.provincia} onChange={handleInputChange} />

        <div>
          <label className="block font-medium mb-1">Missão, Visão e Valores</label>
          <EditorText description={formData.missaoVisaoValores} setDescription={handleEditorChange} />
        </div>

        <InputField label="Facebook URL" name="facebook" value={formData.facebook} onChange={handleInputChange} />
        <InputField label="WhatsApp URL" name="whatsappUrl" value={formData.whatsappUrl} disabled />
        <InputField label="Instagram URL" name="instagram" value={formData.instagram} onChange={handleInputChange} />
        <InputField label="LinkedIn URL" name="linkedin" value={formData.linkedin} onChange={handleInputChange} />
        <InputField label="Website" name="website" value={formData.website} onChange={handleInputChange} />

        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded w-full">
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

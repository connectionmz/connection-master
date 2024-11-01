import { useState } from 'react';
import { ref, update } from 'firebase/database'; // Importa as funções do Firebase
import { db } from '../fb';
import Snackbar from '@mui/material/Snackbar'; // Importação do Snackbar
import Alert from '@mui/material/Alert'; // Importação do Alert
import { EditorText } from '../utils/formUtils';

const EditProfile = ({ user }) => {
  const [formData, setFormData] = useState({
    nome: user.nome || '',
    bio: user.bio || '',
    contacto: user.contacto || '',
    endereco: user.endereco || '',
    provincia: user.provincia || '',
    missaoVisaoValores: user.missaoVisaoValores || '',
    facebookUrl: user.facebook || '',
    whatsappUrl: user.contacto ? `https://wa.me/${user.contacto}` : '',
    instagramUrl: user.instagram || '',
    linkedinUrl: user.linkedin || '',
    website: user.website || ''
  });

  // Estados para o Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
      ...(name === 'contacto' && { whatsappUrl: `https://wa.me/${value}` }) // Atualiza automaticamente o URL do WhatsApp
    }));
  };

  const handleEditorChange = (content) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      missaoVisaoValores: content
    }));
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
        facebook: formData.facebookUrl,
        whatsapp: formData.whatsappUrl,
        instagram: formData.instagramUrl,
        linkedin: formData.linkedinUrl,
        website: formData.website
      }
    };

    try {
      await update(ref(db, `company/${user.id}`), companyUpdate);
      setSnackbarMessage('Dados atualizados com sucesso');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Erro ao atualizar dados');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4 p-4">
        <div>
          <label>Nome</label>
          <input
            type="text"
            name="nome"
            value={formData.nome}
            onChange={handleInputChange}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label>Bio</label>
          <input
            type="text"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label>Contacto</label>
          <input
            type="text"
            name="contacto"
            value={formData.contacto}
            onChange={handleInputChange}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label>Endereço</label>
          <input
            type="text"
            name="endereco"
            value={formData.endereco}
            onChange={handleInputChange}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label>Província</label>
          <input
            type="text"
            name="provincia"
            value={formData.provincia}
            onChange={handleInputChange}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label>Missão, Visão e Valores</label>
          <EditorText
            description={formData.missaoVisaoValores}
            setDescription={handleEditorChange} // Usa a função específica para o EditorText
          />
        </div>

        <div>
          <label>Facebook URL</label>
          <input
            type="text"
            name="facebookUrl"
            value={formData.facebookUrl}
            onChange={handleInputChange}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label>WhatsApp URL</label>
          <input
            type="text"
            name="whatsappUrl"
            value={formData.whatsappUrl}
            onChange={handleInputChange}
            className="border p-2 w-full"
            disabled 
          />
        </div>

        <div>
          <label>Instagram URL</label>
          <input
            type="text"
            name="instagramUrl"
            value={formData.instagramUrl}
            onChange={handleInputChange}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label>LinkedIn URL</label>
          <input
            type="text"
            name="linkedinUrl"
            value={formData.linkedinUrl}
            onChange={handleInputChange}
            className="border p-2 w-full"
          />
        </div>

        <div>
          <label>Website</label>
          <input
            type="text"
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            className="border p-2 w-full"
          />
        </div>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Salvar
        </button>
      </form>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default EditProfile;

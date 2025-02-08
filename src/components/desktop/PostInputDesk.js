import React, { useState, useEffect } from 'react';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Alert, Snackbar, Button, Box, Typography, LinearProgress } from '@mui/material';
import { push, ref, set } from 'firebase/database';
import { db } from '../../fb';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Importar o estilo do Quill

const PostInputDesk = ({ user }) => {
  const [newPhotos, setNewPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState({});
  const [photoDescriptions, setPhotoDescriptions] = useState({});
  const [uploadProgress, setUploadProgress] = useState({}); // Progresso de cada foto
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [allUploadsComplete, setAllUploadsComplete] = useState(false);

  const handleSavePublishedPhotos = () => {
    if (!user || !user.id) {
      console.error('Usuário não definido ou ID do usuário ausente');
      return;
    }

    if (newPhotos.length > 0) {
      const storage = getStorage();
      let completedUploads = 0;

      newPhotos.forEach((photo) => {
        const fileRef = storageRef(storage, `published/${user.id}/${photo.name}`);
        const uploadTask = uploadBytesResumable(fileRef, photo);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress((prevProgress) => ({
              ...prevProgress,
              [photo.name]: progress,
            }));
            setSnackbarOpen(true);
          },
          (error) => {
            console.error('Erro ao carregar foto: ', error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref)
              .then((url) => {
                const description = photoDescriptions[photo.name] || '';
                const newPostRef = push(ref(db, 'posts'));
                const postId = newPostRef.key; // ID único gerado

                const postData = {
                  id: postId,
                  company: {
                    id: user.id,
                    name: user.nome,
                    logo: user.logoUrl,
                    sector: user.sector
                  },
                  description,
                  url,
                  timestamp: Date.now(),
                };

                set(newPostRef, postData)
                  .then(() => {
                    setUploadSuccess(true);
                    completedUploads++;

                    // Verifica se todos os uploads foram concluídos
                    if (completedUploads === newPhotos.length) {
                      setAllUploadsComplete(true);
                    }
                  })
                  .catch((error) => {
                    console.error('Erro ao salvar dados do post no Firebase: ', error);
                  });
              })
              .catch((error) => {
                console.error('Erro ao obter URL da foto: ', error);
              });
          }
        );
      });
    } else {
      console.error('Sem fotos para carregar ou dados do usuário ausentes');
    }
  };

  useEffect(() => {
    if (allUploadsComplete) {
      setSnackbarOpen(true);
      setTimeout(() => {
        window.location.reload(); // Recarrega a página
      }, 3000); // Aguarda 3 segundos antes de recarregar
    }
  }, [allUploadsComplete]);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setNewPhotos(files);

    // Create object URLs for image previews
    const previews = {};
    files.forEach((file) => {
      previews[file.name] = URL.createObjectURL(file);
    });
    setPhotoPreviews(previews);
  };

  const handleDescriptionChange = (value, photoName) => {
    const newDescriptions = { ...photoDescriptions, [photoName]: value };
    setPhotoDescriptions(newDescriptions);
  };

  return (
    <div className="p-4">
      <Box sx={{ width: '100%' }} className="upload-photo space-y-4">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        {newPhotos.length > 0 && (
          <div className="photo-list space-y-6">
            {newPhotos.map((photo, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                {/* Mini Preview */}
                <img
                  src={photoPreviews[photo.name]}
                  alt={photo.name}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-300 shadow-sm"
                />
                {/* Description Input with ReactQuill */}
                <Box sx={{ flex: 1, ml: 2 }}>
                  <Typography variant="body2" color="textSecondary" fontWeight="bold">
                    {photo.name}
                  </Typography>
                  <ReactQuill
                    value={photoDescriptions[photo.name] || ''}
                    onChange={(value) => handleDescriptionChange(value, photo.name)}
                    placeholder="Adicionar descrição"
                    modules={{
                      toolbar: [
                        [{ 'header': '1' }, { 'header': '2' }, { 'font': [] }],
                        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                        ['bold', 'italic', 'underline'],
                        ['link'],
                        [{ 'align': [] }],
                      ],
                    }}
                    style={{ marginTop: 16, height: '150px' }}
                  />
                  {/* Barra de progresso para cada foto */}
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress[photo.name] || 0}
                    sx={{ mt: 2 }}
                  />
                </Box>
              </Box>
            ))}
          </div>
        )}

        <Button
          onClick={handleSavePublishedPhotos}
          variant="contained"
          color="primary"
          sx={{
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 'bold',
            textTransform: 'none',
          }}
        >
          Upload Novas Fotos
        </Button>
      </Box>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={uploadSuccess ? 'success' : 'info'} sx={{ width: '100%' }}>
          {allUploadsComplete ? 'Todas as fotos foram carregadas com sucesso! Recarregando a página...' : `Progresso do upload: ${Math.round(uploadProgress)}%`}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default PostInputDesk;
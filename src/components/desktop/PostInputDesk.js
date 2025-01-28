import React, { useState } from 'react';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Alert, Snackbar } from '@mui/material';
import { push, ref, set } from 'firebase/database';
import { db } from '../../fb';

const PostInputDesk = ({ user }) => {
  const [newPhotos, setNewPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState({});
  const [photoDescriptions, setPhotoDescriptions] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const handleSavePublishedPhotos = () => {
    if (!user || !user.id) {
      console.error('Usuário não definido ou ID do usuário ausente');
      return;
    }
  
    if (newPhotos.length > 0) {
      const storage = getStorage();
  
      newPhotos.forEach((photo) => {
        const fileRef = storageRef(storage, `published/${user.id}/${photo.name}`);
        const uploadTask = uploadBytesResumable(fileRef, photo);
  
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
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
  
                // Log para depuração
                console.log('Carregando post com ID:', postId, 'e Company ID:', user.id);
  
                const postData = {
                  id: postId,
                  company:{
                    id: user.id,
                    name: user.nome,
                    logo: user.logoUrl,
                    sector:user.sector
                  } , 
                  description,
                  url,
                  timestamp: Date.now(),
                };
  
                set(newPostRef, postData)
                  .then(() => {
                    setUploadSuccess(true);
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

  const handleDescriptionChange = (event, photoName) => {
    const newDescriptions = { ...photoDescriptions, [photoName]: event.target.value };
    setPhotoDescriptions(newDescriptions);
  };

  return (
    <div className="p-4">
      <div className="upload-photo space-y-4">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        {newPhotos.length > 0 && (
          <div className="photo-list space-y-6">
            {newPhotos.map((photo, index) => (
              <div key={index} className="flex space-x-4 items-start">
                {/* Mini Preview */}
                <img
                  src={photoPreviews[photo.name]}
                  alt={photo.name}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-300 shadow-sm"
                />
                {/* Description Input */}
                <div className="flex flex-col w-full">
                  <span className="text-gray-600 font-semibold">{photo.name}</span>
                  <input
                    type="text"
                    placeholder="Adicionar descrição"
                    value={photoDescriptions[photo.name] || ''}
                    onChange={(e) => handleDescriptionChange(e, photo.name)}
                    className="block w-full px-3 py-2 mt-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleSavePublishedPhotos}
          className="bg-green-600 text-white py-2 px-4 rounded-lg shadow hover:bg-green-700 transition"
        >
          Upload Novas Fotos
        </button>
      </div>

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={uploadSuccess ? 'success' : 'info'} sx={{ width: '100%' }}>
          {uploadSuccess ? 'Fotos carregadas com sucesso!' : `Progresso do upload: ${Math.round(uploadProgress)}%`}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default PostInputDesk;

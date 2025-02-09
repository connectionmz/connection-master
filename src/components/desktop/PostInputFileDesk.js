import React, { useState, useEffect } from 'react';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Alert, Snackbar, Button, Box, Typography, LinearProgress } from '@mui/material';
import { push, ref, set } from 'firebase/database';
import { db } from '../../fb';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const allowedFileTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

const PostInputFileDesk = ({ user }) => {
  const [newFiles, setNewFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState({});
  const [fileDescriptions, setFileDescriptions] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [allUploadsComplete, setAllUploadsComplete] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSavePublishedFiles = () => {
    if (!user || !user.id) {
      console.error('Usuário não definido ou ID do usuário ausente');
      return;
    }

    if (newFiles.length > 0) {
      setIsUploading(true);
      const storage = getStorage();
      let completedUploads = 0;

      newFiles.forEach((file) => {
        const filePath = `vitrine/${user.id}/${file.name}`;
        const fileRef = storageRef(storage, filePath);
        const uploadTask = uploadBytesResumable(fileRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress((prevProgress) => ({
              ...prevProgress,
              [file.name]: progress,
            }));
            setSnackbarOpen(true);
          },
          (error) => {
            console.error('Erro ao carregar arquivo: ', error);
            setIsUploading(false);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref)
              .then((url) => {
                const description = fileDescriptions[file.name] || '';
                const newPostRef = push(ref(db, `vitrine/${user.id}`));
                const postId = newPostRef.key;

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
                  fileType: file.type,
                  timestamp: Date.now(),
                };

                set(newPostRef, postData)
                  .then(() => {
                    completedUploads++;
                    if (completedUploads === newFiles.length) {
                      setAllUploadsComplete(true);
                      setIsUploading(false);
                    }
                  })
                  .catch((error) => {
                    console.error('Erro ao salvar dados do post no Firebase: ', error);
                    setIsUploading(false);
                  });
              })
              .catch((error) => {
                console.error('Erro ao obter URL do arquivo: ', error);
                setIsUploading(false);
              });
          }
        );
      });
    } else {
      console.error('Sem arquivos para carregar ou dados do usuário ausentes');
    }
  };

  useEffect(() => {
    if (allUploadsComplete) {
      setSnackbarOpen(true);
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    }
  }, [allUploadsComplete]);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter(file => allowedFileTypes.includes(file.type));

    if (validFiles.length !== files.length) {
      setErrorMessage('Alguns arquivos foram rejeitados. Apenas imagens e documentos são permitidos.');
    } else {
      setErrorMessage('');
    }

    setNewFiles(validFiles);

    const previews = {};
    validFiles.forEach((file) => {
      if (file.type.startsWith('image')) {
        previews[file.name] = URL.createObjectURL(file);
      } else {
        previews[file.name] = null;
      }
    });

    setFilePreviews(previews);
  };

  const handleDescriptionChange = (value, fileName) => {
    setFileDescriptions((prev) => ({ ...prev, [fileName]: value }));
  };

  return (
    <div className="p-4">
      <Box sx={{ width: '100%' }} className="upload-file space-y-4">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={isUploading}
          accept=".jpg, .jpeg, .png, .gif, .webp, .pdf, .doc, .docx, .xls, .xlsx"
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />

        {errorMessage && <Alert severity="warning">{errorMessage}</Alert>}

        {newFiles.length > 0 && (
          <div className="file-list space-y-6">
            {newFiles.map((file, index) => (
              <Box key={index} sx={{ display: 'flex', alignItems: 'flex-start' }}>
                {filePreviews[file.name] ? (
                  <img
                    src={filePreviews[file.name]}
                    alt={file.name}
                    className="w-20 h-20 object-cover rounded-lg border border-gray-300 shadow-sm"
                  />
                ) : (
                  <Typography variant="body2" color="textSecondary">
                    📄 {file.name}
                  </Typography>
                )}
                <Box sx={{ flex: 1, ml: 2 }}>
                  <ReactQuill
                    value={fileDescriptions[file.name] || ''}
                    onChange={(value) => handleDescriptionChange(value, file.name)}
                    placeholder="Adicionar descrição"
                    modules={{ toolbar: [['bold', 'italic', 'underline'], ['link']] }}
                    style={{ marginTop: 16, height: '100px' }}
                  />
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress[file.name] || 0}
                    sx={{ mt: 2 }}
                  />
                </Box>
              </Box>
            ))}
          </div>
        )}

        <Button
          onClick={handleSavePublishedFiles}
          variant="contained"
          color="primary"
          disabled={isUploading}
          sx={{ padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', textTransform: 'none' }}
        >
          {isUploading ? 'Carregando...' : 'Upload de Arquivos'}
        </Button>
      </Box>
    </div>
  );
};

export default PostInputFileDesk;

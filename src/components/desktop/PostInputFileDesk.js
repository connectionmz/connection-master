import React, { useState, useEffect } from 'react';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { 
  Alert, 
  Snackbar, 
  Button, 
  Box, 
  Typography, 
  LinearProgress,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Paper,
  IconButton,
  CircularProgress,
  Tooltip
} from '@mui/material';
import { push, ref, set } from 'firebase/database';
import { db } from '../../fb';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';

const allowedFileTypes = [
  'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 
  'application/pdf', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
  'application/vnd.ms-excel', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const fileIcons = {
  'image/jpeg': '🖼️',
  'image/png': '🖼️',
  'image/jpg': '🖼️',
  'image/gif': '🖼️',
  'image/webp': '🖼️',
  'application/pdf': '📄',
  'application/msword': '📝',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
  'application/vnd.ms-excel': '📊',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊'
};

const PostInputFileDesk = ({ user }) => {
  const [files, setFiles] = useState([]);
  const [fileDescriptions, setFileDescriptions] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({}); // 'uploading', 'success', 'error'
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    const validFiles = newFiles.filter(file => allowedFileTypes.includes(file.type));
    
    if (validFiles.length !== newFiles.length) {
      showSnackbar('Alguns arquivos foram rejeitados. Apenas imagens e documentos são permitidos.', 'warning');
    }
    
    // Adiciona os novos arquivos à lista existente
    setFiles(prevFiles => [...prevFiles, ...validFiles]);
    
    // Inicializa descrições para os novos arquivos
    const newDescriptions = {};
    validFiles.forEach(file => {
      newDescriptions[file.name] = fileDescriptions[file.name] || '';
    });
    setFileDescriptions(prev => ({ ...prev, ...newDescriptions }));
  };

  const handleRemoveFile = (fileName) => {
    setFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    setFileDescriptions(prev => {
      const newDescriptions = { ...prev };
      delete newDescriptions[fileName];
      return newDescriptions;
    });
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
  };

  const handleDescriptionChange = (value, fileName) => {
    setFileDescriptions(prev => ({ ...prev, [fileName]: value }));
  };

  const handleUploadFiles = () => {
    if (!user?.id) {
      showSnackbar('Usuário não identificado', 'error');
      return;
    }

    if (files.length === 0) {
      showSnackbar('Nenhum arquivo selecionado para upload', 'warning');
      return;
    }

    setIsUploading(true);
    const storage = getStorage();
    let completedUploads = 0;
    let successfulUploads = 0;

    files.forEach((file) => {
      const filePath = `vitrine/${user.id}/${Date.now()}_${file.name}`;
      const fileRef = storageRef(storage, filePath);
      const uploadTask = uploadBytesResumable(fileRef, file);

      setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
        },
        (error) => {
          console.error('Erro no upload:', error);
          setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
          showSnackbar(`Falha no upload de ${file.name}`, 'error');
          completedUploads++;
          checkAllUploadsComplete(completedUploads, successfulUploads);
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
                fileName: file.name,
                timestamp: Date.now(),
              };

              return set(newPostRef, postData);
            })
            .then(() => {
              setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
              successfulUploads++;
              showSnackbar(`${file.name} enviado com sucesso!`, 'success');
            })
            .catch((error) => {
              console.error('Erro ao salvar dados:', error);
              setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
              showSnackbar(`Erro ao salvar dados de ${file.name}`, 'error');
            })
            .finally(() => {
              completedUploads++;
              checkAllUploadsComplete(completedUploads, successfulUploads);
            });
        }
      );
    });
  };

  const checkAllUploadsComplete = (completed, successful) => {
    if (completed === files.length) {
      setIsUploading(false);
      if (successful > 0) {
        showSnackbar(`${successful} arquivo(s) enviado(s) com sucesso!`, 'success');
      }
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const getFileIcon = (fileType) => {
    return fileIcons[fileType] || '📁';
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Upload de Arquivos
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Button
          component="label"
          variant="contained"
          startIcon={<CloudUploadIcon />}
          disabled={isUploading}
        >
          Selecionar Arquivos
          <input
            type="file"
            multiple
            hidden
            onChange={handleFileChange}
            accept={allowedFileTypes.join(',')}
          />
        </Button>
      </Box>

      {files.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {files.map((file, index) => (
            <Grid item xs={12} key={index}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {file.type.startsWith('image') ? (
                      <CardMedia
                        component="img"
                        sx={{ width: 60, height: 60, mr: 2, objectFit: 'cover' }}
                        image={URL.createObjectURL(file)}
                        alt={file.name}
                      />
                    ) : (
                      <Box sx={{ 
                        width: 60, 
                        height: 60, 
                        mr: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1
                      }}>
                        <Typography variant="h4">
                          {getFileIcon(file.type)}
                        </Typography>
                      </Box>
                    )}
                    
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle1" noWrap>
                        {file.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(file.size / 1024).toFixed(2)} KB
                      </Typography>
                    </Box>
                    
                    <Tooltip title="Remover arquivo">
                      <IconButton 
                        onClick={() => handleRemoveFile(file.name)}
                        disabled={isUploading}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <ReactQuill
                      value={fileDescriptions[file.name] || ''}
                      onChange={(value) => handleDescriptionChange(value, file.name)}
                      placeholder="Adicionar descrição..."
                      modules={{
                        toolbar: [
                          ['bold', 'italic', 'underline'],
                          ['link'],
                          ['clean']
                        ]
                      }}
                      style={{ minHeight: '100px' }}
                    />
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {uploadStatus[file.name] === 'uploading' && (
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                    )}
                    {uploadStatus[file.name] === 'success' && (
                      <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    )}
                    
                    <Box sx={{ width: '100%', ml: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={uploadProgress[file.name] || 0}
                        color={
                          uploadStatus[file.name] === 'success' ? 'success' :
                          uploadStatus[file.name] === 'error' ? 'error' : 'primary'
                        }
                      />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {files.length > 0 && (
        <Button
          onClick={handleUploadFiles}
          variant="contained"
          color="primary"
          disabled={isUploading}
          startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
          sx={{ mt: 2 }}
        >
          {isUploading ? 'Enviando...' : 'Iniciar Upload'}
        </Button>
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default PostInputFileDesk;
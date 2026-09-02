import React, { useEffect, useRef, useState } from 'react';
import { deleteObject, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
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
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AlertTitle
} from '@mui/material';
import { push, ref, set } from 'firebase/database';
import { db, storage } from '../../fb';
import { useLanguage } from '../../context/LanguageContext';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import { Info as InfoIcon, ExpandMore as ExpandIcon } from '@mui/icons-material';

const allowedFileTypes = [
  'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp', 
  'application/pdf', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
  'application/vnd.ms-excel', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

const MAX_FILES = 10;
const MAX_FILE_SIZE_MB = 10;
const plainText = (value = '') => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const safeFileName = (value = 'document') => value.normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);

const ImagePreview = ({ file }) => {
  const [url, setUrl] = useState('');
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return <CardMedia component="img" sx={{ width: 60, height: 60, mr: 2, objectFit: 'cover' }} image={url} alt={file.name} />;
};

const PostInputFileDesk = ({ user }) => {
  const { t } = useLanguage();
  const [files, setFiles] = useState([]);
  const [fileDescriptions, setFileDescriptions] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isUploading, setIsUploading] = useState(false);
  const uploadTasksRef = useRef(new Set());
  const mountedRef = useRef(true);
  const cancelledRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    const uploadTasks = uploadTasksRef.current;
    return () => {
      mountedRef.current = false;
      uploadTasks.forEach((task) => task.cancel());
      uploadTasks.clear();
    };
  }, []);

  const cancelUploads = () => {
    cancelledRef.current = true;
    uploadTasksRef.current.forEach((task) => task.cancel());
    uploadTasksRef.current.clear();
    setIsUploading(false);
    showSnackbar(t('fileUpload.cancelled'), 'info');
  };

  const resetForm = () => {
    setFiles([]);
    setFileDescriptions({});
    setUploadProgress({});
    setUploadStatus({});
  };

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || []);
    event.target.value = '';
    const existingNames = new Set(files.map((file) => file.name));
    const newFiles = selected.filter((file) => !existingNames.has(file.name));
    
    if (files.length + newFiles.length > MAX_FILES) {
      showSnackbar(t('fileUpload.maxFiles', { count: MAX_FILES }), 'warning');
      return;
    }
    
    const validFiles = newFiles.filter(file => {
      const isTypeValid = allowedFileTypes.includes(file.type);
      const isSizeValid = file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
      
      if (!isTypeValid) {
        showSnackbar(t('fileUpload.invalidType', { name: file.name }), 'warning');
      }
      if (!isSizeValid) {
        showSnackbar(t('fileUpload.tooLarge', { size: MAX_FILE_SIZE_MB, name: file.name }), 'warning');
      }
      
      return isTypeValid && isSizeValid;
    });
    
    if (validFiles.length === 0) return;
    
    setFiles(prevFiles => [...prevFiles, ...validFiles]);
    
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
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[fileName];
      return newStatus;
    });
  };

  const handleDescriptionChange = (value, fileName) => {
    setFileDescriptions(prev => ({ ...prev, [fileName]: value }));
  };

  const handleUploadFiles = async () => {
    if (!user?.id) {
      showSnackbar(t('fileUpload.userMissing'), 'error');
      return;
    }

    if (files.length === 0) {
      showSnackbar(t('fileUpload.noneSelected'), 'warning');
      return;
    }

    setIsUploading(true);
    cancelledRef.current = false;
    let completedUploads = 0;
    let successfulUploads = 0;

    const processFile = async (file) => {
      try {
        setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));
        
        const newPostRef = push(ref(db, `vitrine/${user.id}`));
        const filePath = `vitrine/${user.id}/${newPostRef.key}_${safeFileName(file.name)}`;
        const fileRef = storageRef(storage, filePath);
        const uploadTask = uploadBytesResumable(fileRef, file);
        uploadTasksRef.current.add(uploadTask);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              if (!mountedRef.current) return;
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
            },
            (error) => {
              reject(error);
            },
            async () => {
              uploadTasksRef.current.delete(uploadTask);
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                const description = plainText(fileDescriptions[file.name]).slice(0, 2000);
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
                  storagePath: filePath,
                  timestamp: Date.now(),
                };

                try {
                  await set(newPostRef, postData);
                } catch (databaseError) {
                  await deleteObject(fileRef).catch((cleanupError) => console.error('Erro ao limpar upload órfão:', cleanupError));
                  throw databaseError;
                }
                setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
                successfulUploads++;
                resolve();
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      } catch (error) {
        if (error.code === 'storage/canceled') return;
        console.error('Erro no upload:', error);
        setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
        showSnackbar(t('fileUpload.fileError', { name: file.name }), 'error');
      } finally {
        completedUploads++;
        if (completedUploads === files.length) {
          uploadTasksRef.current.clear();
          setIsUploading(false);
          if (cancelledRef.current) return;
          if (successfulUploads > 0) {
            // Limpa o formulário apenas se pelo menos um arquivo foi enviado com sucesso
            if (successfulUploads === files.length) {
              showSnackbar(t('fileUpload.allSuccess', { count: successfulUploads }), 'success');
              resetForm();
            } else {
              showSnackbar(t('fileUpload.partialSuccess', { success: successfulUploads, failed: files.length - successfulUploads }), 'warning');
            }
          } else {
            showSnackbar(t('fileUpload.noneSuccess'), 'error');
          }
        }
      }
    };

    await Promise.all(files.map(file => processFile(file)));
  };

  const showSnackbar = (message, severity) => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        {t('fileUpload.title')}
      </Typography>

      <Accordion defaultExpanded sx={{ mb: 3, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InfoIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">
              {t('fileUpload.policyTitle')}
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>{t('fileUpload.allowedTitle')}</AlertTitle>
            {t('fileUpload.allowedIntro')}
            <ul>
              <li>{t('fileUpload.allowedHours')}</li>
              <li>{t('fileUpload.allowedManuals')}</li>
              <li>{t('fileUpload.allowedRegulatory')}</li>
              <li>{t('fileUpload.allowedOther')}</li>
            </ul>
          </Alert>
          
          <Alert severity="warning">
            <AlertTitle>{t('fileUpload.disallowedTitle')}</AlertTitle>
            {t('fileUpload.disallowedIntro')}
            <ul>
              <li>{t('fileUpload.disallowedPromo')}</li>
              <li>{t('fileUpload.disallowedMarketing')}</li>
              <li>{t('fileUpload.disallowedUnrelated')}</li>
            </ul>
          </Alert>
          
          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
            Observações importantes:
            <ul>
              <li>Documentos inadequados serão bloqueados ou removidos sem aviso prévio</li>
              <li>Materiais promocionais devem ser enviados nos espaços específicos da plataforma</li>
              <li>Em caso de dúvidas, consulte nossas políticas de uso ou entre em contato com o suporte</li>
            </ul>
          </Typography>
        </AccordionDetails>
      </Accordion>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          component="label"
          variant="contained"
          startIcon={<CloudUploadIcon />}
          disabled={isUploading || files.length >= MAX_FILES}
        >
          {t('fileUpload.select')}
          <input
            type="file"
            multiple
            hidden
            onChange={handleFileChange}
            accept={allowedFileTypes.join(',')}
          />
        </Button>
        
        <Typography variant="caption" color="text.secondary">
          {t('fileUpload.selectionSummary', { selected: files.length, count: MAX_FILES, size: MAX_FILE_SIZE_MB })}
        </Typography>
      </Box>

      {files.length > 0 && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {files.map((file, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {file.type.startsWith('image') ? (
                        <ImagePreview file={file} />
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
                          <DescriptionIcon color="action" fontSize="large" />
                        </Box>
                      )}
                      
                      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Tooltip title={file.name}>
                          <Typography variant="subtitle1" noWrap>
                            {file.name}
                          </Typography>
                        </Tooltip>
                        <Typography variant="caption" color="text.secondary">
                          {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1]}
                        </Typography>
                      </Box>
                      
                      <Tooltip title={t('fileUpload.remove')}>
                        <IconButton 
                          onClick={() => handleRemoveFile(file.name)}
                          disabled={isUploading}
                          size="small"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    <Box sx={{ mb: 2, flexGrow: 1 }}>
                      <ReactQuill
                        value={fileDescriptions[file.name] || ''}
                        onChange={(value) => handleDescriptionChange(value, file.name)}
                        placeholder={t('fileUpload.description')}
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

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            {isUploading && <Button onClick={cancelUploads} variant="outlined" color="warning">{t('fileUpload.cancel')}</Button>}
            <Button
              onClick={resetForm}
              variant="outlined"
              color="error"
              disabled={isUploading}
              startIcon={<DeleteIcon />}
            >
              {t('fileUpload.clear')}
            </Button>
            
            <Button
              onClick={handleUploadFiles}
              variant="contained"
              color="primary"
              disabled={isUploading}
              startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
              sx={{ minWidth: 200 }}
            >
              {isUploading ? t('fileUpload.uploading', { current: Object.values(uploadStatus).filter(s => s === 'uploading').length, count: files.length }) : t('fileUpload.start')}
            </Button>
          </Box>
        </>
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

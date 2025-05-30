import React, { useState } from 'react';
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
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AlertTitle
} from '@mui/material';
import { push, ref, set } from 'firebase/database';
import { db } from '../../fb';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DeleteIcon from '@mui/icons-material/Delete';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
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
  const [uploadStatus, setUploadStatus] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  const [isUploading, setIsUploading] = useState(false);

  const resetForm = () => {
    setFiles([]);
    setFileDescriptions({});
    setUploadProgress({});
    setUploadStatus({});
  };

  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files);
    
    if (files.length + newFiles.length > MAX_FILES) {
      showSnackbar(`Você pode enviar no máximo ${MAX_FILES} arquivos por vez.`, 'warning');
      return;
    }
    
    const validFiles = newFiles.filter(file => {
      const isTypeValid = allowedFileTypes.includes(file.type);
      const isSizeValid = file.size <= MAX_FILE_SIZE_MB * 1024 * 1024;
      
      if (!isTypeValid) {
        showSnackbar(`Tipo de arquivo não suportado: ${file.name}`, 'warning');
      }
      if (!isSizeValid) {
        showSnackbar(`Arquivo muito grande (limite: ${MAX_FILE_SIZE_MB}MB): ${file.name}`, 'warning');
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

    const processFile = async (file) => {
      try {
        setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));
        
        const filePath = `vitrine/${user.id}/${Date.now()}_${file.name}`;
        const fileRef = storageRef(storage, filePath);
        const uploadTask = uploadBytesResumable(fileRef, file);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(prev => ({ ...prev, [file.name]: progress }));
            },
            (error) => {
              reject(error);
            },
            async () => {
              try {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
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

                await set(newPostRef, postData);
                setUploadStatus(prev => ({ ...prev, [file.name]: 'success' }));
                successfulUploads++;
                showSnackbar(`${file.name} enviado com sucesso!`, 'success');
                resolve();
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      } catch (error) {
        console.error('Erro no upload:', error);
        setUploadStatus(prev => ({ ...prev, [file.name]: 'error' }));
        showSnackbar(`Falha no upload de ${file.name}`, 'error');
      } finally {
        completedUploads++;
        if (completedUploads === files.length) {
          setIsUploading(false);
          if (successfulUploads > 0) {
            // Limpa o formulário apenas se pelo menos um arquivo foi enviado com sucesso
            if (successfulUploads === files.length) {
              showSnackbar(`Todos os ${successfulUploads} arquivos foram enviados com sucesso! O formulário foi limpo.`, 'success');
              resetForm();
            } else {
              showSnackbar(`${successfulUploads} arquivo(s) enviado(s) com sucesso! ${files.length - successfulUploads} falharam.`, 'warning');
            }
          } else {
            showSnackbar(`Nenhum arquivo foi enviado com sucesso.`, 'error');
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

  const getFileIcon = (fileType) => {
    return fileIcons[fileType] || '📁';
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Upload de Arquivos
      </Typography>

      <Accordion defaultExpanded sx={{ mb: 3, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
        <AccordionSummary expandIcon={<ExpandIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <InfoIcon color="primary" sx={{ mr: 1 }} />
            <Typography variant="subtitle1" fontWeight="bold">
              Política de Upload de Documentos
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Alert severity="info" sx={{ mb: 2 }}>
            <AlertTitle>Documentos Permitidos</AlertTitle>
            Este espaço é destinado exclusivamente para o upload de documentos públicos inerentes à empresa, tais como:
            <ul>
              <li>Horário de funcionamento da empresa</li>
              <li>Manuais, termos de garantia e políticas de troca</li>
              <li>Documentos fiscais e regulatórios (ANVISA, INMETRO, etc.)</li>
              <li>Outros que no julgar da empresa poderão ser expostos publicamente</li>
            </ul>
          </Alert>
          
          <Alert severity="warning">
            <AlertTitle>Documentos Não Permitidos</AlertTitle>
            NÃO são permitidos:
            <ul>
              <li>Conteúdo promocional (anúncios, banners, brindes)</li>
              <li>Materiais de marketing (folders, campanhas, concursos)</li>
              <li>Informações não relacionadas à documentação empresarial</li>
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
          Selecionar Arquivos
          <input
            type="file"
            multiple
            hidden
            onChange={handleFileChange}
            accept={allowedFileTypes.join(',')}
          />
        </Button>
        
        <Typography variant="caption" color="text.secondary">
          {files.length} de {MAX_FILES} arquivos selecionados • Tamanho máximo por arquivo: {MAX_FILE_SIZE_MB}MB
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
                      
                      <Tooltip title="Remover arquivo">
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

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
            <Button
              onClick={resetForm}
              variant="outlined"
              color="error"
              disabled={isUploading}
              startIcon={<DeleteIcon />}
            >
              Limpar Tudo
            </Button>
            
            <Button
              onClick={handleUploadFiles}
              variant="contained"
              color="primary"
              disabled={isUploading}
              startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
              sx={{ minWidth: 200 }}
            >
              {isUploading ? `Enviando (${Object.values(uploadStatus).filter(s => s === 'uploading').length}/${files.length})` : 'Iniciar Upload'}
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
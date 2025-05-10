import React, { useState, useEffect, useCallback } from "react";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import {
  Alert,
  Snackbar,
  Button,
  Box,
  Typography,
  LinearProgress,
  TextField,
  Paper,
  Grid,
  IconButton,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  useMediaQuery,
  Tooltip,
  Divider,
} from "@mui/material";
import { push, ref, set, get } from "firebase/database";
import { db } from "../../fb";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import CloseIcon from "@mui/icons-material/Close";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DescriptionIcon from '@mui/icons-material/Description';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

const PostInputDesk = ({ user }) => {
  const [newPhotos, setNewPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState({});
  const [photoDescriptions, setPhotoDescriptions] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);
  const isMobile = useMediaQuery('(max-width:600px)');
  const isSmallScreen = useMediaQuery('(max-width:400px)');

  const validateData = () => {
    const errors = [];
    if (!user || !user.id) {
      errors.push("Usuário não definido ou ID do usuário ausente");
    }
    if (newPhotos.length === 0) {
      errors.push("Nenhuma foto selecionada para upload.");
    }
    setErrorMessages(errors);
    return errors.length === 0;
  };

  const sendNotificationToConnections = async (postId) => {
    try {
      const connectionsRef = ref(db, `connections/${user.id}`);
      const connectionsSnapshot = await get(connectionsRef);
  
      if (connectionsSnapshot.exists()) {
        const connections = connectionsSnapshot.val();
        const notificationsPromises = Object.keys(connections).map((connectionId) => {
          const notification = {
            type: "new_post",
            message: `${user.nome} publicou uma nova foto.`,
            fromUserId: user.id,
            fromUserName: user.nome,
            postId: postId,
            link: `/post/${postId}`,
            timestamp: new Date().toISOString(),
            status: "unread",
          };
  
          const notificationRef = push(ref(db, `notifications/${connectionId}`));
          return set(notificationRef, notification);
        });
  
        await Promise.all(notificationsPromises);
      }
    } catch (error) {
      console.error("Erro ao enviar notificações:", error);
    }
  };

  const handleSavePublishedPhotos = useCallback(async () => {
    if (!validateData()) return;

    setIsUploading(true);
    const storage = getStorage();
    let completedUploads = 0;

    try {
      for (const photo of newPhotos) {
        const fileRef = storageRef(storage, `published/${user.id}/${photo.name}`);
        const uploadTask = uploadBytesResumable(fileRef, photo);

        await new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = Math.round(
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100
              );
              setUploadProgress((prevProgress) => ({
                ...prevProgress,
                [photo.name]: progress,
              }));
            },
            (error) => {
              reject(error);
            },
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              const description = photoDescriptions[photo.name];
              const newPostRef = push(ref(db, "posts"));
              const postId = newPostRef.key;

              await set(newPostRef, {
                id: postId,
                company: {
                  id: user.id,
                  name: user.nome,
                  logo: user.logoUrl,
                  sector: user.sector,
                  provincia: user.provincia,
                },
                description,
                url,
                timestamp: Date.now(),
              });

              await sendNotificationToConnections(postId);

              completedUploads++;
              if (completedUploads === newPhotos.length) {
                setUploadSuccess(true);
                setIsUploading(false);
              }
              resolve();
            }
          );
        });
      }
    } catch (error) {
      setErrorMessages([...errorMessages, `Erro ao carregar as fotos: ${error.message}`]);
      setIsUploading(false);
    }
  }, [newPhotos, photoDescriptions, user, errorMessages]);

  useEffect(() => {
    if (uploadSuccess) {
      setSnackbarOpen(true);
      setTimeout(() => {
        setNewPhotos([]);
        setPhotoPreviews({});
        setPhotoDescriptions({});
        setUploadProgress({});
        setUploadSuccess(false);
      }, 3000);
    }
  }, [uploadSuccess]);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setNewPhotos(files);
    setErrorMessages([]);

    const previews = {};
    const descriptions = {};

    files.forEach((file) => {
      previews[file.name] = URL.createObjectURL(file);
      descriptions[file.name] = "";
    });

    setPhotoPreviews(previews);
    setPhotoDescriptions(descriptions);
  };

  const handleDescriptionChange = (value, photoName) => {
    setPhotoDescriptions((prevDescriptions) => ({
      ...prevDescriptions,
      [photoName]: value,
    }));
  };

  const handleRemovePhoto = (photoName) => {
    setNewPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.name !== photoName));
    setPhotoPreviews((prevPreviews) => {
      const newPreviews = { ...prevPreviews };
      URL.revokeObjectURL(newPreviews[photoName]);
      delete newPreviews[photoName];
      return newPreviews;
    });
    setPhotoDescriptions((prevDescriptions) => {
      const newDescriptions = { ...prevDescriptions };
      delete newDescriptions[photoName];
      return newDescriptions;
    });
  };

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean']
    ]
  };

  return (
    <Paper 
    sx={{ 
      p: isMobile ? 2 : 4, 
      maxWidth: 800, 
      mx: "auto", 
      borderRadius: 3,
      boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
      backgroundColor: 'background.paper'
    }}
  >
    <Box sx={{ width: "100%" }}>
      <Typography 
        variant="h5" 
        component="h2" 
        sx={{ 
          mb: 3, 
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <PhotoLibraryIcon color="primary" />
        Publicar Trabalhos Realizados
      </Typography>

      {/* ADDED NOTIFICATION BOX */}
      <Alert 
        severity="info" 
        sx={{ 
          mb: 3,
          borderRadius: 2,
          alignItems: 'center',
          backgroundColor: 'info.light',
          '& .MuiAlert-icon': {
            color: 'info.main'
          }
        }}
      >
        <Typography variant="body2">
          <strong>Nota:</strong> Esta seção é destinada exclusivamente para compartilhar 
          <strong> trabalhos realizados</strong> pela sua empresa (projetos concluídos, obras, 
          serviços prestados). Não é permitido postar produtos à venda, anúncios comerciais 
          ou conteúdo promocional. Publicações inadequadas serão removidas.
        </Typography>
      </Alert>

        <input
          accept="image/*"
          style={{ display: "none" }}
          id="raised-button-file"
          multiple
          type="file"
          onChange={handleFileChange}
          disabled={isUploading}
        />
        <label htmlFor="raised-button-file">
          <Button 
            variant="contained" 
            component="span" 
            disabled={isUploading}
            startIcon={<CloudUploadIcon />}
            sx={{
              px: 3,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: isMobile ? '0.875rem' : '1rem',
              boxShadow: 'none',
              '&:hover': {
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
              }
            }}
          >
            Selecionar Fotos
          </Button>
        </label>

        {errorMessages.length > 0 && (
          <Alert 
            severity="error" 
            sx={{ 
              mt: 2,
              borderRadius: 2,
              alignItems: 'center'
            }}
            onClose={() => setErrorMessages([])}
          >
            <Box>
              {errorMessages.map((message, index) => (
                <Typography key={index} variant="body2">
                  {message}
                </Typography>
              ))}
            </Box>
          </Alert>
        )}

        {newPhotos.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <DescriptionIcon color="action" />
              Fotos selecionadas ({newPhotos.length})
            </Typography>
            
            <Divider sx={{ mb: 3 }} />

            {newPhotos.map((photo, index) => (
              <Card 
                key={index} 
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  border: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Grid container>
                  <Grid item xs={12} sm={5} md={4}>
                    <CardMedia
                      component="img"
                      image={photoPreviews[photo.name]}
                      alt={photo.name}
                      sx={{ 
                        height: isMobile ? 200 : 240, 
                        objectFit: 'cover',
                        borderTopLeftRadius: '8px',
                        borderBottomLeftRadius: isMobile ? 0 : '8px',
                        borderTopRightRadius: isMobile ? '8px' : 0
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={7} md={8}>
                    <CardContent sx={{ position: 'relative', pb: '56px !important' }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 1
                      }}>
                        <Tooltip title={photo.name}>
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 500,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: isMobile ? '180px' : '300px'
                            }}
                          >
                            {photo.name}
                          </Typography>
                        </Tooltip>
                        <IconButton 
                          onClick={() => handleRemovePhoto(photo.name)}
                          size="small"
                          sx={{
                            color: 'error.main',
                            '&:hover': {
                              backgroundColor: 'error.light',
                              color: 'error.dark'
                            }
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <ReactQuill
                        value={photoDescriptions[photo.name] || ""}
                        onChange={(value) => handleDescriptionChange(value, photo.name)}
                        placeholder="Adicione uma descrição para sua foto..."
                        modules={quillModules}
                        style={{ 
                          height: isMobile ? '120px' : '140px', 
                          marginBottom: '12px',
                          fontSize: '0.875rem'
                        }}
                        theme="snow"
                      />

                      <Box sx={{ 
                        position: 'absolute', 
                        bottom: 16, 
                        left: 16, 
                        right: 16 
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          {uploadProgress[photo.name] === 100 ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <CircularProgress 
                              size={16} 
                              thickness={6}
                              value={uploadProgress[photo.name] || 0}
                              variant={isUploading ? "determinate" : "indeterminate"}
                            />
                          )}
                          <Typography variant="caption" color="text.secondary">
                            {uploadProgress[photo.name] === 100 ? 
                              'Pronto para enviar' : 
                              (isUploading ? 'Enviando...' : '')}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={uploadProgress[photo.name] || 0}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'action.selected',
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 3,
                              backgroundColor: 
                                uploadProgress[photo.name] === 100 ? 'success.main' : 'primary.main',
                            },
                          }}
                        />
                      </Box>
                    </CardContent>
                  </Grid>
                </Grid>
              </Card>
            ))}

            <Button
              onClick={handleSavePublishedPhotos}
              variant="contained"
              color="primary"
              disabled={isUploading || newPhotos.length === 0}
              fullWidth
              size="large"
              startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{
                mt: 2,
                py: 1.5,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 500,
                boxShadow: 'none',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                  backgroundColor: 'primary.dark'
                },
                '&:disabled': {
                  backgroundColor: 'action.disabledBackground'
                }
              }}
            >
              {isUploading ? "Publicando..." : "Publicar Fotos"}
            </Button>
          </Box>
        )}

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity="success"
            icon={<CheckCircleIcon fontSize="inherit" />}
            sx={{
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              width: '100%'
            }}
          >
            Fotos publicadas com sucesso!
          </Alert>
        </Snackbar>
      </Box>
    </Paper>
  );
};

export default PostInputDesk;
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AlertTitle,
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
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const MAX_FREE_POSTS = 5;

const PostInputDesk = ({ user, currentPostCount }) => {
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
    if (currentPostCount + newPhotos.length > MAX_FREE_POSTS) {
      errors.push(`Limite de ${MAX_FREE_POSTS} publicações gratuitas atingido. Remova algumas fotos ou atualize seu plano para publicar mais.`);
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
  }, [newPhotos, photoDescriptions, user, errorMessages, currentPostCount]);

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

  // Verificação mais robusta do limite
  const remainingSlots = MAX_FREE_POSTS - currentPostCount;
  if (remainingSlots <= 0) {
    setErrorMessages([`Você atingiu o limite de ${MAX_FREE_POSTS} publicações gratuitas. Atualize seu plano para publicar mais.`]);
    return;
  }

  if (files.length > remainingSlots) {
    setErrorMessages([`Você só pode adicionar mais ${remainingSlots} foto(s). Remova ${files.length - remainingSlots} foto(s) ou atualize seu plano.`]);
    return;
  }
}
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

        <Accordion defaultExpanded sx={{ mb: 3, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Política de Publicação de Trabalhos
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Trabalhos Permitidos</AlertTitle>
              Esta seção é exclusivamente dedicada à partilha de trabalhos realizados pela sua empresa:
              <ul>
                <li>Projetos concluídos e obras finalizadas</li>
                <li>Serviços prestados com exemplos reais</li>
                <li>Portfólio profissional da empresa</li>
                <li>Demonstrações de habilidades e competências</li>
              </ul>
            </Alert>
            
            <Alert severity="warning">
              <AlertTitle>Limitações do Plano Gratuito</AlertTitle>
              No plano gratuito:
              <ul>
                <li>Limite de {MAX_FREE_POSTS} publicações</li>
                <li>Não são permitidos anúncios promocionais</li>
                <li>Não são permitidos produtos à venda</li>
                <li>Conteúdo inapropriado será removido</li>
              </ul>
            </Alert>
            
            <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
              Você já publicou {currentPostCount} de {MAX_FREE_POSTS} trabalhos disponíveis no plano gratuito.
              {currentPostCount >= MAX_FREE_POSTS && (
                <Box sx={{ color: 'error.main', fontWeight: 'bold', mt: 1 }}>
                  Limite atingido! Atualize seu plano para publicar mais trabalhos.
                </Box>
              )}
            </Typography>
          </AccordionDetails>
        </Accordion>

        <input
          accept="image/*"
          style={{ display: "none" }}
          id="raised-button-file"
          multiple
          type="file"
          onChange={handleFileChange}
          disabled={isUploading || currentPostCount >= MAX_FREE_POSTS}
        />
        <label htmlFor="raised-button-file">
          <Button 
            variant="contained" 
            component="span" 
            disabled={isUploading || currentPostCount >= MAX_FREE_POSTS}
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
              },
              '&:disabled': {
                backgroundColor: currentPostCount >= MAX_FREE_POSTS ? 'error.light' : 'action.disabledBackground',
                color: currentPostCount >= MAX_FREE_POSTS ? 'error.contrastText' : 'text.disabled'
              }
            }}
          >
            {currentPostCount >= MAX_FREE_POSTS ? 'Limite Atingido' : 'Selecionar Fotos'}
          </Button>
        </label>

        {currentPostCount >= MAX_FREE_POSTS && (
          <Alert severity="error" sx={{ mt: 2, alignItems: 'center' }}>
            Você atingiu o limite de {MAX_FREE_POSTS} publicações no plano gratuito. 
            <Button 
              variant="text" 
              color="inherit" 
              sx={{ ml: 1, fontWeight: 'bold' }}
              onClick={() => {/* Add your upgrade plan function here */}}
            >
              Atualizar Plano
            </Button>
          </Alert>
        )}

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
              Fotos selecionadas ({newPhotos.length}) - {currentPostCount + newPhotos.length}/{MAX_FREE_POSTS} no total
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
              disabled={isUploading || newPhotos.length === 0 || currentPostCount + newPhotos.length > MAX_FREE_POSTS}
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
                  backgroundColor: currentPostCount + newPhotos.length > MAX_FREE_POSTS ? 'error.light' : 'action.disabledBackground',
                  color: currentPostCount + newPhotos.length > MAX_FREE_POSTS ? 'error.contrastText' : 'text.disabled'
                }
              }}
            >
              {isUploading ? "Publicando..." : 
               currentPostCount + newPhotos.length > MAX_FREE_POSTS ? "Limite Excedido" : 
               "Publicar Fotos"}
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
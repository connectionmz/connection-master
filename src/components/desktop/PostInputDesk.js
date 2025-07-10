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
import { push, ref, set, get, onValue } from "firebase/database";
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

// Constants
const MAX_POSTS = 5;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const PostInputDesk = ({ user }) => {
  const [newPhotos, setNewPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState({});
  const [photoDescriptions, setPhotoDescriptions] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);
  const [userPostCount, setUserPostCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');

  // Quill editor configuration
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean']
    ]
  };

  // Monitor user's post count
  useEffect(() => {
    const postsRef = ref(db, 'posts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      let count = 0;

      if (data) {
        Object.values(data).forEach(post => {
          if (post.company?.id === user?.id) {
            count++;
          }
        });
      }

      setUserPostCount(count);
      setLimitReached(count >= MAX_POSTS);
    });

    return () => unsubscribe();
  }, [user?.id]);

  // Validate form data
  const validateData = useCallback(() => {
    const errors = [];
    
    if (!user?.id) {
      errors.push("Usuário não autenticado");
    }
    
    if (newPhotos.length === 0) {
      errors.push("Selecione pelo menos uma foto para publicar");
    }
    
    if (limitReached) {
      errors.push(`Limite de ${MAX_POSTS} publicações atingido. Remova publicações existentes para adicionar novas.`);
    }
    
    if (userPostCount + newPhotos.length > MAX_POSTS) {
      errors.push(`Você pode adicionar no máximo ${MAX_POSTS - userPostCount} foto(s)`);
    }
    
    // Validate each file
    newPhotos.forEach(photo => {
      if (photo.size > MAX_FILE_SIZE) {
        errors.push(`A foto "${photo.name}" excede o tamanho máximo de 25MB`);
      }
      
      if (!ALLOWED_FILE_TYPES.includes(photo.type)) {
        errors.push(`Formato não suportado para "${photo.name}". Use JPEG, PNG ou WEBP.`);
      }
    });

    setErrorMessages(errors);
    return errors.length === 0;
  }, [user, newPhotos, userPostCount, limitReached]);

  // Send notifications to connections
  const sendNotificationToConnections = useCallback(async (postId) => {
    try {
      const connectionsRef = ref(db, `connections/${user.id}`);
      const connectionsSnapshot = await get(connectionsRef);
  
      if (connectionsSnapshot.exists()) {
        const connections = connectionsSnapshot.val();
        const notificationsPromises = Object.keys(connections).map(connectionId => {
          const notification = {
            type: "new_post",
            message: `${user.nome} publicou uma nova foto.`,
            fromUserId: user.id,
            fromUserName: user.nome,
            postId,
            link: `/post/${postId}`,
            timestamp: new Date().toISOString(),
            status: "unread",
          };
  
          return set(push(ref(db, `notifications/${connectionId}`), notification));
        });
  
        await Promise.all(notificationsPromises);
      }
    } catch (error) {
      console.error("Erro ao enviar notificações:", error);
    }
  }, [user]);

  // Handle photo upload and post creation
  const handleSavePublishedPhotos = useCallback(async () => {
    if (!validateData()) return;

    setIsUploading(true);
    setErrorMessages([]);
    const storage = getStorage();
    let uploadErrors = [];

    try {
      await Promise.all(newPhotos.map(async (photo) => {
        try {
          const fileRef = storageRef(storage, `published/${user.id}/${Date.now()}_${photo.name}`);
          const uploadTask = uploadBytesResumable(fileRef, photo);

          const url = await new Promise((resolve, reject) => {
            uploadTask.on(
              "state_changed",
              (snapshot) => {
                const progress = Math.round(
                  (snapshot.bytesTransferred / snapshot.totalBytes) * 100
                );
                setUploadProgress(prev => ({ ...prev, [photo.name]: progress }));
              },
              reject,
              async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
            );
          });

          const newPostRef = push(ref(db, "posts"));
          await set(newPostRef, {
            id: newPostRef.key,
            company: {
              id: user.id,
              name: user.nome,
              logo: user.logoUrl,
              sector: user.sector,
              provincia: user.provincia,
            },
            description: photoDescriptions[photo.name] || "",
            url,
            timestamp: Date.now(),
          });

          await sendNotificationToConnections(newPostRef.key);
        } catch (error) {
          console.error(`Erro ao carregar ${photo.name}:`, error);
          uploadErrors.push(`Falha ao publicar "${photo.name}": ${error.message}`);
        }
      }));

      if (uploadErrors.length > 0) {
        setErrorMessages(uploadErrors);
      } else {
        setUploadSuccess(true);
      }
    } catch (error) {
      console.error("Erro geral no upload:", error);
      setErrorMessages([...uploadErrors, `Erro no processo de upload: ${error.message}`]);
    } finally {
      setIsUploading(false);
    }
  }, [newPhotos, photoDescriptions, user, validateData, sendNotificationToConnections]);

  // Reset form after successful upload
  useEffect(() => {
    if (uploadSuccess) {
      setSnackbarOpen(true);
      const timer = setTimeout(() => {
        setNewPhotos([]);
        setPhotoPreviews({});
        setPhotoDescriptions({});
        setUploadProgress({});
        setUploadSuccess(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [uploadSuccess]);

  // Handle file selection
  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    if (!files.length) return;

    // Check remaining slots
    const remainingSlots = MAX_POSTS - userPostCount;
    if (remainingSlots <= 0) {
      setErrorMessages([`Você já atingiu o limite máximo de ${MAX_POSTS} publicações.`]);
      setLimitReached(true);
      return;
    }

    // Validate number of files
    if (files.length > remainingSlots) {
      setErrorMessages([`Você só pode adicionar mais ${remainingSlots} foto(s).`]);
      return;
    }

    // Create previews and update state
    const newPreviews = {};
    const validFiles = [];
    const newErrors = [];

    files.forEach(file => {
      if (file.size > MAX_FILE_SIZE) {
        newErrors.push(`"${file.name}" excede 25MB`);
        return;
      }
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        newErrors.push(`"${file.name}" não é um formato suportado`);
        return;
      }
      
      newPreviews[file.name] = URL.createObjectURL(file);
      validFiles.push(file);
    });

    if (newErrors.length > 0) {
      setErrorMessages(newErrors);
    }

    if (validFiles.length > 0) {
      setNewPhotos(prev => [...prev, ...validFiles]);
      setPhotoPreviews(prev => ({ ...prev, ...newPreviews }));
      setErrorMessages([]);
    }
  };

  // Handle description changes
  const handleDescriptionChange = (value, photoName) => {
    setPhotoDescriptions(prev => ({ ...prev, [photoName]: value }));
  };

  // Remove a photo
  const handleRemovePhoto = (photoName) => {
    setNewPhotos(prev => prev.filter(photo => photo.name !== photoName));
    setPhotoPreviews(prev => {
      URL.revokeObjectURL(prev[photoName]);
      const newPreviews = { ...prev };
      delete newPreviews[photoName];
      return newPreviews;
    });
    setPhotoDescriptions(prev => {
      const newDescriptions = { ...prev };
      delete newDescriptions[photoName];
      return newDescriptions;
    });
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[photoName];
      return newProgress;
    });
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
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
          <Chip 
            label={`${userPostCount}/${MAX_POSTS}`} 
            color={limitReached ? "error" : "primary"} 
            size="small"
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </Typography>

        {limitReached && (
          <Alert severity="warning" sx={{ mb: 3, alignItems: 'center' }}>
            <Box>
              <AlertTitle>Limite de Publicações Atingido</AlertTitle>
              <Typography variant="body2">
                Você já possui {MAX_POSTS} publicações ativas. Para adicionar mais:
              </Typography>
              <ul style={{ marginTop: 4, marginBottom: 0, paddingLeft: 20 }}>
                <li>Remova publicações antigas</li>
                <li>Atualize publicações existentes</li>
              </ul>
            </Box>
          </Alert>
        )}

        <Accordion defaultExpanded sx={{ mb: 3, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <InfoIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="subtitle1" fontWeight="bold">
                Política de Publicação
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Alert severity="info" sx={{ mb: 2 }}>
              <AlertTitle>Trabalhos Permitidos</AlertTitle>
              <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                <Box component="li" sx={{ mb: 1 }}>Projetos concluídos e obras finalizadas</Box>
                <Box component="li" sx={{ mb: 1 }}>Serviços prestados com exemplos reais</Box>
                <Box component="li">Portfólio profissional da empresa</Box>
              </Box>
            </Alert>
            
            <Alert severity="warning">
              <AlertTitle>Diretrizes Importantes</AlertTitle>
              <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Limite de {MAX_POSTS} publicações</strong> - Mantenha apenas seus melhores trabalhos
                </Box>
                <Box component="li">
                  <strong>Tamanho máximo</strong> - 25MB por imagem (JPEG, PNG ou WEBP)
                </Box>
              </Box>
            </Alert>
          </AccordionDetails>
        </Accordion>

        <input
          accept={ALLOWED_FILE_TYPES.join(',')}
          style={{ display: "none" }}
          id="photo-upload-input"
          multiple
          type="file"
          onChange={handleFileChange}
          disabled={isUploading || limitReached}
        />
        <label htmlFor="photo-upload-input">
          <Button 
            variant="contained" 
            component="span" 
            disabled={isUploading || limitReached}
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
            {limitReached ? 'Limite Atingido' : 'Selecionar Fotos'}
          </Button>
        </label>

        {!limitReached && userPostCount > 0 && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Você pode adicionar até {MAX_POSTS - userPostCount} foto(s).
          </Typography>
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
              Fotos selecionadas ({newPhotos.length})
              <Typography variant="caption" color="text.secondary">
                ({userPostCount + newPhotos.length}/{MAX_POSTS} no total)
              </Typography>
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
              disabled={isUploading || newPhotos.length === 0 || limitReached || (userPostCount + newPhotos.length) > MAX_POSTS}
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
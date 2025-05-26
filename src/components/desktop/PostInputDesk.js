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
  const isSmallScreen = useMediaQuery('(max-width:400px)');

  // Monitorar posts existentes e contar os do usuário atual
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
      setLimitReached(count >= 5);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const validateData = () => {
    const errors = [];
    if (!user || !user.id) {
      errors.push("Usuário não definido ou ID do usuário ausente");
    }
    if (newPhotos.length === 0) {
      errors.push("Nenhuma foto selecionada para upload.");
    }
    if (limitReached) {
      errors.push("Você atingiu o limite de 5 postagens permitidas. Remova algumas publicações existentes para adicionar novas.");
    }
    if (userPostCount + newPhotos.length > 5) {
      errors.push(`Você já tem ${userPostCount} publicações. Selecionando ${newPhotos.length} foto(s), você ultrapassará o limite de 5.`);
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
                description: description || "", 
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

    // Verificação criativa do limite
    const remainingSlots = 5 - userPostCount;
    if (remainingSlots <= 0) {
      setErrorMessages(["Você já atingiu o limite máximo de 5 publicações."]);
      setLimitReached(true);
      return;
    }

    if (files.length > remainingSlots) {
      setErrorMessages([`Você só pode adicionar mais ${remainingSlots} foto(s). Selecione menos arquivos ou remova publicações existentes.`]);
      return;
    }

    const newPreviews = {};
    files.forEach(file => {
      newPreviews[file.name] = URL.createObjectURL(file);
    });

    setNewPhotos(prev => [...prev, ...files]);
    setPhotoPreviews(prev => ({ ...prev, ...newPreviews }));
    setErrorMessages([]);
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
          <Chip 
            label={`${userPostCount}/5`} 
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
                Você já possui 5 publicações ativas. Para adicionar mais:
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
              <AlertTitle>Limites e Diretrizes</AlertTitle>
              <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                <Box component="li" sx={{ mb: 1 }}>
                  <strong>Qualidade sobre quantidade</strong> - Selecione apenas seus melhores trabalhos
                </Box>
                <Box component="li">
                  <strong>Atualizações frequentes</strong> - Substitua trabalhos antigos por novos regularmente
                </Box>
              </Box>
            </Alert>
          </AccordionDetails>
        </Accordion>

        <input
          accept="image/*"
          style={{ display: "none" }}
          id="raised-button-file"
          multiple
          type="file"
          onChange={handleFileChange}
          disabled={isUploading || limitReached}
        />
        <label htmlFor="raised-button-file">
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
            Você ainda pode adicionar {5 - userPostCount} foto(s).
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
                ({userPostCount + newPhotos.length}/5 no total)
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
              disabled={isUploading || newPhotos.length === 0 || limitReached || (userPostCount + newPhotos.length) > 5}
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
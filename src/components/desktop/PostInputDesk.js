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
} from "@mui/material";
import { push, ref, set, get } from "firebase/database";
import { db } from "../../fb";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import CloseIcon from "@mui/icons-material/Close";

const PostInputDesk = ({ user }) => {
  const [newPhotos, setNewPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState({});
  const [photoDescriptions, setPhotoDescriptions] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);

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

        Object.keys(connections).forEach(async (connectionId) => {
          const notification = {
            type: "new_post",
            message: `${user.nome} publicou uma nova foto.`,
            fromUserId: user.id,
            fromUserName: user.nome,
            postId: postId,
            timestamp: new Date().toISOString(),
            status: "unread",
          };

          const notificationRef = push(ref(db, `notifications/${connectionId}`));
          await set(notificationRef, notification);
        });
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
    setNewPhotos(files);

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
      delete newPreviews[photoName];
      return newPreviews;
    });
    setPhotoDescriptions((prevDescriptions) => {
      const newDescriptions = { ...prevDescriptions };
      delete newDescriptions[photoName];
      return newDescriptions;
    });
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 800, mx: "auto" }}>
      <Box sx={{ width: "100%" }}>
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
          <Button variant="contained" component="span" disabled={isUploading}>
            Selecionar Fotos
          </Button>
        </label>

        {errorMessages.length > 0 && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {errorMessages.map((message, index) => (
              <Typography key={index} variant="body2">
                {message}
              </Typography>
            ))}
          </Alert>
        )}

        {newPhotos.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {newPhotos.map((photo, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Box
                      component="img"
                      src={photoPreviews[photo.name]}
                      alt={photo.name}
                      sx={{ width: "100%", height: "auto", borderRadius: 1 }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={8}>
                    <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body1" fontWeight="bold">
                        {photo.name}
                      </Typography>
                      <IconButton onClick={() => handleRemovePhoto(photo.name)}>
                        <CloseIcon />
                      </IconButton>
                    </Box>
                    <ReactQuill
                      value={photoDescriptions[photo.name] || ""}
                      onChange={(value) => handleDescriptionChange(value, photo.name)}
                      placeholder="Adicionar descrição"
                      modules={{
                        toolbar: [
                          [{ header: "1" }, { header: "2" }, { font: [] }],
                          [{ list: "ordered" }, { list: "bullet" }],
                          ["bold", "italic", "underline"],
                          ["link"],
                          [{ align: [] }],
                        ],
                      }}
                      style={{ height: "120px", marginBottom: "12px" }}
                    />
                    <LinearProgress
                      variant="determinate"
                      value={uploadProgress[photo.name] || 0}
                      sx={{
                        mt: 2,
                        backgroundColor: "#e0e0e0",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor:
                            uploadProgress[photo.name] === 100 ? "#4caf50" : "#2196f3",
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Box>
        )}

        <Button
          onClick={handleSavePublishedPhotos}
          variant="contained"
          color="primary"
          disabled={isUploading || newPhotos.length === 0}
          fullWidth
          sx={{ mt: 2 }}
        >
          {isUploading ? "Carregando..." : "Upload Novas Fotos"}
        </Button>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity="success">
            Carregamento concluído com sucesso!
          </Alert>
        </Snackbar>
      </Box>
    </Paper>
  );
};

export default PostInputDesk;
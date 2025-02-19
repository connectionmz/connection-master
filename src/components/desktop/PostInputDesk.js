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
} from "@mui/material";
import { push, ref, set } from "firebase/database";
import { db } from "../../fb";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const PostInputDesk = ({ user }) => {
  const [newPhotos, setNewPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState({});
  const [photoDescriptions, setPhotoDescriptions] = useState({});
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);

  // Função para validar os dados antes do upload
  const validateData = () => {
    if (!user || !user.id) {
      setErrorMessages(["Usuário não definido ou ID do usuário ausente"]);
      return false;
    }
    if (newPhotos.length === 0) {
      setErrorMessages(["Nenhuma foto selecionada para upload."]);
      return false;
    }
    const missingDescriptions = newPhotos.filter(
      (photo) => !photoDescriptions[photo.name]
    );

    return true;
  };

  // Função para salvar fotos publicadas no Firebase
  const handleSavePublishedPhotos = useCallback(() => {
    if (!validateData()) return;

    setIsUploading(true);
    const storage = getStorage();
    let completedUploads = 0;

    newPhotos.forEach((photo) => {
      const fileRef = storageRef(storage, `published/${user.id}/${photo.name}`);
      const uploadTask = uploadBytesResumable(fileRef, photo);

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
          setErrorMessages([
            ...errorMessages,
            `Erro ao carregar a foto "${photo.name}": ${error.message}`,
          ]);
          setIsUploading(false);
        },
        async () => {
          try {
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

            completedUploads++;
            if (completedUploads === newPhotos.length) {
              setUploadSuccess(true);
              setIsUploading(false);
            }
          } catch (error) {
            setErrorMessages([
              ...errorMessages,
              `Erro ao salvar dados do post "${photo.name}" no Firebase: ${error.message}`,
            ]);
            setIsUploading(false);
          }
        }
      );
    });
  }, [newPhotos, photoDescriptions, user]);

  useEffect(() => {
    if (uploadSuccess) {
      setSnackbarOpen(true);
      setTimeout(() => {
        setNewPhotos([]); // Limpa as fotos após o upload
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
      descriptions[file.name] = ""; // Inicializa descrições vazias
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

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ width: "100%" }} className="upload-photo space-y-4">
        {/* Input de Arquivos */}
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          aria-label="Selecionar fotos"
        />

        {/* Mensagens de Erro */}
        {errorMessages.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessages.map((message, index) => (
              <Typography key={index} variant="body2">
                {message}
              </Typography>
            ))}
          </Alert>
        )}

        {/* Lista de Fotos */}
        {newPhotos.length > 0 && (
          <Box className="photo-list space-y-6">
            {newPhotos.map((photo, index) => (
              <Box
                key={index}
                sx={{ display: "flex", alignItems: "flex-start" }}
              >
                <img
                  src={photoPreviews[photo.name]}
                  alt={photo.name}
                  className="w-20 h-20 object-cover rounded-lg border border-gray-300 shadow-sm"
                  aria-label={`Preview da foto ${photo.name}`}
                />
                <Box sx={{ flex: 1, ml: 2 }}>
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    fontWeight="bold"
                  >
                    {photo.name}
                  </Typography>
                  <ReactQuill
                    value={photoDescriptions[photo.name] || ""}
                    onChange={(value) =>
                      handleDescriptionChange(value, photo.name)
                    }
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
                    style={{ marginTop: 16, height: "150px" }}
                  />
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress[photo.name] || 0}
                    sx={{
                      mt: 2,
                      backgroundColor: "#e0e0e0",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor:
                          uploadProgress[photo.name] === 100
                            ? "#4caf50"
                            : "#2196f3",
                      },
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Botão de Upload */}
        <Button
          onClick={handleSavePublishedPhotos}
          variant="contained"
          color="primary"
          disabled={isUploading}
          sx={{
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: "bold",
            textTransform: "none",
          }}
        >
          {isUploading ? "Carregando..." : "Upload Novas Fotos"}
        </Button>

        {/* SnackBar de Sucesso */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleCloseSnackbar}
        >
          <Alert onClose={handleCloseSnackbar} severity="success">
            Upload concluído com sucesso!
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default PostInputDesk;
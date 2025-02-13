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
  const [uploadProgress, setUploadProgress] = useState({}); // Progresso do upload
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [allUploadsComplete, setAllUploadsComplete] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessages, setErrorMessages] = useState([]);

  // Função para salvar fotos publicadas no Firebase
  const handleSavePublishedPhotos = useCallback(() => {
    if (!user || !user.id) {
      setErrorMessages(["Usuário não definido ou ID do usuário ausente"]);
      return;
    }

    if (newPhotos.length === 0) {
      setErrorMessages(["Nenhuma foto selecionada para upload."]);
      return;
    }

    // Verifica se todas as fotos têm descrições
    const missingDescriptions = newPhotos.filter(
      (photo) => !photoDescriptions[photo.name]
    );
    if (missingDescriptions.length > 0) {
      setErrorMessages([
        `As seguintes fotos não possuem descrição: ${missingDescriptions
          .map((photo) => photo.name)
          .join(", ")}`,
      ]);
      return;
    }

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
        () => {
          getDownloadURL(uploadTask.snapshot.ref)
            .then((url) => {
              const description = photoDescriptions[photo.name];
              const newPostRef = push(ref(db, "posts"));
              const postId = newPostRef.key;

              const postData = {
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
              };

              set(newPostRef, postData)
                .then(() => {
                  completedUploads++;
                  if (completedUploads === newPhotos.length) {
                    setAllUploadsComplete(true);
                    setIsUploading(false);
                  }
                })
                .catch((error) => {
                  setErrorMessages([
                    ...errorMessages,
                    `Erro ao salvar dados do post "${photo.name}" no Firebase: ${error.message}`,
                  ]);
                  setIsUploading(false);
                });
            })
            .catch((error) => {
              setErrorMessages([
                ...errorMessages,
                `Erro ao obter URL da foto "${photo.name}": ${error.message}`,
              ]);
              setIsUploading(false);
            });
        }
      );
    });
  }, [newPhotos, photoDescriptions, user]);

  useEffect(() => {
    if (allUploadsComplete) {
      setSnackbarOpen(true);
      setTimeout(() => {
        window.location.reload(); // Recarrega a página após o upload completo
      }, 3000);
    }
  }, [allUploadsComplete]);

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleFileChange = (event) => {
    const files = Array.from(event.target.files);
    setNewPhotos(files);

    const previews = {};
    files.forEach((file) => {
      previews[file.name] = URL.createObjectURL(file);
    });
    setPhotoPreviews(previews);
    setPhotoDescriptions((prevDescriptions) =>
      files.reduce(
        (acc, file) => ({
          ...acc,
          [file.name]: prevDescriptions[file.name] || "",
        }),
        {}
      )
    );
  };

  const handleDescriptionChange = (value, photoName) => {
    setPhotoDescriptions((prevDescriptions) => ({
      ...prevDescriptions,
      [photoName]: value,
    }));
  };

  return (
    <div className="p-4">
      <Box sx={{ width: "100%" }} className="upload-photo space-y-4">
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          disabled={isUploading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          aria-label="Selecionar fotos"
        />
        {errorMessages.length > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessages.map((message, index) => (
              <Typography key={index} variant="body2">
                {message}
              </Typography>
            ))}
          </Alert>
        )}
        {newPhotos.length > 0 && (
          <div className="photo-list space-y-6">
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
          </div>
        )}
        <Button
          onClick={handleSavePublishedPhotos}
          variant="contained"
          color="primary"
          disabled={isUploading || errorMessages.length > 0}
          sx={{
            padding: "10px 20px",
            borderRadius: "8px",
            fontWeight: "bold",
            textTransform: "none",
          }}
        >
          {isUploading ? "Carregando..." : "Upload Novas Fotos"}
        </Button>
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
    </div>
  );
};

export default PostInputDesk;
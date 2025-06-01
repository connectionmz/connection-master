import React, { useState, useEffect } from 'react';
import { CameraAlt, Edit, ExitToApp, LocationOn, Save } from "@mui/icons-material";
import { useNavigate } from 'react-router-dom';
import { get, ref, update } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { auth, db, storage } from '../../fb';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Box, 
  Typography, 
  Avatar, 
  IconButton, 
  Button, 
  Snackbar, 
  Alert, 
  CircularProgress,
  Select,
  MenuItem,
  Paper,
  Stack
} from "@mui/material";

const ProfileDeskSingular = ({ userI }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [profilePhoto, setProfilePhoto] = useState('');
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [provinceTemp, setProvinceTemp] = useState('');

  const user = auth.currentUser?.uid;

  // Busca dados do usuário
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        try {
          const companyRef = ref(db, `company/${user}`);
          const companySnapshot = await get(companyRef);

          if (companySnapshot.exists()) {
            const companyData = companySnapshot.val();
            setUserData({
              ...companyData,
              photoURL: companyData.logoUrl || "https://via.placeholder.com/150",
              displayName: companyData.nome || 'Sem nome',
            });
            setProvinceTemp(companyData.provincia || companyData.provinciaTemp || 'Maputo');
          }
        } catch (error) {
          console.error('Erro ao carregar dados:', error);
          navigate('/auth');
        }
      };
      fetchData();
    } else {
      navigate('/auth');
    }
  }, [user, navigate]);

  // Atualiza foto de perfil
  const handleProfilePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingProfile(true);
    try {
      const storageRef = ref(storage, `profile_photos/${user}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // Atualiza no banco de dados
      const companyRef = ref(db, `company/${user}`);
      await update(companyRef, { logoUrl: photoURL });
      
      setProfilePhoto(photoURL);
      setSnackbar({ open: true, message: 'Foto atualizada!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao atualizar foto.', severity: 'error' });
    } finally {
      setIsUploadingProfile(false);
    }
  };

  // Atualiza localização
  const saveProvince = async () => {
    try {
      const companyRef = ref(db, `company/${user}`);
      await update(companyRef, { provinciaTemp: provinceTemp });
      setSnackbar({ open: true, message: 'Localização atualizada!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao atualizar localização.', severity: 'error' });
    }
  };

  // Logout
  const handleLogout = () => {
    signOut(auth)
      .then(() => navigate('/auth'))
      .catch((error) => {
        setSnackbar({ open: true, message: 'Erro ao sair.', severity: 'error' });
      });
  };

  // Fecha Snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (!userData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box width="100%" minHeight="100vh" p={4}>
      {/* Foto de Perfil */}
      <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
        <Avatar
          src={profilePhoto || userData.photoURL}
          alt="Profile"
          sx={{ width: 128, height: 128 }}
        />
      </Box>

      {/* Nome e Informações */}
      <Box textAlign="center" mt={4}>
        <Typography variant="h5">{userData.displayName}</Typography>
        
        {/* Seletor de Localização */}
        <Paper sx={{ p: 2, mt: 3, maxWidth: 300, mx: 'auto' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LocationOn color="primary" />
            <Select
              value={provinceTemp}
              onChange={(e) => setProvinceTemp(e.target.value)}
              variant="standard"
              disableUnderline
              sx={{ flexGrow: 1 }}
            >
              {[
                "Maputo", "Gaza", "Inhambane", "Sofala", "Manica", "Tete",
                "Zambézia", "Nampula", "Cabo Delgado", "Niassa",
              ].map((prov) => (
                <MenuItem key={prov} value={prov}>
                  {prov}
                </MenuItem>
              ))}
            </Select>
            <IconButton onClick={saveProvince} color="primary">
              <Save />
            </IconButton>
          </Stack>
        </Paper>

        {/* Botões de Ação */}
        <Stack direction="column" spacing={2} mt={4} sx={{ maxWidth: 300, mx: 'auto' }}>
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => navigate('/editar-meuperfil')}
            fullWidth
          >
            Editar Perfil
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<ExitToApp />}
            onClick={handleLogout}
            fullWidth
          >
            Sair
          </Button>
        </Stack>
      </Box>

      {/* Snackbar para feedback */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ProfileDeskSingular;
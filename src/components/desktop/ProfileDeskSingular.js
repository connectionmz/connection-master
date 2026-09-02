import { useEffect, useState } from 'react';
import { Edit, ExitToApp, LocationOn, PhotoCamera, Save } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { ref, update } from 'firebase/database';
import { getDownloadURL, ref as createStorageRef, uploadBytes } from 'firebase/storage';
import {
  Alert, Avatar, Box, Button, CircularProgress, Container, IconButton,
  MenuItem, Paper, Select, Snackbar, Stack, Typography,
} from '@mui/material';
import { db, storage } from '../../fb';
import { useLanguage } from '../../context/LanguageContext';
import { useUser } from '../../context/UserContext';

const PROVINCES = [
  'Maputo Cidade', 'Maputo Província', 'Gaza', 'Inhambane', 'Sofala',
  'Manica', 'Tete', 'Zambézia', 'Nampula', 'Cabo Delgado', 'Niassa',
];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ProfileDeskSingular = ({ user }) => {
  const navigate = useNavigate();
  const { signOut } = useUser();
  const { t } = useLanguage();
  const [province, setProvince] = useState(user?.provincia || 'Maputo Cidade');
  const [uploading, setUploading] = useState(false);
  const [savingProvince, setSavingProvince] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => setProvince(user?.provincia || 'Maputo Cidade'), [user?.provincia]);

  const showMessage = (message, severity) => setSnackbar({ open: true, message, severity });

  const handleProfilePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !user?.id) return;
    if (!file.type.startsWith('image/') || file.size > MAX_IMAGE_SIZE) {
      showMessage(t('personalProfile.invalidPhoto'), 'error');
      return;
    }

    setUploading(true);
    try {
      const imageRef = createStorageRef(storage, `profile_photos/${user.id}`);
      await uploadBytes(imageRef, file, { contentType: file.type });
      const logoUrl = await getDownloadURL(imageRef);
      await update(ref(db, `company/${user.id}`), { logoUrl });
      showMessage(t('personalProfile.photoSuccess'), 'success');
    } catch (error) {
      console.error('Erro ao atualizar foto do perfil:', error);
      showMessage(t('personalProfile.photoError'), 'error');
    } finally {
      setUploading(false);
    }
  };

  const saveProvince = async () => {
    if (!user?.id || savingProvince || province === user?.provincia) return;
    setSavingProvince(true);
    try {
      await update(ref(db, `company/${user.id}`), { provincia: province });
      showMessage(t('personalProfile.locationSuccess'), 'success');
    } catch (error) {
      console.error('Erro ao atualizar localização:', error);
      showMessage(t('personalProfile.locationError'), 'error');
    } finally {
      setSavingProvince(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Erro ao terminar sessão:', error);
      showMessage(t('personalProfile.logoutError'), 'error');
    }
  };

  if (!user) return <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 3, md: 6 } }}>
      <Paper component="section" aria-labelledby="personal-profile-title" variant="outlined" sx={{ p: { xs: 2.5, sm: 4 }, borderRadius: 3 }}>
        <Stack alignItems="center" spacing={2.5}>
          <Box sx={{ position: 'relative' }}>
            <Avatar src={user.logoUrl || user.photoURL} alt={user.nome || t('personalProfile.defaultName')} sx={{ width: 128, height: 128 }} />
            <IconButton component="label" disabled={uploading} aria-label={t('personalProfile.changePhoto')} sx={{ position: 'absolute', right: -4, bottom: -4, bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }}>
              {uploading ? <CircularProgress size={22} color="inherit" /> : <PhotoCamera />}
              <input hidden type="file" accept="image/*" onChange={handleProfilePhotoChange} />
            </IconButton>
          </Box>

          <Box textAlign="center">
            <Typography id="personal-profile-title" component="h1" variant="h4" fontWeight={700}>{user.nome || t('personalProfile.defaultName')}</Typography>
            {user.email && <Typography color="text.secondary">{user.email}</Typography>}
          </Box>

          <Paper variant="outlined" sx={{ p: 2, width: '100%' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <LocationOn color="primary" aria-hidden="true" />
              <Select value={province} onChange={(event) => setProvince(event.target.value)} inputProps={{ 'aria-label': t('personalProfile.province') }} sx={{ flex: 1 }} size="small">
                {PROVINCES.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}
              </Select>
              <IconButton onClick={saveProvince} color="primary" disabled={savingProvince || province === user.provincia} aria-label={t('personalProfile.saveProvince')}>
                {savingProvince ? <CircularProgress size={22} /> : <Save />}
              </IconButton>
            </Stack>
          </Paper>

          <Stack spacing={1.5} width="100%">
            <Button variant="contained" startIcon={<Edit />} onClick={() => navigate('/editar-perfil')} fullWidth>{t('profile.edit')}</Button>
            <Button variant="outlined" color="error" startIcon={<ExitToApp />} onClick={handleLogout} fullWidth>{t('personalProfile.logout')}</Button>
          </Stack>
        </Stack>
      </Paper>

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar(current => ({ ...current, open: false }))}>
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfileDeskSingular;

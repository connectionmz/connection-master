import { useEffect, useState } from 'react';
import { Alert, Box, Button, Container, Paper, Snackbar, Tab, Tabs, TextField, Typography } from '@mui/material';
import { ref, update } from 'firebase/database';
import { db } from '../../fb';
import { useLanguage } from '../../context/LanguageContext';
import BackButton from '../BackButton';
import ChangePassword from '../password/ChangePassword';

const getInitialData = (user) => ({
  nome: user?.nome || '',
  contacto: user?.contacto || '',
  endereco: user?.endereco || '',
});

const EditProfileDeskSingular = ({ user }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState(() => getInitialData(user));
  const [tabIndex, setTabIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => setFormData(getInitialData(user)), [user]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData(current => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user?.id || saving) {
      if (!user?.id) setSnackbar({ open: true, message: t('profileEdit.userMissing'), severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      await update(ref(db, `company/${user.id}`), {
        nome: formData.nome.trim().slice(0, 120),
        contacto: formData.contacto.trim().slice(0, 30),
        endereco: formData.endereco.trim().slice(0, 250),
      });
      setSnackbar({ open: true, message: t('profileEdit.saveSuccess'), severity: 'success' });
    } catch (error) {
      console.error('Erro ao atualizar perfil singular:', error);
      setSnackbar({ open: true, message: t('profileEdit.saveError'), severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      <BackButton sx={{ mb: 2 }} />
      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5" fontWeight={700}>{t('profileEdit.title')}</Typography>
        </Box>
        <Tabs
          value={tabIndex}
          onChange={(_, value) => setTabIndex(value)}
          variant="fullWidth"
          aria-label={t('profileEdit.title')}
        >
          <Tab label={t('profileEdit.tabs.profile')} />
          <Tab label={t('profileEdit.tabs.password')} />
        </Tabs>

        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {tabIndex === 0 ? (
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
              <TextField
                required
                label={t('profileEdit.name')}
                name="nome"
                value={formData.nome}
                onChange={handleInputChange}
                inputProps={{ maxLength: 120 }}
              />
              <TextField
                label={t('profile.contact')}
                name="contacto"
                value={formData.contacto}
                onChange={handleInputChange}
                inputProps={{ maxLength: 30 }}
              />
              <TextField
                label={t('profile.address')}
                name="endereco"
                value={formData.endereco}
                onChange={handleInputChange}
                inputProps={{ maxLength: 250 }}
              />
              <Button type="submit" variant="contained" disabled={saving || !formData.nome.trim()}>
                {saving ? t('postEdit.saving') : t('profileEdit.save')}
              </Button>
            </Box>
          ) : <ChangePassword />}
        </Box>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(current => ({ ...current, open: false }))}
      >
        <Alert severity={snackbar.severity} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default EditProfileDeskSingular;

import { useEffect, useState } from 'react';
import { onValue, push, ref, remove, update } from 'firebase/database';
import {
  Alert, Box, Button, Card, CardActions, CardContent, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  MenuItem, Stack, Tab, Tabs, TextField, Typography,
} from '@mui/material';
import { Add, DeleteOutline, EditOutlined } from '@mui/icons-material';
import { db } from '../fb';
import { useLanguage } from '../context/LanguageContext';

const BANKS = [
  ['BCI', 'Banco Comercial e de Investimentos (BCI)'],
  ['BIM', 'Millennium BIM'],
  ['FNB', 'First National Bank (FNB)'],
  ['Standard Bank', 'Standard Bank'],
  ['ABSA', 'ABSA Bank Moçambique'],
];

const emptyForm = (name = '') => ({
  banco: 'BCI', numeroConta: '', titularConta: name, nib: '', iban: '',
});

export const sanitizeBankDetails = (data) => ({
  banco: String(data.banco || 'BCI').trim().slice(0, 60),
  numeroConta: String(data.numeroConta || '').replace(/\s+/g, '').slice(0, 34),
  titularConta: String(data.titularConta || '').trim().slice(0, 120),
  nib: String(data.nib || '').replace(/\s+/g, '').slice(0, 34),
  iban: String(data.iban || '').replace(/\s+/g, '').toUpperCase().slice(0, 34),
});

const DadosBancarios = ({ user }) => {
  const { t } = useLanguage();
  const [formData, setFormData] = useState(() => emptyForm(user?.nome));
  const [bankDetails, setBankDetails] = useState([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [feedback, setFeedback] = useState({ message: '', severity: 'success' });

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      setFeedback({ message: t('bank.userMissing'), severity: 'error' });
      return undefined;
    }

    setLoading(true);
    const detailsRef = ref(db, `company/${user.id}/bankDetails`);
    return onValue(detailsRef, (snapshot) => {
      const data = snapshot.val();
      setBankDetails(data
        ? Object.entries(data).map(([id, value]) => ({ id, ...value }))
        : []);
      setLoading(false);
    }, (error) => {
      console.error('Erro ao carregar dados bancários:', error);
      setFeedback({ message: t('bank.loadError'), severity: 'error' });
      setLoading(false);
    });
  }, [t, user?.id]);

  useEffect(() => {
    if (!editId) setFormData((current) => ({ ...current, titularConta: current.titularConta || user?.nome || '' }));
  }, [editId, user?.nome]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setFeedback({ message: '', severity: 'success' });
  };

  const resetForm = () => {
    setEditId(null);
    setFormData(emptyForm(user?.nome));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleanData = sanitizeBankDetails(formData);
    if (!user?.id) {
      setFeedback({ message: t('bank.userMissing'), severity: 'error' });
      return;
    }
    if (!cleanData.numeroConta || !cleanData.titularConta) {
      setFeedback({ message: t('bank.required'), severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      if (editId) {
        await update(ref(db, `company/${user.id}/bankDetails/${editId}`), cleanData);
        setFeedback({ message: t('bank.updateSuccess'), severity: 'success' });
      } else {
        await push(ref(db, `company/${user.id}/bankDetails`), cleanData);
        setFeedback({ message: t('bank.createSuccess'), severity: 'success' });
      }
      resetForm();
      setTab(1);
    } catch (error) {
      console.error('Erro ao guardar dados bancários:', error);
      setFeedback({ message: t('bank.saveError'), severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (details) => {
    setEditId(details.id);
    setFormData(sanitizeBankDetails(details));
    setFeedback({ message: '', severity: 'success' });
    setTab(0);
  };

  const handleDelete = async () => {
    if (!user?.id || !deleteId) return;
    setSaving(true);
    try {
      await remove(ref(db, `company/${user.id}/bankDetails/${deleteId}`));
      setFeedback({ message: t('bank.deleteSuccess'), severity: 'success' });
      if (editId === deleteId) resetForm();
    } catch (error) {
      console.error('Erro ao remover dados bancários:', error);
      setFeedback({ message: t('bank.deleteError'), severity: 'error' });
    } finally {
      setDeleteId(null);
      setSaving(false);
    }
  };

  return (
    <Box component="section" aria-labelledby="bank-details-title" sx={{ maxWidth: 760, mx: 'auto' }}>
      <Typography id="bank-details-title" component="h2" variant="h5" fontWeight={700} gutterBottom>{t('bank.title')}</Typography>
      <Typography color="text.secondary" sx={{ mb: 2 }}>{t('bank.description')}</Typography>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} aria-label={t('bank.title')} variant="fullWidth" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab icon={<Add />} iconPosition="start" label={editId ? t('bank.editTab') : t('bank.addTab')} />
        <Tab label={t('bank.listTab')} />
      </Tabs>

      {feedback.message && <Alert severity={feedback.severity} sx={{ mb: 2 }}>{feedback.message}</Alert>}

      {tab === 0 ? (
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'grid', gap: 2 }}>
          <TextField select required label={t('bank.bank')} name="banco" value={formData.banco} onChange={handleChange}>
            {BANKS.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
          <TextField required label={t('bank.accountNumber')} name="numeroConta" value={formData.numeroConta} onChange={handleChange} inputProps={{ maxLength: 34, inputMode: 'numeric' }} />
          <TextField required label={t('bank.accountHolder')} name="titularConta" value={formData.titularConta} onChange={handleChange} inputProps={{ maxLength: 120 }} />
          <TextField label={t('bank.nib')} name="nib" value={formData.nib} onChange={handleChange} inputProps={{ maxLength: 34, inputMode: 'numeric' }} />
          <TextField label={t('bank.iban')} name="iban" value={formData.iban} onChange={handleChange} inputProps={{ maxLength: 34, style: { textTransform: 'uppercase' } }} />
          <Stack direction={{ xs: 'column-reverse', sm: 'row' }} justifyContent="flex-end" gap={1.5}>
            {editId && <Button onClick={resetForm} disabled={saving}>{t('common.cancel')}</Button>}
            <Button type="submit" variant="contained" disabled={saving} startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}>{saving ? t('bank.saving') : editId ? t('bank.update') : t('bank.add')}</Button>
          </Stack>
        </Box>
      ) : loading ? (
        <Box sx={{ py: 6, display: 'grid', placeItems: 'center' }}><CircularProgress aria-label={t('bank.loading')} /></Box>
      ) : bankDetails.length ? (
        <Stack spacing={2}>
          {bankDetails.map((details) => (
            <Card key={details.id} variant="outlined">
              <CardContent>
                <Typography variant="h6" fontWeight={700}>{details.banco}</Typography>
                <Typography><strong>{t('bank.accountNumber')}:</strong> {details.numeroConta}</Typography>
                <Typography><strong>{t('bank.accountHolder')}:</strong> {details.titularConta}</Typography>
                {details.nib && <Typography><strong>{t('bank.nib')}:</strong> {details.nib}</Typography>}
                {details.iban && <Typography><strong>{t('bank.iban')}:</strong> {details.iban}</Typography>}
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                <Button startIcon={<EditOutlined />} onClick={() => handleEdit(details)}>{t('common.edit')}</Button>
                <Button color="error" startIcon={<DeleteOutline />} onClick={() => setDeleteId(details.id)}>{t('common.delete')}</Button>
              </CardActions>
            </Card>
          ))}
        </Stack>
      ) : <Alert severity="info">{t('bank.empty')}</Alert>}

      <Dialog open={Boolean(deleteId)} onClose={() => !saving && setDeleteId(null)} aria-labelledby="delete-bank-title">
        <DialogTitle id="delete-bank-title">{t('bank.deleteTitle')}</DialogTitle>
        <DialogContent><DialogContentText>{t('bank.deleteDescription')}</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={saving}>{t('common.cancel')}</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={saving}>{t('common.delete')}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DadosBancarios;

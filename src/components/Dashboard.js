import { useEffect, useState } from 'react';
import { get, ref, update } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { alpha } from '@mui/material/styles';
import {
  Alert, Box, Button, CircularProgress, Container, Dialog, DialogActions,
  DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import { BusinessOutlined, RequestQuoteOutlined, Search, StorefrontOutlined } from '@mui/icons-material';
import { db } from '../fb';
import { useLanguage } from '../context/LanguageContext';
import StorieListDesk from './desktop/StorieListDesk';
import StoresDesk from './desktop/StoresDesk';
import { buildDashboardSearchPath, normalizeProvincePreference } from '../utils/dashboardNavigation';

const POPULAR_SECTORS = ['Construção', 'TI & Software', 'Logística', 'Consultoria'];

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [provinces, setProvinces] = useState([]);
  const [selectedProvince, setSelectedProvince] = useState('national');
  const [savingProvince, setSavingProvince] = useState(false);
  const [provinceError, setProvinceError] = useState('');
  const provincePromptOpen = Boolean(user?.id && !user?.provincia);

  useEffect(() => {
    let active = true;
    get(ref(db, 'provincias'))
      .then((snapshot) => { if (active) setProvinces(snapshot.val() || []); })
      .catch((error) => { console.error('Erro ao carregar províncias:', error); if (active) setProvinceError(t('dashboard.provinceLoadError')); });
    return () => { active = false; };
  }, [t]);

  const handleSearch = (event) => {
    event.preventDefault();
    navigate(buildDashboardSearchPath(query));
  };

  const saveProvincePreference = async () => {
    if (!user?.id || savingProvince) return;
    setSavingProvince(true);
    setProvinceError('');
    try {
      await update(ref(db, `company/${user.id}`), {
        provincia: normalizeProvincePreference(selectedProvince),
      });
    } catch (error) {
      console.error('Erro ao guardar província:', error);
      setProvinceError(t('dashboard.provinceError'));
    } finally {
      setSavingProvince(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box sx={{ position: 'relative', overflow: 'hidden', py: { xs: 7, md: 11 }, color: '#fff', background: 'linear-gradient(160deg,#08192E 0%,#0E2849 55%,#183A63 100%)' }}>
        <Box aria-hidden="true" sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 85% 15%,rgba(200,144,58,.18),transparent 38%)' }} />
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Typography variant="overline" sx={{ color: '#E8B96A', fontWeight: 700 }}>{t('dashboard.eyebrow')}</Typography>
          <Typography component="h1" sx={{ mt: 1, maxWidth: 760, fontWeight: 800, fontSize: { xs: '2.25rem', md: '3.6rem' }, lineHeight: 1.08 }}>{t('dashboard.title')}</Typography>
          <Typography sx={{ mt: 2, mb: 4, maxWidth: 660, color: 'rgba(255,255,255,.76)', fontSize: { xs: '1rem', md: '1.1rem' } }}>{t('dashboard.description')}</Typography>

          <Box component="form" role="search" onSubmit={handleSearch} sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.25, maxWidth: 760 }}>
            <TextField fullWidth value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('dashboard.searchPlaceholder')} inputProps={{ 'aria-label': t('dashboard.searchLabel') }} InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} /> }} sx={{ bgcolor: 'background.paper', borderRadius: 1 }} />
            <Button type="submit" variant="contained" startIcon={<Search />} sx={{ px: 4, bgcolor: '#C8903A', color: '#fff', '&:hover': { bgcolor: '#E8B96A' } }}>{t('dashboard.search')}</Button>
          </Box>

          <Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{ mt: 2.5 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,.65)' }}>{t('dashboard.popular')}</Typography>
            {POPULAR_SECTORS.map((sector) => <Button key={sector} size="small" onClick={() => navigate(`/explorar?sector=${encodeURIComponent(sector)}`)} sx={{ color: '#fff', border: '1px solid rgba(255,255,255,.25)', borderRadius: 99, textTransform: 'none', '&:hover': { bgcolor: '#C8903A', borderColor: '#C8903A' } }}>{sector}</Button>)}
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}>
            <Button variant="outlined" startIcon={<BusinessOutlined />} onClick={() => navigate('/explorar')} sx={{ color: '#fff', borderColor: alpha('#fff', 0.45) }}>{t('dashboard.exploreCompanies')}</Button>
            <Button variant="outlined" startIcon={<StorefrontOutlined />} onClick={() => navigate('/lojas')} sx={{ color: '#fff', borderColor: alpha('#fff', 0.45) }}>{t('dashboard.exploreStores')}</Button>
            {user && <Button variant="outlined" startIcon={<RequestQuoteOutlined />} onClick={() => navigate('/cotacao')} sx={{ color: '#fff', borderColor: alpha('#fff', 0.45) }}>{t('dashboard.requestQuote')}</Button>}
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}><StorieListDesk user={user} /></Container>
      <StoresDesk user={user} />

      <Dialog open={provincePromptOpen} disableEscapeKeyDown aria-labelledby="province-prompt-title">
        <DialogTitle id="province-prompt-title">{t('dashboard.provinceTitle')}</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }}>{t('dashboard.provinceDescription')}</Typography>
          {provinceError && <Alert severity="error" sx={{ mb: 2 }}>{provinceError}</Alert>}
          <TextField select fullWidth label={t('explore.province')} value={selectedProvince} onChange={(event) => setSelectedProvince(event.target.value)}>
            <MenuItem value="national">{t('dashboard.national')}</MenuItem>
            {provinces.map((item) => <MenuItem key={item.provincia} value={item.provincia}>{item.provincia}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions><Button variant="contained" onClick={saveProvincePreference} disabled={savingProvince} startIcon={savingProvince ? <CircularProgress size={18} color="inherit" /> : undefined}>{savingProvince ? t('dashboard.savingProvince') : t('dashboard.confirmProvince')}</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default Dashboard;

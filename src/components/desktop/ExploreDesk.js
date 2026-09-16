import { useEffect, useMemo, useState } from 'react';
import { get, ref } from 'firebase/database';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import {
  Alert, Avatar, Box, Button, Card, CardActionArea, Chip, CircularProgress,
  Container, Dialog, DialogActions, DialogContent, DialogTitle, Grid,
  IconButton, MenuItem, Pagination, Stack, TextField, Typography,
} from '@mui/material';
import { Business, Category, Close, LocationOn, Search, Tune } from '@mui/icons-material';
import { db } from '../../fb';
import { useLanguage } from '../../context/LanguageContext';
import { filterCompanyDirectory } from '../../utils/companyDirectory';
import { loadPublicCompanyDirectory } from '../../services/companyDirectory';

const EMPTY_FILTERS = { sector: '', subsector: '', province: '', district: '', entityType: '' };
const PAGE_SIZE = 24;
const createExploreTokens = (theme) => ({
  navy: '#08192E', navyMid: '#0E2849', navyLight: '#183A63',
  gold: '#C8903A', goldLight: '#E8B96A', goldPale: theme.palette.mode === 'dark' ? alpha('#C8903A', 0.16) : '#FDF3E3',
  white: '#FFFFFF', text: theme.palette.text.primary, textSub: theme.palette.text.secondary,
  borderMid: theme.palette.divider, surface: theme.palette.background.default,
  card: theme.palette.background.paper,
});
const KEYFRAMES = (T) => `
  @keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .afu{animation:fadeUp .65s cubic-bezier(.22,1,.36,1) both}.afi{animation:fadeIn .5s ease both}
  .d1{animation-delay:.10s}.d2{animation-delay:.22s}.d3{animation-delay:.34s}.d4{animation-delay:.46s}
  .feature-card{transition:transform .25s ease,border-color .25s ease,box-shadow .25s ease}
  .feature-card:hover,.feature-card:focus-within{transform:translateY(-4px);border-color:${T.gold}!important;box-shadow:0 16px 48px rgba(8,25,46,.15)!important}
  .cta-btn{transition:background .2s,transform .2s}.cta-btn:hover{background:${T.goldLight}!important;transform:translateY(-1px)}
  @media(prefers-reduced-motion:reduce){.afu,.afi,.feature-card,.cta-btn{animation:none!important;transition:none!important;transform:none!important}}
`;

const ExploreDesk = () => {
  const theme = useTheme();
  const T = useMemo(() => createExploreTokens(theme), [theme]);
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState([]);
  const [references, setReferences] = useState({ provinces: [], sectors: [], entityTypes: [] });
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(() => ({ ...EMPTY_FILTERS, sector: searchParams.get('sector') || '' }));
  const [draft, setDraft] = useState(EMPTY_FILTERS);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterLoading, setFilterLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    Promise.all([loadPublicCompanyDirectory(db), get(ref(db, 'provincias')), get(ref(db, 'sectores_de_atividade')), get(ref(db, 'tipos_entidades'))])
      .then(([directory, provincesSnap, sectorsSnap, typesSnap]) => {
        if (!active) return;
        setCompanies(directory);
        setReferences({ provinces: provincesSnap.val() || [], sectors: sectorsSnap.val() || [], entityTypes: typesSnap.val() || [] });
      })
      .catch((loadError) => { console.error('Erro ao carregar diretório:', loadError); if (active) setError(t('explore.loadError')); })
      .finally(() => { if (active) { setLoading(false); setFilterLoading(false); } });
    return () => { active = false; };
  }, [t]);

  const subsectors = useMemo(() => references.sectors.find(({ setor }) => setor === draft.sector)?.subsectores || [], [draft.sector, references.sectors]);
  const districts = useMemo(() => references.provinces.find(({ provincia }) => provincia === draft.province)?.distritos || [], [draft.province, references.provinces]);
  const filtered = useMemo(() => filterCompanyDirectory(companies, { ...filters, search }), [companies, filters, search]);
  const pages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeCount = Object.values(filters).filter(Boolean).length;

  useEffect(() => setPage(1), [search, filters]);
  useEffect(() => {
    const sector = searchParams.get('sector') || '';
    setFilters((current) => current.sector === sector ? current : { ...current, sector, subsector: '' });
  }, [searchParams]);

  const openFilters = () => { setDraft(filters); setDialogOpen(true); };
  const clearFilters = () => { setFilters(EMPTY_FILTERS); setDraft(EMPTY_FILTERS); setSearch(''); setSearchParams({}); };
  const setDraftField = (name, value) => setDraft((current) => ({
    ...current, [name]: value,
    ...(name === 'sector' ? { subsector: '' } : {}),
    ...(name === 'province' ? { district: '' } : {}),
  }));

  if (loading) return <Box sx={{ minHeight: '55vh', display: 'grid', placeItems: 'center' }}><CircularProgress aria-label={t('explore.loading')} /></Box>;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: T.surface }}>
      <style>{KEYFRAMES(T)}</style>
      <Box sx={{ py: { xs: 6, md: 9 }, background: `linear-gradient(160deg,${T.navy} 0%,${T.navyMid} 55%,${T.navyLight} 100%)`, color: T.white }}>
        <Container maxWidth="lg">
          <Typography className="afu" variant="overline" sx={{ color: T.goldLight }}>{t('explore.eyebrow')}</Typography>
          <Typography className="afu d1" component="h1" variant="h3" fontWeight={800} sx={{ maxWidth: 720 }}>{t('explore.title')}</Typography>
          <Typography className="afu d2" sx={{ mt: 1.5, mb: 3, opacity: 0.8, maxWidth: 650 }}>{t('explore.description')}</Typography>
          <Stack className="afu d3" direction={{ xs: 'column', sm: 'row' }} spacing={1.5} maxWidth={760}>
            <TextField fullWidth value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('explore.searchPlaceholder')} inputProps={{ 'aria-label': t('explore.searchLabel') }} InputProps={{ startAdornment: <Search sx={{ mr: 1, color: T.textSub }} /> }} sx={{ bgcolor: T.card, borderRadius: 1 }} />
            <Button className="cta-btn" variant="contained" startIcon={<Tune />} onClick={openFilters} sx={{ bgcolor: T.gold, color: T.white }}>{t('explore.filters')}{activeCount ? ` (${activeCount})` : ''}</Button>
          </Stack>
          {(search || activeCount > 0) && <Button onClick={clearFilters} color="inherit" size="small" sx={{ mt: 1.5 }}>{t('explore.clear')}</Button>}
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 5 }}>
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        <Typography color="text.secondary" sx={{ mb: 3 }}>{t('explore.results', { count: filtered.length })}</Typography>
        {!visible.length ? <Alert severity="info" icon={<Business />}>{t('explore.empty')}</Alert> : (
          <Grid container spacing={2.5}>
            {visible.map((company) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={company.id}>
                <Card className="feature-card" variant="outlined" sx={{ height: '100%', bgcolor: T.card, borderColor: T.borderMid }}>
                  <CardActionArea component={RouterLink} to={`/empresa/${company.id}`} sx={{ height: '100%', p: 2.5 }} aria-label={t('explore.openCompany', { name: company.nome })}>
                    <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
                      <Avatar src={company.logoUrl} alt="" sx={{ width: 56, height: 56, bgcolor: T.goldPale, color: T.gold }}><Business /></Avatar>
                      <Box minWidth={0}><Typography fontWeight={750} noWrap>{company.sigla || company.nome}</Typography>{company.sigla && <Typography variant="body2" color="text.secondary" noWrap>{company.nome}</Typography>}</Box>
                    </Stack>
                    <Stack spacing={1} color="text.secondary">
                      <Stack direction="row" spacing={1}><Category fontSize="small" /><Typography variant="body2" noWrap>{company.sector || t('explore.noSector')}</Typography></Stack>
                      {(company.provincia || company.distrito) && <Stack direction="row" spacing={1}><LocationOn fontSize="small" /><Typography variant="body2" noWrap>{[company.provincia, company.distrito].filter(Boolean).join(' · ')}</Typography></Stack>}
                      {company.tipoEntidade && <Box><Chip label={company.tipoEntidade} size="small" /></Box>}
                    </Stack>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        {pages > 1 && <Pagination count={pages} page={page} onChange={(_, value) => { setPage(value); window.scrollTo({ top: 0, behavior: 'smooth' }); }} sx={{ mt: 5, display: 'flex', justifyContent: 'center' }} />}
      </Container>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>{t('explore.filterTitle')}<IconButton onClick={() => setDialogOpen(false)} aria-label={t('common.close')}><Close /></IconButton></DialogTitle>
        <DialogContent dividers><Stack spacing={2.5} sx={{ pt: 1 }}>
          {filterLoading && <CircularProgress size={24} />}
          <TextField select label={t('explore.province')} value={draft.province} onChange={(e) => setDraftField('province', e.target.value)}><MenuItem value="">{t('explore.all')}</MenuItem>{references.provinces.map((item) => <MenuItem key={item.provincia} value={item.provincia}>{item.provincia}</MenuItem>)}</TextField>
          <TextField select disabled={!draft.province} label={t('explore.district')} value={draft.district} onChange={(e) => setDraftField('district', e.target.value)}><MenuItem value="">{t('explore.all')}</MenuItem>{districts.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
          <TextField select label={t('explore.sector')} value={draft.sector} onChange={(e) => setDraftField('sector', e.target.value)}><MenuItem value="">{t('explore.all')}</MenuItem>{references.sectors.map((item) => <MenuItem key={item.setor} value={item.setor}>{item.setor}</MenuItem>)}</TextField>
          <TextField select disabled={!draft.sector} label={t('explore.subsector')} value={draft.subsector} onChange={(e) => setDraftField('subsector', e.target.value)}><MenuItem value="">{t('explore.all')}</MenuItem>{subsectors.map((item) => <MenuItem key={item} value={item}>{item}</MenuItem>)}</TextField>
          <TextField select label={t('explore.entityType')} value={draft.entityType} onChange={(e) => setDraftField('entityType', e.target.value)}><MenuItem value="">{t('explore.all')}</MenuItem>{references.entityTypes.map((item) => <MenuItem key={item.tipo} value={item.tipo}>{item.tipo}</MenuItem>)}</TextField>
        </Stack></DialogContent>
        <DialogActions><Button onClick={() => setDraft(EMPTY_FILTERS)}>{t('explore.clearFilters')}</Button><Button variant="contained" onClick={() => { setFilters(draft); setSearchParams(draft.sector ? { sector: draft.sector } : {}); setDialogOpen(false); }}>{t('explore.apply')}</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default ExploreDesk;

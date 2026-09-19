import React, { useEffect, useMemo, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../fb';
import {
  Box, Container, Typography, Tabs, Tab, Card, CardContent, Chip, Stack,
  Button, Alert, CircularProgress, Divider, Link as MuiLink,
} from '@mui/material';
import { OpenInNew, Description, Business, AccessTime, AttachMoney } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useActiveModules } from '../../context/ActiveModulesContext';

const GOLD = '#C8903A';
const PAGE_SIZE = 20;

const STATUS_COLORS = {
  aberto: 'success',
  expirado: 'default',
  cancelado: 'error',
  concluido: 'info',
};

const ConcursosPublicosDesk = () => {
  const { t, language } = useLanguage();
  const { isModuleActive } = useActiveModules();
  const [tenders, setTenders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('aberto');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const hasAlerts = isModuleActive('moduloSMS');

  useEffect(() => {
    const tendersRef = ref(db, 'concursos_publicos');
    const unsubscribe = onValue(tendersRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([id, tender]) => ({ id, ...tender }));
      list.sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
      setTenders(list);
      setLoading(false);
    }, () => {
      setError(t('tenders.loadError'));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [t]);

  const filtered = useMemo(
    () => (tab === 'aberto' ? tenders.filter((tender) => tender.status === 'aberto') : tenders),
    [tenders, tab],
  );
  const visible = filtered.slice(0, visibleCount);

  const handleTabChange = (_, value) => {
    setTab(value);
    setVisibleCount(PAGE_SIZE);
  };

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(
    language === 'en' ? 'en-GB' : 'pt-PT',
    { dateStyle: 'medium', timeStyle: 'short' },
  ), [language]);
  const priceFormatter = useMemo(() => new Intl.NumberFormat(
    language === 'en' ? 'en-GB' : 'pt-PT',
    { style: 'currency', currency: 'MZN', maximumFractionDigits: 0 },
  ), [language]);

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={1} sx={{ mb: 3 }}>
        <Typography component="h1" variant="h4" fontWeight={800}>
          {t('tenders.title')}
        </Typography>
        <Typography color="text.secondary">{t('tenders.description')}</Typography>
      </Stack>

      {!hasAlerts && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button component={RouterLink} to="/pagar/moduloSMS" color="inherit" size="small" sx={{ fontWeight: 700 }}>
              {t('tenders.alertCtaButton')}
            </Button>
          }
        >
          {t('tenders.alertCta')}
        </Alert>
      )}

      <Tabs
        value={tab}
        onChange={handleTabChange}
        sx={{ mb: 3, '& .MuiTabs-indicator': { bgcolor: GOLD } }}
      >
        <Tab value="aberto" label={t('tenders.tabOpen')} />
        <Tab value="all" label={t('tenders.tabAll')} />
      </Tabs>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'grid', placeItems: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ py: 7, textAlign: 'center' }}>
            <Typography color="text.secondary">{t('tenders.empty')}</Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {visible.map((tender) => (
            <Card key={tender.id} variant="outlined">
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} sx={{ mb: 1 }}>
                  <Typography variant="h6" fontWeight={700}>{tender.title}</Typography>
                  <Chip
                    size="small"
                    label={t(`tenders.status.${tender.status}`) || tender.status}
                    color={STATUS_COLORS[tender.status] || 'default'}
                  />
                </Stack>

                {tender.buyerName && (
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <Business fontSize="small" color="disabled" />
                    <Typography variant="body2" color="text.secondary">
                      {t('tenders.buyer')}: {tender.buyerName}
                    </Typography>
                  </Stack>
                )}

                {tender.submissionDeadline && (
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                    <AccessTime fontSize="small" color="disabled" />
                    <Typography variant="body2" color="text.secondary">
                      {t('tenders.deadline')}: {dateFormatter.format(new Date(tender.submissionDeadline))}
                    </Typography>
                  </Stack>
                )}

                {tender.valueAmount != null && (
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <AttachMoney fontSize="small" color="disabled" />
                    <Typography variant="body2" color="text.secondary">
                      {t('tenders.value')}: {priceFormatter.format(tender.valueAmount)}
                    </Typography>
                  </Stack>
                )}

                {tender.description && (
                  <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                    {tender.description}
                  </Typography>
                )}

                {tender.documents?.length > 0 && (
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                    {tender.documents.map((doc, index) => (
                      <MuiLink
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: '0.85rem' }}
                      >
                        <Description fontSize="inherit" /> {doc.title || t('tenders.documents')}
                      </MuiLink>
                    ))}
                  </Stack>
                )}

                <Divider sx={{ my: 2 }} />

                <Button
                  href={tender.sourceUrl || 'https://ufsa.dotcom.co.mz/concursos'}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  endIcon={<OpenInNew fontSize="small" />}
                  sx={{ color: GOLD }}
                >
                  {t('tenders.viewSource')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {!loading && visible.length < filtered.length && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button variant="outlined" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
            {t('tenders.loadMore', { shown: visible.length, total: filtered.length })}
          </Button>
        </Box>
      )}
    </Container>
  );
};

export default ConcursosPublicosDesk;

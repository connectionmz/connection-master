import React, { useEffect, useMemo, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../fb';
import {
  Box, Container, Typography, Tabs, Tab, Chip, Stack,
  Button, Alert, CircularProgress, Divider, Link as MuiLink, Paper,
} from '@mui/material';
import { OpenInNew, Description, Business, AccessTime, AttachMoney, Gavel } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useActiveModules } from '../../context/ActiveModulesContext';

/* ── Design tokens (mesmos de CotacoesDesk.js, para manter o visual consistente) ── */
const T = {
  navy:        '#08192E',
  navyMid:     '#0E2849',
  navyLight:   '#183A63',
  navyCard:    '#0D2240',
  gold:        '#C8903A',
  goldLight:   '#E8B96A',
  goldPale:    '#FDF3E3',
  white:       '#FFFFFF',
  textSub:     '#6B89A5',
  darkBorder:  'rgba(255,255,255,0.08)',
  darkText:    'rgba(255,255,255,0.88)',
  darkTextSub: 'rgba(255,255,255,0.52)',
  darkMuted:   'rgba(255,255,255,0.30)',
  success:     '#10b981',
  error:       '#ef4444',
  info:        '#3b82f6',
  warning:     '#f59e0b',
};

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .fade-up {
    animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .tender-card {
    background: ${T.navyCard};
    border: 1px solid ${T.darkBorder};
    border-radius: 16px;
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }
  .tender-card:hover {
    transform: translateY(-2px);
    border-color: ${T.gold} !important;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important;
  }
`;

const BG_GRID = {
  position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.02,
  backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)`,
  backgroundSize: '56px 56px',
};

const STATUS_COLORS = {
  aberto: T.success,
  expirado: T.darkMuted,
  cancelado: T.error,
  concluido: T.info,
};

const PAGE_SIZE = 20;

// O scraper grava o estado no momento da recolha; um concurso "aberto" cujo
// prazo já passou tem de aparecer como expirado sem esperar por nova recolha.
const effectiveStatus = (tender) => {
  const deadline = tender.submissionDeadline ? new Date(tender.submissionDeadline).getTime() : NaN;
  return tender.status === 'aberto' && deadline < Date.now() ? 'expirado' : tender.status;
};

const timeOf = (value, fallback) => {
  const ms = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(ms) ? ms : fallback;
};

// A UFSA por vezes publica datas de lançamento no futuro (erro de digitação),
// o que fixaria esses concursos no topo para sempre. Um concurso não pode ter
// sido publicado depois de o vermos pela primeira vez.
const releaseKey = (tender) => Math.min(timeOf(tender.releaseDate, 0), timeOf(tender.firstSeenAt, Infinity));

// Novos primeiro: a UFSA data alguns concursos antes de os listar, por isso
// ordenar só por data de lançamento enterrava-os a meio da lista. Dentro da
// mesma recolha (mesmo firstSeenAt) ordena pela data de lançamento.
const compareTenders = (a, b) =>
  timeOf(b.firstSeenAt, 0) - timeOf(a.firstSeenAt, 0) || releaseKey(b) - releaseKey(a);

const NEW_WINDOW_MS = 48 * 60 * 60 * 1000;
const isNewTender = (tender) => Date.now() - timeOf(tender.firstSeenAt, 0) < NEW_WINDOW_MS;

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
      const list = Object.entries(data).map(([id, tender]) => ({ id, ...tender, status: effectiveStatus(tender) }));
      list.sort(compareTenders);
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: T.navy }}>
        <CircularProgress size={48} thickness={4} sx={{ color: T.gold }} />
      </Box>
    );
  }

  return (
    <Box sx={{
      backgroundColor: T.navy,
      minHeight: '100vh',
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      position: 'relative',
    }}>
      <style>{KEYFRAMES}</style>
      <Box sx={BG_GRID} />

      <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
        {/* Header */}
        <Paper sx={{
          p: 3,
          mb: 3,
          bgcolor: T.navyCard,
          border: `1px solid ${T.darkBorder}`,
          borderRadius: 3,
        }}>
          <Typography
            component="h1"
            variant="h4"
            sx={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 800,
              color: T.white,
              fontSize: { xs: '1.5rem', sm: '2rem' },
            }}
          >
            {t('tenders.title')}
          </Typography>
          <Typography sx={{ color: T.darkTextSub, mt: 1 }}>{t('tenders.description')}</Typography>
        </Paper>

        {!hasAlerts && (
          <Alert
            severity="info"
            icon={<Gavel />}
            sx={{
              mb: 3,
              bgcolor: 'rgba(59,130,246,0.12)',
              color: T.info,
              border: '1px solid rgba(59,130,246,0.25)',
              borderRadius: '12px',
              '& .MuiAlert-icon': { color: T.info },
            }}
            action={
              <Button
                component={RouterLink}
                to="/pagar/moduloSMS"
                size="medium"
                sx={{
                  bgcolor: T.gold,
                  color: T.navy,
                  fontWeight: 700,
                  '&:hover': { bgcolor: T.goldLight },
                  borderRadius: '8px',
                }}
              >
                {t('tenders.alertCtaButton')}
              </Button>
            }
          >
            {t('tenders.alertCta')}
          </Alert>
        )}

        {/* Tabs */}
        <Paper sx={{
          mb: 3,
          bgcolor: T.navyCard,
          border: `1px solid ${T.darkBorder}`,
          borderRadius: 2,
          overflow: 'hidden',
        }}>
          <Tabs
            value={tab}
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                color: T.darkTextSub,
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '0.9rem',
                minHeight: 56,
                '&.Mui-selected': { color: T.gold },
              },
              '& .MuiTabs-indicator': { bgcolor: T.gold },
            }}
          >
            <Tab value="aberto" label={t('tenders.tabOpen')} />
            <Tab value="all" label={t('tenders.tabAll')} />
          </Tabs>
        </Paper>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

        {filtered.length === 0 ? (
          <Paper sx={{
            p: 6,
            textAlign: 'center',
            bgcolor: T.navyCard,
            border: `1px solid ${T.darkBorder}`,
            borderRadius: 3,
          }}>
            <Typography sx={{ color: T.darkTextSub }}>{t('tenders.empty')}</Typography>
          </Paper>
        ) : (
          <Stack spacing={2} className="fade-up">
            {visible.map((tender) => (
              <Box key={tender.id} className="tender-card" sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={1} sx={{ mb: 1.5 }}>
                  <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, color: T.white, fontSize: '1.1rem' }}>
                    {tender.title}
                  </Typography>
                  {isNewTender(tender) && (
                    <Chip
                      size="small"
                      label={t('tenders.new')}
                      sx={{
                        alignSelf: { xs: 'flex-start', sm: 'center' },
                        bgcolor: `${T.gold}25`,
                        color: T.goldLight,
                        border: `1px solid ${T.gold}60`,
                        fontWeight: 700,
                      }}
                    />
                  )}
                  <Chip
                    size="small"
                    label={t(`tenders.status.${tender.status}`) || tender.status}
                    sx={{
                      alignSelf: { xs: 'flex-start', sm: 'center' },
                      bgcolor: `${STATUS_COLORS[tender.status] || T.darkMuted}20`,
                      color: STATUS_COLORS[tender.status] || T.darkTextSub,
                      border: `1px solid ${STATUS_COLORS[tender.status] || T.darkMuted}40`,
                      fontWeight: 600,
                    }}
                  />
                </Stack>

                <Stack spacing={0.75} sx={{ mb: tender.description ? 1.5 : 0 }}>
                  {tender.buyerName && (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Business sx={{ fontSize: 18, color: T.gold }} />
                      <Typography variant="body2" sx={{ color: T.darkTextSub }}>
                        {t('tenders.buyer')}: {tender.buyerName}
                      </Typography>
                    </Stack>
                  )}
                  {tender.submissionDeadline && (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AccessTime sx={{ fontSize: 18, color: T.gold }} />
                      <Typography variant="body2" sx={{ color: T.darkTextSub }}>
                        {t('tenders.deadline')}: {dateFormatter.format(new Date(tender.submissionDeadline))}
                      </Typography>
                    </Stack>
                  )}
                  {tender.valueAmount != null && (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AttachMoney sx={{ fontSize: 18, color: T.gold }} />
                      <Typography variant="body2" sx={{ color: T.darkTextSub }}>
                        {t('tenders.value')}: {priceFormatter.format(tender.valueAmount)}
                      </Typography>
                    </Stack>
                  )}
                </Stack>

                {tender.description && (
                  <Typography variant="body2" sx={{ color: T.darkText, whiteSpace: 'pre-wrap', mb: 1.5 }}>
                    {tender.description}
                  </Typography>
                )}

                {tender.documents?.length > 0 && (
                  <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 1.5 }}>
                    {tender.documents.map((doc, index) => (
                      <MuiLink
                        key={index}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'inline-flex', alignItems: 'center', gap: 0.5,
                          fontSize: '0.85rem', color: T.goldLight,
                          '&:hover': { color: T.gold },
                        }}
                      >
                        <Description fontSize="inherit" /> {doc.title || t('tenders.documents')}
                      </MuiLink>
                    ))}
                  </Stack>
                )}

                <Divider sx={{ my: 1.5, borderColor: T.darkBorder }} />

                <Button
                  href={tender.sourceUrl || 'https://www.ufsa.gov.mz/concursos.php'}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                  endIcon={<OpenInNew fontSize="small" />}
                  sx={{ color: T.gold, textTransform: 'none', fontWeight: 600, '&:hover': { color: T.goldLight } }}
                >
                  {t('tenders.viewSource')}
                </Button>
              </Box>
            ))}
          </Stack>
        )}

        {visible.length < filtered.length && (
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              sx={{
                color: T.gold,
                borderColor: T.darkBorder,
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': { borderColor: T.gold, bgcolor: 'rgba(200,144,58,0.08)' },
              }}
            >
              {t('tenders.loadMore', { shown: visible.length, total: filtered.length })}
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default ConcursosPublicosDesk;

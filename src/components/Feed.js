import React, { useEffect, useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { Alert, Avatar, Box, Button, Card, CardActionArea, CardContent, Chip, CircularProgress, Container, Stack, Typography, alpha } from '@mui/material';
import AccessTime from '@mui/icons-material/AccessTime';
import Business from '@mui/icons-material/Business';
import FeedOutlined from '@mui/icons-material/FeedOutlined';
import ImageOutlined from '@mui/icons-material/ImageOutlined';
import { db } from '../fb';
import { useLanguage } from '../context/LanguageContext';

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const toTimestamp = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) return numericValue;
    const parsedValue = Date.parse(value);
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
  }
  return 0;
};

const normalizePost = (postId, value) => {
  const post = value && typeof value === 'object' ? value : {};
  const company = post.company && typeof post.company === 'object' ? post.company : {};
  const companyName = company.name || post.companyName || 'Empresa';

  return {
    id: post.id || postId,
    description: stripHtml(post.description),
    imageUrl: post.url || post.imageUrl || '',
    timestamp: toTimestamp(post.timestamp || post.createdAt),
    company: {
      id: company.id || post.companyId || '',
      name: companyName,
      logo: company.logo || post.logoUrl || '',
      province: company.provincia || post.provincia || '',
    },
  };
};

const Feed = ({ user }) => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [posts, setPosts] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    const unsubscribe = onValue(
      ref(db, 'posts'),
      (snapshot) => {
        const value = snapshot.val();
        const nextPosts = value && typeof value === 'object'
          ? Object.entries(value).map(([postId, post]) => normalizePost(postId, post)).sort((a, b) => b.timestamp - a.timestamp)
          : [];
        setPosts(nextPosts);
        setLoading(false);
      },
      () => {
        setPosts([]);
        setError(t('feed.loadError'));
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [t]);

  const companies = useMemo(() => {
    const uniqueCompanies = new Map();
    posts.forEach(({ company }) => {
      const key = company.id || company.name;
      if (key && !uniqueCompanies.has(key)) uniqueCompanies.set(key, { ...company, key });
    });
    return Array.from(uniqueCompanies.values());
  }, [posts]);

  const visiblePosts = useMemo(() => selectedCompanyId === 'all'
    ? posts
    : posts.filter(({ company }) => (company.id || company.name) === selectedCompanyId), [posts, selectedCompanyId]);

  useEffect(() => {
    if (selectedCompanyId !== 'all' && !companies.some(({ key }) => key === selectedCompanyId)) setSelectedCompanyId('all');
  }, [companies, selectedCompanyId]);

  const formatDate = (timestamp) => {
    if (!timestamp) return t('feed.dateUnknown');
    return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(timestamp));
  };

  return (
    <Box component="main" sx={{ minHeight: 'calc(100vh - 64px)', bgcolor: 'background.default', py: { xs: 2, md: 4 } }}>
      <Container maxWidth="xl">
        <Stack spacing={3}>
          <Box sx={(theme) => ({ p: { xs: 2.5, md: 4 }, borderRadius: 4, color: 'common.white', background: `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})` })}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.14)', width: 52, height: 52 }}><FeedOutlined /></Avatar>
              <Box>
                <Typography component="h1" variant="h4" fontWeight={800}>{t('feed.title')}</Typography>
                <Typography sx={{ mt: 0.5, color: 'rgba(255,255,255,0.78)', maxWidth: 720 }}>{t('feed.description')}</Typography>
              </Box>
            </Stack>
          </Box>

          {companies.length > 0 && (
            <Box component="nav" aria-label={t('feed.companyFilter')} sx={{ overflowX: 'auto', pb: 0.5 }}>
              <Stack direction="row" spacing={1} sx={{ width: 'max-content' }}>
                <Chip clickable color={selectedCompanyId === 'all' ? 'primary' : 'default'} label={t('feed.allCompanies')} onClick={() => setSelectedCompanyId('all')} />
                {companies.map((company) => (
                  <Chip key={company.key} clickable aria-label={`${t('feed.companyFilter')}: ${company.name}`} avatar={<Avatar src={company.logo}>{company.name.charAt(0)}</Avatar>} color={selectedCompanyId === company.key ? 'primary' : 'default'} label={company.name} onClick={() => setSelectedCompanyId(company.key)} />
                ))}
              </Stack>
            </Box>
          )}

          {error && <Alert severity="error" action={<Button color="inherit" onClick={() => window.location.reload()}>{t('feed.retry')}</Button>}>{error}</Alert>}

          {loading ? (
            <Stack alignItems="center" spacing={2} sx={{ py: 8 }} role="status" aria-live="polite">
              <CircularProgress /><Typography color="text.secondary">{t('feed.loading')}</Typography>
            </Stack>
          ) : !error && visiblePosts.length === 0 ? (
            <Stack alignItems="center" spacing={1.5} sx={{ py: 8, px: 2, textAlign: 'center' }}>
              <FeedOutlined sx={{ fontSize: 58, color: 'text.disabled' }} />
              <Typography component="h2" variant="h6" fontWeight={700}>{t('feed.empty')}</Typography>
              <Typography color="text.secondary">{selectedCompanyId === 'all' ? t('feed.emptyHelp') : t('feed.emptyCompany')}</Typography>
            </Stack>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: { xs: 2, md: 3 } }}>
              {visiblePosts.map((post) => (
                <Card key={post.id} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
                  <CardActionArea onClick={() => navigate(`/post/${encodeURIComponent(post.id)}`)} aria-label={`${t('feed.openPost')} ${post.company.name}`} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                    {post.imageUrl ? (
                      <Box component="img" src={post.imageUrl} alt="" loading="lazy" sx={{ width: '100%', aspectRatio: '16 / 10', objectFit: 'cover', bgcolor: 'action.hover' }} />
                    ) : (
                      <Stack alignItems="center" justifyContent="center" sx={{ aspectRatio: '16 / 10', bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08) }}><ImageOutlined sx={{ fontSize: 48, color: 'text.disabled' }} /></Stack>
                    )}
                    <CardContent sx={{ width: '100%', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography sx={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.description || t('feed.noDescription')}</Typography>
                      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mt: 'auto' }}>
                        <Avatar src={post.company.logo} sx={{ width: 36, height: 36 }}>{post.company.name.charAt(0)}</Avatar>
                        <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                          <Typography variant="body2" fontWeight={700} noWrap>{post.company.name}</Typography>
                          <Stack direction="row" alignItems="center" spacing={0.5} color="text.secondary">
                            {post.company.province ? <Business sx={{ fontSize: 14 }} /> : <AccessTime sx={{ fontSize: 14 }} />}
                            <Typography variant="caption" noWrap>{post.company.province || formatDate(post.timestamp)}</Typography>
                          </Stack>
                        </Box>
                        {post.company.province && <Typography variant="caption" color="text.secondary">{formatDate(post.timestamp)}</Typography>}
                      </Stack>
                    </CardContent>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default Feed;

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Avatar, Box, Button, Card, CardActionArea, CardContent, Chip, CircularProgress, Container, IconButton, InputAdornment, Stack, TextField, Typography, alpha } from '@mui/material';
import AccessTime from '@mui/icons-material/AccessTime';
import Business from '@mui/icons-material/Business';
import Close from '@mui/icons-material/Close';
import FeedOutlined from '@mui/icons-material/FeedOutlined';
import ImageOutlined from '@mui/icons-material/ImageOutlined';
import Search from '@mui/icons-material/Search';
import { db } from '../fb';
import { useLanguage } from '../context/LanguageContext';
import LazyImage from './LazyImage';
import { loadAllPublicPosts, loadPublicPostsPage } from '../services/feedPosts';
import { FEED_PAGE_SIZE, filterFeedPosts, isSearchActive, uniqueCompanies } from '../utils/feedPosts';

const SEARCH_DEBOUNCE_MS = 300;

const Feed = ({ user }) => {
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const [browse, setBrowse] = useState({ posts: [], cursor: null, hasMore: false });
  const [allPosts, setAllPosts] = useState(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(FEED_PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const searching = isSearchActive(search);
  const filterMode = searching || selectedCompanyId !== 'all';

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => { setVisibleCount(FEED_PAGE_SIZE); }, [search, selectedCompanyId]);

  // Navegação normal: só a primeira fatia (as mais recentes), ordenada e limitada no servidor.
  useEffect(() => {
    let active = true;
    setLoading(true);
    setHasError(false);
    loadPublicPostsPage(db, { minPublic: FEED_PAGE_SIZE })
      .then((page) => { if (active) setBrowse(page); })
      .catch((error) => { console.error('Erro ao carregar publicações:', error); if (active) setHasError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [reloadToken]);

  // Pesquisa/filtro por empresa: descarrega o texto de todas as publicações uma única vez.
  useEffect(() => {
    if (!filterMode || allPosts) return undefined;
    let active = true;
    setHasError(false);
    loadAllPublicPosts(db)
      .then((posts) => { if (active) setAllPosts(posts); })
      .catch((error) => { console.error('Erro ao pesquisar publicações:', error); if (active) setHasError(true); });
    return () => { active = false; };
  }, [filterMode, allPosts, reloadToken]);

  const companies = useMemo(() => uniqueCompanies(allPosts || browse.posts), [allPosts, browse.posts]);

  const filtered = useMemo(() => {
    const source = filterMode ? allPosts : browse.posts;
    return source ? filterFeedPosts(source, { search: searching ? search : '', companyId: selectedCompanyId }) : [];
  }, [filterMode, allPosts, browse.posts, searching, search, selectedCompanyId]);

  const waitingForAll = filterMode && !allPosts && !hasError;
  // Os dados chegam em lotes, mas só se mostram (e só descarregam imagens de) FEED_PAGE_SIZE cartões de cada vez.
  const visiblePosts = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount || (!filterMode && browse.hasMore);

  useEffect(() => {
    if (selectedCompanyId !== 'all' && !companies.some(({ key }) => key === selectedCompanyId)) setSelectedCompanyId('all');
  }, [companies, selectedCompanyId]);

  const handleLoadMore = useCallback(async () => {
    const nextCount = visibleCount + FEED_PAGE_SIZE;
    setVisibleCount(nextCount);
    if (filterMode || !browse.hasMore || browse.posts.length >= nextCount) return;

    setLoadingMore(true);
    try {
      const page = await loadPublicPostsPage(db, { minPublic: nextCount - browse.posts.length, before: browse.cursor });
      setBrowse((current) => {
        const known = new Set(current.posts.map(({ id }) => id));
        return { posts: [...current.posts, ...page.posts.filter(({ id }) => !known.has(id))], cursor: page.cursor, hasMore: page.hasMore };
      });
    } catch (error) {
      console.error('Erro ao carregar mais publicações:', error);
      setHasError(true);
    } finally {
      setLoadingMore(false);
    }
  }, [filterMode, visibleCount, browse]);

  const formatDate = (timestamp) => {
    if (!timestamp) return t('feed.dateUnknown');
    return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'pt-MZ', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(timestamp));
  };

  const clearSearch = () => { setSearchInput(''); setSearch(''); };

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

          <Box component="form" role="search" onSubmit={(event) => event.preventDefault()} sx={{ maxWidth: 640 }}>
            <TextField
              fullWidth
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('feed.searchPlaceholder')}
              inputProps={{ 'aria-label': t('feed.searchLabel'), inputMode: 'search', enterKeyHint: 'search' }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search color="action" /></InputAdornment>,
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton size="small" edge="end" aria-label={t('feed.clearSearch')} onClick={clearSearch}><Close fontSize="small" /></IconButton>
                  </InputAdornment>
                ) : null,
                sx: { bgcolor: 'background.paper', borderRadius: 2 },
              }}
            />
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

          {hasError && <Alert severity="error" action={<Button color="inherit" onClick={() => setReloadToken((token) => token + 1)}>{t('feed.retry')}</Button>}>{t('feed.loadError')}</Alert>}

          {filterMode && allPosts && (
            <Typography color="text.secondary" role="status" aria-live="polite">{t('feed.results', { count: filtered.length })}</Typography>
          )}

          {loading || waitingForAll ? (
            <Stack alignItems="center" spacing={2} sx={{ py: 8 }} role="status" aria-live="polite">
              <CircularProgress /><Typography color="text.secondary">{t(waitingForAll && !loading ? 'feed.searching' : 'feed.loading')}</Typography>
            </Stack>
          ) : !hasError && visiblePosts.length === 0 ? (
            <Stack alignItems="center" spacing={1.5} sx={{ py: 8, px: 2, textAlign: 'center' }}>
              <FeedOutlined sx={{ fontSize: 58, color: 'text.disabled' }} />
              <Typography component="h2" variant="h6" fontWeight={700}>{searching ? t('feed.noResults') : t('feed.empty')}</Typography>
              <Typography color="text.secondary">{searching ? t('feed.noResultsHelp') : selectedCompanyId === 'all' ? t('feed.emptyHelp') : t('feed.emptyCompany')}</Typography>
              {searching && <Button onClick={clearSearch}>{t('feed.clearSearch')}</Button>}
            </Stack>
          ) : (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(3, minmax(0, 1fr))' }, gap: { xs: 2, md: 3 } }}>
                {visiblePosts.map((post) => (
                  <Card key={post.id} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', height: '100%' }}>
                    <CardActionArea onClick={() => navigate(`/post/${encodeURIComponent(post.id)}`)} aria-label={`${t('feed.openPost')} ${post.company.name}`} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                      {post.imageUrl ? (
                        <LazyImage src={post.imageUrl} />
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

              {hasMore && (
                <Stack alignItems="center" spacing={1}>
                  <Button variant="outlined" size="large" onClick={handleLoadMore} disabled={loadingMore} startIcon={loadingMore ? <CircularProgress size={18} /> : null}>
                    {loadingMore ? t('feed.loadingMore') : t('feed.loadMore')}
                  </Button>
                  <Typography variant="caption" color="text.secondary">{t('feed.loadMoreHint')}</Typography>
                </Stack>
              )}
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default Feed;

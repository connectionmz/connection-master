import React, { useMemo, useState } from 'react';
import { Box, Card, CardActionArea, CardMedia, Typography } from '@mui/material';
import { Image as ImageIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const plainText = (value = '') => String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const normalizePosts = (posts) => (Array.isArray(posts) ? posts : [])
  .filter((post) => post && post.id)
  .map((post) => ({
    ...post,
    description: plainText(post.description),
    url: typeof post.url === 'string' ? post.url.trim() : '',
  }))
  .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));

const PostGallery = ({ posts = [] }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [failedImages, setFailedImages] = useState({});
  const normalizedPosts = useMemo(() => normalizePosts(posts), [posts]);

  if (normalizedPosts.length === 0) {
    return (
      <Box sx={{ py: 7, px: 2, textAlign: 'center', color: 'text.secondary' }}>
        <ImageIcon aria-hidden="true" sx={{ fontSize: 48, mb: 1, opacity: 0.55 }} />
        <Typography variant="h6" color="text.primary">{t('gallery.empty')}</Typography>
        <Typography variant="body2">{t('gallery.emptyHelp')}</Typography>
      </Box>
    );
  }

  return (
    <Box
      component="section"
      aria-label={t('gallery.label')}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' },
        gap: { xs: 1, sm: 1.5 },
      }}
    >
      {normalizedPosts.map((post) => {
        const imageUnavailable = !post.url || failedImages[post.id];
        const companyName = post.company?.name || t('gallery.companyUnknown');
        const description = post.description || t('feed.noDescription');

        return (
          <Card key={post.id} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <CardActionArea
              onClick={() => navigate(`/post/${post.id}`)}
              aria-label={t('gallery.openPost', { company: companyName })}
              sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
            >
              {imageUnavailable ? (
                <Box sx={{ aspectRatio: '1 / 1', display: 'grid', placeItems: 'center', bgcolor: 'action.hover', color: 'text.secondary' }}>
                  <ImageIcon aria-hidden="true" sx={{ fontSize: 46, opacity: 0.55 }} />
                </Box>
              ) : (
                <CardMedia
                  component="img"
                  src={post.url}
                  alt={post.description || t('gallery.imageAlt', { company: companyName })}
                  loading="lazy"
                  onError={() => setFailedImages((current) => ({ ...current, [post.id]: true }))}
                  sx={{ aspectRatio: '1 / 1', objectFit: 'cover' }}
                />
              )}
              <Box sx={{ p: 1.5, width: '100%', flexGrow: 1 }}>
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{ display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: 2, overflow: 'hidden' }}
                >
                  {description}
                </Typography>
              </Box>
            </CardActionArea>
          </Card>
        );
      })}
    </Box>
  );
};

export { normalizePosts };
export default PostGallery;

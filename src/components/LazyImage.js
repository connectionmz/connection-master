import React, { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import PhotoFade from './PhotoFade';

// O `loading="lazy"` do browser antecipa muitas imagens; aqui só descarrega quando está mesmo perto do ecrã.
const LazyImage = ({ src, alt = '', aspectRatio = '16 / 10', rootMargin = '120px', sx }) => {
  const containerRef = useRef(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');

  useEffect(() => {
    if (visible || !containerRef.current) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [visible, rootMargin]);

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: '100%', aspectRatio, bgcolor: 'action.hover', overflow: 'hidden', ...sx }}>
      {visible && (
        <>
          <Box component="img" src={src} alt={alt} decoding="async" sx={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
          <PhotoFade />
        </>
      )}
    </Box>
  );
};

export default LazyImage;

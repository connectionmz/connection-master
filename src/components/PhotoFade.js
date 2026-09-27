import React from 'react';
import { Box } from '@mui/material';

// Degradê na base da foto. O contentor pai tem de ter `position: relative`.
const PhotoFade = ({ sx }) => (
  <Box
    aria-hidden="true"
    sx={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      background: 'linear-gradient(to top, rgba(8,25,46,0.62) 0%, rgba(8,25,46,0.28) 32%, rgba(8,25,46,0) 68%)',
      ...sx,
    }}
  />
);

export default PhotoFade;

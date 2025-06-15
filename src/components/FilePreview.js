// FilePreview.js
import React from 'react';
import { Box, Typography, IconButton, Chip } from '@mui/material';
import { Close, InsertDriveFile } from '@mui/icons-material';

const FilePreview = ({ file, onRemove }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
      <InsertDriveFile sx={{ mr: 1 }} />
      <Typography variant="body2" sx={{ flexGrow: 1 }}>
        {file.name}
      </Typography>
      <IconButton size="small" onClick={onRemove}>
        <Close fontSize="small" />
      </IconButton>
    </Box>
  );
};

export default FilePreview;
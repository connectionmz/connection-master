import React, { useMemo } from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import { splitAboutSections, toBlocks, toReadableText } from '../../utils/richText';

const bodyTextSx = (colors) => ({
  color: colors.body,
  lineHeight: 1.85,
  whiteSpace: 'pre-line',
  overflowWrap: 'anywhere',
  maxWidth: '80ch',
});

const CompanyAbout = ({ text, colors }) => {
  const sections = useMemo(() => splitAboutSections(toReadableText(text)), [text]);
  if (!sections.length) return null;

  return (
    <Stack spacing={3}>
      {sections.map(({ heading, body }, index) => (
        <Box
          key={`${heading || 'texto'}-${index}`}
          sx={heading ? { pl: 2, borderLeft: `3px solid ${colors.accent}` } : undefined}
        >
          {heading && (
            <Typography
              component="h3"
              sx={{ color: colors.accent, fontWeight: 700, fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1 }}
            >
              {heading}
            </Typography>
          )}
          <Stack spacing={1.5}>
            {toBlocks(body, { valuesMode: heading === 'Valores' }).map((block, blockIndex) => {
              if (block.type === 'list') {
                return (
                  <Box key={blockIndex} component="ul" sx={{ m: 0, pl: 3, color: colors.body, lineHeight: 1.85, maxWidth: '80ch' }}>
                    {block.items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{item}</li>)}
                  </Box>
                );
              }
              if (block.type === 'chips') {
                return (
                  <Box key={blockIndex} sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {block.items.map((item, itemIndex) => (
                      <Chip
                        key={`${item}-${itemIndex}`}
                        label={item}
                        size="small"
                        sx={{ bgcolor: colors.chipBg, color: colors.heading, border: `1px solid ${colors.border}`, fontWeight: 600 }}
                      />
                    ))}
                  </Box>
                );
              }
              return <Typography key={blockIndex} sx={bodyTextSx(colors)}>{block.text}</Typography>;
            })}
          </Stack>
        </Box>
      ))}
    </Stack>
  );
};

export default CompanyAbout;

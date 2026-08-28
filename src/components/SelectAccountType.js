import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Alert, Avatar, Box, Button, Card, CardActionArea, CardContent,
  Container, Grid, Paper, Typography,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useLanguage } from '../context/LanguageContext';

const SelectAccountType = () => {
  const [selectedType, setSelectedType] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const accountTypes = [
    {
      id: 'personal',
      title: t('onboarding.accountType.personal'),
      description: t('onboarding.accountType.personalDescription'),
      icon: <PersonIcon fontSize="large" />,
      color: 'primary.main',
      destination: '/setupUser',
    },
    {
      id: 'business',
      title: t('onboarding.accountType.business'),
      description: t('onboarding.accountType.businessDescription'),
      icon: <BusinessIcon fontSize="large" />,
      color: 'secondary.main',
      destination: '/setup',
    },
  ];

  const handleConfirm = () => {
    const selection = accountTypes.find(({ id }) => id === selectedType);
    if (!selection) {
      setError(t('onboarding.accountType.required'));
      return;
    }
    navigate(selection.destination, { replace: true });
  };

  return (
    <Box component="main" sx={{ minHeight: '100vh', bgcolor: 'background.default', display: 'grid', placeItems: 'center', p: { xs: 2, md: 4 } }}>
      <Container maxWidth="md" disableGutters>
        <Paper component="section" aria-labelledby="account-type-title" elevation={4} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          {location.state?.registrationComplete && (
            <Alert severity="success" sx={{ mb: 3 }}>{t('onboarding.accountType.created')}</Alert>
          )}
          <Typography id="account-type-title" component="h1" variant="h4" textAlign="center" fontWeight={700} gutterBottom>
            {t('onboarding.accountType.title')}
          </Typography>
          <Typography color="text.secondary" textAlign="center" sx={{ mb: 4 }}>
            {t('onboarding.accountType.description')}
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Grid container spacing={2.5} role="radiogroup" aria-label={t('onboarding.accountType.title')}>
            {accountTypes.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <Grid item xs={12} sm={6} key={type.id}>
                  <Card variant="outlined" sx={{ height: '100%', borderWidth: 2, borderColor: isSelected ? type.color : 'divider', bgcolor: isSelected ? 'action.selected' : 'background.paper' }}>
                    <CardActionArea role="radio" aria-checked={isSelected} onClick={() => { setSelectedType(type.id); setError(''); }} sx={{ height: '100%', p: 1 }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Avatar sx={{ bgcolor: 'action.hover', color: type.color, width: 64, height: 64, mx: 'auto', mb: 2 }}>{type.icon}</Avatar>
                        <Typography component="h2" variant="h5" fontWeight={650} gutterBottom>{type.title}</Typography>
                        <Typography color="text.secondary" sx={{ minHeight: { sm: 72 } }}>{type.description}</Typography>
                        <Typography color={isSelected ? type.color : 'text.secondary'} fontWeight={650} sx={{ mt: 2 }}>
                          {isSelected ? t('onboarding.accountType.selected') : t('onboarding.accountType.select')}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>
                </Grid>
              );
            })}
          </Grid>

          <Button fullWidth variant="contained" size="large" disabled={!selectedType} onClick={handleConfirm} endIcon={<ArrowForwardIcon />} sx={{ mt: 4, py: 1.5 }}>
            {t('onboarding.accountType.continue')}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default SelectAccountType;

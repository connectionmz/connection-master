import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { onValue, push, ref, update } from 'firebase/database';
import {
  Alert, Box, Button, Card, CardContent, Chip, CircularProgress,
  Container, Dialog, DialogActions, DialogContent, DialogTitle, Divider,
  Link, Stack, TextField, Typography,
} from '@mui/material';
import { Check, Close, Email, Phone, RateReview, ReceiptLong, Storefront } from '@mui/icons-material';
import { db } from '../../fb';
import { useLanguage } from '../../context/LanguageContext';
import { buildCustomerDecisionUpdates } from '../market/quoteResponse';

const STATUS_COLORS = {
  pending: 'warning',
  answered: 'success',
  expired: 'default',
  cancelled: 'default',
  accepted: 'success',
  rejected: 'error',
  revision_requested: 'info',
};

const SentStoreQuotesDesk = ({ userId }) => {
  const { t, language } = useLanguage();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [decisionDialog, setDecisionDialog] = useState({ open: false, quote: null, type: '', note: '' });
  const [decisionSubmitting, setDecisionSubmitting] = useState(false);
  const [decisionError, setDecisionError] = useState('');

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onValue(ref(db, `user_quotes/${userId}`), (snapshot) => {
      const data = snapshot.val() || {};
      setQuotes(Object.entries(data)
        .map(([id, quote]) => ({ id, ...quote }))
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setError('');
      setLoading(false);
    }, () => {
      setError(t('market.sentQuotes.loadError'));
      setLoading(false);
    });

    return unsubscribe;
  }, [userId, t]);

  useEffect(() => {
    const unseenResponses = quotes.filter(quote => quote.response && quote.customerViewed === false);
    if (!userId || unseenResponses.length === 0) return;

    const viewedAt = new Date().toISOString();
    const viewedUpdates = {};
    unseenResponses.forEach((quote) => {
      viewedUpdates[`user_quotes/${userId}/${quote.id}/customerViewed`] = true;
      viewedUpdates[`user_quotes/${userId}/${quote.id}/customerViewedAt`] = viewedAt;
      viewedUpdates[`quotes/${quote.storeId}/${quote.id}/customerViewed`] = true;
      viewedUpdates[`quotes/${quote.storeId}/${quote.id}/customerViewedAt`] = viewedAt;
    });
    update(ref(db), viewedUpdates).catch(() => undefined);
  }, [quotes, userId]);

  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(
    language === 'en' ? 'en-GB' : 'pt-PT',
    { dateStyle: 'medium', timeStyle: 'short' },
  ), [language]);
  const priceFormatter = useMemo(() => new Intl.NumberFormat(
    language === 'en' ? 'en-GB' : 'pt-PT',
    { style: 'currency', currency: 'MZN', maximumFractionDigits: 2 },
  ), [language]);

  const openDecision = (quote, type) => {
    setDecisionError('');
    setDecisionDialog({ open: true, quote, type, note: '' });
  };

  const submitDecision = async () => {
    try {
      setDecisionSubmitting(true);
      setDecisionError('');
      const notificationId = push(ref(db, `notifications/${decisionDialog.quote.storeId}`)).key;
      const updates = buildCustomerDecisionUpdates({
        quote: decisionDialog.quote,
        customerId: userId,
        decision: decisionDialog.type,
        note: decisionDialog.note,
        notificationId,
      });
      await update(ref(db), updates);
      setDecisionDialog({ open: false, quote: null, type: '', note: '' });
    } catch (decisionFailure) {
      setDecisionError(decisionFailure.message === 'Revision note is required'
        ? t('market.sentQuotes.revisionRequired')
        : t('market.sentQuotes.decisionError'));
    } finally {
      setDecisionSubmitting(false);
    }
  };

  if (loading) {
    return <Box sx={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={1} sx={{ mb: 4 }}>
        <Typography component="h1" variant="h4" fontWeight={800}>
          {t('market.sentQuotes.title')}
        </Typography>
        <Typography color="text.secondary">{t('market.sentQuotes.description')}</Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {!error && quotes.length === 0 ? (
        <Card variant="outlined">
          <CardContent sx={{ py: 7, textAlign: 'center' }}>
            <ReceiptLong color="disabled" sx={{ fontSize: 56, mb: 2 }} />
            <Typography variant="h6">{t('market.sentQuotes.empty')}</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>{t('market.sentQuotes.emptyHelp')}</Typography>
            <Button component={RouterLink} to="/lojas" variant="contained">
              {t('market.sentQuotes.explore')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {quotes.map((quote) => (
            <Card key={quote.id} variant="outlined">
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Storefront color="primary" />
                      <Link component={RouterLink} to={`/loja/${quote.storeId}`} underline="hover" color="text.primary">
                        <Typography component="span" variant="h6" fontWeight={700}>{quote.storeName}</Typography>
                      </Link>
                    </Stack>
                    <Typography variant="body2" color="text.secondary">
                      #{quote.id} · {quote.createdAt ? dateFormatter.format(new Date(quote.createdAt)) : ''}
                    </Typography>
                  </Box>
                  <Chip
                    label={t(`market.sentQuotes.status.${quote.status || 'pending'}`)}
                    color={STATUS_COLORS[quote.status] || 'default'}
                    size="small"
                  />
                </Stack>

                <Divider sx={{ my: 2 }} />
                <Stack spacing={1}>
                  {(quote.items || []).map((item) => (
                    <Typography key={item.id} variant="body2">
                      {item.quantity || 1}× {item.productName}
                      {item.specifications ? ` — ${item.specifications}` : ''}
                    </Typography>
                  ))}
                </Stack>

                {quote.message && <Typography sx={{ mt: 2 }} color="text.secondary">{quote.message}</Typography>}

                {quote.response && (
                  <Alert severity="success" icon={<ReceiptLong />} sx={{ mt: 3, alignItems: 'flex-start' }}>
                    <Typography fontWeight={800}>{t('market.sentQuotes.responseTitle')}</Typography>
                    <Typography sx={{ whiteSpace: 'pre-wrap' }}>{quote.response.message}</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 0.5, sm: 2 }} sx={{ mt: 1 }}>
                      {quote.response.totalPrice && (
                        <Typography variant="body2" fontWeight={700}>
                          {t('market.sentQuotes.totalPrice')}: {priceFormatter.format(quote.response.totalPrice)}
                        </Typography>
                      )}
                      {quote.response.validUntil && (
                        <Typography variant="body2">
                          {t('market.sentQuotes.validUntil')}: {dateFormatter.format(new Date(quote.response.validUntil))}
                        </Typography>
                      )}
                    </Stack>
                  </Alert>
                )}

                {quote.response && ['answered', 'revision_requested'].includes(quote.status) && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
                    <Button variant="contained" color="success" startIcon={<Check />} onClick={() => openDecision(quote, 'accepted')}>
                      {t('market.sentQuotes.accept')}
                    </Button>
                    <Button variant="outlined" startIcon={<RateReview />} onClick={() => openDecision(quote, 'revision_requested')}>
                      {t('market.sentQuotes.requestRevision')}
                    </Button>
                    <Button variant="text" color="error" startIcon={<Close />} onClick={() => openDecision(quote, 'rejected')}>
                      {t('market.sentQuotes.reject')}
                    </Button>
                  </Stack>
                )}

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 3 }}>
                  {quote.storeContact && (
                    <Button component="a" href={`tel:${quote.storeContact}`} startIcon={<Phone />} variant="outlined">
                      {t('market.sentQuotes.callStore')}
                    </Button>
                  )}
                  {quote.storeEmail && (
                    <Button component="a" href={`mailto:${quote.storeEmail}`} startIcon={<Email />} variant="outlined">
                      {t('market.sentQuotes.emailStore')}
                    </Button>
                  )}
                  <Button component={RouterLink} to={`/loja/${quote.storeId}`} startIcon={<Storefront />}>
                    {t('market.sentQuotes.viewStore')}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={decisionDialog.open} onClose={() => !decisionSubmitting && setDecisionDialog({ open: false, quote: null, type: '', note: '' })} fullWidth maxWidth="sm">
        <DialogTitle>{t(`market.sentQuotes.decision.${decisionDialog.type}`)}</DialogTitle>
        <DialogContent>
          {decisionError && <Alert severity="error" sx={{ mb: 2 }}>{decisionError}</Alert>}
          <TextField
            fullWidth multiline minRows={3}
            required={decisionDialog.type === 'revision_requested'}
            label={t('market.sentQuotes.decisionNote')}
            value={decisionDialog.note}
            onChange={(event) => setDecisionDialog(current => ({ ...current, note: event.target.value }))}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button disabled={decisionSubmitting} onClick={() => setDecisionDialog({ open: false, quote: null, type: '', note: '' })}>{t('common.cancel', 'Cancelar')}</Button>
          <Button variant="contained" disabled={decisionSubmitting} onClick={submitDecision}>{t('common.confirm', 'Confirmar')}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SentStoreQuotesDesk;

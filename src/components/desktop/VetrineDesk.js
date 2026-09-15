import { useEffect, useState } from 'react';
import { onValue, ref, remove, runTransaction } from 'firebase/database';
import { deleteObject, ref as storageRef } from 'firebase/storage';
import {
  Alert, Box, Button, Card, CardActions, CardContent, CircularProgress,
  Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
  Snackbar, Stack, Typography,
} from '@mui/material';
import {
  Archive, DeleteOutline, Description, Download, Image, InsertDriveFile,
  PictureAsPdf, VideoLibrary,
} from '@mui/icons-material';
import { db, storage } from '../../fb';
import { useLanguage } from '../../context/LanguageContext';

const FileIcon = ({ type = '' }) => {
  if (type.includes('pdf')) return <PictureAsPdf color="error" />;
  if (type.includes('word') || type.includes('doc')) return <Description color="primary" />;
  if (type.includes('excel') || type.includes('sheet') || type.includes('xls')) return <InsertDriveFile color="success" />;
  if (type.includes('image')) return <Image color="secondary" />;
  if (type.includes('video')) return <VideoLibrary color="warning" />;
  if (type.includes('zip') || type.includes('rar')) return <Archive />;
  return <InsertDriveFile />;
};

const VetrineDesk = ({ id, userId }) => {
  const { language, t } = useLanguage();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteFile, setDeleteFile] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (!id) {
      setFiles([]);
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    return onValue(ref(db, `vitrine/${id}`), (snapshot) => {
      const data = snapshot.val() || {};
      setFiles(Object.entries(data).map(([fileId, value]) => ({
        id: fileId,
        description: value.description || '',
        fileType: value.fileType || 'application/octet-stream',
        fileName: value.fileName || '',
        timestamp: value.timestamp || 0,
        url: value.url || '',
        ownerId: value.company?.id || id,
        storagePath: value.storagePath || null,
      })).sort((a, b) => b.timestamp - a.timestamp));
      setLoading(false);
    }, (error) => {
      console.error('Erro ao carregar documentos da montra:', error);
      setFeedback({ open: true, message: t('showcase.loadError'), severity: 'error' });
      setLoading(false);
    });
  }, [id, t]);

  const handleDownload = async (file) => {
    if (!file.url) return;
    window.open(file.url, '_blank', 'noopener,noreferrer');
    try {
      const countRef = ref(db, `download/${id}/${file.id}`);
      await runTransaction(countRef, (current) => ({
        ...(current || {}),
        totalDownloads: (current?.totalDownloads || 0) + 1,
      }));
    } catch (error) {
      console.error('Erro ao atualizar contador de downloads:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteFile || deleteFile.ownerId !== userId) return;
    setDeleting(true);
    try {
      if (deleteFile.storagePath) {
        try {
          await deleteObject(storageRef(storage, deleteFile.storagePath));
        } catch (error) {
          if (error.code !== 'storage/object-not-found') throw error;
        }
      }
      await remove(ref(db, `vitrine/${id}/${deleteFile.id}`));
      setFeedback({ open: true, message: t('showcase.deleteSuccess'), severity: 'success' });
      setDeleteFile(null);
    } catch (error) {
      console.error('Erro ao eliminar documento:', error);
      setFeedback({ open: true, message: t('showcase.deleteError'), severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <Box sx={{ py: 6, display: 'grid', placeItems: 'center' }}><CircularProgress aria-label={t('showcase.loading')} /></Box>;

  return (
    <Box component="section" aria-labelledby="showcase-title">
      <Typography id="showcase-title" component="h2" variant="h5" fontWeight={700} gutterBottom>{t('showcase.title')}</Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>{t('showcase.description')}</Typography>

      {!files.length ? <Alert severity="info">{t('showcase.empty')}</Alert> : (
        <Stack spacing={2}>
          {files.map((file) => (
            <Card key={file.id} variant="outlined">
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box sx={{ mt: 0.25 }}><FileIcon type={file.fileType} /></Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography fontWeight={700} sx={{ overflowWrap: 'anywhere' }}>{file.fileName || t('showcase.document')}</Typography>
                    <Typography color="text.secondary" sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{file.description || t('showcase.noDescription')}</Typography>
                    {file.timestamp > 0 && <Typography variant="caption" color="text.secondary">{new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'pt-PT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(file.timestamp))}</Typography>}
                  </Box>
                </Stack>
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Button startIcon={<Download />} onClick={() => handleDownload(file)} disabled={!file.url}>{t('showcase.download')}</Button>
                {file.ownerId === userId && <Button color="error" startIcon={<DeleteOutline />} onClick={() => setDeleteFile(file)}>{t('common.delete')}</Button>}
              </CardActions>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={Boolean(deleteFile)} onClose={() => !deleting && setDeleteFile(null)} aria-labelledby="showcase-delete-title">
        <DialogTitle id="showcase-delete-title">{t('showcase.deleteTitle')}</DialogTitle>
        <DialogContent><DialogContentText>{t('showcase.deleteDescription')}</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteFile(null)} disabled={deleting}>{t('common.cancel')}</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>{deleting ? t('showcase.deleting') : t('common.delete')}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={feedback.open} autoHideDuration={5000} onClose={() => setFeedback((current) => ({ ...current, open: false }))}>
        <Alert severity={feedback.severity} variant="filled">{feedback.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default VetrineDesk;

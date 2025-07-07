// MyAdsTab.js
import React, { useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import DeleteIcon from '@mui/icons-material/Delete';
import AdDetailsDialog from './AdDetailsDialog';
import { formatPrice, formatDate, getStatusColor } from './adUtils';

const MyAdsTab = ({ myAds, loading, onAdCreated, onAdDeleted }) => {
  const [selectedAd, setSelectedAd] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState(null);

  const handleViewAd = (ad) => {
    setSelectedAd(ad);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
  };

  const handleOpenDeleteDialog = (ad) => {
    setAdToDelete(ad);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setAdToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (adToDelete) {
      onAdDeleted(adToDelete.id);
      handleCloseDeleteDialog();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (myAds.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="textSecondary">
          Não tem nenhum anúncio criado ainda.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Imagem</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Duração</TableCell>
              <TableCell>Custo</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Expira em</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {myAds.map((ad) => (
              <TableRow key={ad.id}>
                <TableCell>
                  {ad.imageUrl ? (
                    <img 
                      src={ad.imageUrl} 
                      alt="Anúncio" 
                      style={{ width: 100, height: 50, objectFit: 'cover' }} 
                    />
                  ) : (
                    <Typography variant="body2">Sem imagem</Typography>
                  )}
                </TableCell>
                <TableCell>{ad.description}</TableCell>
                <TableCell>
                  {ad.tipoAnuncio === 'home' && 'Página Inicial'}
                  {ad.tipoAnuncio === 'concurso' && 'Concurso'}
                  {ad.tipoAnuncio === 'cotacoes' && 'Cotações'}
                  {ad.tipoAnuncio === 'destacar_perfil' && 'Destacar Perfil'}
                </TableCell>
                <TableCell>{ad.days} dias</TableCell>
                <TableCell>{formatPrice(ad.totalCost)} MT</TableCell>
                <TableCell>
                  <Chip 
                    label={ad.status} 
                    color={getStatusColor(ad.status)} 
                    size="small" 
                  />
                </TableCell>
                <TableCell>{formatDate(ad.expireDate)}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    onClick={() => handleViewAd(ad)}
                    startIcon={<BarChartIcon />}
                    size="small"
                    sx={{ mr: 1 }}
                  >
                    Estatísticas
                  </Button>
                  <IconButton
                    aria-label="delete"
                    onClick={() => handleOpenDeleteDialog(ad)}
                    color="error"
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedAd && (
        <AdDetailsDialog
          open={openDetails}
          onClose={handleCloseDetails}
          ad={selectedAd}
        />
      )}

      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Confirmar eliminação</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Tem certeza que deseja eliminar este anúncio? Esta ação não pode ser desfeita.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancelar</Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MyAdsTab;
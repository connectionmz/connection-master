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
} from '@mui/material';
import BarChartIcon from '@mui/icons-material/BarChart';
import AdDetailsDialog from './AdDetailsDialog';
import { formatPrice, formatDate, getStatusColor } from './adUtils';

const MyAdsTab = ({ myAds, loading, onAdCreated }) => {
  const [selectedAd, setSelectedAd] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);

  const handleViewAd = (ad) => {
    setSelectedAd(ad);
    setOpenDetails(true);
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
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
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ mt: 2 }}
          onClick={() => onAdCreated()}
        >
          Criar Primeiro Anúncio
        </Button>
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
              <TableCell>Status</TableCell>
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
                  >
                    Estatísticas
                  </Button>
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
    </>
  );
};

export default MyAdsTab;
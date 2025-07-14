import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
  Tabs,
  Tab
} from '@mui/material';
import { ref, onValue } from 'firebase/database';
import { db } from '../../fb';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import StarIcon from '@mui/icons-material/Star';
import { calculateCTR, formatDate, formatPrice, getStatusColor } from './adUtils';
import { generateAdReport } from './reportGenerator';

const AdDetailsDialog = ({ open, onClose, ad }) => {
  const [adStats, setAdStats] = useState({
    clicks: 0,
    impressions: 0,
    companiesReached: [],
    performanceBySector: [],
    loadingStats: true,
  });
  const [tabValue, setTabValue] = useState(0);
  const [interestedCompanies, setInterestedCompanies] = useState([]);

  const classifyCompaniesByInterest = (companies) => {
    const classified = companies.map(company => {
      let interestLevel = 'baixo';
      let interestDescription = 'Visualizou o anúncio';
      let interestIcon = null;
      
      if (company.clicks >= 3) {
        interestLevel = 'alto';
        interestDescription = '(3+ cliques)';
        interestIcon = <StarIcon color="error" fontSize="small" />;
      } else if (company.clicks === 2) {
        interestLevel = 'médio';
        interestDescription = '(2 cliques)';
        interestIcon = <StarIcon color="warning" fontSize="small" />;
      } else if (company.clicks === 1) {
        interestLevel = 'baixo';
        interestDescription = 'Visualizou o anúncio';
      }
      
      return {
        ...company,
        interestLevel,
        interestDescription,
        interestIcon
      };
    });

    setInterestedCompanies(
      classified
        .filter(c => c.interestLevel !== 'baixo')
        .sort((a, b) => b.clicks - a.clicks)
    );

    return classified;
  };

  const fetchAdStats = useCallback(async (adId, companyId, tipoAnuncio) => {
    setAdStats(prev => ({ ...prev, loadingStats: true }));
    
    try {
      // Fetch anuncios_metrics
      const metricsRef = ref(db, `anuncios_metrics`);
      const metricsSnapshot = await new Promise(resolve => {
        onValue(metricsRef, (snapshot) => {
          resolve(snapshot.val() || {});
        }, { onlyOnce: true });
      });

      // Filter metrics by companyId and tipoAnuncio (assuming 'from' matches tipoAnuncio)
      const adMetrics = Object.values(metricsSnapshot).filter(
        metric => 
          metric.company?.id === companyId && 
          metric.from.toLowerCase() === tipoAnuncio.toLowerCase()
      );

      // Calculate total clicks and impressions
      const totalClicks = adMetrics.reduce((sum, metric) => sum + (metric.total_cliques || 0), 0);
      const uniqueCompanies = new Set(adMetrics.map(metric => metric.company.id));
      const totalImpressions = adMetrics.length; // Assuming each metric entry is an impression

      // Fetch loja_metrics for additional click data
      const lojaMetricsRef = ref(db, `loja_metrics`);
      const lojaMetricsSnapshot = await new Promise(resolve => {
        onValue(lojaMetricsRef, (snapshot) => {
          resolve(snapshot.val() || {});
        }, { onlyOnce: true });
      });

      // Filter loja_metrics by companyId and tipoAnuncio
      const lojaMetrics = Object.values(lojaMetricsSnapshot).filter(
        metric => 
          metric.company?.id === companyId && 
          metric.from.toLowerCase() === tipoAnuncio.toLowerCase()
      );

      const lojaClicks = lojaMetrics.reduce((sum, metric) => sum + (metric.total_cliques || 0), 0);
      const totalClicksCombined = totalClicks + lojaClicks;

      // Aggregate company stats
      const companiesStats = {};
      
      adMetrics.forEach(metric => {
        const companyId = metric.company.id;
        if (!companiesStats[companyId]) {
          companiesStats[companyId] = {
            id: companyId,
            name: metric.company.nome,
            provincia: metric.company.provincia,
            sector: metric.company.sector || 'Não informado',
            impressions: 0,
            clicks: 0,
          };
        }
        companiesStats[companyId].impressions += 1;
        companiesStats[companyId].clicks += metric.total_cliques || 0;
      });

      // Include loja_metrics in company stats
      lojaMetrics.forEach(metric => {
        const companyId = metric.company?.id || metric.id;
        if (!companiesStats[companyId]) {
          companiesStats[companyId] = {
            id: companyId,
            name: metric.company?.nome || 'Desconhecido',
            provincia: metric.company?.provincia || 'Não informado',
            sector: metric.company?.sector || 'Não informado',
            impressions: 0,
            clicks: 0,
          };
        }
        companiesStats[companyId].impressions += 1;
        companiesStats[companyId].clicks += metric.total_cliques || 0;
      });

      // Convert to array and calculate CTR
      const companiesArray = Object.values(companiesStats).map(company => ({
        ...company,
        ctr: calculateCTR(company.clicks, company.impressions),
      }));

      // Fetch company details for contacts
      const companiesWithContacts = await Promise.all(
        companiesArray.map(async company => {
          const companyData = await new Promise(resolve => {
            const companyRef = ref(db, `company/${company.id}`);
            onValue(companyRef, (snapshot) => {
              resolve(snapshot.val() || {});
            }, { onlyOnce: true });
          });
          
          return {
            ...company,
            contacto: companyData.contacto || 'Não disponível',
            email: companyData.email || 'Não disponível',
            whatsapp: companyData.contacto ? `https://wa.me/258${companyData.contacto.replace(/\D/g, '')}` : null
          };
        })
      );

      // Classify companies by interest
      const companiesWithInterest = classifyCompaniesByInterest(companiesWithContacts);

      // Process performance by sector
      const sectorsRef = ref(db, 'sectores_de_atividade');
      const sectorsSnapshot = await new Promise(resolve => {
        onValue(sectorsRef, (snapshot) => {
          resolve(snapshot.val() || []);
        }, { onlyOnce: true });
      });

      const sectorStats = sectorsSnapshot
        .filter(sector => sector?.setor)
        .map(sector => {
          const companiesInSector = companiesWithInterest.filter(
            company => company.sector === sector.setor
          );
          
          const sectorImpressions = companiesInSector.reduce((sum, company) => sum + company.impressions, 0);
          const sectorClicks = companiesInSector.reduce((sum, company) => sum + company.clicks, 0);
          
          return {
            sector: sector.setor,
            impressions: sectorImpressions,
            clicks: sectorClicks,
            ctr: calculateCTR(sectorClicks, sectorImpressions),
          };
        })
        .filter(sector => sector.impressions > 0);

      setAdStats({
        clicks: totalClicksCombined,
        impressions: totalImpressions + lojaMetrics.length,
        companiesReached: companiesWithInterest.sort((a, b) => b.clicks - a.clicks),
        performanceBySector: sectorStats.sort((a, b) => b.impressions - a.impressions),
        loadingStats: false,
      });
    } catch (error) {
      console.error('Error fetching ad stats:', error);
      setAdStats(prev => ({ ...prev, loadingStats: false }));
    }
  }, []);

  useEffect(() => {
    if (open && ad?.id && ad?.companyId && ad?.tipoAnuncio) {
      fetchAdStats(ad.id, ad.companyId, ad.tipoAnuncio);
      setTabValue(0);
    }
  }, [open, ad, fetchAdStats]);

  const handleDownloadReport = async () => {
    try {
      await generateAdReport(ad, adStats, interestedCompanies);
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <VisibilityIcon sx={{ mr: 1 }} />
            Detalhes do Anúncio
          </Box>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {ad ? (
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Informações Básicas</Typography>
                {ad.imageUrl && (
                  <img
                    src={ad.imageUrl}
                    alt="Anúncio"
                    style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }}
                  />
                )}
                <Typography><strong>Descrição:</strong> {ad.description}</Typography>
                <Typography><strong>Tipo:</strong> {
                  ad.tipoAnuncio === 'home' ? 'Página Inicial' :
                  ad.tipo === 'concurso' ? 'Concurso' :
                  ad.tipoAnuncio === 'cotacoes' ? 'Cotações' : 'Destacar Perfil'
                }</Typography>
                <Typography><strong>Duração:</strong> {ad.days} dias</Typography>
                <Typography><strong>Custo:</strong> {formatPrice(ad.totalCost)} MT</Typography>
                <Typography><strong>Status:</strong> 
                  <Chip 
                    label={ad.status} 
                    color={getStatusColor(ad.status)} 
                    size="small" 
                    sx={{ ml: 1 }}/>
                </Typography>
                <Typography><strong>Criado em:</strong> {formatDate(ad.uploadedAt)}</Typography>
                <Typography><strong>Expira em:</strong> {formatDate(ad.expireDate)}</Typography>
              </Box>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Segmentação</Typography>
                <Typography><strong>Províncias:</strong> {ad.provincias?.join(', ') || 'Nenhuma'}</Typography>
                <Typography><strong>Setores:</strong> {ad.sectores?.join(', ') || 'Nenhum'}</Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={8}>
              {adStats.loadingStats ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center1">
                      <Typography variant="h6" gutterBottom>Estatísticas Gerais</Typography>
                      <Button 
                        variant="outlined" 
                        startIcon={<PictureAsPdfIcon />}
                        onClick={handleDownloadReport}>
                        Baixar Relatório
                      </Button>
                    </Box>
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4">{adStats.impressions}</Typography>
                          <Typography variant="subtitle1">Impressões</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={6} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4">{adStats.clicks}</Typography>
                          <Typography variant="subtitle1">Cliques</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4">
                            {calculateCTR(adStats.clicks, adStats.impressions)}%
                          </Typography>
                          <Typography variant="subtitle1">Taxa de Clique (CTR)</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>Desempenho por Setor</Typography>
                    {adStats.performanceBySector.length > 0 ? (
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Setor</TableCell>
                              <TableCell align="right">Impressões</TableCell>
                              <TableCell align="right">Cliques</TableCell>
                              <TableCell align="right">CTR</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {adStats.performanceBySector.map((sector) => (
                              <TableRow key={sector.sector}>
                                <TableCell>{sector.sector}</TableCell>
                                <TableCell align="right">{sector.impressions}</TableCell>
                                <TableCell align="right">{sector.clicks}</TableCell>
                                <TableCell align="right">{sector.ctr}%</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography variant="body2">Nenhum dado disponível</Typography>
                    )}
                  </Box>
                  <Box>
                    <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                      <Tab label="Todas Empresas" />
                      <Tab 
                        label={
                          <Box display="flex" alignItems="center">
                            <StarIcon color="warning" sx={{ mr: 1 }} />
                            Potenciais Interessados ({interestedCompanies.length})
                          </Box>
                        } 
                      />
                    </Tabs>
                    {tabValue === 0 ? (
                      <TableContainer component={Paper}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Empresa</TableCell>
                              <TableCell align="center">Interesse</TableCell>
                              <TableCell align="right">Cliques</TableCell>
                              <TableCell align="right">CTR</TableCell>
                              <TableCell>Contato</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {adStats.companiesReached.slice(0, 5).map((company) => (
                              <TableRow key={company.id}>
                                <TableCell>
                                  <Box>
                                    <Typography fontWeight="medium">{company.name}</Typography>
                                    <Typography variant="body2" color="textSecondary">
                                      {company.provincia} • {company.sector}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell align="center">
                                  <Chip 
                                    label={company.interestDescription}
                                    color={
                                      company.interestLevel === 'alto' ? 'error' :
                                      company.interestLevel === 'médio' ? 'warning' : 'default'
                                    }
                                    size="small"
                                    icon={company.interestIcon}
                                  />
                                </TableCell>
                                <TableCell align="right">{company.clicks}</TableCell>
                                <TableCell align="right">{company.ctr}%</TableCell>
                                <TableCell>
                                  <Box display="flex" flexDirection="column" gap={1}>
                                    <Box display="flex" alignItems="center">
                                      <PhoneIcon fontSize="small" sx={{ mr: 1 }} />
                                      <Typography>{company.contacto}</Typography>
                                    </Box>
                                    <Box display="flex" alignItems="center">
                                      <EmailIcon fontSize="small" sx={{ mr: 1 }} />
                                      <a 
                                        href={`mailto:${company.email}`} 
                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                      >
                                        {company.email}
                                      </a>
                                    </Box>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box>
                        {interestedCompanies.length > 0 ? (
                          <TableContainer component={Paper}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Empresa</TableCell>
                                  <TableCell align="center">Nível Interesse</TableCell>
                                  <TableCell align="right">Cliques</TableCell>
                                  <TableCell>Ações</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {interestedCompanies.map((company) => (
                                  <TableRow key={company.id}>
                                    <TableCell>
                                      <Box>
                                        <Typography fontWeight="medium">{company.name}</Typography>
                                        <Typography variant="body2" color="textSecondary">
                                          {company.provincia} • {company.sector}
                                        </Typography>
                                      </Box>
                                    </TableCell>
                                    <TableCell align="center">
                                      <Chip 
                                        label={company.interestDescription}
                                        color={company.interestLevel === 'alto' ? 'error' : 'warning'}
                                        size="small"
                                        icon={<StarIcon />}
                                      />
                                    </TableCell>
                                    <TableCell align="right">{company.clicks}</TableCell>
                                    <TableCell>
                                      <Box display="flex" gap={1}>
                                        <Button 
                                          variant="outlined" 
                                          size="small" 
                                          startIcon={<PhoneIcon />}
                                          href={company.whatsapp || `tel:${company.contacto}`}
                                          target="_blank"
                                        >
                                          Contatar
                                        </Button>
                                        <Button 
                                          variant="outlined" 
                                          size="small" 
                                          startIcon={<EmailIcon />}
                                          href={`mailto:${company.email}`}
                                        >
                                          Email
                                        </Button>
                                      </Box>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        ) : (
                          <Paper sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body1" color="textSecondary">
                              Nenhuma empresa demonstrou interesse significativo (2+ cliques)
                            </Typography>
                          </Paper>
                        )}
                      </Box>
                    )}
                  </Box>
                </>
              )}
            </Grid>
          </Grid>
        ) : (
          <Typography variant="body1" color="textSecondary">
            Nenhum anúncio selecionado
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdDetailsDialog;
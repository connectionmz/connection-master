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
  Tabs,
  Tab
} from '@mui/material';
import { ref, onValue, get, query, orderByChild, equalTo } from 'firebase/database';
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
    companiesReached: [],
    loadingStats: true,
  });
  const [tabValue, setTabValue] = useState(0);
  const [interestedCompanies, setInterestedCompanies] = useState([]);

  const classifyCompaniesByInterest = (companies) => {
    const classified = companies.map(company => {
      let interestLevel = 'baixo';
      let interestDescription = 'Clicou';
      let interestIcon = null;
      
      // Apenas 3+ cliques são considerados interessados
      if (company.clicks >= 2) {
        interestLevel = 'alto';
        interestDescription = '(3+ cliques)';
        interestIcon = <StarIcon color="error" fontSize="small" />;
      } else if (company.clicks === 2) {
        interestLevel = 'baixo';
        interestDescription = '(2 cliques)';
      } else if (company.clicks === 1) {
        interestLevel = 'baixo';
        interestDescription = '(1 clique)';
      }
      
      return {
        ...company,
        interestLevel,
        interestDescription,
        interestIcon
      };
    });

    // Apenas empresas com 3+ cliques são consideradas interessadas
    const highInterestCompanies = classified
      .filter(c => c.clicks >= 3)
      .sort((a, b) => b.clicks - a.clicks);

    setInterestedCompanies(highInterestCompanies);

    return classified;
  };

  const fetchAdStats = useCallback(async (adId) => {
    if (!adId) {
      console.error('Missing ad ID for fetchAdStats');
      setAdStats(prev => ({ ...prev, loadingStats: false }));
      return;
    }

    setAdStats(prev => ({ ...prev, loadingStats: true }));
    
    try {
      console.log('Fetching ad stats for ad ID:', adId);

      // Buscar métricas do anúncio específico
      const metricsRef = ref(db, `anuncios_metrics/${adId}`);
      
      const result = await new Promise((resolve) => {
        onValue(metricsRef, async (snapshot) => {
          const metricsData = snapshot.val();
          console.log('Raw metrics data:', metricsData);

          let totalClicks = metricsData?.total_cliques || 0;
          const companiesStats = {};

          // Buscar todos os usuários que clicaram neste anúncio
          // Primeiro, vamos buscar na coleção users para encontrar todos os cliques
          const usersRef = ref(db, 'users');
          
          const usersSnapshot = await new Promise((resolveUsers) => {
            onValue(usersRef, (snapshot) => {
              resolveUsers(snapshot.val() || {});
            }, { onlyOnce: true });
          });

          const companyIds = new Set();

          // Adicionar último usuário que clicou (se existir)
          if (metricsData?.user_data?.last_user_id) {
            companyIds.add(metricsData.user_data.last_user_id);
          }

          // Procurar em todos os usuários por cliques neste anúncio
          Object.entries(usersSnapshot).forEach(([userId, userData]) => {
            if (userData.anuncios_clicados && userData.anuncios_clicados[adId]) {
              companyIds.add(userId);
            }
          });

          // Buscar dados de todas as empresas que clicaram
          if (companyIds.size > 0) {
            const companiesPromises = Array.from(companyIds).map(async (companyId) => {
              try {
                const companyRef = ref(db, `company/${companyId}`);
                const companySnapshot = await get(companyRef);
                
                if (companySnapshot.exists()) {
                  const companyData = companySnapshot.val();
                  
                  // Contar cliques deste usuário neste anúncio
                  let userClicks = 0;
                  
                  // Verificar se o usuário tem cliques registrados
                  if (usersSnapshot[companyId]?.anuncios_clicados?.[adId]?.count) {
                    userClicks = usersSnapshot[companyId].anuncios_clicados[adId].count;
                  } else if (companyId === metricsData?.user_data?.last_user_id) {
                    // Fallback: se for o último usuário que clicou, atribui 1 clique
                    userClicks = 1;
                  }
                  
                  companiesStats[companyId] = {
                    id: companyId,
                    name: companyData.nome || 'Empresa Desconhecida',
                    provincia: companyData.provincia || 'Não informado',
                    sector: companyData.sector || 'Não informado',
                    clicks: userClicks,
                    contacto: companyData.contacto || 'Não disponível',
                    email: companyData.email || 'Não disponível'
                  };
                } else {
                  // Se a empresa não existe na coleção company, criar entrada básica
                  companiesStats[companyId] = {
                    id: companyId,
                    name: 'Empresa Desconhecida',
                    provincia: 'Não informado',
                    sector: 'Não informado',
                    clicks: usersSnapshot[companyId]?.anuncios_clicados?.[adId]?.count || 1,
                    contacto: 'Não disponível',
                    email: 'Não disponível'
                  };
                }
              } catch (error) {
                console.error('Error fetching company:', companyId, error);
              }
            });

            await Promise.all(companiesPromises);
          }

          resolve({
            metrics: metricsData || {},
            companies: companiesStats,
            totalClicks
          });
        }, { onlyOnce: true });
      });

      const { metrics, companies, totalClicks } = result;

      // Converter para array
      const companiesArray = Object.values(companies).map(company => ({
        ...company,
        ctr: calculateCTR(company.clicks, 1), // Usando 1 impressão como base
        whatsapp: company.contacto !== 'Não disponível' ? 
          `https://wa.me/258${company.contacto.replace(/\D/g, '')}` : null
      }));

      // Classificar empresas por interesse
      const companiesWithInterest = classifyCompaniesByInterest(companiesArray);

      console.log('Companies with clicks:', companiesArray);
      console.log('High interest companies:', companiesWithInterest.filter(c => c.clicks >= 3));

      setAdStats({
        clicks: totalClicks,
        companiesReached: companiesWithInterest.sort((a, b) => b.clicks - a.clicks),
        loadingStats: false,
      });

    } catch (error) {
      console.error('Error fetching ad stats:', error);
      setAdStats(prev => ({ 
        ...prev, 
        loadingStats: false,
        companiesReached: [],
      }));
    }
  }, []);

  useEffect(() => {
    if (open && ad?.id) {
      fetchAdStats(ad.id);
      setTabValue(0);
    } else if (open) {
      setAdStats(prev => ({ ...prev, loadingStats: false }));
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
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
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
                    style={{ width: '100%', borderRadius: '8px', marginBottom: '16px', maxHeight: '200px', objectFit: 'cover' }}
                  />
                )}
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Descrição:</strong> {ad.description || 'Nenhuma descrição'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Tipo:</strong> {
                    ad.tipoAnuncio === 'home' ? 'Página Inicial' :
                    ad.tipo === 'concurso' ? 'Concurso' :
                    ad.tipoAnuncio === 'cotacoes' ? 'Cotações' : 
                    ad.tipoAnuncio === 'destacar' ? 'Destacar Perfil' : ad.tipoAnuncio
                  }
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Duração:</strong> {ad.days || 0} dias
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Custo:</strong> {formatPrice(ad.totalCost || 0)} MT
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Status:</strong> 
                  <Chip 
                    label={ad.status || 'Desconhecido'} 
                    color={getStatusColor(ad.status)} 
                    size="small" 
                    sx={{ ml: 1 }}/>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Criado em:</strong> {formatDate(ad.uploadedAt)}
                </Typography>
                <Typography variant="body2">
                  <strong>Expira em:</strong> {formatDate(ad.expireDate)}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>Segmentação</Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Províncias:</strong> {ad.provincias?.join(', ') || 'Todas'}
                </Typography>
                <Typography variant="body2">
                  <strong>Setores:</strong> {ad.sectores?.join(', ') || 'Todos'}
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={8}>
              {adStats.loadingStats ? (
                <Box display="flex" justifyContent="center" alignItems="center" py={4}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Carregando estatísticas...
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ mb: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Typography variant="h6" gutterBottom>Estatísticas de Cliques</Typography>
                      <Button 
                        variant="outlined" 
                        startIcon={<PictureAsPdfIcon />}
                        onClick={handleDownloadReport}
                      >
                        Baixar Relatório
                      </Button>
                    </Box>
                    
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="secondary">
                            {adStats.clicks}
                          </Typography>
                          <Typography variant="body2">Total de Cliques</Typography>
                        </Paper>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Paper sx={{ p: 2, textAlign: 'center' }}>
                          <Typography variant="h4" color="primary">
                            {interestedCompanies.length}
                          </Typography>
                          <Typography variant="body2">Potenciais Interessados (3+ cliques)</Typography>
                        </Paper>
                      </Grid>
                    </Grid>
                  </Box>

                  <Box>
                    <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
                      <Tab label={`Todas Empresas (${adStats.companiesReached.length})`} />
                      <Tab 
                        label={
                          <Box display="flex" alignItems="center">
                            <StarIcon color="error" sx={{ mr: 1 }} />
                            Potenciais Interessados ({interestedCompanies.length})
                          </Box>
                        } 
                      />
                    </Tabs>

                    {adStats.companiesReached.length === 0 ? (
                      <Paper sx={{ p: 3, textAlign: 'center' }}>
                        <Typography variant="body1" color="textSecondary">
                          Nenhuma empresa clicou neste anúncio ainda
                        </Typography>
                      </Paper>
                    ) : tabValue === 0 ? (
                      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Empresa</TableCell>
                              <TableCell align="center">Interesse</TableCell>
                              <TableCell align="right">Cliques</TableCell>
                              <TableCell>Contato</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {adStats.companiesReached.map((company) => (
                              <TableRow key={company.id} hover>
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
                                      company.interestLevel === 'alto' ? 'error' : 'default'
                                    }
                                    size="small"
                                    icon={company.interestIcon}
                                  />
                                </TableCell>
                                <TableCell align="right">{company.clicks}</TableCell>
                                <TableCell>
                                  <Box display="flex" flexDirection="column" gap={0.5}>
                                    {company.contacto !== 'Não disponível' && (
                                      <Box display="flex" alignItems="center">
                                        <PhoneIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                        <Typography variant="body2">{company.contacto}</Typography>
                                      </Box>
                                    )}
                                    {company.email !== 'Não disponível' && (
                                      <Box display="flex" alignItems="center">
                                        <EmailIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                        <a 
                                          href={`mailto:${company.email}`} 
                                          style={{ textDecoration: 'none', color: 'inherit', fontSize: '0.875rem' }}
                                        >
                                          {company.email}
                                        </a>
                                      </Box>
                                    )}
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
                          <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                            <Table size="small" stickyHeader>
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
                                  <TableRow key={company.id} hover>
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
                                        color="error"
                                        size="small"
                                        icon={<StarIcon />}
                                      />
                                    </TableCell>
                                    <TableCell align="right">{company.clicks}</TableCell>
                                    <TableCell>
                                      <Box display="flex" gap={1} flexWrap="wrap">
                                        {company.contacto !== 'Não disponível' && (
                                          <Button 
                                            variant="outlined" 
                                            size="small" 
                                            startIcon={<PhoneIcon />}
                                            href={company.whatsapp || `tel:${company.contacto}`}
                                            target="_blank"
                                            sx={{ fontSize: '0.75rem' }}
                                          >
                                            WhatsApp
                                          </Button>
                                        )}
                                        {company.email !== 'Não disponível' && (
                                          <Button 
                                            variant="outlined" 
                                            size="small" 
                                            startIcon={<EmailIcon />}
                                            href={`mailto:${company.email}`}
                                            sx={{ fontSize: '0.75rem' }}
                                          >
                                            Email
                                          </Button>
                                        )}
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
                              Nenhuma empresa demonstrou alto interesse (3+ cliques)
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
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <Typography variant="body1" color="textSecondary">
              Nenhum anúncio selecionado
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Fechar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdDetailsDialog;
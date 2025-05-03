import React, { useState, useEffect, useCallback } from 'react';
import { ref as createStorageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../fb';
import { ref, push, set, onValue, query, orderByChild, equalTo } from 'firebase/database';
import {
  Button,
  TextField,
  Box,
  Typography,
  Paper,
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  Divider,
  Avatar,
  Grid,
} from '@mui/material';
import BackButton from '../BackButton';
import { formatPrice } from '../../utils/utils';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BarChartIcon from '@mui/icons-material/BarChart';

const AnunciarDesk = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [myAds, setMyAds] = useState([]);
  const [loadingAds, setLoadingAds] = useState(false);

  const loadUserAds = useCallback(async () => {
    if (!user?.id) return;
    
    setLoadingAds(true);
    try {
      const adsRef = query(ref(db, 'banners'), orderByChild('companyId'), equalTo(user.id));
      onValue(adsRef, (snapshot) => {
        const adsData = snapshot.val();
        if (adsData) {
          const adsArray = Object.keys(adsData).map((key) => ({
            id: key,
            ...adsData[key],
          }));
          
          // Ordenar por uploadedAt (do mais recente para o mais antigo)
          const sortedAds = adsArray.sort((a, b) => {
            // Converter para timestamp para comparação
            const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
            const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
            return dateB - dateA; // Ordem decrescente
          });
          
          setMyAds(sortedAds);
        } else {
          setMyAds([]);
        }
      });
    } catch (error) {
      console.error('Error loading ads:', error);
    } finally {
      setLoadingAds(false);
    }
}, [user]);

  useEffect(() => {
    if (activeTab === 0) {
      loadUserAds();
    }
  }, [activeTab, user, loadUserAds]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box width="100%" minHeight="100vh">
      <Paper sx={{ width: '100%', padding: 3 }}>
        <BackButton sx={{ mb: 2 }} />
        <Typography variant="h5" gutterBottom>
          Gestão de Anúncios
        </Typography>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Meus Anúncios" />
          <Tab label="Criar Anúncio" />
        </Tabs>

        {activeTab === 0 ? (
          <MyAdsTab myAds={myAds} loading={loadingAds} />
        ) : (
          <CreateAdTab user={user} onAdCreated={() => setActiveTab(0)} />
        )}
      </Paper>
    </Box>
  );
};

const MyAdsTab = ({ myAds, loading }) => {
  const [selectedAd, setSelectedAd] = useState(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [adStats, setAdStats] = useState({
    clicks: 0,
    impressions: 0,
    companiesReached: [],
    performanceBySector: [],
    loadingStats: true,
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'expired': return 'error';
      default: return 'default';
    }
  };

  const calculateCTR = (clicks, impressions) => {
    return impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : 0;
  };

  const fetchAdStats = useCallback(async (adId) => {
    setAdStats(prev => ({ ...prev, loadingStats: true }));
    
    try {
      // Buscar cliques e impressões totais
      const [clicksSnap, impressionsSnap] = await Promise.all([
        new Promise(resolve => {
          const clicksRef = ref(db, `anuncios_metrics/${adId}/total_cliques`);
          onValue(clicksRef, (snapshot) => {
            resolve(snapshot.val() || 0);
          }, { onlyOnce: true });
        }),
        new Promise(resolve => {
          const impressionsRef = ref(db, `anuncios_metrics/${adId}/total_impressoes`);
          onValue(impressionsRef, (snapshot) => {
            resolve(snapshot.val() || 0);
          }, { onlyOnce: true });
        })
      ]);
  
      // Buscar dados detalhados de empresas que visualizaram
      const [companiesViewedData, companiesClickedData, sectorsData] = await Promise.all([
        new Promise(resolve => {
          const companiesViewedRef = ref(db, `anuncios_metrics/${adId}/impressoes`);
          onValue(companiesViewedRef, (snapshot) => {
            resolve(snapshot.val() || {});
          }, { onlyOnce: true });
        }),
        new Promise(resolve => {
          const companiesClickedRef = ref(db, `anuncios_metrics/${adId}/cliques`);
          onValue(companiesClickedRef, (snapshot) => {
            resolve(snapshot.val() || {});
          }, { onlyOnce: true });
        }),
        new Promise(resolve => {
          const sectorsRef = ref(db, 'sectores_de_atividade');
          onValue(sectorsRef, (snapshot) => {
            resolve(snapshot.val() || []);
          }, { onlyOnce: true });
        })
      ]);
  
      // Processar empresas atingidas
      const companyIds = new Set([
        ...Object.keys(companiesViewedData),
        ...Object.keys(companiesClickedData),
      ]);
  
      const companiesStats = await Promise.all(
        Array.from(companyIds).map(async (companyId) => {
          const companyData = await new Promise(resolve => {
            const companyRef = ref(db, `company/${companyId}`);
            onValue(companyRef, (snapshot) => {
              resolve(snapshot.val() || { nome: 'Desconhecida' });
            }, { onlyOnce: true });
          });
          
          const views = companiesViewedData[companyId] ? Object.keys(companiesViewedData[companyId]).length : 0;
          const clicks = companiesClickedData[companyId] ? Object.keys(companiesClickedData[companyId]).length : 0;
          
          return {
            id: companyId,
            name: companyData.nome,
            impressions: views,
            clicks: clicks,
            ctr: calculateCTR(clicks, views),
          };
        })
      );
  
      // Processar desempenho por setor
      const sectorStats = sectorsData.map(sector => {
        const companiesInSector = companiesStats.filter(company => 
          company.sector === sector.setor
        );
        
        const sectorImpressions = companiesInSector.reduce((sum, company) => sum + company.impressions, 0);
        const sectorClicks = companiesInSector.reduce((sum, company) => sum + company.clicks, 0);
        
        return {
          sector: sector.setor,
          impressions: sectorImpressions,
          clicks: sectorClicks,
          ctr: calculateCTR(sectorClicks, sectorImpressions),
        };
      }).filter(sector => sector.impressions > 0);
  
      setAdStats({
        clicks: clicksSnap,
        impressions: impressionsSnap,
        companiesReached: companiesStats.sort((a, b) => b.impressions - a.impressions),
        performanceBySector: sectorStats.sort((a, b) => b.impressions - a.impressions),
        loadingStats: false,
      });
    } catch (error) {
      console.error('Error fetching ad stats:', error);
      setAdStats(prev => ({ ...prev, loadingStats: false }));
    }
  }, []);

  const handleViewAd = (ad) => {
    setSelectedAd(ad);
    setOpenDetails(true);
    fetchAdStats(ad.id);
  };

  const handleCloseDetails = () => {
    setOpenDetails(false);
  };

  if (loading) {
    return <CircularProgress />;
  }

  if (myAds.length === 0) {
    return <Typography>Não tem nenhum anúncio criado ainda.</Typography>;
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
                  <img 
                    src={ad.imageUrl} 
                    alt="Anúncio" 
                    style={{ width: 100, height: 50, objectFit: 'cover' }} 
                  />
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
                  >
                    <BarChartIcon />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDetails} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <VisibilityIcon sx={{ mr: 1 }} />
            Detalhes do Anúncio
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedAd && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Informações Básicas</Typography>
                  <img
                    src={selectedAd.imageUrl}
                    alt="Anúncio"
                    style={{ width: '100%', borderRadius: '8px', marginBottom: '16px' }}
                  />
                  <Typography><strong>Descrição:</strong> {selectedAd.description}</Typography>
                  <Typography><strong>Tipo:</strong> {
                    selectedAd.tipoAnuncio === 'home' ? 'Página Inicial' :
                    selectedAd.tipoAnuncio === 'concurso' ? 'Concurso' :
                    selectedAd.tipoAnuncio === 'cotacoes' ? 'Cotações' : 'Destacar Perfil'
                  }</Typography>
                  <Typography><strong>Duração:</strong> {selectedAd.days} dias</Typography>
                  <Typography><strong>Custo:</strong> {formatPrice(selectedAd.totalCost)} MT</Typography>
                  <Typography><strong>Status:</strong> 
                    <Chip 
                      label={selectedAd.status} 
                      color={getStatusColor(selectedAd.status)} 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>Segmentação</Typography>
                  <Typography><strong>Províncias:</strong> {selectedAd.provincias?.join(', ') || 'Nenhuma'}</Typography>
                  <Typography><strong>Setores:</strong> {selectedAd.sectores?.join(', ') || 'Nenhum'}</Typography>
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
                      <Typography variant="h6" gutterBottom>Estatísticas Gerais</Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h4">{adStats.impressions}</Typography>
                            <Typography variant="subtitle1">Impressões</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={6}>
                          <Paper sx={{ p: 2, textAlign: 'center' }}>
                            <Typography variant="h4">{adStats.clicks}</Typography>
                            <Typography variant="subtitle1">Cliques</Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={12}>
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
                      <Typography variant="h6" gutterBottom>Empresas Atingidas</Typography>
                      {adStats.companiesReached.length > 0 ? (
                        <List dense>
                          {adStats.companiesReached.slice(0, 5).map((company) => (
                            <React.Fragment key={company.id}>
                              <ListItem>
                                <ListItemText
                                  primary={company.name}
                                  secondary={`Impressões: ${company.impressions} | Cliques: ${company.clicks} (CTR: ${company.ctr}%)`}
                                />
                              </ListItem>
                              <Divider />
                            </React.Fragment>
                          ))}
                          {adStats.companiesReached.length > 5 && (
                            <Typography variant="body2" sx={{ mt: 1 }}>
                              + {adStats.companiesReached.length - 5} outras empresas
                            </Typography>
                          )}
                        </List>
                      ) : (
                        <Typography variant="body2">Nenhuma empresa registrada</Typography>
                      )}
                    </Box>
                  </>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Fechar</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const CreateAdTab = ({ user, onAdCreated }) => {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [uploading, setUploading] = useState(false);
  const [days, setDays] = useState(null);
  const [totalCost, setTotalCost] = useState(30);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [provincias, setProvincias] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [selectedProvincias, setSelectedProvincias] = useState([]);
  const [selectedSectores, setSelectedSectores] = useState([]);
  const [empresas, setEmpresas] = useState([]);
  const [empresasAtingidas, setEmpresasAtingidas] = useState(0);
  const [tipoAnuncio, setTipoAnuncio] = useState('home');
  const isDestacarPerfil = tipoAnuncio === 'destacar_perfil';


  const prices = {
    home: 30,
    concurso: 50,
    cotacoes: 40,
    destacar_perfil: 120,
  };

  const ADDITIONAL_COST_PER_PROVINCIA = 30;
  const ADDITIONAL_COST_PER_SETOR = 30;

  useEffect(() => {
    const provinciasRef = ref(db, 'provincias');
    const sectoresRef = ref(db, 'sectores_de_atividade');
    const empresasRef = ref(db, 'company');

    onValue(provinciasRef, (snapshot) => setProvincias(snapshot.val() || []));
    onValue(sectoresRef, (snapshot) => setSectores(snapshot.val() || []));
    onValue(empresasRef, (snapshot) => {
      const empresasData = snapshot.val();
      if (empresasData) {
        const empresasArray = Object.keys(empresasData).map((key) => ({
          id: key,
          ...empresasData[key],
        }));
        setEmpresas(empresasArray);
      } else {
        setEmpresas([]);
      }
    });

    if (user) {
      setSelectedSectores(user.sector ? [user.sector] : []);
      setSelectedProvincias(user.provincia ? [user.provincia] : []);
    }
  }, [user]);

  useEffect(() => {
    const baseCost = prices[tipoAnuncio] || prices.home;
    const hasAdditionalSectors = selectedSectores.length > 1;
    const hasAdditionalProvincias = selectedProvincias.length > 1;

    const additionalCost =
      (hasAdditionalProvincias ? (selectedProvincias.length - 1) * ADDITIONAL_COST_PER_PROVINCIA : 0) +
      (hasAdditionalSectors ? (selectedSectores.length - 1) * ADDITIONAL_COST_PER_SETOR : 0);

    setTotalCost(days * (baseCost + additionalCost));
  }, [days, selectedProvincias, selectedSectores, tipoAnuncio]);

  useEffect(() => {
    if (empresas.length > 0 && (selectedProvincias.length > 0 || selectedSectores.length > 0)) {
      const empresasFiltradas = empresas.filter((empresa) => {
        const matchesProvincia = selectedProvincias.length === 0 || selectedProvincias.includes(empresa.provincia);
        const matchesSetor = selectedSectores.length === 0 || selectedSectores.includes(empresa.sector);
        return matchesProvincia && matchesSetor;
      });
      setEmpresasAtingidas(empresasFiltradas.length);
    } else {
      setEmpresasAtingidas(0);
    }
  }, [selectedProvincias, selectedSectores, empresas]);

  const handleProvinciaChange = (e) => {
    const newSelectedProvincias = e.target.value;
    if (user.provincia && !newSelectedProvincias.includes(user.provincia)) {
      newSelectedProvincias.push(user.provincia);
    }
    setSelectedProvincias(newSelectedProvincias);
  };

  const handleSetorChange = (e) => {
    const newSelectedSectores = e.target.value;
    if (user.sector && !newSelectedSectores.includes(user.sector)) {
      newSelectedSectores.push(user.sector);
    }
    setSelectedSectores(newSelectedSectores);
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setImageUrl(URL.createObjectURL(selectedFile));
    }
  };

const validateForm = () => {
  if (!file) {
    showSnackbar('Por favor, selecione uma imagem para o anúncio.', 'error');
    return false;
  }
  if (!phoneNumber) {
    showSnackbar('Por favor, insira um número de telefone.', 'error');
    return false;
  }
  // A descrição só é obrigatória para tipos diferentes de "Destacar Perfil"
  if (!isDestacarPerfil && !description) {
    showSnackbar('Por favor, insira uma descrição para o anúncio.', 'error');
    return false;
  }
  return true;
};
  const handlePublish = async () => {
    if (!validateForm()) return;
    setUploading(true);

    try {
      const fileRef = createStorageRef(storage, `images/${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      await saveToDatabase(url);
      
      showSnackbar('Anúncio publicado com sucesso!', 'success');
      resetForm();
      onAdCreated();
    } catch (error) {
      console.error('Erro ao publicar anúncio:', error);
      showSnackbar('Erro ao publicar o anúncio. Tente novamente.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const saveToDatabase = async (url) => {
    const anuncioRef = push(ref(db, 'banners'));
    const idAnuncio = anuncioRef.key;

    const expireDate = calculateExpireDate(days);

    const anuncioData = {
      id: idAnuncio,
      imageUrl: url,
      uploadedAt: new Date().toISOString(),
      expireDate,
      companyId: user.id,
      days,
      totalCost,
      provincias: selectedProvincias,
      sectores: selectedSectores,
      tipoAnuncio,
      phoneNumber,
      status: 'active'
    };

    if (!isDestacarPerfil) {
      anuncioData.description = description;
      anuncioData.link = link;
    } else {
      anuncioData.description = `Perfil destacado de ${user.nome}`;
      anuncioData.link = `/perfil/${user.id}`;
    }
    await set(anuncioRef, anuncioData);
  };
  const calculateExpireDate = (days) => {
    const currentDate = new Date();
    const expireDate = new Date(currentDate);
    expireDate.setDate(currentDate.getDate() + days);
    return expireDate.toISOString();
  };

  const resetForm = () => {
    setDescription('');
    setLink('');
    setFile(null);
    setImageUrl('');
    setDays(null);
    setPhoneNumber('');
    setSelectedProvincias(user.provincia ? [user.provincia] : []);
    setSelectedSectores(user.sector ? [user.sector] : []);
    setTipoAnuncio('home');
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <Typography variant="body1" sx={{ mb: 1 }}>
          Escolha o tipo de anúncio:
        </Typography>
        <RadioGroup
            value={tipoAnuncio}
            onChange={(e) => {
              setTipoAnuncio(e.target.value);
              // Resetar descrição e link quando mudar para destacar perfil
              if (e.target.value === 'destacar_perfil') {
                setDescription('');
                setLink('');
              }
            }}
          >
          <FormControlLabel value="home" control={<Radio />} label="Página Inicial" />
          <FormControlLabel value="concurso" control={<Radio />} label="Concurso" />
          <FormControlLabel value="cotacoes" control={<Radio />} label="Cotações" />
          <FormControlLabel value="destacar_perfil" control={<Radio />} label="Destacar Perfil" />
        </RadioGroup>
      </FormControl>
      {!isDestacarPerfil && (
    <>
      <TextField
        label="Descrição do anúncio"
        variant="outlined"
        fullWidth
        multiline
        rows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        label="Link externo (opcional)"
        variant="outlined"
        fullWidth
        value={link}
        onChange={(e) => setLink(e.target.value)}
        sx={{ mb: 2 }}
      />
       <Box sx={{ mb: 2 }}>
      <Typography variant="body1" sx={{ mb: 1 }}>
        Imagem do anúncio *
      </Typography>
      <input 
        type="file" 
        onChange={handleFileChange} 
        accept="image/*"
      />
      {imageUrl && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
            Pré-visualização:
          </Typography>
          <img
            src={imageUrl}
            alt="Preview da Imagem"
            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }}
          />
        </Box>
    )}
  </Box>
    </>
  )}

 

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="provincias-label">Províncias *</InputLabel>
        <Select
          labelId="provincias-label"
          multiple
          value={selectedProvincias}
          onChange={handleProvinciaChange}
          renderValue={(selected) => selected.join(', ')}
        >
          {provincias.map((provincia) => (
            <MenuItem key={provincia.provincia} value={provincia.provincia}>
              <Checkbox
                checked={selectedProvincias.includes(provincia.provincia)}
                disabled={user.provincia === provincia.provincia}
              />
              <ListItemText primary={provincia.provincia} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="sectores-label">Setores de Atividade *</InputLabel>
        <Select
          labelId="sectores-label"
          multiple
          value={selectedSectores}
          onChange={handleSetorChange}
          renderValue={(selected) => selected.join(', ')}
        >
          {sectores.map((setor) => (
            <MenuItem key={setor.setor} value={setor.setor}>
              <Checkbox
                checked={selectedSectores.includes(setor.setor)}
                disabled={user.sector === setor.setor}
              />
              <ListItemText primary={setor.setor} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Box mb={2}>
        <Typography>Tempo do anúncio (1 a 30 dias):</Typography>
        <TextField
              type="number"
              value={days}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setDays('');
                  return;
                }

                const numberValue = Number(value);
                if (numberValue >= 0 && numberValue <= 30) {
                  setDays(numberValue);
                }
              }}
              onBlur={() => {
                // Quando sair do input, forçar limite
                if (days < 1) setDays(1);
                if (days > 30) setDays(30);
              }}
              inputProps={{ min: 1, max: 30 }}
              fullWidth
            />

      </Box>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Valor estimado: <strong>{formatPrice(totalCost)} MT</strong>
      </Typography>

      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        Este anúncio atingirá aproximadamente <strong>{empresasAtingidas}</strong> empresas.
      </Typography>

      <TextField
        label="Número de celular *"
        variant="outlined"
        fullWidth
        value={phoneNumber}
        onChange={(e) => setPhoneNumber(e.target.value)}
        sx={{ mb: 2 }}
      />

<Button
  variant="contained"
  color="primary"
  onClick={handlePublish}
  sx={{ mb: 2 }}
>
  {uploading ? <CircularProgress size={24} /> : 'Publicar Anúncio'}
</Button>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AnunciarDesk;
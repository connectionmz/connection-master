import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { get, ref } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Box,
  Avatar,
  useMediaQuery,
  Pagination,
  Chip,
  Container,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import CategoryIcon from '@mui/icons-material/Category';
import CloseIcon from '@mui/icons-material/Close';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { db } from '../../fb';

/* ─── Design tokens ─────────────────────────────────────────────────────── */
const T = {
  navy:    '#0B1F3A',
  navyMid: '#162E52',
  accent:  '#C8953A',       // amber-gold
  accentLight: '#F5E6C8',
  steel:   '#4A6080',
  muted:   '#8A9BB0',
  border:  '#DDE3EC',
  surface: '#F7F9FC',
  white:   '#FFFFFF',
  text:    '#1C2D40',
  textSub: '#56708A',
};

const cardSx = {
  height: '100%',
  border: `1px solid ${T.border}`,
  borderRadius: '14px',
  background: T.white,
  transition: 'box-shadow 0.22s ease, transform 0.22s ease, border-color 0.22s ease',
  cursor: 'pointer',
  overflow: 'hidden',
  '&:hover': {
    borderColor: T.accent,
    boxShadow: `0 8px 32px rgba(11,31,58,0.12)`,
    transform: 'translateY(-3px)',
  },
};

/* ─── Component ─────────────────────────────────────────────────────────── */
const Explore = React.memo(() => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState('');
  const [selectedSubsector, setSelectedSubsector] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedTipoEntidade, setSelectedTipoEntidade] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [provincias, setProvincias] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [subsectores, setSubsectores] = useState([]);
  const [distritos, setDistritos] = useState([]);
  const [tiposEntidades, setTiposEntidades] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');

  /* fetch ----------------------------------------------------------------- */
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const snapshot = await get(ref(db, 'company'));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setCompanies(
            Object.keys(data)
              .map((key) => ({ id: key, ...data[key] }))
              .filter((e) => e.type !== 'singular')
          );
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchRefs = async () => {
      try {
        const [pSnap, sSnap, tSnap] = await Promise.all([
          get(ref(db, 'provincias')),
          get(ref(db, 'sectores_de_atividade')),
          get(ref(db, 'tipos_entidades')),
        ]);
        if (pSnap.exists()) setProvincias(pSnap.val() || []);
        if (sSnap.exists()) setSectores(sSnap.val() || []);
        if (tSnap.exists()) setTiposEntidades(tSnap.val() || []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCompanies();
    fetchRefs();
  }, []);

  useEffect(() => {
    if (selectedSector) {
      const found = sectores.find((s) => s.setor === selectedSector);
      setSubsectores(found ? found.subsectores : []);
    } else {
      setSubsectores([]);
    }
    setSelectedSubsector('');
  }, [selectedSector, sectores]);

  useEffect(() => {
    if (selectedProvince) {
      const found = provincias.find((p) => p.provincia === selectedProvince);
      setDistritos(found ? found.distritos : []);
    } else {
      setDistritos([]);
    }
    setSelectedDistrict('');
  }, [selectedProvince, provincias]);

  useEffect(() => { setCurrentPage(1); }, [
    searchTerm, selectedSector, selectedSubsector,
    selectedProvince, selectedDistrict, selectedTipoEntidade,
  ]);

  /* filter / paginate ----------------------------------------------------- */
  const filteredCompanies = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return companies.filter((c) => {
      const matchSearch = !q ||
        c.nome?.toLowerCase().includes(q) ||
        c.sigla?.toLowerCase().includes(q) ||
        c.descricao?.toLowerCase().includes(q) ||
        c.sector?.toLowerCase().includes(q);
      return (
        matchSearch &&
        (!selectedSector      || c.sector       === selectedSector) &&
        (!selectedSubsector   || c.subsectores?.some((s) => s === selectedSubsector)) &&
        (!selectedProvince    || c.provincia     === selectedProvince) &&
        (!selectedDistrict    || c.distrito      === selectedDistrict) &&
        (!selectedTipoEntidade || c.tipoEntidade === selectedTipoEntidade)
      );
    });
  }, [companies, searchTerm, selectedSector, selectedSubsector, selectedProvince, selectedDistrict, selectedTipoEntidade]);

  const currentCompanies = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredCompanies.slice(start, start + itemsPerPage);
  }, [filteredCompanies, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const hasActiveFilters = !!(selectedSector || selectedSubsector || selectedProvince || selectedDistrict || selectedTipoEntidade || searchTerm);

  const handleSearch    = useCallback((e) => setSearchTerm(e.target.value), []);
  const handleClick     = useCallback((id) => navigate(`/empresa/${id}`), [navigate]);
  const openModal       = useCallback(() => setIsModalOpen(true), []);
  const closeModal      = useCallback(() => setIsModalOpen(false), []);
  const resetFilters    = useCallback(() => {
    setSelectedSector(''); setSelectedSubsector('');
    setSelectedProvince(''); setSelectedDistrict('');
    setSelectedTipoEntidade(''); setSearchTerm('');
  }, []);

  /* loading --------------------------------------------------------------- */
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor={T.surface}>
        <Box textAlign="center">
          <CircularProgress size={36} thickness={4} sx={{ color: T.accent }} />
          <Typography variant="body2" sx={{ mt: 2, color: T.muted, fontFamily: '"DM Sans", sans-serif' }}>
            A carregar empresas…
          </Typography>
        </Box>
      </Box>
    );
  }

  /* render ---------------------------------------------------------------- */
  return (
    <Box sx={{ backgroundColor: T.surface, minHeight: '100vh', fontFamily: '"DM Sans", sans-serif' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyMid} 60%, #1E3A5F 100%)`,
          pt: { xs: 6, md: 10 },
          pb: { xs: 5, md: 8 },
          px: 2,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(circle at 80% 20%, rgba(200,149,58,0.15) 0%, transparent 50%),
                              radial-gradient(circle at 10% 80%, rgba(200,149,58,0.08) 0%, transparent 40%)`,
            pointerEvents: 'none',
          },
          // subtle grid texture
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            pointerEvents: 'none',
          },
        }}
      >
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1 }}>
          {/* eyebrow */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 0.5,
              mb: 2.5,
              border: `1px solid rgba(200,149,58,0.4)`,
              borderRadius: '100px',
              background: 'rgba(200,149,58,0.1)',
            }}
          >
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: T.accent }} />
            <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.08em', color: T.accent, textTransform: 'uppercase' }}>
              Diretório Nacional de Empresas
            </Typography>
          </Box>

          <Typography
            component="h1"
            sx={{
              fontSize: { xs: '2rem', md: '2.8rem' },
              fontWeight: 700,
              fontFamily: '"DM Serif Display", Georgia, serif',
              color: T.white,
              lineHeight: 1.15,
              mb: 1.5,
              letterSpacing: '-0.02em',
            }}
          >
            Encontre Empresas,<br />
            <Box component="span" sx={{ color: T.accent }}>Bens e Serviços</Box>
          </Typography>

          <Typography
            sx={{
              color: 'rgba(255,255,255,0.62)',
              fontSize: '1rem',
              mb: 4,
              maxWidth: 480,
              lineHeight: 1.7,
              fontFamily: '"DM Sans", sans-serif',
            }}
          >
            Aceda ao maior diretório empresarial de Moçambique. Pesquise por nome, setor ou localização.
          </Typography>

          {/* Search bar */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              background: T.white,
              borderRadius: '12px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
              border: `1px solid rgba(255,255,255,0.1)`,
              overflow: 'hidden',
              maxWidth: 680,
            }}
          >
            <Box sx={{ pl: 2, display: 'flex', alignItems: 'center' }}>
              <SearchIcon sx={{ color: T.muted, fontSize: 22 }} />
            </Box>
            <TextField
              placeholder="Nome da empresa, setor ou descrição…"
              value={searchTerm}
              onChange={handleSearch}
              variant="standard"
              fullWidth
              InputProps={{
                disableUnderline: true,
                sx: {
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.95rem',
                  fontFamily: '"DM Sans", sans-serif',
                  color: T.text,
                  '& input::placeholder': { color: T.muted, opacity: 1 },
                },
              }}
            />
            <Box
              sx={{
                height: 48,
                width: '1px',
                bgcolor: T.border,
                my: 'auto',
                flexShrink: 0,
              }}
            />
            <Button
              startIcon={<TuneIcon sx={{ fontSize: '18px !important' }} />}
              onClick={openModal}
              sx={{
                px: 2.5,
                height: 56,
                borderRadius: 0,
                color: hasActiveFilters ? T.accent : T.steel,
                fontFamily: '"DM Sans", sans-serif',
                fontWeight: 600,
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                minWidth: 'auto',
                '&:hover': { bgcolor: T.surface },
              }}
            >
              {!isMobile && 'Filtros'}
              {hasActiveFilters && (
                <Box
                  sx={{
                    ml: 1,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    bgcolor: T.accent,
                    color: T.white,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {[selectedSector, selectedSubsector, selectedProvince, selectedDistrict, selectedTipoEntidade].filter(Boolean).length}
                </Box>
              )}
            </Button>
          </Box>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <Box sx={{ mt: 2.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {[
                { label: searchTerm && `"${searchTerm}"`, clear: () => setSearchTerm('') },
                { label: selectedSector, clear: () => setSelectedSector('') },
                { label: selectedSubsector, clear: () => setSelectedSubsector('') },
                { label: selectedProvince, clear: () => setSelectedProvince('') },
                { label: selectedDistrict, clear: () => setSelectedDistrict('') },
                { label: selectedTipoEntidade, clear: () => setSelectedTipoEntidade('') },
              ]
                .filter((f) => f.label)
                .map((f, i) => (
                  <Chip
                    key={i}
                    label={f.label}
                    onDelete={f.clear}
                    size="small"
                    deleteIcon={<CloseIcon style={{ fontSize: 14 }} />}
                    sx={{
                      bgcolor: 'rgba(200,149,58,0.15)',
                      color: T.accentLight,
                      border: `1px solid rgba(200,149,58,0.3)`,
                      borderRadius: '8px',
                      fontFamily: '"DM Sans", sans-serif',
                      fontSize: '0.78rem',
                      '& .MuiChip-deleteIcon': { color: 'rgba(200,149,58,0.7)' },
                    }}
                  />
                ))}
              <Chip
                label="Limpar tudo"
                onClick={resetFilters}
                size="small"
                sx={{
                  bgcolor: 'transparent',
                  color: 'rgba(255,255,255,0.45)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '8px',
                  fontFamily: '"DM Sans", sans-serif',
                  fontSize: '0.78rem',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                }}
              />
            </Box>
          )}
        </Container>
      </Box>

      {/* ── RESULTS AREA ─────────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py: 5 }}>

        {/* Result count bar */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3,
            pb: 2.5,
            borderBottom: `1px solid ${T.border}`,
          }}
        >
          <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.9rem', color: T.textSub }}>
            {filteredCompanies.length > 0
              ? <>Mostrando <strong style={{ color: T.text }}>{currentCompanies.length}</strong> de <strong style={{ color: T.text }}>{filteredCompanies.length}</strong> empresas</>
              : 'Nenhuma empresa encontrada'}
          </Typography>
          {totalPages > 1 && (
            <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.85rem', color: T.muted }}>
              Pág. {currentPage} / {totalPages}
            </Typography>
          )}
        </Box>

        {filteredCompanies.length === 0 ? (
          /* ── EMPTY STATE ─────────────────────────────────────────────── */
          <Box
            sx={{
              textAlign: 'center',
              py: 12,
              px: 3,
              border: `1px dashed ${T.border}`,
              borderRadius: '16px',
              background: T.white,
            }}
          >
            <Box
              sx={{
                width: 72,
                height: 72,
                borderRadius: '18px',
                bgcolor: T.surface,
                border: `1px solid ${T.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 3,
              }}
            >
              <BusinessIcon sx={{ fontSize: 32, color: T.muted }} />
            </Box>
            <Typography
              variant="h6"
              sx={{ fontFamily: '"DM Serif Display", Georgia, serif', color: T.text, mb: 1 }}
            >
              Nenhum resultado encontrado
            </Typography>
            <Typography sx={{ fontFamily: '"DM Sans", sans-serif', color: T.textSub, fontSize: '0.9rem', mb: 3 }}>
              Tente ajustar os filtros ou alterar o termo de pesquisa.
            </Typography>
            {hasActiveFilters && (
              <Button
                onClick={resetFilters}
                variant="outlined"
                sx={{
                  borderColor: T.border,
                  color: T.steel,
                  borderRadius: '8px',
                  fontFamily: '"DM Sans", sans-serif',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&:hover': { borderColor: T.navy, color: T.navy, bgcolor: 'transparent' },
                }}
              >
                Limpar todos os filtros
              </Button>
            )}
          </Box>
        ) : (
          <>
            {/* ── GRID ─────────────────────────────────────────────────── */}
            <Grid container spacing={2.5}>
              {currentCompanies.map((company) => (
                <Grid item key={company.id} xs={12} sm={6} md={4} lg={3}>
                  <Card elevation={0} sx={cardSx} onClick={() => handleClick(company.slug)}>
                    {/* Accent bar on top */}
                    <Box
                      sx={{
                        height: 3,
                        background: `linear-gradient(90deg, ${T.accent} 0%, rgba(200,149,58,0) 100%)`,
                        opacity: 0,
                        transition: 'opacity 0.22s',
                        '.MuiCard-root:hover &': { opacity: 1 },
                      }}
                    />
                    <Box sx={{ p: 2.5 }}>
                      {/* Header */}
                      <Box display="flex" alignItems="flex-start" gap={1.5} mb={2}>
                        <Avatar
                          src={company.logoUrl}
                          alt={company.nome}
                          variant="rounded"
                          sx={{
                            width: 44,
                            height: 44,
                            bgcolor: T.surface,
                            border: `1px solid ${T.border}`,
                            borderRadius: '10px',
                            flexShrink: 0,
                            fontSize: '1.1rem',
                            fontWeight: 700,
                            color: T.navy,
                            fontFamily: '"DM Serif Display", serif',
                          }}
                        >
                          {(company.sigla || company.nome || '?')[0]}
                        </Avatar>
                        <Box sx={{ minWidth: 0, flex: 1, pt: 0.25 }}>
                          <Typography
                            sx={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontWeight: 700,
                              fontSize: '0.9rem',
                              color: T.text,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              lineHeight: 1.3,
                            }}
                          >
                            {company.sigla || company.nome}
                          </Typography>
                          {company.sigla && company.nome && (
                            <Typography
                              sx={{
                                fontFamily: '"DM Sans", sans-serif',
                                fontSize: '0.72rem',
                                color: T.muted,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.4,
                              }}
                            >
                              {company.nome}
                            </Typography>
                          )}
                        </Box>
                      </Box>

                      {/* Divider */}
                      <Box sx={{ height: '1px', bgcolor: T.border, mb: 2 }} />

                      {/* Meta */}
                      <Box display="flex" flexDirection="column" gap={0.8}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <CategoryIcon sx={{ fontSize: 14, color: T.muted, flexShrink: 0 }} />
                          <Typography
                            sx={{
                              fontFamily: '"DM Sans", sans-serif',
                              fontSize: '0.78rem',
                              color: T.textSub,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {company.sector || 'Setor não especificado'}
                          </Typography>
                        </Box>

                        {(company.provincia || company.distrito) && (
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocationOnIcon sx={{ fontSize: 14, color: T.muted, flexShrink: 0 }} />
                            <Typography
                              sx={{
                                fontFamily: '"DM Sans", sans-serif',
                                fontSize: '0.78rem',
                                color: T.textSub,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {company.provincia}
                              {company.distrito && ` · ${company.distrito}`}
                            </Typography>
                          </Box>
                        )}

                        {company.tipoEntidade && (
                          <Box sx={{ mt: 0.5 }}>
                            <Box
                              component="span"
                              sx={{
                                display: 'inline-block',
                                px: 1.2,
                                py: 0.35,
                                borderRadius: '6px',
                                bgcolor: T.surface,
                                border: `1px solid ${T.border}`,
                                fontSize: '0.7rem',
                                fontFamily: '"DM Sans", sans-serif',
                                fontWeight: 600,
                                color: T.steel,
                                letterSpacing: '0.02em',
                              }}
                            >
                              {company.tipoEntidade}
                            </Box>
                          </Box>
                        )}
                      </Box>

                      {/* CTA row */}
                      <Box
                        sx={{
                          mt: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          '.MuiCard-root:hover &': { opacity: 1 },
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            fontFamily: '"DM Sans", sans-serif',
                            fontWeight: 600,
                            color: T.accent,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.4,
                          }}
                        >
                          Ver perfil <ArrowForwardIcon sx={{ fontSize: 13 }} />
                        </Typography>
                      </Box>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* ── PAGINATION ───────────────────────────────────────────── */}
            {totalPages > 1 && (
              <Box display="flex" justifyContent="center" mt={7}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, val) => setCurrentPage(val)}
                  shape="rounded"
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      fontFamily: '"DM Sans", sans-serif',
                      fontWeight: 500,
                      color: T.steel,
                      border: `1px solid ${T.border}`,
                      borderRadius: '8px',
                      '&:hover': { bgcolor: T.surface, borderColor: T.navy },
                      '&.Mui-selected': {
                        bgcolor: T.navy,
                        color: T.white,
                        borderColor: T.navy,
                        fontWeight: 700,
                        '&:hover': { bgcolor: T.navyMid },
                      },
                    },
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Container>

      {/* ── FILTER MODAL ─────────────────────────────────────────────────── */}
      <Dialog
        open={isModalOpen}
        onClose={closeModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            fontFamily: '"DM Sans", sans-serif',
            overflow: 'hidden',
            boxShadow: '0 24px 80px rgba(0,0,0,0.18)',
          },
        }}
      >
        {/* Modal header */}
        <DialogTitle
          sx={{
            px: 3,
            py: 2.5,
            borderBottom: `1px solid ${T.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: T.navy,
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <TuneIcon sx={{ color: T.accent, fontSize: 20 }} />
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: T.white, fontFamily: '"DM Sans", sans-serif' }}>
              Filtros Avançados
            </Typography>
          </Box>
          <IconButton onClick={closeModal} size="small" sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: T.white } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, bgcolor: T.white }}>
          <Box display="flex" flexDirection="column" gap={3.5}>

            {/* Localização */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <LocationOnIcon sx={{ fontSize: 16, color: T.accent }} />
                <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, fontSize: '0.82rem', color: T.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Localização
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.78rem', color: T.textSub, mb: 0.75 }}>Província</Typography>
                  <Select value={selectedProvince} onChange={(e) => setSelectedProvince(e.target.value)} displayEmpty fullWidth size="small"
                    sx={{ borderRadius: '8px', fontFamily: '"DM Sans", sans-serif', fontSize: '0.88rem', '& fieldset': { borderColor: T.border } }}>
                    <MenuItem value="">Todas as províncias</MenuItem>
                    {provincias.map((p) => <MenuItem key={p.provincia} value={p.provincia}>{p.provincia}</MenuItem>)}
                  </Select>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.78rem', color: T.textSub, mb: 0.75 }}>Distrito</Typography>
                  <Select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={!selectedProvince} displayEmpty fullWidth size="small"
                    sx={{ borderRadius: '8px', fontFamily: '"DM Sans", sans-serif', fontSize: '0.88rem', '& fieldset': { borderColor: T.border } }}>
                    <MenuItem value="">Todos os distritos</MenuItem>
                    {distritos.map((d, i) => <MenuItem key={i} value={d}>{d}</MenuItem>)}
                  </Select>
                </Grid>
              </Grid>
            </Box>

            {/* Atividade */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <CategoryIcon sx={{ fontSize: 16, color: T.accent }} />
                <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, fontSize: '0.82rem', color: T.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Atividade
                </Typography>
              </Box>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.78rem', color: T.textSub, mb: 0.75 }}>Setor</Typography>
                  <Select value={selectedSector} onChange={(e) => setSelectedSector(e.target.value)} displayEmpty fullWidth size="small"
                    sx={{ borderRadius: '8px', fontFamily: '"DM Sans", sans-serif', fontSize: '0.88rem', '& fieldset': { borderColor: T.border } }}>
                    <MenuItem value="">Todos os setores</MenuItem>
                    {sectores.map((s) => <MenuItem key={s.setor} value={s.setor}>{s.setor}</MenuItem>)}
                  </Select>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontSize: '0.78rem', color: T.textSub, mb: 0.75 }}>Subsector</Typography>
                  <Select value={selectedSubsector} onChange={(e) => setSelectedSubsector(e.target.value)} disabled={!selectedSector} displayEmpty fullWidth size="small"
                    sx={{ borderRadius: '8px', fontFamily: '"DM Sans", sans-serif', fontSize: '0.88rem', '& fieldset': { borderColor: T.border } }}>
                    <MenuItem value="">Todos os subsectores</MenuItem>
                    {subsectores.map((s, i) => <MenuItem key={i} value={s}>{s}</MenuItem>)}
                  </Select>
                </Grid>
              </Grid>
            </Box>

            {/* Tipo de Entidade */}
            <Box>
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <BusinessIcon sx={{ fontSize: 16, color: T.accent }} />
                <Typography sx={{ fontFamily: '"DM Sans", sans-serif', fontWeight: 700, fontSize: '0.82rem', color: T.text, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Tipo de Entidade
                </Typography>
              </Box>
              <Select value={selectedTipoEntidade} onChange={(e) => setSelectedTipoEntidade(e.target.value)} displayEmpty fullWidth size="small"
                sx={{ borderRadius: '8px', fontFamily: '"DM Sans", sans-serif', fontSize: '0.88rem', '& fieldset': { borderColor: T.border } }}>
                <MenuItem value="">Todos os tipos</MenuItem>
                {tiposEntidades.map((e) => <MenuItem key={e.tipo} value={e.tipo}>{e.tipo}</MenuItem>)}
              </Select>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2.5,
            borderTop: `1px solid ${T.border}`,
            gap: 1.5,
            bgcolor: T.surface,
          }}
        >
          <Button
            onClick={resetFilters}
            sx={{
              color: T.textSub,
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: '8px',
              '&:hover': { bgcolor: T.border, color: T.text },
            }}
          >
            Limpar filtros
          </Button>
          <Button
            variant="contained"
            onClick={closeModal}
            disableElevation
            sx={{
              bgcolor: T.navy,
              color: T.white,
              borderRadius: '8px',
              px: 3.5,
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: 700,
              textTransform: 'none',
              fontSize: '0.9rem',
              '&:hover': { bgcolor: T.navyMid },
            }}
          >
            Aplicar filtros
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default Explore;
import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Container, Grid, Snackbar, Alert,
  useMediaQuery, Typography, InputBase, Button,
} from "@mui/material";
import ArrowForwardIcon          from '@mui/icons-material/ArrowForward';
import RequestQuoteOutlinedIcon  from '@mui/icons-material/RequestQuoteOutlined';
import StorefrontOutlinedIcon    from '@mui/icons-material/StorefrontOutlined';
import HandymanOutlinedIcon      from '@mui/icons-material/HandymanOutlined';
import BusinessOutlinedIcon      from '@mui/icons-material/BusinessOutlined';
import VerifiedOutlinedIcon      from '@mui/icons-material/VerifiedOutlined';
import TrendingUpOutlinedIcon    from '@mui/icons-material/TrendingUpOutlined';
import CheckCircleOutlineIcon    from '@mui/icons-material/CheckCircleOutline';
import SearchIcon                from '@mui/icons-material/Search';
import { useNavigate } from "react-router-dom";
import { onValue, ref } from "firebase/database";
import { db } from "../fb";
import StorieListDesk from "./desktop/StorieListDesk";
import StoresDesk     from "./desktop/StoresDesk";

/* ── Design tokens ──────────────────────────────────────────────────────── */
const T = {
  navy:      '#08192E',
  navyMid:   '#0E2849',
  navyLight: '#183A63',
  gold:      '#C8903A',
  goldLight: '#E8B96A',
  goldPale:  '#FDF3E3',
  white:     '#FFFFFF',
  text:      '#0F1C2D',
  textSub:   '#6B89A5',
  borderMid: '#C5D4E3',
  surface:   '#F4F7FB',
};

/* ── Keyframes (static — defined outside component) ────────────────────── */
const KEYFRAMES = `
  @keyframes fadeUp    { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
  @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }

  .afu   { animation: fadeUp .65s cubic-bezier(.22,1,.36,1) both; }
  .afi   { animation: fadeIn .5s ease both; }
  .d1 { animation-delay:.10s } .d2 { animation-delay:.22s }
  .d3 { animation-delay:.34s } .d4 { animation-delay:.46s }

  .feature-card {
    transition: transform .25s ease, border-color .25s ease, box-shadow .25s ease;
  }
  .feature-card:hover {
    transform: translateY(-4px);
    border-color: ${T.gold} !important;
    box-shadow: 0 16px 48px rgba(8,25,46,0.1) !important;
  }
  .sector-pill { transition: background .18s, color .18s, border-color .18s; }
  .sector-pill:hover {
    background: ${T.gold} !important;
    color: ${T.white} !important;
    border-color: ${T.gold} !important;
  }
  .cta-btn { transition: background .2s, transform .2s; }
  .cta-btn:hover { background: ${T.goldLight} !important; transform: translateY(-1px); }
`;

/* ── Static data (outside component — no re-creation on render) ─────────── */
const POPULAR_SECTORS = ['Construção', 'TI & Software', 'Logística', 'Consultoria'];

/* ════════════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════════════ */
const Dashboard = ({ user }) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const isTablet = useMediaQuery('(max-width:960px)');
  const navigate = useNavigate();

  /* ── State ─────────────────────────────────────────────────────── */
  const [search,          setSearch]          = useState('');
  const [campanhasAtivas, setCampanhasAtivas] = useState([]);
  const [snackbar, setSnackbar] = useState({ open:false, message:'', severity:'success' });

  const showSnack = useCallback((message, severity = 'success') => {
    setSnackbar({ open:true, message, severity });
  }, []);

  /* ── Fetch campanhas ───────────────────────────────────────────── */
  useEffect(() => {
    const campanhasRef = ref(db, 'campanhas');
    const currentProvince = user?.provinciaTemp || user?.provincia || 'Cabo Delgado';

    const unsub = onValue(campanhasRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const result = [];
      Object.values(data).forEach((grupo) => {
        Object.entries(grupo).forEach(([id, campanha]) => {
          if (
            campanha.component === 'home' &&
            campanha.company?.provincia === currentProvince
          ) {
            result.push({ id, ...campanha });
          }
        });
      });
      setCampanhasAtivas(result);
    }, (err) => {
      console.error('campanhas:', err);
      showSnack('Erro ao carregar campanhas.', 'error');
    });

    return () => unsub();
  }, [user, showSnack]);

  /* ── Handlers ──────────────────────────────────────────────────── */
  const handleSearch = useCallback(() => {
    if (search.trim()) navigate(`/explorar?q=${encodeURIComponent(search.trim())}`);
    else navigate('/explorar');
  }, [search, navigate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <Box sx={{ fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
      <style>{KEYFRAMES}</style>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <Box sx={{
        position: 'relative',
        background: `linear-gradient(160deg,${T.navy} 0%,${T.navyMid} 55%,${T.navyLight} 100%)`,
        pt: { xs:7, md:11 }, pb: { xs:8, md:12 },
        overflow: 'hidden',
      }}>
        {/* Background layers */}
        <Box sx={{ position:'absolute', inset:0, pointerEvents:'none',
          background:`
            radial-gradient(ellipse 80% 60% at 90% 10%, rgba(200,144,58,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 5%  90%, rgba(200,144,58,0.07) 0%, transparent 50%)
          ` }} />
        <Box sx={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.035,
          backgroundImage:`linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),
                           linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)`,
          backgroundSize:'56px 56px' }} />
        <Box sx={{ display:{ xs:'none', md:'block' }, position:'absolute', right:'6%', top:'12%',
          width:320, height:320, borderRadius:'50%',
          border:'1px solid rgba(200,144,58,0.15)',
          animation:'float 6s ease-in-out infinite',
          '&::after':{ content:'""', position:'absolute', inset:24, borderRadius:'50%',
            border:'1px solid rgba(200,144,58,0.10)' } }} />

        <Container maxWidth="lg" sx={{ position:'relative', zIndex:1 }}>
          <Grid container spacing={4} alignItems="center">
            {/* ── Left col ─────────────────────────────────────── */}
            <Grid item xs={12} md={7}>
              {/* Eyebrow pill */}
              <Box className="afu" sx={{ display:'inline-flex', alignItems:'center', gap:1,
                px:2, py:0.6, mb:3,
                background:'rgba(200,144,58,0.12)', border:'1px solid rgba(200,144,58,0.35)',
                borderRadius:'100px' }}>
                <Box sx={{ width:7, height:7, borderRadius:'50%', bgcolor:T.gold,
                  animation:'pulse-dot 2s ease infinite' }} />
                <Typography sx={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.07em',
                  color:T.goldLight, fontFamily:'"Plus Jakarta Sans", sans-serif',
                  textTransform:'uppercase' }}>
                  Diretório Nacional de Empresas
                </Typography>
              </Box>

              {/* Headline */}
              <Typography className="afu d1" component="h1" sx={{
                fontFamily:'"Playfair Display", Georgia, serif', fontWeight:800,
                fontSize:{ xs:'2.2rem', sm:'2.8rem', md:'3.4rem' },
                lineHeight:1.08, color:T.white, letterSpacing:'-0.02em', mb:2,
              }}>
                Encontre Empresas,<br />
                <Box component="span" sx={{ color:T.gold, position:'relative',
                  '&::after':{ content:'""', position:'absolute', bottom:2, left:0, right:0,
                    height:2, background:`linear-gradient(90deg,${T.gold},transparent)`,
                    borderRadius:2 } }}>
                  Bens e Serviços
                </Box>
              </Typography>

              {/* Search bar */}
              <Box className="afu d3" sx={{ display:'flex', background:T.white,
                borderRadius:'14px', boxShadow:'0 24px 80px rgba(0,0,0,0.3)',
                overflow:'hidden', maxWidth:580, mb:3 }}>
                <Box sx={{ pl:2, display:'flex', alignItems:'center', flexShrink:0 }}>
                  <SearchIcon sx={{ color:T.textSub, fontSize:22 }} />
                </Box>
                <InputBase
                  placeholder="Empresa, produto, serviço ou setor…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  fullWidth
                  sx={{ px:1.5, py:1.5, fontSize:'0.95rem',
                    fontFamily:'"Plus Jakarta Sans", sans-serif', color:T.text,
                    '& input::placeholder':{ color:T.textSub, opacity:1 } }}
                />
                <Button onClick={handleSearch} className="cta-btn" disableElevation
                  sx={{ m:0.6, px:{ xs:2, sm:3 }, borderRadius:'10px', background:T.gold,
                    color:T.white, fontFamily:'"Plus Jakarta Sans", sans-serif',
                    fontWeight:700, fontSize:'0.88rem', textTransform:'none',
                    whiteSpace:'nowrap', flexShrink:0 }}>
                  {isMobile ? <SearchIcon fontSize="small" /> : 'Pesquisar'}
                </Button>
              </Box>

              {/* Popular tags */}
              <Box className="afu d4" sx={{ display:'flex', alignItems:'center', gap:1, flexWrap:'wrap' }}>
                <Typography sx={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.4)',
                  fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
                  Popular:
                </Typography>
                {POPULAR_SECTORS.map((s) => (
                  <Box key={s} component="span" className="sector-pill"
                    onClick={() => navigate(`/explorar?sector=${s}`)}
                    sx={{ px:1.5, py:0.4, border:'1px solid rgba(255,255,255,0.15)',
                      borderRadius:'100px', fontSize:'0.76rem', color:'rgba(255,255,255,0.6)',
                      cursor:'pointer', fontFamily:'"Plus Jakarta Sans", sans-serif' }}>
                    {s}
                  </Box>
                ))}
              </Box>
            </Grid>

            {/* ── Right col — floating cards (hidden on tablet/mobile) ── */}
            {!isTablet && (
              <Grid item md={5} sx={{ display:'flex', justifyContent:'center', alignItems:'center' }}>
                <Box className="afi d2" sx={{ position:'relative', width:300, height:340 }}>
                  {/* Cotação card */}
                  <Box sx={{ position:'absolute', top:0, left:20, background:T.white,
                    borderRadius:'16px', p:2.5, width:230,
                    boxShadow:'0 20px 60px rgba(0,0,0,0.25)',
                    animation:'float 5s ease-in-out infinite' }}>
                    <Box sx={{ display:'flex', alignItems:'center', gap:1.5, mb:1.5 }}>
                      <Box sx={{ width:36, height:36, borderRadius:'10px', bgcolor:T.goldPale,
                        display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <RequestQuoteOutlinedIcon sx={{ fontSize:18, color:T.gold }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize:'0.78rem', fontWeight:700, color:T.text,
                          fontFamily:'"Plus Jakarta Sans", sans-serif' }}>Cotação Recebida</Typography>
                        <Typography sx={{ fontSize:'0.68rem', color:T.textSub,
                          fontFamily:'"Plus Jakarta Sans", sans-serif' }}>Empresa Pemba, Lda</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ bgcolor:T.surface, borderRadius:'8px', px:1.5, py:1 }}>
                      <Typography sx={{ fontSize:'0.72rem', color:T.textSub,
                        fontFamily:'"Plus Jakarta Sans", sans-serif' }}>Material de construção</Typography>
                      <Typography sx={{ fontSize:'1.1rem', fontWeight:700, color:T.navy,
                        fontFamily:'"Plus Jakarta Sans", sans-serif' }}>850 000 MT</Typography>
                    </Box>
                    <Box sx={{ display:'flex', alignItems:'center', gap:0.5, mt:1 }}>
                      <CheckCircleOutlineIcon sx={{ fontSize:13, color:'#22c55e' }} />
                      <Typography sx={{ fontSize:'0.68rem', color:'#22c55e', fontWeight:600,
                        fontFamily:'"Plus Jakarta Sans", sans-serif' }}>Empresa verificada</Typography>
                    </Box>
                  </Box>

                  {/* Product card */}
                  <Box sx={{ position:'absolute', bottom:0, right:0, background:T.white,
                    borderRadius:'16px', p:2, width:200,
                    boxShadow:'0 16px 50px rgba(0,0,0,0.22)',
                    animation:'float 7s ease-in-out infinite', animationDelay:'1.5s' }}>
                    <Box sx={{ height:80, borderRadius:'10px', bgcolor:T.surface, mb:1.5,
                      display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <StorefrontOutlinedIcon sx={{ fontSize:32, color:T.borderMid }} />
                    </Box>
                    <Typography sx={{ fontSize:'0.75rem', fontWeight:700, color:T.text, mb:0.25,
                      fontFamily:'"Plus Jakarta Sans", sans-serif' }}>Cimento CEM II 42.5</Typography>
                    <Typography sx={{ fontSize:'0.68rem', color:T.textSub,
                      fontFamily:'"Plus Jakarta Sans", sans-serif' }}>Cimentos de Moçambique</Typography>
                    <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', mt:1 }}>
                      <Typography sx={{ fontSize:'0.85rem', fontWeight:700, color:T.gold,
                        fontFamily:'"Plus Jakarta Sans", sans-serif' }}>1 250 MT</Typography>
                      <Box sx={{ px:1, py:0.25, bgcolor:T.goldPale, borderRadius:'6px' }}>
                        <Typography sx={{ fontSize:'0.65rem', fontWeight:700, color:T.gold,
                          fontFamily:'"Plus Jakarta Sans", sans-serif' }}>Em stock</Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Online pill */}
                  <Box sx={{ position:'absolute', top:120, right:8, background:T.navy,
                    borderRadius:'100px', px:1.5, py:0.6,
                    display:'flex', alignItems:'center', gap:0.75,
                    boxShadow:'0 8px 24px rgba(0,0,0,0.3)' }}>
                    <Box sx={{ width:6, height:6, borderRadius:'50%', bgcolor:'#22c55e',
                      animation:'pulse-dot 1.5s ease infinite' }} />
                    <Typography sx={{ fontSize:'0.68rem', fontWeight:700, color:T.white,
                      fontFamily:'"Plus Jakarta Sans", sans-serif' }}>312 empresas online</Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>
        </Container>
      </Box>

      {/* ── Stories ──────────────────────────────────────────────── */}
      <Container maxWidth="lg" sx={{ py:{ xs:3, md:4 } }}>
        <StorieListDesk user={user} />
      </Container>

      {/* ── Marketplace ──────────────────────────────────────────── */}
      <StoresDesk user={user} />

      {/* ── Snackbar ─────────────────────────────────────────────── */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open:false }))}
        anchorOrigin={{ vertical:'bottom', horizontal:'center' }}>
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open:false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontFamily:'"Plus Jakarta Sans", sans-serif', borderRadius:'12px' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
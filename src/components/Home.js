import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Grid,
  InputBase, useMediaQuery,
} from '@mui/material';
import SearchIcon          from '@mui/icons-material/Search';
import ArrowForwardIcon    from '@mui/icons-material/ArrowForward';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import StorefrontOutlinedIcon   from '@mui/icons-material/StorefrontOutlined';
import HandymanOutlinedIcon     from '@mui/icons-material/HandymanOutlined';
import BusinessOutlinedIcon     from '@mui/icons-material/BusinessOutlined';
import VerifiedOutlinedIcon     from '@mui/icons-material/VerifiedOutlined';
import TrendingUpOutlinedIcon   from '@mui/icons-material/TrendingUpOutlined';
import CheckCircleOutlineIcon   from '@mui/icons-material/CheckCircleOutline';
import KeyboardArrowRightIcon   from '@mui/icons-material/KeyboardArrowRight';

/* ── Design Tokens ──────────────────────────────────────────────────────── */
const T = {
  navy:      '#08192E',
  navyMid:   '#0E2849',
  navyLight: '#183A63',
  navyCard:  '#0D2240',   // card bg on dark sections
  gold:      '#C8903A',
  goldLight: '#E8B96A',
  goldPale:  '#FDF3E3',
  white:     '#FFFFFF',
  text:      '#0F1C2D',
  textMid:   '#3D5A7A',
  textSub:   '#6B89A5',
  border:    '#E0E8F0',
  borderMid: '#C5D4E3',
  surface:   '#F4F7FB',
  // Dark-mode card borders
  darkBorder:    'rgba(255,255,255,0.08)',
  darkBorderMid: 'rgba(255,255,255,0.14)',
  darkText:      'rgba(255,255,255,0.88)',
  darkTextSub:   'rgba(255,255,255,0.52)',
  darkTextMuted: 'rgba(255,255,255,0.32)',
};

/* ── Shared background layers (reused in every section) ─────────────────── */
const BG_GRID = {
  position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.03,
  backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
  backgroundSize: '56px 56px',
};

const bgGlow = (pos = '90% 10%', size = '70% 55%') => ({
  position: 'absolute', inset: 0, pointerEvents: 'none',
  background: `radial-gradient(ellipse ${size} at ${pos}, rgba(200,144,58,0.10) 0%, transparent 60%)`,
});

/* ── Keyframes ──────────────────────────────────────────────────────────── */
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  @keyframes fadeUp   { from{opacity:0;transform:translateY(26px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes pulse-dot{ 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.85)} }

  .afu  { animation: fadeUp  .65s cubic-bezier(.22,1,.36,1) both; }
  .afin { animation: fadeIn  .5s ease both; }
  .d1{animation-delay:.10s} .d2{animation-delay:.22s} .d3{animation-delay:.34s}
  .d4{animation-delay:.46s} .d5{animation-delay:.58s}

  /* Feature cards — dark variant */
  .dk-card {
    transition: transform .24s ease, border-color .24s ease, box-shadow .24s ease;
    position: relative; overflow: hidden;
  }
  .dk-card::before {
    content:''; position:absolute; top:0; left:0; right:0; height:2px;
    background: linear-gradient(90deg, ${T.gold} 0%, transparent 100%);
    opacity:0; transition:opacity .24s;
  }
  .dk-card:hover { transform:translateY(-4px); border-color:${T.gold} !important; box-shadow:0 20px 60px rgba(0,0,0,0.35) !important; }
  .dk-card:hover::before { opacity:1; }
  .dk-card:hover .dk-icon { background:rgba(200,144,58,0.22) !important; }

  /* Sector pills */
  .sec-pill { transition: background .18s, color .18s, border-color .18s; }
  .sec-pill:hover { background:${T.gold} !important; color:#fff !important; border-color:${T.gold} !important; }

  /* Step icon */
  .step-icon { transition: background .24s; }
  .dk-card:hover .step-icon { background: rgba(200,144,58,0.22) !important; }

  /* CTA btns */
  .btn-gold   { transition: background .2s, transform .2s; }
  .btn-gold:hover   { background:${T.goldLight} !important; transform:translateY(-1px); }
  .btn-ghost  { transition: background .2s, border-color .2s; }
  .btn-ghost:hover  { background:rgba(255,255,255,0.09) !important; border-color:rgba(255,255,255,0.55) !important; }
`;

/* ── Dark section wrapper ────────────────────────────────────────────────── */
const DarkSection = ({ children, glowPos, glowSize, py = { xs: 9, md: 13 }, sx = {} }) => (
  <Box sx={{
    position: 'relative', overflow: 'hidden',
    background: `linear-gradient(160deg, ${T.navy} 0%, ${T.navyMid} 60%, ${T.navyLight} 100%)`,
    py, px: 2,
    ...sx,
  }}>
    <Box sx={BG_GRID} />
    {glowPos && <Box sx={bgGlow(glowPos, glowSize)} />}
    <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
      {children}
    </Container>
  </Box>
);

/* ── Eyebrow badge ──────────────────────────────────────────────────────── */
const Eyebrow = ({ children }) => (
  <Box sx={{
    display: 'inline-flex', alignItems: 'center', gap: 1,
    px: 2, py: 0.55, mb: 2.5,
    background: 'rgba(200,144,58,0.12)',
    border: '1px solid rgba(200,144,58,0.35)',
    borderRadius: '100px',
  }}>
    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: T.gold, animation: 'pulse-dot 2s ease infinite' }} />
    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.08em', color: T.goldLight, fontFamily: '"Plus Jakarta Sans", sans-serif', textTransform: 'uppercase' }}>
      {children}
    </Typography>
  </Box>
);

/* ── Section heading (dark) ─────────────────────────────────────────────── */
const DarkHeading = ({ children, sub, center = false, maxWidth = 560 }) => (
  <Box sx={{ textAlign: center ? 'center' : 'left', mb: 6, ...(center ? {} : {}) }}>
    <Typography sx={{
      fontFamily: '"Playfair Display", Georgia, serif',
      fontWeight: 800,
      fontSize: { xs: '2rem', md: '2.6rem' },
      color: T.white,
      letterSpacing: '-0.02em',
      lineHeight: 1.1,
      mb: 1.5,
      ...(center ? { mx: 'auto', maxWidth } : { maxWidth }),
    }}>
      {children}
    </Typography>
    {sub && (
      <Typography sx={{
        color: T.darkTextSub, fontSize: '1rem', lineHeight: 1.75,
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        ...(center ? { mx: 'auto', maxWidth: 500 } : { maxWidth: 540 }),
      }}>
        {sub}
      </Typography>
    )}
  </Box>
);

/* ── Dark card ──────────────────────────────────────────────────────────── */
const DarkCard = ({ children, sx = {} }) => (
  <Box className="dk-card" sx={{
    background: T.navyCard,
    border: `1px solid ${T.darkBorder}`,
    borderRadius: '18px',
    p: 3.5,
    height: '100%',
    ...sx,
  }}>
    {children}
  </Box>
);

/* ── Data ───────────────────────────────────────────────────────────────── */
const HOW_IT_WORKS = [
  { n: '01', title: 'Pesquise a Empresa',    desc: 'Encontre empresas por nome, setor ou localização em todo o território nacional.', icon: <BusinessOutlinedIcon sx={{ fontSize: 22 }} /> },
  { n: '02', title: 'Explore Bens & Serviços', desc: 'Veja os produtos e serviços que cada empresa oferece, com detalhes e preços.', icon: <StorefrontOutlinedIcon sx={{ fontSize: 22 }} /> },
  { n: '03', title: 'Solicite uma Cotação',  desc: 'Envie o seu pedido de cotação diretamente à empresa e receba uma proposta.',  icon: <RequestQuoteOutlinedIcon sx={{ fontSize: 22 }} /> },
];

const VALUE_PROPS = [
  { icon: <RequestQuoteOutlinedIcon sx={{ fontSize: 26 }} />, title: 'Cotações Rápidas',       desc: 'Envie pedidos de cotação a múltiplas empresas e compare propostas num só lugar.' },
  { icon: <StorefrontOutlinedIcon   sx={{ fontSize: 26 }} />, title: 'Catálogo de Produtos',   desc: 'Navegue por milhares de produtos e bens disponíveis pelas empresas cadastradas.' },
  { icon: <HandymanOutlinedIcon     sx={{ fontSize: 26 }} />, title: 'Serviços Especializados', desc: 'Encontre prestadores de serviços qualificados em todas as áreas de atividade.' },
  { icon: <VerifiedOutlinedIcon     sx={{ fontSize: 26 }} />, title: 'Empresas Verificadas',   desc: 'Todas as empresas são verificadas e validadas antes de integrarem a plataforma.' },
  { icon: <TrendingUpOutlinedIcon   sx={{ fontSize: 26 }} />, title: 'Decisões Informadas',    desc: 'Aceda a perfis completos com histórico, certificações e avaliações de clientes.' },
  { icon: <BusinessOutlinedIcon     sx={{ fontSize: 26 }} />, title: 'Cobertura Nacional',     desc: 'Empresas de todas as províncias e distritos de Moçambique numa só plataforma.' },
];

const SECTORS = [
  'Construção & Infraestrutura', 'Tecnologia & TI', 'Saúde & Farmácia',
  'Alimentação & Bebidas', 'Logística & Transporte', 'Energia & Utilities',
  'Consultoria & Serviços', 'Educação & Formação',
];

const STATS = [
  { value: '2 400+', label: 'Empresas Cadastradas' },
  { value: '18',     label: 'Setores de Atividade' },
  { value: '11',     label: 'Províncias Cobertas'  },
  { value: '5 000+', label: 'Cotações Enviadas'    },
];

/* ════════════════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════════════════ */
const Home = () => {
  const navigate  = useNavigate();
  const [search, setSearch] = useState('');
  const isMobile  = useMediaQuery('(max-width:600px)');
  const isTablet  = useMediaQuery('(max-width:960px)');

  const handleSearch = () => {
    navigate(search.trim() ? `/explorar?q=${encodeURIComponent(search)}` : '/explorar');
  };

  return (
    <Box sx={{ backgroundColor: T.navy, minHeight: '100vh', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      <style>{KEYFRAMES}</style>

      {/* ══════════════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════════════ */}
      <Box sx={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(160deg, ${T.navy} 0%, ${T.navyMid} 55%, ${T.navyLight} 100%)`,
        pt: { xs: 8, md: 12 }, pb: { xs: 9, md: 13 }, px: 2,
      }}>
        {/* Decorative layers */}
        <Box sx={BG_GRID} />
        <Box sx={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse 80% 60% at 90% 10%, rgba(200,144,58,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 50% 50% at 5% 90%,  rgba(200,144,58,0.07) 0%, transparent 50%)
          `,
        }} />
        {/* Floating ring */}
        <Box sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute', right: '6%', top: '12%',
          width: 300, height: 300, borderRadius: '50%',
          border: '1px solid rgba(200,144,58,0.15)',
          animation: 'float 6s ease-in-out infinite',
          '&::after': { content:'""', position:'absolute', inset:22, borderRadius:'50%', border:'1px solid rgba(200,144,58,0.08)' },
        }} />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box className="afu"><Eyebrow>Diretório Empresarial de Moçambique</Eyebrow></Box>

              <Typography className="afu d1" component="h1" sx={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontWeight: 800,
                fontSize: { xs: '2.3rem', sm: '2.9rem', md: '3.5rem' },
                lineHeight: 1.08, color: T.white, letterSpacing: '-0.02em', mb: 2,
              }}>
                Encontre Empresas,<br />
                <Box component="span" sx={{
                  color: T.gold, position: 'relative',
                  '&::after': { content:'""', position:'absolute', bottom:2, left:0, right:0, height:2, background:`linear-gradient(90deg,${T.gold},transparent)`, borderRadius:2 },
                }}>
                  Bens e Serviços
                </Box>
              </Typography>

              <Typography className="afu d2" sx={{
                color: T.darkTextSub, fontSize: { xs: '1rem', md: '1.08rem' },
                lineHeight: 1.78, mb: 4, maxWidth: 520, fontFamily: '"Plus Jakarta Sans", sans-serif',
              }}>
                Pesquise produtos, compare serviços e solicite cotações a empresas verificadas em todo o território nacional — num único lugar.
              </Typography>

              {/* Search bar */}
              <Box className="afu d3" sx={{
                display: 'flex', background: T.white, borderRadius: '14px',
                boxShadow: '0 24px 80px rgba(0,0,0,0.35)', overflow: 'hidden',
                maxWidth: 580, mb: 3,
              }}>
                <Box sx={{ pl: 2, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  <SearchIcon sx={{ color: T.textSub, fontSize: 22 }} />
                </Box>
                <InputBase
                  placeholder="Empresa, produto, serviço ou setor…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  fullWidth
                  sx={{ px: 1.5, py: 1.5, fontSize: '0.95rem', fontFamily: '"Plus Jakarta Sans", sans-serif', color: T.text, '& input::placeholder': { color: T.textSub, opacity: 1 } }}
                />
                <Button
                  onClick={handleSearch}
                  className="btn-gold"
                  disableElevation
                  sx={{
                    m: 0.6, px: { xs: 2, sm: 3 }, borderRadius: '10px',
                    background: T.gold, color: T.white,
                    fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                    fontSize: '0.88rem', textTransform: 'none', whiteSpace: 'nowrap', flexShrink: 0,
                  }}
                >
                  {isMobile ? <SearchIcon fontSize="small" /> : 'Pesquisar'}
                </Button>
              </Box>

              {/* Quick links */}
              <Box className="afu d4" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography sx={{ fontSize: '0.78rem', color: T.darkTextMuted, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Popular:</Typography>
                {['Construção', 'TI & Software', 'Logística', 'Consultoria'].map((s) => (
                  <Box key={s} component="span" onClick={() => navigate(`/explorar?sector=${s}`)} sx={{
                    px: 1.5, py: 0.4, border: '1px solid rgba(255,255,255,0.15)', borderRadius: '100px',
                    fontSize: '0.75rem', color: T.darkTextSub, cursor: 'pointer',
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    transition: 'all .18s', '&:hover': { borderColor: T.gold, color: T.gold },
                  }}>{s}</Box>
                ))}
              </Box>
            </Grid>

            {/* Floating UI cards */}
            {!isTablet && (
              <Grid item md={5} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Box className="afin d2" sx={{ position: 'relative', width: 300, height: 340 }}>
                  {/* Quote card */}
                  <Box sx={{
                    position: 'absolute', top: 0, left: 20,
                    background: T.white, borderRadius: '16px', p: 2.5, width: 230,
                    boxShadow: '0 20px 60px rgba(0,0,0,0.35)', animation: 'float 5s ease-in-out infinite',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                      <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: T.goldPale, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RequestQuoteOutlinedIcon sx={{ fontSize: 18, color: T.gold }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: T.text, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Cotação Recebida</Typography>
                        <Typography sx={{ fontSize: '0.68rem', color: T.textSub, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Construtora Maputo, Lda</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ bgcolor: T.surface, borderRadius: '8px', px: 1.5, py: 1 }}>
                      <Typography sx={{ fontSize: '0.72rem', color: T.textSub, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Material de construção</Typography>
                      <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: T.navy, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>850 000 MT</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                      <CheckCircleOutlineIcon sx={{ fontSize: 13, color: '#22c55e' }} />
                      <Typography sx={{ fontSize: '0.68rem', color: '#22c55e', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Empresa verificada</Typography>
                    </Box>
                  </Box>
                  {/* Product card */}
                  <Box sx={{
                    position: 'absolute', bottom: 0, right: 0,
                    background: T.white, borderRadius: '16px', p: 2, width: 200,
                    boxShadow: '0 16px 50px rgba(0,0,0,0.3)', animation: 'float 7s ease-in-out infinite', animationDelay: '1.5s',
                  }}>
                    <Box sx={{ height: 80, borderRadius: '10px', bgcolor: T.surface, mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <StorefrontOutlinedIcon sx={{ fontSize: 30, color: T.borderMid }} />
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: T.text, mb: 0.25, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Cimento CEM II 42.5</Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: T.textSub, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Cimentos de Moçambique</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: T.gold, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>1 250 MT</Typography>
                      <Box sx={{ px: 1, py: 0.25, bgcolor: T.goldPale, borderRadius: '6px' }}>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: T.gold, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Em stock</Typography>
                      </Box>
                    </Box>
                  </Box>
                  {/* Live badge */}
                  <Box sx={{
                    position: 'absolute', top: 118, right: 6,
                    background: T.navyCard, border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '100px', px: 1.5, py: 0.6,
                    display: 'flex', alignItems: 'center', gap: 0.75,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  }}>
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e', animation: 'pulse-dot 1.5s ease infinite' }} />
                    <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.white, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>312 empresas online</Typography>
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>

          {/* Stats bar */}
          <Box className="afu d5" sx={{
            mt: { xs: 7, md: 9 }, pt: 4,
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', md: 'repeat(4,1fr)' }, gap: 3,
          }}>
            {STATS.map((s) => (
              <Box key={s.label} sx={{ textAlign: { xs: 'center', md: 'left' } }}>
                <Typography sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, fontSize: { xs: '1.7rem', md: '2rem' }, color: T.gold, lineHeight: 1, mb: 0.5 }}>
                  {s.value}
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: T.darkTextMuted, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ══════════════════════════════════════════════════════════════
          HOW IT WORKS  — dark
      ══════════════════════════════════════════════════════════════ */}
      <DarkSection glowPos="10% 50%" glowSize="55% 70%">
        {/* Subtle top separator line */}
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        <Box sx={{ textAlign: 'center', mb: 7 }}>
          <Eyebrow>Como Funciona</Eyebrow>
          <DarkHeading center sub="Em três passos encontra o que procura e entra em contacto com o fornecedor certo.">
            Simples. Rápido.<br />
            <Box component="span" sx={{ color: T.gold }}>Eficiente.</Box>
          </DarkHeading>
        </Box>

        <Grid container spacing={3}>
          {HOW_IT_WORKS.map((step, i) => (
            <Grid item xs={12} md={4} key={i}>
              <DarkCard>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5 }}>
                  <Box className="step-icon dk-icon" sx={{
                    width: 48, height: 48, borderRadius: '14px',
                    bgcolor: 'rgba(200,144,58,0.14)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, color: T.gold,
                  }}>
                    {step.icon}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.98rem', color: T.darkText, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                        {step.title}
                      </Typography>
                      <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: T.darkTextMuted, fontFamily: '"Plus Jakarta Sans", sans-serif', letterSpacing: '0.05em' }}>
                        {step.n}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.875rem', color: T.darkTextSub, lineHeight: 1.75, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                      {step.desc}
                    </Typography>
                  </Box>
                </Box>
              </DarkCard>
            </Grid>
          ))}
        </Grid>
      </DarkSection>

      {/* ══════════════════════════════════════════════════════════════
          VALUE PROPS  — dark
      ══════════════════════════════════════════════════════════════ */}
      <DarkSection glowPos="85% 20%" glowSize="60% 60%">
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        <Box sx={{ mb: 7, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'flex-end' }, justifyContent: 'space-between', gap: 2 }}>
          <Box>
            <Eyebrow>Porquê Usar</Eyebrow>
            <DarkHeading sub="Tudo o que precisa para encontrar fornecedores e comprar com confiança.">
              Uma plataforma.<br />
              <Box component="span" sx={{ color: T.gold }}>Todas as ferramentas.</Box>
            </DarkHeading>
          </Box>
          <Button
            onClick={() => navigate('/explorar')}
            endIcon={<ArrowForwardIcon />}
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
              color: T.gold, fontSize: '0.9rem', textTransform: 'none', flexShrink: 0,
              borderRadius: '10px', border: '1px solid rgba(200,144,58,0.3)',
              px: 2.5, py: 1.1,
              '&:hover': { bgcolor: 'rgba(200,144,58,0.1)', borderColor: T.gold },
            }}
          >
            Ver todas as empresas
          </Button>
        </Box>

        <Grid container spacing={2.5}>
          {VALUE_PROPS.map((v, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <DarkCard>
                <Box className="dk-icon" sx={{
                  width: 50, height: 50, borderRadius: '14px',
                  bgcolor: 'rgba(200,144,58,0.14)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  mb: 2.5, color: T.gold, flexShrink: 0,
                  transition: 'background .24s',
                }}>
                  {v.icon}
                </Box>
                <Typography sx={{ fontWeight: 700, fontSize: '0.98rem', color: T.darkText, mb: 1, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  {v.title}
                </Typography>
                <Typography sx={{ fontSize: '0.875rem', color: T.darkTextSub, lineHeight: 1.75, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  {v.desc}
                </Typography>
              </DarkCard>
            </Grid>
          ))}
        </Grid>
      </DarkSection>

      {/* ══════════════════════════════════════════════════════════════
          SECTORS  — dark
      ══════════════════════════════════════════════════════════════ */}
      <DarkSection glowPos="50% 80%" glowSize="50% 50%" py={{ xs: 8, md: 11 }}>
        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'rgba(255,255,255,0.05)' }} />

        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Eyebrow>Setores</Eyebrow>
          <DarkHeading center sub="Navegue pelas principais áreas de atividade disponíveis na plataforma.">
            Explore por{' '}
            <Box component="span" sx={{ color: T.gold }}>Setor</Box>
          </DarkHeading>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', mb: 5 }}>
          {SECTORS.map((s) => (
            <Box
              key={s}
              component="span"
              className="sec-pill"
              onClick={() => navigate(`/explorar?sector=${s}`)}
              sx={{
                px: 2.5, py: 1.1,
                border: `1px solid ${T.darkBorderMid}`,
                borderRadius: '100px',
                fontSize: '0.875rem', fontWeight: 600,
                color: T.darkTextSub,
                cursor: 'pointer',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                display: 'flex', alignItems: 'center', gap: 0.75,
                background: 'rgba(255,255,255,0.04)',
              }}
            >
              {s}
              <KeyboardArrowRightIcon sx={{ fontSize: 15, opacity: 0.5 }} />
            </Box>
          ))}
        </Box>

        <Box sx={{ textAlign: 'center' }}>
          <Button
            onClick={() => navigate('/explorar')}
            endIcon={<ArrowForwardIcon sx={{ fontSize: 15 }} />}
            sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600,
              color: T.darkTextMuted, fontSize: '0.85rem', textTransform: 'none',
              '&:hover': { color: T.gold, bgcolor: 'transparent' },
            }}
          >
            Ver todos os 18 setores
          </Button>
        </Box>
      </DarkSection>

      {/* ══════════════════════════════════════════════════════════════
          CTA BANNER  — dark accent
      ══════════════════════════════════════════════════════════════ */}
      <Box sx={{
        position: 'relative', overflow: 'hidden',
        background: `linear-gradient(135deg, ${T.navyMid} 0%, ${T.navyLight} 100%)`,
        py: { xs: 9, md: 13 }, px: 2,
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}>
        <Box sx={BG_GRID} />
        {/* Gold orb right */}
        <Box sx={{
          position: 'absolute', right: '-8%', top: '-30%',
          width: 480, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,144,58,0.13) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        {/* Gold orb left */}
        <Box sx={{
          position: 'absolute', left: '-5%', bottom: '-25%',
          width: 360, height: 360, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,144,58,0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        {/* Decorative ring */}
        <Box sx={{
          display: { xs: 'none', md: 'block' },
          position: 'absolute', left: '8%', top: '15%',
          width: 200, height: 200, borderRadius: '50%',
          border: '1px solid rgba(200,144,58,0.12)',
          animation: 'float 7s ease-in-out infinite',
          '&::after': { content:'""', position:'absolute', inset:18, borderRadius:'50%', border:'1px solid rgba(200,144,58,0.07)' },
        }} />

        <Container maxWidth="md" sx={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <Eyebrow>Comece Agora</Eyebrow>
          <Typography sx={{
            fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 800,
            fontSize: { xs: '2.1rem', md: '3rem' },
            color: T.white, letterSpacing: '-0.02em', mb: 2, lineHeight: 1.1,
          }}>
            Pronto para encontrar<br />
            <Box component="span" sx={{ color: T.gold }}>o seu próximo fornecedor?</Box>
          </Typography>
          <Typography sx={{
            color: T.darkTextSub, fontSize: '1rem', mb: 5.5,
            maxWidth: 460, mx: 'auto', lineHeight: 1.78,
            fontFamily: '"Plus Jakarta Sans", sans-serif',
          }}>
            Aceda a milhares de empresas, compare propostas e tome decisões de compra com total confiança.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              onClick={() => navigate('/explorar')}
              className="btn-gold"
              variant="contained"
              disableElevation
              endIcon={<ArrowForwardIcon />}
              sx={{
                bgcolor: T.gold, color: T.white,
                fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 700,
                fontSize: '0.95rem', textTransform: 'none',
                px: 4, py: 1.6, borderRadius: '12px',
              }}
            >
              Explorar Empresas
            </Button>
            <Button
              onClick={() => navigate('/cotacoes')}
              className="btn-ghost"
              variant="outlined"
              sx={{
                borderColor: 'rgba(255,255,255,0.22)',
                color: T.darkText,
                fontFamily: '"Plus Jakarta Sans", sans-serif', fontWeight: 600,
                fontSize: '0.95rem', textTransform: 'none',
                px: 4, py: 1.6, borderRadius: '12px',
              }}
            >
              Pedir Cotação
            </Button>
          </Box>
        </Container>
      </Box>

      {/* ══════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <Box sx={{ py: 4, px: 2, background: T.navy, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
            <Typography sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, fontSize: '1.2rem', color: T.white }}>
              <Box component="span" sx={{ color: T.gold }}>Biz</Box>Moz
            </Typography>
            <Typography sx={{ fontSize: '0.78rem', color: T.darkTextMuted, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              © {new Date().getFullYear()} · Plataforma Empresarial de Moçambique
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default Home;
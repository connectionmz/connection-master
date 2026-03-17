import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Grid,
  Snackbar,
  Alert,
  useMediaQuery,
  Typography,
  InputBase,
  Button,
} from "@mui/material";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import HandymanOutlinedIcon from '@mui/icons-material/HandymanOutlined';
import BusinessOutlinedIcon from '@mui/icons-material/BusinessOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { Link, useNavigate } from "react-router-dom";
import { get, limitToFirst, onValue, orderByKey, query, ref, set } from "firebase/database";
import { db } from "../fb";
import MarqueeAnuncios from "./MarqueeAnuncios";
import BannerDesk from "./desktop/BannerDesk";
import StorieListDesk from "./desktop/StorieListDesk";
import CategoriaList from "./desktop/CategoriasList";
import LatestBlogPost from "./desktop/LatestBlogPost";
import Evento from "./desktop/Evento";
import { SearchIcon } from "lucide-react";

const Dashboard = ({ user }) => {

  const T = {
  navy:     '#08192E',
  navyMid:  '#0E2849',
  navyLight:'#183A63',
  gold:     '#C8903A',
  goldLight:'#E8B96A',
  goldPale: '#FDF3E3',
  cream:    '#FAFAF7',
  white:    '#FFFFFF',
  text:     '#0F1C2D',
  textMid:  '#3D5A7A',
  textSub:  '#6B89A5',
  border:   '#E0E8F0',
  borderMid:'#C5D4E3',
  surface:  '#F4F7FB',
};

/* ── Keyframes injected once ────────────────────────────────────────────── */
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.85); }
  }
  @keyframes countUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-up {
    animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) both;
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease both;
  }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.22s; }
  .delay-3 { animation-delay: 0.34s; }
  .delay-4 { animation-delay: 0.46s; }
  .delay-5 { animation-delay: 0.58s; }
  .delay-6 { animation-delay: 0.70s; }
  .feature-card:hover { transform: translateY(-4px); border-color: ${T.gold} !important; }
  .feature-card { transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; }
  .feature-card:hover { box-shadow: 0 16px 48px rgba(8,25,46,0.1) !important; }
  .sector-pill:hover { background: ${T.gold} !important; color: ${T.white} !important; border-color: ${T.gold} !important; }
  .sector-pill { transition: background 0.18s, color 0.18s, border-color 0.18s; }
  .cta-btn:hover { background: ${T.goldLight} !important; transform: translateY(-1px); }
  .cta-btn { transition: background 0.2s, transform 0.2s; }
  .outline-btn:hover { background: rgba(255,255,255,0.1) !important; border-color: rgba(255,255,255,0.6) !important; }
  .outline-btn { transition: background 0.2s, border-color 0.2s; }
  .step-card:hover .step-icon { background: ${T.gold} !important; }
  .step-icon { transition: background 0.25s; }
`;

/* ── Data ───────────────────────────────────────────────────────────────── */
const HOW_IT_WORKS = [
  {
    n: '01',
    title: 'Pesquise a Empresa',
    desc: 'Encontre empresas por nome, setor ou localização em todo o território nacional.',
    icon: <BusinessOutlinedIcon sx={{ fontSize: 22, color: T.white }} />,
  },
  {
    n: '02',
    title: 'Explore Bens & Serviços',
    desc: 'Veja os produtos e serviços que cada empresa oferece, com detalhes e preços.',
    icon: <StorefrontOutlinedIcon sx={{ fontSize: 22, color: T.white }} />,
  },
  {
    n: '03',
    title: 'Solicite uma Cotação',
    desc: 'Envie o seu pedido de cotação diretamente à empresa e receba uma proposta.',
    icon: <RequestQuoteOutlinedIcon sx={{ fontSize: 22, color: T.white }} />,
  },
];

const VALUE_PROPS = [
  {
    icon: <RequestQuoteOutlinedIcon sx={{ fontSize: 28, color: T.gold }} />,
    title: 'Cotações Rápidas',
    desc: 'Envie pedidos de cotação a múltiplas empresas e compare propostas num só lugar.',
  },
  {
    icon: <StorefrontOutlinedIcon sx={{ fontSize: 28, color: T.gold }} />,
    title: 'Catálogo de Produtos',
    desc: 'Navegue por milhares de produtos e bens disponíveis pelas empresas cadastradas.',
  },
  {
    icon: <HandymanOutlinedIcon sx={{ fontSize: 28, color: T.gold }} />,
    title: 'Serviços Especializados',
    desc: 'Encontre prestadores de serviços qualificados em todas as áreas de atividade.',
  },
  {
    icon: <VerifiedOutlinedIcon sx={{ fontSize: 28, color: T.gold }} />,
    title: 'Empresas Verificadas',
    desc: 'Todas as empresas são verificadas e validadas antes de integrarem a plataforma.',
  },
  {
    icon: <TrendingUpOutlinedIcon sx={{ fontSize: 28, color: T.gold }} />,
    title: 'Decisões Informadas',
    desc: 'Aceda a perfis completos com histórico, certificações e avaliações de clientes.',
  },
  {
    icon: <BusinessOutlinedIcon sx={{ fontSize: 28, color: T.gold }} />,
    title: 'Cobertura Nacional',
    desc: 'Empresas de todas as províncias e distritos de Moçambique numa só plataforma.',
  },
];

const SECTORS = [
  'Construção & Infraestrutura', 'Tecnologia & TI', 'Saúde & Farmácia',
  'Alimentação & Bebidas', 'Logística & Transporte', 'Energia & Utilities',
  'Consultoria & Serviços', 'Educação & Formação',
];

const STATS = [
  { value: '2 400+', label: 'Empresas Cadastradas' },
  { value: '18',     label: 'Setores de Atividade' },
  { value: '11',     label: 'Províncias Cobertas' },
  { value: '5 000+', label: 'Cotações Enviadas' },
];


  const [search, setSearch] = useState("");

  const [hasRespondedIds, setHasRespondedIds] = useState(new Set());
  const [error, setError] = useState(null);
  const [campanhasAtivas, setCampanhasAtivas] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [hasRequestedDemo, setHasRequestedDemo] = useState(false); 
  const [latestBlog, setLatestBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery("(max-width:600px)");
  const isTablet = useMediaQuery('(max-width:960px)')

  const navigate = useNavigate();

    const handleSearch = () => {
    if (search.trim()) navigate(`/explorar?q=${encodeURIComponent(search)}`);
    else navigate('/explorar');
  };
  useEffect(() => {
    const fetchCampanhasAtivas = async () => {
      try {
        const campanhasRef = ref(db, "campanhas");
        onValue(campanhasRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            const campanhasArray = [];
            Object.keys(data).forEach((campanhaKey) => {
              const campanhasInternas = data[campanhaKey];
              Object.keys(campanhasInternas).forEach((subKey) => {
                const campanha = campanhasInternas[subKey];
                if (campanha.component === "home") {
                  const currentProvince = user 
                    ? user.provinciaTemp || user.provincia 
                    : "Cabo Delgado";
                  
                  if (currentProvince === campanha.company?.provincia) {
                    campanhasArray.push({ id: subKey, ...campanha });
                  }
                }
              });
            });
            setCampanhasAtivas(campanhasArray);
          }
        });
      } catch (error) {
        setError("Erro ao carregar campanhas");
      }
    };
  
    const fetchRespondedInqueritos = async () => {
      try {
        const responsesRef = ref(db, "survey_responses/");
        const snapshot = await get(responsesRef);
        if (snapshot.exists()) {
          const respondedIds = Object.keys(snapshot.val());
          setHasRespondedIds(new Set(respondedIds));
        }
      } catch (error) {
      }
    };
  
    fetchCampanhasAtivas();
    fetchRespondedInqueritos();
  }, [user]);

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const currentProvince = user 
    ? user.provinciaTemp || user.provincia 
    : "Cabo Delgado";

  return (
    <Box>
      <Container>
         <Box
                sx={{
                  position: 'relative',
                  background: `linear-gradient(160deg, ${T.navy} 0%, ${T.navyMid} 55%, ${T.navyLight} 100%)`,
                  pt: { xs: 7, md: 11 },
                  pb: { xs: 8, md: 12 },
                  px: 2,
                  overflow: 'hidden',
                }}
              >
                {/* Background decoration */}
                <Box sx={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  background: `
                    radial-gradient(ellipse 80% 60% at 90% 10%, rgba(200,144,58,0.12) 0%, transparent 60%),
                    radial-gradient(ellipse 50% 50% at 5% 90%, rgba(200,144,58,0.07) 0%, transparent 50%)
                  `,
                }} />
                {/* Grid texture */}
                <Box sx={{
                  position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.035,
                  backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                                    linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
                  backgroundSize: '56px 56px',
                }} />
                {/* Floating ring decoration */}
                <Box sx={{
                  display: { xs: 'none', md: 'block' },
                  position: 'absolute', right: '6%', top: '12%',
                  width: 320, height: 320,
                  borderRadius: '50%',
                  border: `1px solid rgba(200,144,58,0.15)`,
                  animation: 'float 6s ease-in-out infinite',
                  '&::after': {
                    content: '""', position: 'absolute',
                    inset: 24, borderRadius: '50%',
                    border: `1px solid rgba(200,144,58,0.1)`,
                  }
                }} />
        
                <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                  <Grid container spacing={4} alignItems="center">
                    <Grid item xs={12} md={7}>
                      {/* Eyebrow badge */}
                      <Box
                        className="animate-fade-up"
                        sx={{
                          display: 'inline-flex', alignItems: 'center', gap: 1,
                          px: 2, py: 0.6, mb: 3,
                          background: 'rgba(200,144,58,0.12)',
                          border: '1px solid rgba(200,144,58,0.35)',
                          borderRadius: '100px',
                        }}
                      >
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: T.gold, animation: 'pulse-dot 2s ease infinite' }} />
                      
                      </Box>
        
                      {/* Headline */}
                      <Typography
                        className="animate-fade-up delay-1"
                        component="h1"
                        sx={{
                          fontFamily: '"Playfair Display", Georgia, serif',
                          fontWeight: 800,
                          fontSize: { xs: '2.2rem', sm: '2.8rem', md: '3.4rem' },
                          lineHeight: 1.08,
                          color: T.white,
                          letterSpacing: '-0.02em',
                          mb: 2,
                        }}
                      >
                        Encontre Empresas,<br />
                        <Box component="span" sx={{
                          color: T.gold,
                          position: 'relative',
                          '&::after': {
                            content: '""', position: 'absolute',
                            bottom: 2, left: 0, right: 0, height: 2,
                            background: `linear-gradient(90deg, ${T.gold}, transparent)`,
                            borderRadius: 2,
                          }
                        }}>
                          Bens e Serviços
                        </Box>
                      </Typography>
                          
                      {/* Search bar */}
                      <Box
                        className="animate-fade-up delay-3"
                        sx={{
                          display: 'flex',
                          background: T.white,
                          borderRadius: '14px',
                          boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
                          overflow: 'hidden',
                          maxWidth: 580,
                          mb: 3,
                        }}
                      >
                        <Box sx={{ pl: 2, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                          <SearchIcon sx={{ color: T.textSub, fontSize: 22 }} />
                        </Box>
                        <InputBase
                          placeholder="Empresa, produto, serviço ou setor…"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          fullWidth
                          sx={{
                            px: 1.5, py: 1.5,
                            fontSize: '0.95rem',
                            fontFamily: '"Plus Jakarta Sans", sans-serif',
                            color: T.text,
                            '& input::placeholder': { color: T.textSub, opacity: 1 },
                          }}
                        />
                        <Button
                          onClick={handleSearch}
                          className="cta-btn"
                          disableElevation
                          sx={{
                            m: 0.6,
                            px: { xs: 2, sm: 3 },
                            borderRadius: '10px',
                            background: T.gold,
                            color: T.white,
                            fontFamily: '"Plus Jakarta Sans", sans-serif',
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            textTransform: 'none',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                          }}
                        >
                          {isMobile ? <SearchIcon fontSize="small" /> : 'Pesquisar'}
                        </Button>
                      </Box>
        
                      {/* Quick links */}
                      <Box className="animate-fade-up delay-4" sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                          Popular:
                        </Typography>
                        {['Construção', 'TI & Software', 'Logística', 'Consultoria'].map((s) => (
                          <Box
                            key={s}
                            component="span"
                            onClick={() => navigate(`/explorar?sector=${s}`)}
                            sx={{
                              px: 1.5, py: 0.4,
                              border: '1px solid rgba(255,255,255,0.15)',
                              borderRadius: '100px',
                              fontSize: '0.76rem',
                              color: 'rgba(255,255,255,0.6)',
                              cursor: 'pointer',
                              fontFamily: '"Plus Jakarta Sans", sans-serif',
                              transition: 'all 0.18s',
                              '&:hover': { borderColor: T.gold, color: T.gold },
                            }}
                          >
                            {s}
                          </Box>
                        ))}
                      </Box>
                    </Grid>
        
                    {/* Hero visual — 3 floating cards */}
                    {!isTablet && (
                      <Grid item md={5} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <Box className="animate-fade-in delay-2" sx={{ position: 'relative', width: 300, height: 340 }}>
                          {/* Card 1 — Cotação */}
                          <Box sx={{
                            position: 'absolute', top: 0, left: 20,
                            background: T.white, borderRadius: '16px',
                            p: 2.5, width: 230,
                            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
                            animation: 'float 5s ease-in-out infinite',
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
        
                          {/* Card 2 — Produto */}
                          <Box sx={{
                            position: 'absolute', bottom: 0, right: 0,
                            background: T.white, borderRadius: '16px',
                            p: 2, width: 200,
                            boxShadow: '0 16px 50px rgba(0,0,0,0.22)',
                            animation: 'float 7s ease-in-out infinite',
                            animationDelay: '1.5s',
                          }}>
                            <Box sx={{ height: 80, borderRadius: '10px', bgcolor: T.surface, mb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <StorefrontOutlinedIcon sx={{ fontSize: 32, color: T.borderMid }} />
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
        
                          {/* Badge — live */}
                          <Box sx={{
                            position: 'absolute', top: 120, right: 8,
                            background: T.navy, borderRadius: '100px',
                            px: 1.5, py: 0.6,
                            display: 'flex', alignItems: 'center', gap: 0.75,
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                          }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#22c55e', animation: 'pulse-dot 1.5s ease infinite' }} />
                            <Typography sx={{ fontSize: '0.68rem', fontWeight: 700, color: T.white, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>312 empresas online</Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )}
                  </Grid>
                </Container>
              </Box>
     
        <StorieListDesk user={user} />
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <MarqueeAnuncios user={user} />
            <Box>
              <BannerDesk user={user} />
            </Box>
          </Grid>
      <Evento/>
        </Grid>
      </Container>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbarMessage.includes("Erro") ? "error" : "success"}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
import React, { useState, useEffect, useMemo } from "react";
import { get, onValue, ref, update } from "firebase/database";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../../fb";
import { signOut } from "firebase/auth";
import ModuleGrid from "../ModuleGrid";
import {
  Box,
  Button,
  Typography,
  Avatar,
  Select,
  MenuItem,
  CircularProgress,
  Card,
  IconButton,
  Grid,
  Paper,
  useMediaQuery,
  useTheme,
  Divider,
  Stack,
  Container,
  Chip
} from "@mui/material";
import { 
  CameraAlt, 
  ExitToApp, 
  Receipt, 
  Save, 
  ArrowForward, 
  LocationOn,
  Dashboard,
  BusinessCenter,
  Settings,
  Help,
  Notifications,
  Verified,
  Edit
} from "@mui/icons-material";
import { useActiveModules } from "../../context/ActiveModulesContext";

/* ── Design Tokens (mesmos da hero) ───────────────────────────────────── */
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

/* ── Keyframes (mesmos da hero) ───────────────────────────────────────── */
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.85); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
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
  
  .dashboard-card {
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .dashboard-card:hover {
    transform: translateY(-4px);
    border-color: ${T.gold} !important;
    box-shadow: 0 16px 48px rgba(8,25,46,0.1) !important;
  }
  .action-btn {
    transition: all 0.2s ease;
  }
  .action-btn:hover {
    transform: translateY(-2px);
  }
  .profile-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 20px 40px rgba(8,25,46,0.08) !important;
  }
  .stat-card {
    transition: all 0.2s ease;
  }
  .stat-card:hover {
    background: ${T.goldPale};
    border-color: ${T.gold} !important;
  }
`;

const ApxDesk = ({ user }) => {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const [provinceTemp, setProvinceTemp] = useState(user?.provinciaTemp || user?.provincia || "");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const navigate = useNavigate();
  const [provincias, setProvincias] = useState([]);

  const { activeModules, isLoading: modulesLoading } = useActiveModules();

  // 🔥 FILTRAR MÓDULOS ATIVOS (não expirados)
  const activeModulesFiltered = useMemo(() => {
    if (!activeModules) return {};
    
    const now = new Date();
    const filtered = {};
    
    Object.keys(activeModules).forEach(key => {
      const module = activeModules[key];
      // Verifica se o módulo está ativo E não expirou
      if (module.status === "active" && module.expiresAt) {
        const expiryDate = new Date(module.expiresAt);
        if (expiryDate > now) {
          filtered[key] = module;
        }
      }
    });
    
    return filtered;
  }, [activeModules]);

  // Stats simulados (depois podem vir do Firebase)
  const [stats, setStats] = useState({
    visualizacoes: 1247,
    propostasEnviadas: 23,
    cotacoesAtivas: 5,
    produtosCadastrados: 48
  });


  useEffect(() => {
    if (user) {
      setUserData(user);
      setProvinceTemp(user?.provinciaTemp || user?.provincia || "");
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const fetchProvincias = async () => {
      try {
        const snapshot = await get(ref(db, 'provincias'));
        if (snapshot.exists()) {
          setProvincias(snapshot.val());
        } else {
          setProvincias([]);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setProvincias([]);
      }
    };

    fetchProvincias();
  }, []);

  const handleLogout = () => {
    if (window.confirm("Tem certeza que deseja sair?")) {
      signOut(auth)
        .then(() => navigate("/auth"))
        .catch((error) => console.error("Logout Error: ", error));
    }
  };

  const saveProvince = async () => {
    if (!user?.id) return;
    
    const isConfirmed = window.confirm(
      `Tem certeza que deseja mudar a localização para ${provinceTemp}?`
    );

    if (!isConfirmed) return;

    try {
      const companyRef = ref(db, `company/${user.id}`);
      await update(companyRef, { provinciaTemp: provinceTemp });
      setUserData(prev => ({ ...prev, provinciaTemp: provinceTemp }));
      alert("Localização atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar província: ", error);
      alert("Erro ao salvar localização.");
    }
  };

  if (loading || modulesLoading) {
    return (
      <Box 
        sx={{ 
          minHeight: '100vh', 
          background: T.cream,
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          fontFamily: '"Plus Jakarta Sans", sans-serif'
        }}
      >
        <style>{KEYFRAMES}</style>
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              width: 48, height: 48,
              borderRadius: '50%',
              border: `3px solid ${T.border}`,
              borderTopColor: T.gold,
              animation: 'fadeUp 0.8s infinite linear',
              mx: 'auto',
              mb: 2
            }}
          />
          <Typography sx={{ color: T.textSub }}>Carregando dashboard...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        backgroundColor: T.cream, 
        minHeight: '100vh',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
      }}
    >
      <style>{KEYFRAMES}</style>
      
      <Container maxWidth="lg" sx={{ py: { xs: 2, md: 4 } }}>
        
        {/* Header com design da hero */}
        <Box
          className="animate-fade-up"
          sx={{
            background: `linear-gradient(135deg, ${T.navy} 0%, ${T.navyLight} 100%)`,
            borderRadius: '24px',
            p: { xs: 3, md: 4 },
            mb: 4,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background decorations (mesmos da hero) */}
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `
              radial-gradient(ellipse 80% 60% at 90% 10%, rgba(200,144,58,0.12) 0%, transparent 60%),
              radial-gradient(ellipse 50% 50% at 5% 90%, rgba(200,144,58,0.07) 0%, transparent 50%)
            `,
          }} />
          <Box sx={{
            position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.035,
            backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
            backgroundSize: '56px 56px',
          }} />

          <Grid container spacing={2} alignItems="center" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid item>
              <Avatar
                src={userData.logoUrl}
                alt={userData.nome}
                sx={{ 
                  width: isMobile ? 56 : 80, 
                  height: isMobile ? 56 : 80,
                  border: `3px solid ${T.gold}`,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                }}
              />
            </Grid>
            
            <Grid item xs>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                <Typography 
                  variant={isMobile ? "h6" : "h5"} 
                  sx={{ 
                    fontWeight: 700, 
                    color: T.white,
                    fontFamily: '"Playfair Display", serif',
                  }}
                >
                  Bem-vindo(a), {userData.nome || "Usuário"}
                </Typography>
                {user?.subscriptions?.isverify && (
                  <Chip
                    icon={<Verified style={{ fontSize: 14, color: T.white }} />}
                    label="Verificado"
                    size="small"
                    sx={{
                      bgcolor: T.gold,
                      color: T.white,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  />
                )}
              </Box>
              
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
                {userData.sector || "Setor não definido"} · {userData.email || "Email não definido"}
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, flexWrap: 'wrap' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOn sx={{ fontSize: 16, color: T.gold }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                    {provinceTemp || "Localização não definida"}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <BusinessCenter sx={{ fontSize: 16, color: T.gold }} />
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                    Membro desde {new Date(userData.timestamp || Date.now()).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* Action Buttons Grid */}
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<CameraAlt />}
              onClick={() => navigate("/post")}
              className="action-btn"
              sx={{
                bgcolor: T.navy,
                color: T.white,
                '&:hover': { bgcolor: T.navyLight },
                borderRadius: '14px',
                py: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
                boxShadow: '0 8px 16px rgba(8,25,46,0.15)',
              }}
            >
              Nova Publicação
            </Button>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              sx={{
                p: 1.5,
                borderRadius: '14px',
                border: `1px solid ${T.border}`,
                background: T.white,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box display="flex" alignItems="center" sx={{ flex: 1 }}>
                <LocationOn sx={{ color: T.gold, mr: 1 }} />
                <Select
                  value={provinceTemp}
                  onChange={(e) => setProvinceTemp(e.target.value)}
                  size="small"
                  variant="standard"
                  disableUnderline
                  sx={{ 
                    flex: 1,
                    fontWeight: 500,
                    color: T.text,
                    '& .MuiSelect-select': { py: 0.5 }
                  }}
                >
                  <MenuItem value="">Todas as províncias</MenuItem>
                  {provincias.map((prov) => (
                    <MenuItem key={prov.provincia} value={prov.provincia}>
                      {prov.provincia}
                    </MenuItem>
                  ))}
                </Select>
              </Box>
              <IconButton 
                size="small" 
                onClick={saveProvince}
                sx={{ 
                  color: T.gold,
                  '&:hover': { bgcolor: T.goldPale }
                }}
              >
                <Save fontSize="small" />
              </IconButton>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="outlined"
              color="error"
              startIcon={<ExitToApp />}
              onClick={handleLogout}
              className="action-btn"
              sx={{
                borderColor: T.borderMid,
                color: '#DC2626',
                '&:hover': { 
                  borderColor: '#DC2626', 
                  bgcolor: '#FEE2E2' 
                },
                borderRadius: '14px',
                py: 2,
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
              }}
            >
              Sair da Conta
            </Button>
          </Grid>
        </Grid>

        {/* Módulos Section - AGORA USANDO activeModulesFiltered */}
        <Card 
          className="animate-fade-up delay-4"
          sx={{ 
            mb: 4,
            borderRadius: '20px',
            border: `1px solid ${T.border}`,
            background: T.white,
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            p: 3,
            background: `linear-gradient(90deg, ${T.goldPale} 0%, ${T.white} 100%)`,
            borderBottom: `1px solid ${T.border}`,
          }}>
            <Typography variant="h6" sx={{ 
              fontWeight: 700, 
              color: T.text,
              fontFamily: '"Playfair Display", serif',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Dashboard sx={{ color: T.gold }} /> Módulos Ativos
            </Typography>
            
            {/* Mostra quantos módulos estão ativos */}
            <Typography variant="body2" sx={{ color: T.textSub, mt: 0.5 }}>
              {Object.keys(activeModulesFiltered).length} módulo(s) ativo(s)
            </Typography>
            
            {/* Passa apenas os módulos filtrados */}
            <ModuleGrid activeModules={activeModulesFiltered} />
          </Box>
        </Card>
      </Container>
    </Box>
  );
};

export default React.memo(ApxDesk);
import React, { useState, useEffect } from "react";
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
  Stack
} from "@mui/material";
import { CameraAlt, ExitToApp, Receipt, Save, ArrowForward, LocationOn } from "@mui/icons-material";
import { useActiveModules } from "../../context/ActiveModulesContext";

const ApxDesk = ({ user }) => {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const [provinceTemp, setProvinceTemp] = useState(user?.provinciaTemp || user?.provincia || "");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [provincias, setProvincias] = useState([]);

  const { activeModules, isLoading: modulesLoading } = useActiveModules();

  useEffect(() => {
    if (user) {
      setUserData(user);
      setProvinceTemp(user?.provinciaTemp || user?.provincia || "");
      setLoading(false);
    }
  }, [user]); // Corrigido: usar user como dependência

  useEffect(() => {
    // One-time read movido para dentro de useEffect
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
  }, []); // Executa apenas uma vez

  const handleLogout = () => {
    signOut(auth)
      .then(() => navigate("/auth"))
      .catch((error) => console.error("Logout Error: ", error));
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
      // Em vez de recarregar a página, atualize o estado local
      setUserData(prev => ({ ...prev, provinciaTemp: provinceTemp }));
      alert("Localização atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar província: ", error);
      alert("Erro ao salvar localização.");
    }
  };

  if (loading || modulesLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      width: '100%', 
      minHeight: '100vh', 
      p: isMobile ? 2 : 3,
      backgroundColor: theme.palette.background.default
    }}>
      {/* Welcome Card */}
      <Card sx={{ 
        mb: 3,
        color: 'black',
        borderRadius: 2,
        boxShadow: 3
      }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" component="div" sx={{ mb: 1, fontWeight: 600 }}>
            {userData.nome || "Usuário"}
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9 }}>
            Tenha todas as ferramentas essenciais para impulsionar seu negócio.
          </Typography>
        </Box>
      </Card>

      {/* Action Buttons */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<CameraAlt />}
            onClick={() => navigate("/post")}
            sx={{ 
              py: 1.5,
              borderRadius: 2,
              boxShadow: 1,
              textTransform: 'none',
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}
          >
            Nova Publicação
          </Button>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Paper sx={{ 
            p: 1.5, 
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: theme.palette.background.paper
          }}>
            <Box display="flex" alignItems="center">
              <LocationOn color="primary" sx={{ mr: 1 }} />
              <Select
                value={provinceTemp}
                onChange={(e) => setProvinceTemp(e.target.value)}
                size="small"
                variant="standard"
                disableUnderline
                sx={{ 
                  minWidth: 120,
                  fontWeight: 500,
                  '& .MuiSelect-select': { py: 0.5 }
                }}
              >
                <MenuItem value="">Todas</MenuItem>
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
              sx={{ color: theme.palette.primary.main }}
            >
              <Save fontSize="small" />
            </IconButton>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Button
            fullWidth
            variant="outlined"
            color="error"
            startIcon={<ExitToApp />}
            onClick={handleLogout}
            sx={{ 
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: isMobile ? '0.875rem' : '1rem'
            }}>
            Sair
          </Button>
        </Grid>
      </Grid>

      <Card sx={{ 
        mb: 3,
        borderRadius: 2,
        boxShadow: 3,
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          p: 3,
          backgroundColor: theme.palette.background.paper
        }}>
          {!user?.subscriptions?.isverify ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="100px">
              Módulos indisponíveis
            </Box>
          ) : (
            <ModuleGrid activeModules={activeModules || {}} />
          )}
        </Box>
      </Card>

      <Card sx={{ 
        mb: 3,
        borderRadius: 2,
        boxShadow: 3
      }}>
        <Box sx={{ p: 3 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <Receipt color="primary" sx={{ mr: 1 }} /> Pagamentos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Verifique seus comprovativos de pagamento
              </Typography>
            </Box>
            <Button
              endIcon={<ArrowForward />}
              onClick={() => navigate("/recibos")}
              sx={{ 
                textTransform: 'none',
                color: theme.palette.primary.main
              }}
            >
              Ver todos
            </Button>
          </Stack>
        </Box>
      </Card>

      <Card 
        component={Link} 
        to="/perfil"
        sx={{ 
          display: 'flex',
          alignItems: 'center',
          p: 2,
          textDecoration: 'none',
          borderRadius: 2,
          boxShadow: 3,
          transition: 'transform 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4
          }
        }}
      >
        <Avatar 
          src={userData.logoUrl} 
          alt="User" 
          sx={{ 
            width: 64, 
            height: 64, 
            mr: 2,
            border: `2px solid ${theme.palette.primary.main}`
          }} 
        />
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {userData.nome || "Usuário"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {userData.sector || "Setor não definido"}
          </Typography>
          <Typography variant="body2" sx={{ 
            mt: 0.5,
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center'
          }}>
            <LocationOn fontSize="small" sx={{ mr: 0.5 }} />
            {provinceTemp || "Localização não definida"}
          </Typography>
        </Box>
      </Card>
    </Box>
  );
};

export default React.memo(ApxDesk); 
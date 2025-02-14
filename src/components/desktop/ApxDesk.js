import React, { useState, useEffect } from "react";
import { ref, update } from "firebase/database";
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
} from "@mui/material";
import { CameraAlt, ExitToApp, Save } from "@mui/icons-material";

const ApxDesk = ({ user }) => {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const [provinceTemp, setProvinceTemp] = useState(user.provincia);
  const [editProvince, setEditProvince] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    setUserData(user);
    setLoading(false);
  }, [navigate]);

  const handleLogout = () => {
    signOut(auth)
      .then(() => navigate("/auth"))
      .catch((error) => console.error("Logout Error: ", error));
  };

  const saveProvince = async () => {
    const isConfirmed = window.confirm(
      `Tem certeza que deseja mudar a localização para ${provinceTemp}?`
    );

    if (!isConfirmed) return;

    try {
      const companyRef = ref(db, `company/${user.id}`);
      await update(companyRef, { provinciaTemp: provinceTemp });
      window.location='/';
    } catch (error) {
      console.error("Erro ao salvar província: ", error);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box width="100%" minHeight="100vh" padding={2}>
          <Card sx={{ width: '100%' }}>
            <Paper elevation={1} sx={{ padding: 3 }}>
              <Typography variant="h5" component="div" sx={{ mb: 2 }}>
                Já imaginou ter todas as ferramentas essenciais para impulsionar o seu negócio e levá-lo ao próximo nível?
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                Estamos aqui para lembrá-lo(a) de um passo fundamental para transformar a sua experiência na plataforma:
                ative os módulos disponíveis e abra as portas para um mundo de oportunidades ilimitadas!
              </Typography>
            </Paper>
          </Card>
          <br/>
        {/* Actions Section (80% width) */}
        <Grid item xs={12} sm={9}>
          <Grid container spacing={2}>
            {/* Make Post Button */}
            <Grid item xs={12} sm={4} display="flex" justifyContent="center">
              <Button
                variant="contained"
                startIcon={<CameraAlt />}
                onClick={() => navigate("/post")}
                sx={{ minWidth: 200 }}
              >
                Fazer Publicação
              </Button>
            </Grid>

            {/* Change Province Section */}
            <Grid item xs={12} sm={4}>
              {editProvince && (
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: "bold" }}>
                    Mudar Localização:
                  </Typography>
                  <Select
                    value={provinceTemp}
                    onChange={(e) => setProvinceTemp(e.target.value)}
                    size="small"
                    sx={{ minWidth: 120 }}
                  >
                    {[
                      "Maputo", "Gaza", "Inhambane", "Sofala", "Manica", "Tete",
                      "Zambézia", "Nampula", "Cabo Delgado", "Niassa",
                    ].map((prov) => (
                      <MenuItem key={prov} value={prov}>
                        {prov}
                      </MenuItem>
                    ))}
                  </Select>
                  <IconButton color="success" onClick={saveProvince}>
                    <Save />
                  </IconButton>
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={4} display="flex" justifyContent="center">
              <Button
                variant="contained"
                color="error"
                startIcon={<ExitToApp />}
                onClick={handleLogout}
                sx={{ minWidth: 200 }}
              >
                Desconectar
              </Button>
            </Grid>
          </Grid>

          <Box mt={4} sx={{ padding: 4, backgroundColor: 'white', borderRadius: 2, boxShadow: 3 }}>
            <ModuleGrid activeModules={userData.activeModules || []} />
          </Box>
        </Grid>


      <br/>
      
          <Link to={"/profile"}>
            <Card sx={{ p: 2, display: "flex", alignItems: "center" }}>
              <Avatar src={userData.logoUrl} alt="User" sx={{ width: 76, height: 76, mr: 2 }} />
              <Box>
               <p>
               <Typography variant="h6">{userData.nome}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {userData.sector}
                </Typography>
               </p>
              </Box>
            </Card>
          </Link>
    </Box>
  );
};

export default ApxDesk;

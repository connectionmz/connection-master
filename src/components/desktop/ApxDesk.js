import React, { useState, useEffect } from 'react';
import { ref, get, update } from "firebase/database";
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../../fb';
import { onAuthStateChanged, signOut } from "firebase/auth";
import ModuleGrid from '../ModuleGrid';
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
} from '@mui/material';
import { CameraAlt, ExitToApp, Edit, Save, Cancel } from '@mui/icons-material';

const ApxDesk = ({ user }) => {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const [provincia, setProvince] = useState(user.provincia || '');
  const [provinceTemp, setProvinceTemp] = useState(user.provincia || '');
  const [editProvince, setEditProvince] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setUserData(user);
    setLoading(false)
  }, [navigate]);

  const handleLogout = () => {
    signOut(auth).then(() => navigate('/auth')).catch((error) => console.error("Logout Error: ", error));
  };

  const saveProvince = async () => {
    try {
      const companyRef = ref(db, `company/${user.id}`);
      await update(companyRef, { provinciaTemp: provinceTemp });
      setProvince(provinceTemp);
      console.log("Província salva com sucesso!");
      setEditProvince(false);
    } catch (error) {
      console.error("Erro ao salvar província: ", error);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box width='100%' minHeight="100vh">
      <Link to={'/profile'}>
        <Card sx={{ mb: 4, p: 2, display: 'flex', alignItems: 'center' }}>
          <Avatar
            src={userData.logoUrl}
            alt="User"
            sx={{ width: 56, height: 56, mr: 2 }}
          />
          <Box>
            <Typography variant="h6">{userData.nome}</Typography>
            <Typography variant="body2" color="textSecondary">{userData.sector}</Typography>
          </Box>
        </Card>
      </Link>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Button
            variant="contained"
            startIcon={<CameraAlt />}
            fullWidth
            onClick={() => window.location.href = '/post'}
            sx={{ mb: 2 }}
          >
            Fazer Publicação
          </Button>
        </Grid>

        <Grid item xs={12} sm={6}>
          {!editProvince ? (
            <Box display="flex" alignItems="center">
              <Typography variant="body1" sx={{ mr: 2 }}>
                Província: {user.provincia}
              </Typography>
              <IconButton
                color="primary"
                onClick={() => setEditProvince(true)}
              >
                <Edit />
              </IconButton>
            </Box>
          ) : (
            <Box display="flex" alignItems="center" gap={1}>
              <Select
                value={provinceTemp}
                onChange={(e) => setProvinceTemp(e.target.value)}
                size="small"
                fullWidth
              >
                {[
                  "Maputo",
                  "Gaza",
                  "Inhambane",
                  "Sofala",
                  "Manica",
                  "Tete",
                  "Zambézia",
                  "Nampula",
                  "Cabo Delgado",
                  "Niassa",
                ].map((prov) => (
                  <MenuItem key={prov} value={prov}>
                    {prov}
                  </MenuItem>
                ))}
              </Select>
              <IconButton
                color="success"
                onClick={saveProvince}
              >
                <Save />
              </IconButton>
              <IconButton
                color="error"
                onClick={() => {
                  setProvinceTemp(provincia);
                  setEditProvince(false);
                }}
              >
                <Cancel />
              </IconButton>
            </Box>
          )}
        </Grid>
      </Grid>

      <Box mt={4}>
        <ModuleGrid activeModules={userData.activeModules || []} />
      </Box>

      <Button
        variant="contained"
        color="error"
        startIcon={<ExitToApp />}
        onClick={handleLogout}
        fullWidth
        sx={{ mt: 4 }}
      >
        Desconectar
      </Button>
    </Box>
  );
};

export default ApxDesk;

import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  Chip,
  useTheme,
  CircularProgress
} from "@mui/material";
import { Link } from "react-router-dom";
import { get, ref } from "firebase/database";
import { db } from "../../fb";

const InqueritosList = ({ user }) => {
  const theme = useTheme();
  const [inqueritos, setInqueritos] = useState([]);
  const [hasRespondedIds, setHasRespondedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Busca todos os inquéritos
  useEffect(() => {
    const fetchInqueritos = async () => {
      try {
        const surveysRef = ref(db, "surveys");
        const snapshot = await get(surveysRef);
        
        if (snapshot.exists()) {
          const surveysData = snapshot.val();
          const formattedSurveys = Object.keys(surveysData).map(key => ({
            id: key,
            ...surveysData[key]
          }));
          setInqueritos(formattedSurveys);
        }
        setLoading(false);
      } catch (err) {
        console.error("Erro ao carregar inquéritos:", err);
        setError("Erro ao carregar inquéritos");
        setLoading(false);
      }
    };

    fetchInqueritos();
  }, []);

  // Busca os inquéritos respondidos pelo usuário
  useEffect(() => {
    const fetchRespondedSurveys = async () => {
      if (!user?.id || !user?.provincia || !user?.sector) return;

      try {
        const responsesRef = ref(db, "survey_responses");
        const responsesSnapshot = await get(responsesRef);

        if (responsesSnapshot.exists()) {
          const responsesData = responsesSnapshot.val();
          const respondedIds = new Set();

          Object.entries(responsesData).forEach(([surveyId, usersResponses]) => {
            if (usersResponses && usersResponses[user.id]) {
              respondedIds.add(surveyId);
            }
          });

          setHasRespondedIds(respondedIds);
        }
      } catch (err) {
        console.error("Erro ao carregar respostas:", err);
      }
    };

    fetchRespondedSurveys();
  }, [user]);

  // Filtra os inquéritos: não respondidos E direcionados ao usuário
  const inqueritosFiltrados = inqueritos.filter(inquerito => {
    // Verifica se o inquérito é direcionado ao usuário
    const isForUserProvince = !inquerito.provincias || 
                             inquerito.provincias.length === 0 || 
                             inquerito.provincias.includes(user?.provincia);
    
    const isForUserSector = !inquerito.sectores || 
                           inquerito.sectores.length === 0 || 
                           inquerito.sectores.includes(user?.sector);
    
    // Verifica se o usuário já respondeu
    const notResponded = !hasRespondedIds.has(inquerito.id);
    
    return isForUserProvince && isForUserSector && notResponded && user;
  });

  if (!user) {
    return (
      <Paper sx={{ padding: 3, mb: 3, borderRadius: 2, boxShadow: 2 }}>
        <Typography variant="h6" sx={{ 
          fontWeight: "bold", 
          textAlign: "center", 
          mb: 2,
          color: theme.palette.text.primary
        }}>
          Faça login para ver os inquéritos
        </Typography>
        <Button
          component={Link}
          to="/auth"
          variant="contained"
          fullWidth
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: "#ffffff",
            fontWeight: "bold",
            "&:hover": { 
              backgroundColor: theme.palette.primary.dark 
            },
          }}
        >
          Autenticar
        </Button>
      </Paper>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Typography color="error" textAlign="center" py={2}>
        {error}
      </Typography>
    );
  }

  return (
    <Paper sx={{ 
      p: 3, 
      mb: 3, 
      borderRadius: 2, 
      boxShadow: 2,
      backgroundColor: theme.palette.background.paper
    }}>
      <Typography 
        variant="h6" 
        fontWeight="bold" 
      >
        Inquéritos ({inqueritosFiltrados.length})
      </Typography>

      {inqueritosFiltrados.length === 0 ? (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ textAlign: 'center', py: 2 }}
        >
          Nenhum inquérito disponível no momento.
        </Typography>
      ) : (
        <List disablePadding>
          {inqueritosFiltrados.map((inquerito, index) => (
            <React.Fragment key={inquerito.id}>
              <ListItem
                disableGutters
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  overflow: "hidden",
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}
                component={Link}
                to={`/inquerito/${inquerito.id}`}
              >
                <ListItemText
                  primary={
                    <Typography 
                      variant="subtitle1" 
                      fontWeight="bold"
                      sx={{ color: theme.palette.text.primary }}
                    >
                      {inquerito.title}
                    </Typography>
                  }
                  secondary={
                    <>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: theme.palette.text.secondary,
                            mr: 2
                          }}
                        >
                          {inquerito.company?.nome || "Empresa não especificada"}
                        </Typography>
                      </Box>
                    </>
                  }
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItem>
              {index < inqueritosFiltrados.length - 1 && (
                <Divider variant="inset" component="li" />
              )}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default InqueritosList;
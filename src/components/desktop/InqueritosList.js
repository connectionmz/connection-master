import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Button,
  useTheme,
  CircularProgress,
  TablePagination
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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5); // Changed default to 5 for better UX

  // Memoized shuffle function
  const shuffleArray = useCallback((array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }, []);

  const fetchInqueritos = useCallback(async () => {
    try {
      setLoading(true);
      const surveysRef = ref(db, "surveys");
      const snapshot = await get(surveysRef);
      
      if (snapshot.exists()) {
        const surveysData = snapshot.val();
        const formattedSurveys = Object.entries(surveysData).map(([key, value]) => ({
          id: key,
          ...value
        }));

        const filteredSurveys = formattedSurveys.filter(
          (survey) => survey.company?.id !== user?.id
        );
  
        setInqueritos(filteredSurveys);
      }
    } catch (err) {
      console.error("Erro ao carregar inquéritos:", err);
      setError("Erro ao carregar inquéritos");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const fetchRespondedSurveys = useCallback(async () => {
    if (!user?.id || !user?.provincia || !user?.sector) return;

    try {
      const responsesRef = ref(db, "survey_responses");
      const responsesSnapshot = await get(responsesRef);

      if (responsesSnapshot.exists()) {
        const responsesData = responsesSnapshot.val();
        const respondedIds = new Set();

        Object.entries(responsesData).forEach(([surveyId, usersResponses]) => {
          if (usersResponses?.[user.id]) {
            respondedIds.add(surveyId);
          }
        });

        setHasRespondedIds(respondedIds);
      }
    } catch (err) {
      console.error("Erro ao carregar respostas:", err);
    }
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      await Promise.all([fetchInqueritos(), fetchRespondedSurveys()]);
    };
    fetchData();
  }, [fetchInqueritos, fetchRespondedSurveys]);

  const inqueritosFiltrados = useMemo(() => {
    return inqueritos.filter(inquerito => {
      const isForUserProvince = !inquerito.provincias?.length || 
                               inquerito.provincias.includes(user?.provincia);
      
      const isForUserSector = !inquerito.sectores?.length || 
                             inquerito.sectores.includes(user?.sector);
      
      const notResponded = !hasRespondedIds.has(inquerito.id);
      
      return isForUserProvince && isForUserSector && notResponded && user;
    });
  }, [inqueritos, user, hasRespondedIds]);

  useEffect(() => {
    setPage(0);
  }, [inqueritosFiltrados]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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
      <Link to="/inqueritos" style={{ textDecoration: 'none' }}>
        <Typography 
          variant="h6" 
          fontWeight="bold"
          sx={{ color: theme.palette.primary.main, '&:hover': { textDecoration: 'underline' } }}
        >
          Inquéritos ({inqueritosFiltrados.length})
        </Typography>
      </Link>

      {inqueritosFiltrados.length === 0 ? (
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ textAlign: 'center', py: 2 }}
        >
          Nenhum inquérito disponível no momento.
        </Typography>
      ) : (
        <>
          <List disablePadding>
            {inqueritosFiltrados
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((inquerito, index) => (
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
                        <Typography 
                          variant="body2" 
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          {inquerito.company?.nome || "Empresa não especificada"}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < Math.min(inqueritosFiltrados.length, rowsPerPage) - 1 && (
                    <Divider variant="inset" component="li" />
                  )}
                </React.Fragment>
              ))}
          </List>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={inqueritosFiltrados.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Itens por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </>
      )}
    </Paper>
  );
};

export default InqueritosList;
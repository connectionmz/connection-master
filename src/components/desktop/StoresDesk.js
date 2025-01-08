import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../../fb';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Box,
  CardActionArea,
  CardMedia,
} from '@mui/material';
import BackButton from '../BackButton';

// Função para embaralhar arrays
const shuffleArray = (array) => {
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
};

const StoresDesk = ({ user }) => {
  const [storesList, setStoresList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Função para buscar lojas de forma pontual
    const fetchStores = async () => {
      try {
        const storesRef = ref(db, 'stores');
        const snapshot = await get(storesRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          const storesArray = Object.entries(data).map(([id, store]) => ({
            id,
            ...store,
          }));
          const shuffledStores = shuffleArray(storesArray);
          setStoresList(shuffledStores);
          setFilteredStores(shuffledStores);
        } else {
          setStoresList([]);
          setFilteredStores([]);
        }
      } catch (error) {
        console.error('Erro ao buscar lojas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStores();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = storesList.filter((store) =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStores(shuffleArray(filtered));
    } else {
      setFilteredStores(shuffleArray(storesList));
    }
  }, [searchQuery, storesList]);

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        align="center"
        sx={{ fontWeight: 'bold', mb: 4 }}
      >
        Lojas Disponíveis
      </Typography>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <TextField
          label="Pesquisar loja por nome..."
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          fullWidth
          sx={{ maxWidth: 600 }}
        />
      </Box>

      {/* Carregando ou lista de lojas */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4}>
          {filteredStores.length > 0 ? (
            filteredStores.map((store) => (
              <Grid item xs={12} sm={6} md={4} key={store.id}>
                <Card
                  sx={{
                    boxShadow: 4,
                    transition: 'transform 0.3s, box-shadow 0.3s',
                    '&:hover': {
                      transform: 'scale(1.05)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardActionArea component={Link} to={`/stores/${store.id}`}>
                    {store.photoUrl && (
                      <CardMedia
                        component="img"
                        height="200"
                        image={store.photoUrl}
                        alt={`${store.name} logo`}
                      />
                    )}
                    <CardContent>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 'bold', textAlign: 'center', mb: 1 }}
                      >
                        {store.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          textAlign: 'center',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitBoxOrient: 'vertical',
                          WebkitLineClamp: 2,
                          height: '50px',
                        }}
                      >
                        {store.description || 'Sem descrição disponível'}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))
          ) : (
            <Typography
              variant="body2"
              sx={{ color: 'gray', textAlign: 'center', width: '100%' }}
            >
              Nenhuma loja encontrada.
            </Typography>
          )}
        </Grid>
      )}
    </Box>
  );
};

export default StoresDesk;

import React from 'react';
import {
  Box,
  Button,
  Card,
  Grid,
  CircularProgress,
  Typography,
  Chip,
  Avatar
} from '@mui/material';
import { School, Star } from '@mui/icons-material';

const BuscarCandidatos = ({ 
  areaBusca, 
  candidatos, 
  loading, 
  onBuscarCandidatos, 
  onSelectCandidato 
}) => {
  return (
    <Card sx={{ p: 3, mb: 3, boxShadow: 3 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
        Encontrar Talentos
      </Typography>
      
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={8}>
          {/* Campo de busca pode ser adicionado aqui */}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Button
            variant="contained"
            onClick={onBuscarCandidatos}
            disabled={!areaBusca || loading}
            fullWidth
            sx={{ height: '56px' }}
          >
            {loading ? <CircularProgress size={24} /> : 'Buscar Candidatos'}
          </Button>
        </Grid>
      </Grid>

      {candidatos.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            {candidatos.length} candidatos encontrados
          </Typography>
          
          <Grid container spacing={2}>
            {candidatos.map((candidato, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card 
                  sx={{ 
                    p: 2, 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    '&:hover': { 
                      boxShadow: 4,
                      transform: 'translateY(-2px)',
                      transition: 'all 0.3s ease'
                    }
                  }}
                  onClick={() => onSelectCandidato(candidato)}
                >
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar 
                      src={candidato.fotoPerfil} 
                      sx={{ width: 56, height: 56, mr: 2 }}
                    />
                    <Box>
                      <Typography fontWeight="bold">{candidato.nome}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {candidato.matchType === 'Atuação' ? 
                          `Atua em ${areaBusca}` : 
                          `Formado em ${areaBusca}`}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mt: 'auto' }}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Chip 
                        icon={<School />} 
                        label={`${candidato.formacao?.length || 0} cursos`} 
                        size="small" 
                      />
                      <Chip 
                        icon={<Star />}
                        label={`${candidato.rating || 0}/10`}
                        color="primary"
                        size="small"
                      />
                    </Box>
                    
                    {candidato.areasDeActuacao?.includes(areaBusca) && (
                      <Chip 
                        label="Atua na área" 
                        color="success" 
                        size="small" 
                        sx={{ mr: 1 }}
                      />
                    )}
                    
                    {candidato.areasDeFormacao?.includes(areaBusca) && (
                      <Chip 
                        label="Formado na área" 
                        color="info" 
                        size="small" 
                      />
                    )}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}
    </Card>
  );
};

export default BuscarCandidatos;
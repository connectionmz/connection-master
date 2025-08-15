import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../../fb';
import {
  Box,
  Button,
  Typography,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  Divider,
  useMediaQuery,
  IconButton,
  Tooltip,
  Skeleton
} from '@mui/material';
import {
  Business,
  ArrowForward,
  CheckCircle,
  Pending,
  HourglassEmpty,
  Person
} from '@mui/icons-material';
import BackButton from '../BackButton';

const PropostasDesk = ({user}) => {
  const { id } = useParams();
  const [propostas, setPropostas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');
  const isSmallScreen = useMediaQuery('(max-width:400px)');

  useEffect(() => {
    const propostasRef = ref(db, `cotacoes/${id}/proposals`);
    
    onValue(propostasRef, (snapshot) => {
      const data = snapshot.val();

      console.log(data)

      if (data) {
        const propostasArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
          // Normalizar o status para o formato esperado
          status: normalizeStatus(value.status)
        }));
        // Ordenar por status (wait primeiro) e depois por timestamp
        propostasArray.sort((a, b) => {
          if (a.status === 'wait' && b.status !== 'wait') return -1;
          if (a.status !== 'wait' && b.status === 'wait') return 1;
          return (b.timestamp || 0) - (a.timestamp || 0);
        });
        setPropostas(propostasArray);
      } else {
        setPropostas([]);
      }
      setLoading(false);
    });
  }, [id]);

  // Função para normalizar os status recebidos
  const normalizeStatus = (status) => {
    if (!status) return 'wait';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('aceit') || statusLower === 'accepted') return 'accepted';
    if (statusLower.includes('recus') || statusLower.includes('rejeit') || statusLower === 'rejected') return 'rejected';
    return 'wait'; // padrão para qualquer outro caso
  };

  const handlePropostaClick = (propostaId) => {
    navigate(`/cotacao/${id}/proposta/${propostaId}`);
  };

  const handleEmpresaClick = (e, empresaId) => {
    e.stopPropagation();
    navigate(`/perfil/${empresaId}`);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'wait':
        return <HourglassEmpty fontSize="small" />;
      case 'accepted':
        return <CheckCircle fontSize="small" />;
      case 'rejected':
        return <Pending fontSize="small" />;
      default:
        return <Pending fontSize="small" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'wait':
        return 'warning';
      case 'accepted':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'wait':
        return 'Aguardando';
      case 'accepted':
        return 'Aceita';
      case 'rejected':
        return 'Recusada';
      default:
        return 'Pendente';
    }
  };

  return (
    <Paper sx={{
      width: '100%',
      maxWidth: 800,
      margin: 'auto',
      p: isMobile ? 2 : 4,
      boxShadow: '0 8px 32px rgba(0,0,0,0.05)',
      borderRadius: 3,
      backgroundColor: 'background.paper'
    }}>
      <BackButton sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Business color="primary" sx={{ fontSize: 32 }} />
        <Typography variant="h5" component="h1" sx={{ 
          fontWeight: 600,
          color: 'text.primary',
          fontSize: isMobile ? '1.25rem' : '1.5rem'
        }}>
          Propostas Recebidas
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((item) => (
            <Card key={item} sx={{ borderRadius: 2 }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="40%" />
                </Box>
                <Skeleton variant="rectangular" width={80} height={32} />
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : propostas.length > 0 ? (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 2,
          mt: 2
        }}>
          {propostas.map((proposta) => (
            <Card
              key={proposta.id}
              onClick={() => handlePropostaClick(proposta.from.id)}  
              sx={{
                cursor: 'pointer',
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                  borderColor: 'primary.main'
                }
              }}
            >
              <CardContent sx={{ 
                p: isMobile ? 1.5 : 2,
                '&:last-child': { pb: isMobile ? 1.5 : 2 }
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  gap: 2
                }}>
                  <Tooltip title="Ver perfil da empresa">
                    <Avatar
                      onClick={(e) => handleEmpresaClick(e, proposta.from.id)}
                      sx={{ 
                        width: 40, 
                        height: 40,
                        bgcolor: 'primary.main',
                        cursor: 'pointer'
                      }}
                    >
                      {proposta.from.nome ? proposta.from.nome.charAt(0) : <Person />}
                    </Avatar>
                  </Tooltip>

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="subtitle1" 
                      sx={{ 
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {proposta.from.nome || 'Empresa não identificada'}
                    </Typography>
                    {proposta.nota && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {proposta.nota}
                      </Typography>
                    )}
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <Chip
                      icon={getStatusIcon(proposta.status)}
                      label={getStatusLabel(proposta.status)}
                      color={getStatusColor(proposta.status)}
                      size="small"
                      variant="outlined"
                      sx={{ 
                        px: 0.5,
                        fontWeight: 500,
                        borderWidth: 2,
                        '& .MuiChip-icon': { ml: 0.5 }
                      }}
                    />
                    
                    <IconButton 
                      size="small"
                      color="primary"
                      sx={{
                        ml: 1,
                        '&:hover': {
                          backgroundColor: 'primary.light'
                        }
                      }}
                    >
                      <ArrowForward fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          py: 4,
          textAlign: 'center'
        }}>
          <HourglassEmpty sx={{ 
            fontSize: 48, 
            color: 'text.disabled', 
            mb: 2 
          }} />
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              fontSize: isMobile ? '1rem' : '1.25rem',
              mb: 1
            }}
          >
            Nenhuma proposta recebida
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ maxWidth: 400 }}
          >
            Quando você receber propostas para esta cotação, elas aparecerão aqui.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default PropostasDesk;
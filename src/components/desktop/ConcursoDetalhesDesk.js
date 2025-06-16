import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../../fb';
import { ref, onValue, increment, update, push, set, get } from 'firebase/database';
import { 
  RemoveRedEye, 
  Share, 
  FileDownload, 
  Report,
  Business,
  Email,
  Phone,
  CalendarToday,
  AccessTime,
  Description,
  CheckCircle,
  History,
  Send,
  Image,
  PictureAsPdf,
  Download
} from '@mui/icons-material';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  Avatar,
  Box,
  Modal,
  Dialog, DialogActions, DialogContent, DialogTitle,
  Chip,
  Divider,
  TextField,
  useMediaQuery,
  useTheme,
  Stack,
  IconButton,
} from '@mui/material';
import BackButton from '../BackButton';
import { formatarValor, formatPrice } from '../../utils/utils';
import { Link2 } from 'lucide-react';

const ConcursoDetalhesDesk = ({ user }) => {
  const { id } = useParams();
  const [concurso, setConcurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewsModalOpen, setViewsModalOpen] = useState(false);
  const [empresasQueVisualizaram, setEmpresasQueVisualizaram] = useState([]);
  const [denunciaModalOpen, setDenunciaModalOpen] = useState(false);
  const [motivoDenuncia, setMotivoDenuncia] = useState('');

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const navigate = useNavigate();

  useEffect(() => {
    const concursoRef = ref(db, `concursos/${id}`);
    const viewsRef = ref(db, `concursos/${id}/views/${user.id}`);

    const fetchConcurso = () => {
      onValue(viewsRef, async (snapshot) => {
        if (!snapshot.exists()) {
          try {
            await update(concursoRef, {
              [`views/${user.id}`]: true,
              viewCount: increment(1),
            });
          } catch (error) {
            console.error("Erro ao atualizar visualizações:", error);
          }
        }
      }, { onlyOnce: true });

      const unsubscribeConcurso = onValue(concursoRef, async (snapshot) => {
        const data = snapshot.val();
        console.log(data)
        if (!data) {
          setError('Concurso não encontrado');
          setLoading(false);
          return;
        }

        setConcurso(data);
        setLoading(false);

        if (data.views) {
          const empresasIds = Object.keys(data.views);
          
          const empresasPromises = empresasIds.map(async (empresaId) => {
            if (empresaId === user.id) return null;
            
            const companyRef = ref(db, `company/${empresaId}`);
            const companySnapshot = await get(companyRef);
            
            if (companySnapshot.exists()) {
              return {
                id: empresaId,
                ...companySnapshot.val(),
              };
            }
            return null;
          });
          
          const empresas = (await Promise.all(empresasPromises)).filter(Boolean);
          setEmpresasQueVisualizaram(empresas);
        }
      });

      return unsubscribeConcurso;
    };

    const unsubscribeConcurso = fetchConcurso();

    return () => {
      unsubscribeConcurso();
    };
  }, [id, user.id]);
  const isPrazoValido = (prazoString) => {
    const now = new Date();
    const prazo = new Date(prazoString);
    return prazo >= now;
  };
  const isConcursoExpirado = () => {
    if (!concurso?.prazo) return false;
    const dataLimite = new Date(concurso.prazo);
    const agora = new Date();
    return dataLimite.getTime() < agora.getTime();
  };

  const handleBaixarEdital = () => {
    navigate(`/concursoPdf/${id}`);
  };

  const handlePartilhar = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => alert('Link copiado! Pronto para partilhar.'),
      (err) => console.error('Erro ao copiar o link', err)
    );
  };

  const handleFecharConcurso = () => {
    if (window.confirm("Tem certeza que deseja fechar este concurso?")) {
      update(ref(db, `concursos/${id}`), {
        status: "Fechada",
      }).then(() => {
        alert("Concurso fechado com sucesso!");
      }).catch((error) => {
        console.error("Erro ao fechar o concurso:", error);
      });
    }
  };

  const handleAbrirDenunciaModal = () => setDenunciaModalOpen(true);
  const handleFecharDenunciaModal = () => {
    setDenunciaModalOpen(false);
    setMotivoDenuncia('');
  };

  const handleDenunciar = () => {
    if (!motivoDenuncia.trim()) {
      alert("Por favor, insira um motivo para a denúncia.");
      return;
    }

    const denunciaUsuarioRef = ref(db, `denuncias/concursos/${id}/${user.id}`);
    
    get(denunciaUsuarioRef).then((snapshot) => {
      if (snapshot.exists()) {
        alert("Você já denunciou este concurso. Não é possível denunciar novamente.");
        handleFecharDenunciaModal();
      } else {
        const novaDenunciaRef = push(denunciaUsuarioRef);

        set(novaDenunciaRef, {
          motivo: motivoDenuncia,
          timestamp: new Date().toISOString(),
          userId: user.id,
          concursoId: id,
        })
          .then(() => {
            alert("Denúncia enviada com sucesso!");
            handleFecharDenunciaModal();
          })
          .catch((error) => {
            console.error("Erro ao enviar denúncia:", error);
            alert("Erro ao enviar denúncia. Tente novamente.");
          });
      }
    }).catch((error) => {
      console.error("Erro ao verificar denúncia existente:", error);
      alert("Erro ao verificar denúncia existente. Tente novamente.");
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography align="center" color="textSecondary">Carregando...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography align="center" color="error">{error}</Typography>
      </Box>
    );
  }

  if (!concurso) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography align="center" color="error">Concurso não encontrado</Typography>
      </Box>
    );
  }

return (
  <Box width="100%" maxWidth="1200px" mx="auto" p={isMobile ? 1 : 3}>
    <BackButton sx={{ mb: 2 }} />
    
    {/* Main Card */}
    <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Link to={`/perfil/${concurso.company.id}`}>
              <Avatar
                src={concurso.company.logoUrl || 'default-logo.png'}
                alt={concurso.company.nome}
                sx={{ width: isMobile ? 48 : 64, height: isMobile ? 48 : 64 }}
              />
            </Link>
          </Grid>
          <Grid item xs>
            <Typography variant={isMobile ? "h6" : "h5"} gutterBottom fontWeight="bold">
              {concurso.company.nome || 'N/A'} 
            </Typography>
            <Typography variant={isMobile ? "h6" : "h5"} gutterBottom fontWeight="bold">
              {concurso.titulo || 'Concurso sem título'} 
            </Typography>
            <Chip
              label={
                concurso.status === 'Fechada' || isConcursoExpirado()
                  ? isConcursoExpirado() 
                    ? 'Expirado' 
                    : 'Fechado'
                  : 'Aberto'
              }
              color={
                concurso.status === 'Fechada' || isConcursoExpirado()
                  ? isConcursoExpirado() 
                    ? 'warning' 
                    : 'error'
                  : 'success'
              }
              size="small"
              sx={{ mb: 1 }}
            />
            
            <Box display="flex" flexWrap="wrap" gap={1} mb={1}>
              <Typography 
                color="primary"
                sx={{ 
                  cursor: 'pointer', 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: isMobile ? '0.8rem' : '1rem'
                }}
                onClick={() => setViewsModalOpen(true)}
              >
                <RemoveRedEye color="primary" sx={{ mr: 0.5 }} /> 
                {Object.keys(concurso.views || {}).length || 0} visualizações
              </Typography>
            </Box>
            
            <Box display="flex" flexWrap="wrap" gap={1}>
              <Typography 
                sx={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: isMobile ? '0.8rem' : '1rem'
                }}
              >
                <CalendarToday sx={{ mr: 0.5 }} /> 
                Publicado em {new Date(concurso.timestamp).toLocaleDateString('pt-PT')}
              </Typography>
              
              <Typography 
                variant="body2" 
                color={isPrazoValido(concurso.prazo) ? 'primary' : 'error'}
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                {isPrazoValido(concurso.prazo) ? (
                  <CheckCircle fontSize="small" color="primary" />
                ) : (
                  <History fontSize="small" color="error" />
                )}
                Prazo: {new Date(concurso.prazo).toLocaleDateString('pt-PT')}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
      
      <Divider />
      
      <CardActions sx={{ p: isMobile ? 1 : 2 }}>
        <Stack 
          direction={isMobile ? 'column' : 'row'} 
          spacing={isMobile ? 1 : 2} 
          width="100%"
        >
          {concurso.anexos && concurso.anexos.length > 0 && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleBaixarEdital} 
              startIcon={<FileDownload />}
              size={isMobile ? 'small' : 'medium'}
              fullWidth={isMobile}
            >
              {isMobile ? 'Baixar Anexos' : 'Baixar Documentos Anexos'}
            </Button>
          )}
          
          <Button 
            variant="outlined" 
            onClick={handlePartilhar} 
            startIcon={<Share />}
            size={isMobile ? 'small' : 'medium'}
            fullWidth={isMobile}
          >
            Partilhar
          </Button>

         {
          concurso.company.id!=user.id && (
             <Button 
            variant="outlined" 
            color="error" 
            onClick={handleAbrirDenunciaModal} 
            startIcon={<Report />}
            size={isMobile ? 'small' : 'medium'}
            fullWidth={isMobile}>
            Denunciar
          </Button>
          )
         }

          {concurso.linkDeSubmissao && (
            <Button
              variant="contained"
              color="success"
              startIcon={<Link2 />}
              href={concurso.linkDeSubmissao}
              target="_blank"
              size={isMobile ? 'small' : 'medium'}
              fullWidth={isMobile}
            >
              Submeter Proposta
            </Button>
          )}
        </Stack>
      </CardActions>
    </Card>

    {/* Object Card */}
    <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Objeto do Concurso
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography 
          variant="body1" 
          dangerouslySetInnerHTML={{ __html: concurso.objeto || '<p>Não especificado</p>' }} 
          sx={{ lineHeight: 1.6 }}
        />
      </CardContent>
    </Card>

    {/* Conditions Card */}
    <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Condições do Concurso
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography 
          variant="body1" 
          dangerouslySetInnerHTML={{ __html: concurso.condicoes || '<p>Não especificado</p>' }} 
          sx={{ lineHeight: 1.6 }}
        />
      </CardContent>
    </Card>

    {/* Criteria Card */}
    <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Critérios de Avaliação
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography 
          variant="body1" 
          dangerouslySetInnerHTML={{ __html: concurso.criterios || '<p>Não especificado</p>' }} 
          sx={{ lineHeight: 1.6 }}
        />
      </CardContent>
    </Card>

    {/* Documentation Card */}
    <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Documentação Necessária
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography 
          variant="body1" 
          dangerouslySetInnerHTML={{ __html: concurso.documentacao || '<p>Não especificado</p>' }} 
          sx={{ lineHeight: 1.6 }}
        />
      </CardContent>
    </Card>

    {/* Technical Requirements Card */}
    <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Requisitos Técnicos
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography 
          variant="body1" 
          dangerouslySetInnerHTML={{ __html: concurso.requisitosTecnicos || '<p>Não especificado</p>' }} 
          sx={{ lineHeight: 1.6 }}
        />
      </CardContent>
    </Card>

    {/* Concurso Details Card */}
    <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Detalhes do Concurso
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Número de Referência:
            </Typography>
            <Typography>{concurso.numeroReferencia || 'Não especificado'}</Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Modalidade:
            </Typography>
            <Typography>{concurso.modalidade || 'Não especificado'}</Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Setor:
            </Typography>
            <Typography>{concurso.setor || 'Não especificado'}</Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Províncias:
            </Typography>
            <Typography>
              {concurso.provincia && concurso.provincia.length > 0 
                ? concurso.provincia.join(', ') 
                : 'Não especificado'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Local de Entrega:
            </Typography>
            <Typography>{concurso.localEntrega || 'Não especificado'}</Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Data de Abertura:
            </Typography>
            <Typography>
              {concurso.dataAbertura 
                ? new Date(concurso.dataAbertura).toLocaleDateString('pt-PT') 
                : 'Não especificado'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Valor Estimado:
            </Typography>
            <Typography>
              {concurso.valorEstimado 
                ? formatarValor(concurso.valorEstimado) + ' MT' 
                : 'Não especificado'}
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Condições de Pagamento:
            </Typography>
            <Typography>
              {concurso.condicoesPagamento || 'Não especificado'}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>

    {/* Attachments Section */}
    {concurso.anexos && concurso.anexos.length > 0 && (
      <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Documentos Anexos
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={2}>
            {concurso.anexos.map((anexo) => (
              <Grid item xs={12} sm={6} key={anexo.id}>
                <Card variant="outlined">
                  <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                    {anexo.tipo.startsWith('image/') ? (
                      <Image sx={{ mr: 2 }} />
                    ) : (
                      <PictureAsPdf sx={{ mr: 2, color: 'error.main' }} />
                    )}
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {anexo.nome}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {(anexo.tamanho / 1024).toFixed(2)} KB
                      </Typography>
                    </Box>
                    <IconButton 
                      onClick={() => window.open(anexo.url, '_blank')}
                      color="primary"
                    >
                      <Download />
                    </IconButton>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    )}

    {/* Observations Section */}
    {concurso.observacoes && (
      <Card sx={{ mb: 4, borderRadius: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Observações
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="body1">
            {concurso.observacoes}
          </Typography>
        </CardContent>
      </Card>
    )}

    {/* Views Modal */}
    <Modal open={viewsModalOpen} onClose={() => setViewsModalOpen(false)}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: isMobile ? 2 : 4,
          borderRadius: 2,
          width: isMobile ? '90%' : '80%',
          maxWidth: 600,
          maxHeight: '80%',
          overflowY: 'auto',
        }}
      >
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Empresas que visualizaram este concurso
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {Object.keys(concurso.views || {}).length > 0 ? (
          <Typography color="textSecondary">
            {Object.keys(concurso.views).length} visualizações registradas
          </Typography>
        ) : (
          <Typography color="textSecondary">Nenhuma visualização registrada até o momento.</Typography>
        )}
        <Box mt={3} textAlign="right">
          <Button variant="contained" onClick={() => setViewsModalOpen(false)} size={isMobile ? 'small' : 'medium'}>
            Fechar
          </Button>
        </Box>
      </Box>
    </Modal>

    {/* Report Modal */}
    <Dialog open={denunciaModalOpen} onClose={handleFecharDenunciaModal} fullScreen={isMobile}>
      <DialogTitle>Denunciar Concurso</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Por favor, descreva o motivo da denúncia. Sua contribuição nos ajuda a manter a plataforma segura e confiável.
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={isMobile ? 3 : 4}
          label="Motivo da Denúncia"
          value={motivoDenuncia}
          onChange={(e) => setMotivoDenuncia(e.target.value)}
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleFecharDenunciaModal} size={isMobile ? 'small' : 'medium'}>
          Cancelar
        </Button>
        <Button 
          onClick={handleDenunciar} 
          color="error" 
          size={isMobile ? 'small' : 'medium'}
          disabled={!motivoDenuncia.trim()}
        >
          Enviar Denúncia
        </Button>
      </DialogActions>
    </Dialog>
  </Box>
);
};

export default ConcursoDetalhesDesk;
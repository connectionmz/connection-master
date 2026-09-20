import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../../fb';
import { ref, onValue, increment, update, push, set, get } from 'firebase/database';
import {
  RemoveRedEye,
  Share,
  FileDownload,
  Report,
  Email,
  Phone,
  CalendarToday,
  CheckCircle,
  History,
  PictureAsPdf,
  Download
} from '@mui/icons-material';
import {
  Typography,
  Button,
  Grid,
  Avatar,
  Box,
  Container,
  Paper,
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
import { formatarValor } from '../../utils/utils';
import { Link2 } from 'lucide-react';

/* ── Design tokens (mesmos de ConcursoDesk.js / CotacoesDesk.js, para manter o visual consistente) ── */
const T = {
  navy:        '#08192E',
  navyCard:    '#0D2240',
  gold:        '#C8903A',
  goldLight:   '#E8B96A',
  white:       '#FFFFFF',
  darkBorder:  'rgba(255,255,255,0.08)',
  darkText:    'rgba(255,255,255,0.88)',
  darkTextSub: 'rgba(255,255,255,0.52)',
  darkMuted:   'rgba(255,255,255,0.30)',
  success:     '#10b981',
  error:       '#ef4444',
  warning:     '#f59e0b',
};

const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .fade-up {
    animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
  }
  .detail-section {
    background: ${T.navyCard};
    border: 1px solid ${T.darkBorder};
    border-radius: 16px;
  }
  .anexo-card {
    background: rgba(255,255,255,0.03);
    border: 1px solid ${T.darkBorder};
    border-radius: 12px;
    transition: border-color 0.2s ease;
  }
  .anexo-card:hover {
    border-color: ${T.gold};
  }
`;

const BG_GRID = {
  position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.02,
  backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)`,
  backgroundSize: '56px 56px',
};

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
      <Box sx={{ backgroundColor: T.navy, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography sx={{ color: T.darkTextSub, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Carregando...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ backgroundColor: T.navy, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography sx={{ color: T.error, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>{error}</Typography>
      </Box>
    );
  }

  if (!concurso) {
    return (
      <Box sx={{ backgroundColor: T.navy, minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Typography sx={{ color: T.error, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Concurso não encontrado</Typography>
      </Box>
    );
  }

const statusInfo = concurso.status === 'Fechada' || isConcursoExpirado()
  ? isConcursoExpirado()
    ? { label: 'Expirado', color: T.warning }
    : { label: 'Fechado', color: T.error }
  : { label: 'Aberto', color: T.success };

const sectionTitleSx = {
  fontFamily: '"Playfair Display", serif',
  fontWeight: 700,
  color: T.white,
  mb: 1.5,
};

const renderHtmlSection = (title, html) => (
  <Paper className="detail-section" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
    <Typography variant="h6" sx={sectionTitleSx}>{title}</Typography>
    <Divider sx={{ borderColor: T.darkBorder, mb: 2 }} />
    <Typography
      component="div"
      dangerouslySetInnerHTML={{ __html: html || '<p>Não especificado</p>' }}
      sx={{ lineHeight: 1.7, color: T.darkText, fontFamily: '"Plus Jakarta Sans", sans-serif' }}
    />
  </Paper>
);

const detailField = (label, value) => (
  <Grid item xs={12} sm={6}>
    <Typography variant="subtitle2" sx={{ color: T.darkTextSub, fontWeight: 600, mb: 0.5 }}>
      {label}
    </Typography>
    <Typography sx={{ color: T.darkText }}>{value || 'Não especificado'}</Typography>
  </Grid>
);

return (
  <Box sx={{ backgroundColor: T.navy, minHeight: '100vh', fontFamily: '"Plus Jakarta Sans", sans-serif', position: 'relative' }}>
    <style>{KEYFRAMES}</style>
    <Box sx={BG_GRID} />

    <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
      <BackButton sx={{ mb: 2, color: T.darkTextSub }} />

      {/* Header */}
      <Paper className="detail-section fade-up" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Grid container spacing={2} alignItems="flex-start">
          <Grid item>
            <Link to={`/perfil/${concurso.company.id}`}>
              <Avatar
                src={concurso.company.logoUrl || 'default-logo.png'}
                alt={concurso.company.nome}
                sx={{ width: isMobile ? 48 : 64, height: isMobile ? 48 : 64, border: `2px solid ${T.gold}` }}
              />
            </Link>
          </Grid>
          <Grid item xs>
            <Typography sx={{ color: T.gold, fontWeight: 600, fontSize: '0.9rem', mb: 0.5 }}>
              {concurso.company.nome || 'N/A'}
            </Typography>
            <Typography
              variant={isMobile ? 'h6' : 'h5'}
              sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 800, color: T.white, mb: 1 }}
            >
              {concurso.titulo || 'Concurso sem título'}
            </Typography>
            <Chip
              label={statusInfo.label}
              size="small"
              sx={{
                mb: 1.5,
                bgcolor: `${statusInfo.color}20`,
                color: statusInfo.color,
                fontWeight: 700,
                border: `1px solid ${statusInfo.color}40`,
              }}
            />

            <Box display="flex" flexWrap="wrap" gap={2} mb={1}>
              <Typography
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: T.gold,
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                }}
                onClick={() => setViewsModalOpen(true)}
              >
                <RemoveRedEye sx={{ mr: 0.5, fontSize: 18 }} />
                {Object.keys(concurso.views || {}).length || 0} visualizações
              </Typography>
            </Box>

            <Box display="flex" flexWrap="wrap" gap={2}>
              <Typography
                sx={{ display: 'flex', alignItems: 'center', color: T.darkTextSub, fontSize: isMobile ? '0.8rem' : '0.9rem' }}
              >
                <CalendarToday sx={{ mr: 0.5, fontSize: 18, color: T.gold }} />
                Publicado em {new Date(concurso.timestamp).toLocaleDateString('pt-PT')}
              </Typography>

              <Typography
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  color: isPrazoValido(concurso.prazo) ? T.darkTextSub : T.error,
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                }}
              >
                {isPrazoValido(concurso.prazo) ? (
                  <CheckCircle sx={{ fontSize: 18, color: T.success }} />
                ) : (
                  <History sx={{ fontSize: 18, color: T.error }} />
                )}
                Prazo: {new Date(concurso.prazo).toLocaleDateString('pt-PT')}
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ borderColor: T.darkBorder, my: 2 }} />

        <Stack direction={isMobile ? 'column' : 'row'} spacing={isMobile ? 1 : 2} flexWrap="wrap" useFlexGap>
          <Button
            variant="contained"
            onClick={handleBaixarEdital}
            startIcon={<FileDownload />}
            size={isMobile ? 'small' : 'medium'}
            fullWidth={isMobile}
            sx={{ bgcolor: T.gold, color: T.navy, '&:hover': { bgcolor: T.goldLight }, fontWeight: 600, textTransform: 'none', borderRadius: '10px' }}
          >
            {isMobile ? 'Baixar Anexos' : 'Baixar Documentos Anexos'}
          </Button>

          <Button
            variant="outlined"
            onClick={handlePartilhar}
            startIcon={<Share />}
            size={isMobile ? 'small' : 'medium'}
            fullWidth={isMobile}
            sx={{ color: T.darkText, borderColor: T.darkBorder, textTransform: 'none', borderRadius: '10px', '&:hover': { borderColor: T.gold, color: T.gold } }}
          >
            Partilhar
          </Button>

          {concurso.company.id != user.id && (
            <Button
              variant="outlined"
              onClick={handleAbrirDenunciaModal}
              startIcon={<Report />}
              size={isMobile ? 'small' : 'medium'}
              fullWidth={isMobile}
              sx={{ color: T.error, borderColor: 'rgba(239,68,68,0.4)', textTransform: 'none', borderRadius: '10px', '&:hover': { borderColor: T.error, bgcolor: 'rgba(239,68,68,0.08)' } }}
            >
              Denunciar
            </Button>
          )}

          {concurso.linkDeSubmissao && (
            <Button
              variant="contained"
              startIcon={<Link2 />}
              href={concurso.linkDeSubmissao}
              target="_blank"
              size={isMobile ? 'small' : 'medium'}
              fullWidth={isMobile}
              sx={{ bgcolor: T.success, color: T.white, '&:hover': { bgcolor: '#0da271' }, textTransform: 'none', borderRadius: '10px' }}
            >
              Submeter Proposta
            </Button>
          )}

          {concurso.email && (
            <Button
              variant="outlined"
              startIcon={<Email />}
              href={`mailto:${concurso.email}`}
              size={isMobile ? 'small' : 'medium'}
              fullWidth={isMobile}
              sx={{ color: T.darkText, borderColor: T.darkBorder, textTransform: 'none', borderRadius: '10px', '&:hover': { borderColor: T.gold, color: T.gold } }}
            >
              {isMobile ? 'Email' : 'Enviar Email'}
            </Button>
          )}
          {concurso.contacto && (
            <Button
              variant="outlined"
              startIcon={<Phone />}
              href={`tel:${concurso.contacto}`}
              size={isMobile ? 'small' : 'medium'}
              fullWidth={isMobile}
              sx={{ color: T.darkText, borderColor: T.darkBorder, textTransform: 'none', borderRadius: '10px', '&:hover': { borderColor: T.gold, color: T.gold } }}
            >
              {isMobile ? 'Ligar' : 'Contactar'}
            </Button>
          )}
        </Stack>
      </Paper>

      {renderHtmlSection('Objeto do Concurso', concurso.objeto)}
      {renderHtmlSection('Condições do Concurso', concurso.condicoes)}
      {renderHtmlSection('Critérios de Avaliação', concurso.criterios)}
      {renderHtmlSection('Documentação Necessária', concurso.documentacao)}
      {renderHtmlSection('Requisitos Técnicos', concurso.requisitosTecnicos)}

      {/* Concurso Details */}
      <Paper className="detail-section" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
        <Typography variant="h6" sx={sectionTitleSx}>Detalhes do Concurso</Typography>
        <Divider sx={{ borderColor: T.darkBorder, mb: 2 }} />
        <Grid container spacing={2}>
          {detailField('Número de Referência:', concurso.numeroReferencia)}
          {detailField('Modalidade:', concurso.modalidade)}
          {detailField('Setor:', concurso.setor)}
          {detailField('Províncias:', concurso.provincia && concurso.provincia.length > 0 ? concurso.provincia.join(', ') : null)}
          {detailField('Local de Entrega:', concurso.localEntrega)}
          {detailField('Data de Abertura:', concurso.dataAbertura ? new Date(concurso.dataAbertura).toLocaleDateString('pt-PT') : null)}
          {detailField('Data de Limite:', concurso.dataLimite ? new Date(concurso.dataLimite).toLocaleDateString('pt-PT') : null)}
          {detailField('Valor Estimado:', concurso.valorEstimado ? formatarValor(concurso.valorEstimado) + ' MT' : null)}
        </Grid>
      </Paper>

      {concurso.anexos && concurso.anexos.length > 0 && (
        <Paper className="detail-section" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
          <Typography variant="h6" sx={sectionTitleSx}>Documentos Anexos</Typography>
          <Divider sx={{ borderColor: T.darkBorder, mb: 2 }} />
          <Grid container spacing={2}>
            {concurso.anexos.map((anexo) => (
              <Grid item xs={12} sm={6} key={anexo.id}>
                <Box className="anexo-card" sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                  {anexo.tipo.startsWith('image/') ? (
                    <Box
                      sx={{ width: 48, height: 48, mr: 2, borderRadius: 1, overflow: 'hidden', flexShrink: 0, cursor: 'pointer' }}
                      onClick={() => window.open(anexo.url, '_blank')}
                    >
                      <img
                        src={anexo.url}
                        alt={anexo.nome}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>
                  ) : (
                    <PictureAsPdf sx={{ mr: 2, color: T.error }} />
                  )}

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="subtitle2" noWrap sx={{ color: T.darkText }}>
                      {anexo.nome}
                    </Typography>
                    <Typography variant="caption" sx={{ color: T.darkTextSub }}>
                      {(anexo.tamanho / 1024).toFixed(2)} KB
                    </Typography>
                  </Box>

                  <IconButton onClick={() => window.open(anexo.url, '_blank')} sx={{ color: T.gold }}>
                    <Download />
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {concurso.observacoes && (
        <Paper className="detail-section" sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
          <Typography variant="h6" sx={sectionTitleSx}>Observações</Typography>
          <Divider sx={{ borderColor: T.darkBorder, mb: 2 }} />
          <Typography sx={{ color: T.darkText }}>{concurso.observacoes}</Typography>
        </Paper>
      )}

      {/* Views Modal */}
      <Modal open={viewsModalOpen} onClose={() => setViewsModalOpen(false)}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: T.navyCard,
            border: `1px solid ${T.darkBorder}`,
            boxShadow: 24,
            p: isMobile ? 2 : 4,
            borderRadius: '16px',
            width: isMobile ? '90%' : '80%',
            maxWidth: 600,
            maxHeight: '80%',
            overflowY: 'auto',
          }}
        >
          <Typography variant="h6" sx={sectionTitleSx}>Empresas que visualizaram este concurso</Typography>
          <Divider sx={{ borderColor: T.darkBorder, mb: 2 }} />
          {Object.keys(concurso.views || {}).length > 0 ? (
            <Typography sx={{ color: T.darkTextSub }}>
              {Object.keys(concurso.views).length} visualizações registradas
            </Typography>
          ) : (
            <Typography sx={{ color: T.darkTextSub }}>Nenhuma visualização registrada até o momento.</Typography>
          )}
          <Box mt={3} textAlign="right">
            <Button
              variant="contained"
              onClick={() => setViewsModalOpen(false)}
              size={isMobile ? 'small' : 'medium'}
              sx={{ bgcolor: T.gold, color: T.navy, '&:hover': { bgcolor: T.goldLight }, textTransform: 'none' }}
            >
              Fechar
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Report Modal */}
      <Dialog
        open={denunciaModalOpen}
        onClose={handleFecharDenunciaModal}
        fullScreen={isMobile}
        PaperProps={{ sx: { bgcolor: T.navyCard, border: `1px solid ${T.darkBorder}`, borderRadius: isMobile ? 0 : '16px' } }}
      >
        <DialogTitle sx={{ color: T.white, fontFamily: '"Playfair Display", serif', borderBottom: `1px solid ${T.darkBorder}` }}>
          Denunciar Concurso
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Typography sx={{ color: T.darkTextSub, mb: 2 }}>
            Por favor, descreva o motivo da denúncia. Sua contribuição nos ajuda a manter a plataforma segura e confiável.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={isMobile ? 3 : 4}
            label="Motivo da Denúncia"
            value={motivoDenuncia}
            onChange={(e) => setMotivoDenuncia(e.target.value)}
            InputLabelProps={{ sx: { color: T.darkTextSub } }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: T.darkText,
                '& fieldset': { borderColor: T.darkBorder },
                '&:hover fieldset': { borderColor: T.gold },
                '&.Mui-focused fieldset': { borderColor: T.gold },
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ borderTop: `1px solid ${T.darkBorder}`, p: 2 }}>
          <Button onClick={handleFecharDenunciaModal} size={isMobile ? 'small' : 'medium'} sx={{ color: T.darkTextSub, textTransform: 'none' }}>
            Cancelar
          </Button>
          <Button
            onClick={handleDenunciar}
            size={isMobile ? 'small' : 'medium'}
            disabled={!motivoDenuncia.trim()}
            sx={{ color: T.error, textTransform: 'none' }}
          >
            Enviar Denúncia
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  </Box>
);
};

export default ConcursoDetalhesDesk;
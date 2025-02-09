import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../fb';
import { ref, onValue, increment, update } from 'firebase/database';
import { AdsClick, Inbox, RemoveRedEye, Share, FileDownload, Timelapse, CalendarToday, AccessTime } from '@mui/icons-material';
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
} from '@mui/material';
import BackButton from '../BackButton';

const ConcursoDetalhesDesk = ({ user }) => {
  const { id } = useParams();
  const [concurso, setConcurso] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [propostas, setPropostas] = useState([]);
  const [viewsModalOpen, setViewsModalOpen] = useState(false);
  const [empresasQueVisualizaram, setEmpresasQueVisualizaram] = useState([]);
  const [hasProposal, setHasProposal] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [proposalDetails, setProposalDetails] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const concursoRef = ref(db, `concursos/${id}`);
    const viewsRef = ref(db, `concursos/${id}/views/${user.id}`);

    // Increment view count if the user hasn't viewed the tender before
    onValue(viewsRef, (snapshot) => {
      if (!snapshot.exists()) {
        update(concursoRef, {
          [`views/${user.id}`]: true,
          viewCount: increment(1),
        });
      }
    }, { onlyOnce: true });

    // Fetch tender data
    onValue(concursoRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setConcurso(data);
        setLoading(false);

        // Fetch proposals
        if (data.proposals) {
          const propostasList = Object.keys(data.proposals).map((propostaId) => ({
            id: propostaId,
            ...data.proposals[propostaId],
          }));
          setPropostas(propostasList);
          setHasProposal(propostasList.some((proposta) => proposta.userId === user.id));
        }

        // Fetch companies that viewed the tender
        if (data.views) {
          const empresasIds = Object.keys(data.views);
          const empresas = empresasIds.map((empresaId) => ({
            id: empresaId,
            ...data.views[empresaId],
          }));
          setEmpresasQueVisualizaram(empresas);
        }
      } else {
        setError('Concurso não encontrado');
        setLoading(false);
      }
    }, (error) => {
      setError('Erro ao buscar dados do concurso');
      setLoading(false);
      console.error('Erro ao buscar dados do concurso:', error);
    });
  }, [id, user.id]);

  const handleBaixarPedido = () => navigate(`/concursoPDF/${id}`);
  const handlePartilhar = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => alert('Link copiado! Pronto para partilhar.'),
      (err) => alert('Erro ao copiar o link', err)
    );
  };

  const handleOpenModal = () => setViewsModalOpen(true);
  const handleCloseModal = () => setViewsModalOpen(false);
  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);

  const handleFecharConcurso = () => {
    if (window.confirm("Tem certeza que deseja fechar este concurso?")) {
      update(ref(db, `concursos/${id}`), {
        status: "Fechada",
      }).then(() => {
        alert("Concurso fechado com sucesso!");
      }).catch((error) => {
        alert("Erro ao fechar o concurso:", error);
      });
    }
  };

  if (loading) {
    return <Typography align="center" color="textSecondary">Carregando...</Typography>;
  }

  if (error) {
    return <Typography align="center" color="error">{error}</Typography>;
  }

  return (
    <Box width='100%' mx="auto" p={3}>
      <BackButton sx={{ mb: 2 }} />
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                src={concurso.company.logoUrl || 'default-logo.png'}
                alt={concurso.company.nome}
                sx={{ width: 64, height: 64 }}
              />
            </Grid>
            <Grid item xs>
              <Typography variant="h5" gutterBottom>{concurso.company.nome}</Typography>
              <Box mt={1}>
                <Grid container spacing={2}>
                  <Typography
                    color="primary"
                    sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    onClick={handleOpenModal}>
                    <RemoveRedEye color="primary" /> {concurso.viewCount || 0} visualizações
                  </Typography>
                  <Grid item><Inbox color="warning" /> {propostas.length} propostas</Grid>
                </Grid>
              </Box>
              <Box mt={1}>
                <Grid container spacing={2}>
                  <Grid item>
                    <Typography color="primary" style={{ verticalAlign: 'middle', marginRight: 4 }}>Publicado</Typography>
                    <Typography variant="body2" component="span">
                      {new Date(concurso.timestamp).toLocaleDateString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </Typography>
                  </Grid>
                  <Grid item>
                    <Typography color="red" style={{ verticalAlign: 'middle', marginRight: 4 }}>Limite</Typography>
                    <Typography variant="body2" component="span">
                      {new Date(concurso.prazo).toLocaleString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
        <CardActions>
          <Button variant="contained" color="primary" onClick={handleBaixarPedido} startIcon={<FileDownload />}>
            Baixar Pedido
          </Button>
          <Button variant="contained" onClick={handlePartilhar} startIcon={<Share />}>
            Partilhar
          </Button>
          {user.id === concurso.company.id ? (
            <>
              {concurso.status !== "Fechada" && (
                <Button variant="contained" color="error" onClick={handleFecharConcurso}>
                  Fechar Concurso
                </Button>
              )}
            </>
          ) : (
            <>
              {hasProposal ? (
                <Button variant="contained" color="error" onClick={handleOpen}>
                  Ver Minha Proposta
                </Button>
              ) : (
                <div>
                  {concurso.status !== "Fechada" ? (
                    <Typography variant="body1" color="error">
                      O concurso está fechado. Não é possível enviar propostas.
                    </Typography>
                  ) : (
                    <></>
                  )}
                </div>
              )}
            </>
          )}
        </CardActions>
      </Card>
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Descrição</Typography>
          <Typography dangerouslySetInnerHTML={{ __html: concurso.objeto }} />
        </CardContent>
      </Card>
      <Card>
        <Typography variant="h6" gutterBottom>Itens Solicitados</Typography>
        {concurso.items && concurso.items.length > 0 ? (
          <Grid container spacing={2}>
            {concurso.items.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card>
                  <CardContent>
                    <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                    <Typography variant="body1">{item.name}</Typography>
                    <Typography variant="body2" color="textSecondary">{item.description}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography color="textSecondary">Nenhum item disponível.</Typography>
        )}
      </Card>

     
    </Box>
  );
};

export default ConcursoDetalhesDesk;
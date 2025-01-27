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
} from '@mui/material';
import BackButton from '../BackButton';

const CotacaoDetalhesDesk = ({user}) => {
  const { id, companyId } = useParams();
  const [cotacao, setCotacao] = useState(null);
  const [isCompanyOwner, setIsCompanyOwner] = useState(false);
  const [propostas, setPropostas] = useState([]);
  const [viewsModalOpen, setViewsModalOpen] = useState(false);
  const [empresasQueVisualizaram, setEmpresasQueVisualizaram] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const cotacaoRef = ref(db, `cotacoes/${id}`);

  // Referência para a lista de visualizações
  const viewsRef = ref(db, `cotacoes/${id}/views/${user.id}`);

  // Verifica se o usuário já visualizou a cotação
  onValue(viewsRef, (snapshot) => {
    if (!snapshot.exists()) {
      // Adiciona o usuário à lista de visualizações e incrementa o contador
      update(cotacaoRef, {
        [`views/${user.id}`]: true, // Marca que o usuário visualizou
        viewCount: increment(1), // Incrementa o contador
      });
    }
  }, { onlyOnce: true });

    // Carregar dados da cotação e empresas que visualizaram
    onValue(cotacaoRef, (snapshot) => {
      const data = snapshot.val();
      setCotacao(data);

      if (data?.views) {
        const empresasIds = Object.keys(data.views);
        const empresas = empresasIds.map((empresaId) => ({
          id: empresaId,
          ...data.views[empresaId], // Exemplo: { id: 'empresa1', nome: 'Empresa 1', logoUrl: '...' }
        }));
        setEmpresasQueVisualizaram(empresas);
      }
    });
  }, [id]);

  const handleEnviarProposta = () => navigate(`/enviar-proposta/${id}/${companyId}`);
  const handleBaixarPedido = () => navigate(`/cotacaoPDF/${id}`);
  const handlePartilhar = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(
      () => alert('Link copiado! Pronto para partilhar.'),
      (err) => alert('Erro ao copiar o link', err)
    );
  };
  const handleVerPropostas = () => {
    if (propostas.length > 0) {
      navigate(`/propostas/${id}/propostas`);
    } else {
      alert('Nenhuma proposta foi recebida ainda.');
    }
  };

  const handleOpenModal = () => setViewsModalOpen(true);
  const handleCloseModal = () => setViewsModalOpen(false);


  if (!cotacao) {
    return <Typography align="center" color="textSecondary">Carregando...</Typography>
  }

  return (
    <Box maxWidth="lg" mx="auto" p={3}>
    <BackButton sx={{ mb: 2 }} />
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar
                src={cotacao.company.logoUrl || 'default-logo.png'}
                alt={cotacao.company.nome}
                sx={{ width: 64, height: 64 }}
              />
            </Grid>
            <Grid item xs>
              <Typography variant="h5" gutterBottom>{cotacao.company.nome}</Typography>
              <Typography variant="body2" color="textSecondary">
                Estado: <strong>{cotacao.status}</strong>
              </Typography>
              <Box mt={1}>
                <Grid container spacing={2}>
                <Typography
                      color="primary"
                      sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      onClick={handleOpenModal}>
                      <RemoveRedEye color="primary" /> {cotacao.viewCount || 0} visualizações
                    </Typography>
                    <Grid item><Inbox color="warning" /> {propostas.length} propostas</Grid>
                </Grid>
              </Box>
              <Box mt={1}>
                <Grid container spacing={2}>


                    {/* Data Limite */}
                    <Grid item>
                      <Typography color="primary" style={{ verticalAlign: 'middle', marginRight: 4 }} >Publicado</Typography>
                      <Typography variant="body2" component="span">
                        {new Date(cotacao.timestamp).toLocaleDateString('pt-PT', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </Typography>
                    </Grid>

                    {/* Data de Criação */}
                    <Grid item>
                      <Typography color="red" style={{ verticalAlign: 'middle', marginRight: 4 }} >Limite</Typography>
                      <Typography variant="body2" component="span">
                        {new Date(cotacao.datalimite).toLocaleString('pt-PT', {
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
          {isCompanyOwner ? (
            <Button variant="contained" color="secondary" onClick={handleVerPropostas}>
              Ver Propostas
            </Button>
          ) : (
            <Button variant="contained" color="primary" onClick={handleEnviarProposta}>
              Enviar Proposta
            </Button>
          )}
        </CardActions>
      </Card>

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Descrição</Typography>
          <Typography dangerouslySetInnerHTML={{ __html: cotacao.description }} />
        </CardContent>
      </Card>

      <Card>

      <Typography variant="h6" gutterBottom>Itens Solicitados</Typography>
          {cotacao.items && cotacao.items.length > 0 ? (
            <Grid container spacing={2}>
              {cotacao.items.map((item, index) => (
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


  {/* Modal */}
  <Modal
        open={viewsModalOpen}
        onClose={handleCloseModal}
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            width: '80%',
            maxHeight: '80%',
            overflowY: 'auto',
          }}
        >
          <Typography id="modal-title" variant="h6" component="h2" gutterBottom>
            Empresas que visualizaram
          </Typography>
          {empresasQueVisualizaram.length > 0 ? (
            <Grid container spacing={2}>
              {empresasQueVisualizaram.map((empresa) => (
                <Grid item xs={12} sm={6} key={empresa.id}>
                  <Box display="flex" alignItems="center" p={2} border={1} borderColor="divider" borderRadius={2}>
                    <Avatar src={empresa.logoUrl || 'default-logo.png'} alt={empresa.nome} sx={{ mr: 2 }} />
                    <Typography variant="body1">{empresa.nome || 'Empresa Desconhecida'}</Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Typography color="textSecondary">Nenhuma empresa visualizou até o momento.</Typography>
          )}
          <Box mt={3} textAlign="right">
            <Button variant="contained" onClick={handleCloseModal}>Fechar</Button>
          </Box>
        </Box>
      </Modal>

    </Box>
  );
};

export default CotacaoDetalhesDesk;

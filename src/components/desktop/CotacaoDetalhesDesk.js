import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../../fb';
import { ref, onValue, increment, update } from 'firebase/database';
import { AdsClick, Inbox, RemoveRedEye, Share, FileDownload } from '@mui/icons-material';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Grid,
  Avatar,
  Box,
} from '@mui/material';

const CotacaoDetalhesDesk = () => {
  const { id, companyId } = useParams();
  const [cotacao, setCotacao] = useState(null);
  const [isCompanyOwner, setIsCompanyOwner] = useState(false);
  const [propostas, setPropostas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const cotacaoRef = ref(db, `cotacoes/${id}`);

    update(cotacaoRef, { views: increment(1) });

    onValue(cotacaoRef, (snapshot) => {
      const data = snapshot.val();
      setCotacao(data);

      if (data?.proposals) {
        setPropostas(Object.values(data.proposals));
      }

      if (auth.currentUser && data?.company?.id === auth.currentUser.uid) {
        setIsCompanyOwner(true);
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

  if (!cotacao) {
    return <Typography align="center" color="textSecondary">Carregando...</Typography>;
  }

  return (
    <Box maxWidth="lg" mx="auto" p={3}>
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
                  <Grid item><RemoveRedEye color="primary" /> {cotacao.views || 0} visualizações</Grid>
                  <Grid item><AdsClick color="success" /> {cotacao.clicks || 0} cliques</Grid>
                  <Grid item><Inbox color="warning" /> {propostas.length} propostas</Grid>
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
        <CardContent>
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
        </CardContent>
      </Card>
    </Box>
  );
};

export default CotacaoDetalhesDesk;

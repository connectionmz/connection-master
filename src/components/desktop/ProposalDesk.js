import React, { useEffect, useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Link,
  Card,
  CardContent,
  useMediaQuery,
  Button,
} from '@mui/material';
import { ref, onValue } from 'firebase/database';
import { db } from '../../fb';
import { useParams } from 'react-router-dom';

const ProposalDesk = () => {
  const { id, cotId } = useParams();
  const [activeTab, setActiveTab] = useState('Aprovada');
  const [cotacoes, setCotacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width:600px)'); // Detecta dispositivos móveis

  useEffect(() => {
    const proposalRef = ref(db, `cotacoes/${cotId}`);

    const unsubscribe = onValue(proposalRef, (snapshot) => {
      const propData = snapshot.val();
      if (propData && propData.proposals) {
        setCotacoes(Object.values(propData.proposals));
      } else {
        setCotacoes([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [cotId, id]);

  const renderProposals = (status) => {
    const filteredProposals = cotacoes.filter((cotacao) => cotacao.status === status);

    if (filteredProposals.length === 0) {
      return (
        <Typography variant="body1" color="textSecondary" align="center">
          Nenhuma proposta disponível para este status.
        </Typography>
      );
    }

    return filteredProposals.map((cotacao) => (
      <Card
        key={cotacao.id}
        sx={{
          mb: 2,
          boxShadow: 3,
          borderRadius: 2,
          p: isMobile ? 2 : 4, // Ajusta padding para mobile
        }}
      >
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {cotacao.from.displayName || 'Empresa Desconhecida'}
          </Typography>
          <Typography
            variant="body1"
            dangerouslySetInnerHTML={{ __html: cotacao.proposal || '<p>Sem descrição</p>' }}
          />
          <Link
            to={cotacao.url || '#'}
            underline="hover"
            color="primary"
            sx={{ display: 'block', mt: 2 }}
          >
            Ver Cotação
          </Link>
        </CardContent>
      </Card>
    ));
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '50vh',
        }}
      >
        <Typography variant="h6">Carregando propostas...</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: isMobile ? '100%' : '800px', // Ajusta largura máxima para mobile
        margin: '0 auto',
        p: isMobile ? 2 : 4, // Ajusta padding para mobile
      }}
    >
      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, newValue) => setActiveTab(newValue)}
        centered
        variant={isMobile ? 'scrollable' : 'standard'} // Scrollável em mobile
        scrollButtons="auto"
        sx={{
          '& .MuiTabs-indicator': {
            backgroundColor: 'primary.main',
          },
          '& .MuiTab-root': {
            textTransform: 'capitalize',
            fontSize: isMobile ? '0.875rem' : '1rem', // Ajusta tamanho da fonte para mobile
          },
        }}
      >
        <Tab label="Aprovada" value="Aprovada" />
        <Tab label="Recusada" value="Recusada" />
        <Tab label="Em Espera" value="Em Espera" />
      </Tabs>

      {/* Lista de Propostas */}
      <Box sx={{ mt: 4 }}>
        {renderProposals(activeTab)}
      </Box>
    </Box>
  );
};

export default ProposalDesk;
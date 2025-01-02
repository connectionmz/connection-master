import React, { useState, useEffect } from 'react';
import { ref, get, onValue, update } from 'firebase/database';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Button,
  TextField,
  Box,
  MenuItem,
  Modal,
  Avatar,
  Divider,
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { db } from '../../fb';
import PaySMSCheckout from '../PaySMSCheckout';
import { FileDownload, Share } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const CotacoesDesk = ({user, onModuleActivation}) => {
  const [cotacoes, setCotacoes] = useState([]);
  const [filteredCotacoes, setFilteredCotacoes] = useState([]);
  const [selectedCotacao, setSelectedCotacao] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todas');
  const [isPaying, setIsPaying] = useState(false); 


  const navigate = useNavigate();

const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '400px',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: '8px',
};

  const hasModuleSMS = user?.activeModules?.moduloSMS?.status === 'active';


useEffect(() => {
  if (!hasModuleSMS) {
    setLoading(false); 
    return;
  }

  const cotacoesRef = ref(db, 'cotacoes');

  const unsubscribeCotacoes = onValue(cotacoesRef, (snapshot) => {
    const cotacoesData = snapshot.val() || {};
    const cotacoesList = Object.entries(cotacoesData)
      .map(([id, data]) => ({ id, ...data }))
      .filter(
        (cotacao) =>
          cotacao.sector === user.sector &&
          cotacao.company?.provincia === user.provincia
      );

    setCotacoes(cotacoesList);
    setFilteredCotacoes(cotacoesList);
    setLoading(false);
    console.log(cotacoesList)
  });

  return () => {
    unsubscribeCotacoes();
  };
}, [db, user, hasModuleSMS]);


  const handleViewDetails = (cotacao) => {
    setSelectedCotacao(cotacao);
  };

  const handleBackToList = () => {
    setSelectedCotacao(null);
  };

const handleFilterChange = (event) => {
  const value = event.target.value;
  setFilter(value);

  if (value === 'Todas') {
    setFilteredCotacoes(cotacoes);
  } else if (value === 'Lidas') {
    setFilteredCotacoes(cotacoes.filter((cotacao) => cotacao.status === 'lida'));
  } else if (value === 'Não Lidas') {
    setFilteredCotacoes(cotacoes.filter((cotacao) => cotacao.status === 'nao-lida'));
  }
};

const handlePaymentSuccess = (paymentDetails) => {
  const userRef = ref(db, `company/${user.id}/activeModules/moduloSMS`);
  update(userRef, { status: 'active', activatedAt: new Date().toISOString(), paymentDetails })
      .then(() => {
          alert('Módulo SMS ativado com sucesso!');
          if (onModuleActivation) onModuleActivation(); 

          window.location.reload();

      })
      .catch((error) => {
          console.error('Erro ao ativar o módulo SMS: ', error);
      });
};






const handlePartilhar = () => {
  const url = window.location.href;
  navigator.clipboard
    .writeText(url)
    .then(() => alert('Link copiado! Pronto para partilhar.'))
    .catch((err) => alert('Erro ao copiar o link', err));
};


  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div
        style={{
          width: selectedCotacao ? '30%' : '100%',
          borderRight: '1px solid #ccc',
          overflowY: 'auto',
        }}
      >
    <Modal
      open={isPaying}
      onClose={() => setIsPaying(false)}
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
    >
      <Box sx={modalStyle}>
        <Typography
          id="modal-title"
          variant="h6"
          component="h2"
          gutterBottom
        >
          Ativação do Módulo SMS
        </Typography>
        <PaySMSCheckout
  user={user}
  onPaymentSuccess={() => handlePaymentSuccess()} // Chama a função corretamente
/>

      </Box>
    </Modal>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          p={2}
          bgcolor="#f5f5f5"
        >
          <Typography variant="h6">Cotações</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() =>   navigate(`/cotacao`)}>
            Nova Cotação
          </Button>
        </Box>

        <Box display="flex" alignItems="center" p={2}>
          <FilterListIcon style={{ marginRight: 8 }} />
          <TextField
            select
            value={filter}
            onChange={handleFilterChange}
            variant="outlined"
            size="small"
            label="Filtrar"
            style={{ flex: 1 }}
          >
            <MenuItem value="Todas">Todas</MenuItem>
            <MenuItem value="Lidas">Lidas</MenuItem>
            <MenuItem value="Não Lidas">Não Lidas</MenuItem>
          </TextField>
        </Box>

        {!hasModuleSMS ? (
      <div
        style={{
          margin: 'auto',
          textAlign: 'center',
          color: '#666',
        }}
      >
        <Typography variant="h6" color="textSecondary">
          Você precisa recarregar as SMS para acessar os pedidos de cotação.
        </Typography>
        <Button
          variant="contained"
          onClick={() => setIsPaying(true)}
        >
          Ativar Módulo SMS
        </Button>
      </div>
    ) : loading ? (
      <Typography variant="body1" align="center" style={{ marginTop: '20px' }}>
        Carregando...
      </Typography>
    ) : (
      <List>
        {cotacoes.map((cotacao, index) => (
          <ListItem key={index} divider button onClick={() => handleViewDetails(cotacao)}>
            <Avatar src={cotacao?.company?.logoUrl || ''} /> 
            <ListItemText
              primary={cotacao?.title || 'Título não disponível'}
              secondary={
                <>
                  <Typography variant="body2">{cotacao?.company?.nome || 'Nome da empresa não disponível'}</Typography>
                  <Typography variant="body2" color="textSecondary">{cotacao.datalimite || 'Data limite não disponível'}</Typography>
                </>
              }
            />
            <ListItemSecondaryAction>
              <IconButton edge="end" aria-label={`Detalhes de ${cotacao?.title}`} onClick={() => handleViewDetails(cotacao)}>
                <InfoIcon />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      )}
    </div>
    <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={handleBackToList}
        style={{ marginBottom: '16px' }}
      >
        Voltar
      </Button>

      <Typography variant="h5" gutterBottom>
        {selectedCotacao?.title || 'Título não disponível'}
      </Typography>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <Avatar
          src={selectedCotacao?.company?.logoUrl || '/path/to/default-avatar.jpg'}
          alt={selectedCotacao?.company?.nome || 'Nome da Empresa'}
          style={{ width: '48px', height: '48px' }}
        />
        <div>
          <Typography variant="body1" color="textSecondary">
            Empresa: {selectedCotacao?.company?.nome || 'Nome da empresa não disponível'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Estado: {selectedCotacao?.status || 'Não especificado'}
          </Typography>
        </div>
      </div>

      <Typography variant="body2" color="textSecondary" paragraph>
        Status: {selectedCotacao?.status || 'Não especificado'}
      </Typography>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <InfoIcon style={{ color: 'blue', marginRight: '8px' }} />
          <Typography variant="body2">{selectedCotacao?.views || 0} visualizações</Typography>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <InfoIcon style={{ color: 'green', marginRight: '8px' }} />
          <Typography variant="body2">{selectedCotacao?.clicks || 0} cliques</Typography>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <InfoIcon style={{ color: 'orange', marginRight: '8px' }} />
          <Typography variant="body2">
            {selectedCotacao?.proposals ? selectedCotacao?.proposals.length : 0} propostas
          </Typography>
        </div>
      </div>

      {/* Descrição da Cotação */}
      <Typography variant="body1" paragraph>
        {selectedCotacao?.description || 'Descrição não disponível'}
      </Typography>

      {/* Data Limite */}
      <Typography variant="body2" color="textSecondary">
        Data Limite: {new Date(selectedCotacao?.datalimite).toLocaleDateString('pt-PT', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })}
      </Typography>

      {/* Divider */}
      <Divider style={{ margin: '16px 0' }} />

      {/* Ações de Propostas */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
        <Button
          variant="contained"
          onClick={() =>   navigate(`/propostas/${selectedCotacao?.id}/propostas`)}
        >
          Ver Propostas
        </Button>
        <Button
          variant="contained"
          onClick={() => navigate(`/enviar-proposta/${selectedCotacao?.id}/${user?.id}`)}
        >
          Enviar Proposta
        </Button>
      </div>

      {/* Ações de Baixar e Partilhar */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
        
        <Button
          variant="contained"
          startIcon={<Share />}
          onClick={handlePartilhar}
        >
          Partilhar
        </Button>
      </div>

      {/* Itens Solicitados */}
      {selectedCotacao?.items && selectedCotacao?.items.length > 0 && (
        <div style={{ marginTop: '24px' }}>
          <Typography variant="h6" gutterBottom>
            Itens Solicitados
          </Typography>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {selectedCotacao?.items.map((item, index) => (
              <div key={index} style={{ padding: '16px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                <img
                  src={item?.imageUrl || '/path/to/default-image.jpg'}
                  alt={item?.name}
                  style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }}
                />
                <Typography variant="body2" color="textSecondary" style={{ marginTop: '8px' }}>
                  {item?.name}
                </Typography>
                <Typography variant="body2">{item?.description}</Typography>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default CotacoesDesk;

import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, query, orderByChild, equalTo, onValue, off, push, set } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Card,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  CircularProgress,
  Snackbar,
  Alert,
  useMediaQuery,
  Grid,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Badge,
  MenuItem
} from '@mui/material';
import { Search, Work, School, Star, Email, Phone, Close, People, Edit } from '@mui/icons-material';

// Configuração do Firebase externo (substitua com suas credenciais)
const externalFirebaseConfig = {
    apiKey: "AIzaSyC1oa1a3ts2jP4LXDA0lYzvkfKXO4L5ijk",
    authDomain: "connectiopos.firebaseapp.com",
    databaseURL: "https://connectiopos-default-rtdb.firebaseio.com",
    projectId: "connectiopos",
    storageBucket: "connectiopos.appspot.com",
    messagingSenderId: "1083339114910",
    appId: "1:1083339114910:web:5ab0c8b4cf4ff729db6e8f",
    measurementId: "G-D7305D656Y"
};

const externalApp = initializeApp(externalFirebaseConfig, 'external');
const externalDb = getDatabase(externalApp);



const RecrutamentoDesk = ({ user }) => {

    console.log(externalDb)

  const [vagas, setVagas] = useState([]);
  const [candidatos, setCandidatos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [areaAtuacao, setAreaAtuacao] = useState('');
  const [loading, setLoading] = useState({ vagas: false, candidatos: false });
  const [selectedCandidato, setSelectedCandidato] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novaVaga, setNovaVaga] = useState({
    titulo: '',
    descricao: '',
    area: '',
    salario: '',
    localizacao: user.provincia,
    tipo: 'Tempo Integral'
  });
  const isMobile = useMediaQuery('(max-width:600px)');
  const navigate = useNavigate();

  // Buscar vagas da empresa atual
  useEffect(() => {
    setLoading(prev => ({ ...prev, vagas: true }));
    const vagasRef = ref(externalDb, `vagas`);
    const empresaVagasQuery = query(vagasRef, orderByChild('empresaId'), equalTo(user.id));

    const unsubscribe = onValue(empresaVagasQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const vagasArray = Object.entries(data).map(([id, vaga]) => ({ id, ...vaga }));
        setVagas(vagasArray);
      } else {
        setVagas([]);
      }
      setLoading(prev => ({ ...prev, vagas: false }));
    });

    return () => off(empresaVagasQuery, 'value', unsubscribe);
  }, [user.id]);

  // Buscar candidatos quando área de atuação for definida
  const buscarCandidatos = () => {
    if (!areaAtuacao) return;
    
    setLoading(prev => ({ ...prev, candidatos: true }));
    const candidatosRef = ref(externalDb, `candidatos`);
    const areaQuery = query(candidatosRef, orderByChild('areaAtuacao'), equalTo(areaAtuacao));

    onValue(areaQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const candidatosArray = Object.entries(data).map(([id, cand]) => ({ id, ...cand }));
        setCandidatos(candidatosArray);
      } else {
        setCandidatos([]);
      }
      setLoading(prev => ({ ...prev, candidatos: false }));
    });
  };

  const publicarVaga = async () => {
    setLoading(prev => ({ ...prev, vagas: true }));
    try {
      const vagasRef = ref(externalDb, 'vagas');
      const novaVagaRef = push(vagasRef);
      
      await set(novaVagaRef, {
        ...novaVaga,
        empresa: user.nome,
        empresaId: user.id,
        logoEmpresa: user.logoUrl,
        dataPublicacao: new Date().toISOString(),
        status: 'Ativa'
      });

      setNovaVaga({
        titulo: '',
        descricao: '',
        area: '',
        salario: '',
        localizacao: user.provincia,
        tipo: 'Tempo Integral'
      });
    } catch (error) {
      console.error('Erro ao publicar vaga:', error);
    } finally {
      setLoading(prev => ({ ...prev, vagas: false }));
    }
  };

  const handleContactarCandidato = (candidato) => {
    // Lógica para enviar mensagem/email para o candidato
    console.log('Contatando candidato:', candidato.email);
    setDialogOpen(false);
  };

  const filteredVagas = vagas.filter(vaga =>
    vaga.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vaga.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const areasAtuacao = [
    'TI e Programação', 'Design', 'Marketing', 'Vendas', 
    'Administração', 'Saúde', 'Engenharia', 'Educação'
  ];

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Recrutamento Inteligente
      </Typography>

      {/* Seção de Publicação de Vagas */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Publicar Nova Oportunidade
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Título da Vaga"
              fullWidth
              value={novaVaga.titulo}
              onChange={(e) => setNovaVaga({...novaVaga, titulo: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Área de Atuação"
              select
              fullWidth
              value={novaVaga.area}
              onChange={(e) => setNovaVaga({...novaVaga, area: e.target.value})}
            >
              {areasAtuacao.map(area => (
                <MenuItem key={area} value={area}>{area}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Descrição Completa"
              multiline
              rows={4}
              fullWidth
              value={novaVaga.descricao}
              onChange={(e) => setNovaVaga({...novaVaga, descricao: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Localização"
              fullWidth
              value={novaVaga.localizacao}
              onChange={(e) => setNovaVaga({...novaVaga, localizacao: e.target.value})}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Tipo de Vaga"
              select
              fullWidth
              value={novaVaga.tipo}
              onChange={(e) => setNovaVaga({...novaVaga, tipo: e.target.value})}
            >
              <MenuItem value="Tempo Integral">Tempo Integral</MenuItem>
              <MenuItem value="Meio Período">Meio Período</MenuItem>
              <MenuItem value="Remoto">Remoto</MenuItem>
              <MenuItem value="Freelance">Freelance</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              label="Salário (opcional)"
              fullWidth
              value={novaVaga.salario}
              onChange={(e) => setNovaVaga({...novaVaga, salario: e.target.value})}
            />
          </Grid>
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              onClick={publicarVaga}
              disabled={loading.vagas}
              startIcon={<Work />}
            >
              {loading.vagas ? <CircularProgress size={24} /> : 'Publicar Vaga'}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Seção de Busca de Candidatos */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Encontrar Talentos
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              select
              label="Área de Atuação"
              fullWidth
              value={areaAtuacao}
              onChange={(e) => setAreaAtuacao(e.target.value)}
            >
              {areasAtuacao.map(area => (
                <MenuItem key={area} value={area}>{area}</MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button
              variant="contained"
              onClick={buscarCandidatos}
              disabled={!areaAtuacao || loading.candidatos}
              fullWidth
              sx={{ height: '56px' }}
            >
              {loading.candidatos ? <CircularProgress size={24} /> : 'Buscar Candidatos'}
            </Button>
          </Grid>
        </Grid>

        {candidatos.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              {candidatos.length} candidatos encontrados
            </Typography>
            
            <Grid container spacing={2}>
              {candidatos.map(candidato => (
                <Grid item xs={12} sm={6} md={4} key={candidato.id}>
                  <Card 
                    sx={{ p: 2, cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                    onClick={() => setSelectedCandidato(candidato)}
                  >
                    <Box display="flex" alignItems="center" mb={2}>
                      <Avatar 
                        src={candidato.fotoPerfil} 
                        sx={{ width: 56, height: 56, mr: 2 }}
                      />
                      <Box>
                        <Typography fontWeight="bold">{candidato.nome}</Typography>
                        <Typography variant="body2">{candidato.areaAtuacao}</Typography>
                      </Box>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Chip 
                        icon={<School />} 
                        label={`${candidato.cursos?.length || 0} cursos`} 
                        size="small" 
                      />
                      <Chip 
                        icon={<Star />}
                        label={`${candidato.rating || 0}/10`}
                        color="primary"
                        size="small"
                      />
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Card>

      {/* Seção de Vagas Publicadas */}
      <Card sx={{ p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Minhas Vagas Publicadas
          </Typography>
          <TextField
            placeholder="Buscar vagas..."
            size="small"
            InputProps={{ startAdornment: <Search /> }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Box>

        {loading.vagas ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : filteredVagas.length === 0 ? (
          <Typography sx={{ p: 2, textAlign: 'center' }}>
            Nenhuma vaga publicada
          </Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Área</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Local</TableCell>
                  <TableCell>Candidatos</TableCell>
                  <TableCell>Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredVagas.map(vaga => (
                  <TableRow key={vaga.id}>
                    <TableCell>{vaga.titulo}</TableCell>
                    <TableCell>{vaga.area}</TableCell>
                    <TableCell>
                      <Chip label={vaga.tipo} size="small" />
                    </TableCell>
                    <TableCell>{vaga.localizacao}</TableCell>
                    <TableCell>
                      <Badge badgeContent={vaga.candidatos?.length || 0} color="primary">
                        <People />
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => navigate(`/vagas/${vaga.id}`)}>
                        <Edit />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {/* Dialog de Detalhes do Candidato */}
      <Dialog open={!!selectedCandidato} onClose={() => setSelectedCandidato(null)} maxWidth="md" fullWidth>
        {selectedCandidato && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Perfil do Candidato</Typography>
                <IconButton onClick={() => setSelectedCandidato(null)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Avatar 
                      src={selectedCandidato.fotoPerfil} 
                      sx={{ width: 120, height: 120, mb: 2 }}
                    />
                    <Typography variant="h6">{selectedCandidato.nome}</Typography>
                    <Typography color="textSecondary">{selectedCandidato.areaAtuacao}</Typography>
                    
                    <Box mt={2} width="100%">
                      <Typography variant="subtitle1" gutterBottom>
                        <Box display="flex" alignItems="center">
                          <Star color="primary" sx={{ mr: 1 }} />
                          Avaliação: {selectedCandidato.rating || 'Não avaliado'}
                        </Box>
                      </Typography>
                      
                      <Typography variant="body2">
                        <Phone sx={{ mr: 1, verticalAlign: 'middle' }} />
                        {selectedCandidato.telefone || 'Não informado'}
                      </Typography>
                      
                      <Typography variant="body2">
                        <Email sx={{ mr: 1, verticalAlign: 'middle' }} />
                        {selectedCandidato.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>Formação Acadêmica</Typography>
                  {selectedCandidato.formacao?.map((item, index) => (
                    <Box key={index} mb={2}>
                      <Typography fontWeight="bold">{item.curso}</Typography>
                      <Typography variant="body2">{item.instituicao}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {item.periodo}
                      </Typography>
                    </Box>
                  )) || <Typography>Não informado</Typography>}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>Experiência Profissional</Typography>
                  {selectedCandidato.experiencia?.map((item, index) => (
                    <Box key={index} mb={2}>
                      <Typography fontWeight="bold">{item.cargo}</Typography>
                      <Typography variant="body2">{item.empresa}</Typography>
                      <Typography variant="body2" color="textSecondary">
                        {item.periodo} • {item.duracao}
                      </Typography>
                    </Box>
                  )) || <Typography>Não informado</Typography>}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>Habilidades</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedCandidato.habilidades?.map((habilidade, index) => (
                      <Chip key={index} label={habilidade} />
                    )) || <Typography>Não informado</Typography>}
                  </Box>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button 
                variant="contained" 
                startIcon={<Email />}
                onClick={() => handleContactarCandidato(selectedCandidato)}
              >
                Enviar Proposta
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default RecrutamentoDesk;
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
  MenuItem,
  Autocomplete
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
  const [vagas, setVagas] = useState([]);
  const [candidatos, setCandidatos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [areaBusca, setAreaBusca] = useState('');
  const [loading, setLoading] = useState({ vagas: false, candidatos: false });
  const [selectedCandidato, setSelectedCandidato] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novaVaga, setNovaVaga] = useState({
    titulo: '',
    descricao: '',
    areaAtuacao: '',
    areaFormacao: '',
    salario: '',
    localizacao: user.provincia,
    tipo: 'Tempo Integral'
  });
  const [areasAtuacao, setAreasAtuacao] = useState([]);
  const [areasFormacao, setAreasFormacao] = useState([]);
  const isMobile = useMediaQuery('(max-width:600px)');
  const navigate = useNavigate();

  // Carregar áreas disponíveis
  useEffect(() => {
    const areasRef = ref(externalDb, 'areas');
    onValue(areasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setAreasAtuacao(data.areasDeActuacao || []);
        setAreasFormacao(data.areasDeFormacao || []);
      }
    });

    return () => off(areasRef);
  }, []);

  // Buscar vagas da empresa
  useEffect(() => {
    setLoading(prev => ({ ...prev, vagas: true }));
    const vagasRef = ref(externalDb, 'vagas');
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

  // Buscar candidatos por área
  const buscarCandidatos = () => {
    if (!areaBusca) return;
    
    setLoading(prev => ({ ...prev, candidatos: true }));
    setCandidatos([]);
    
    // Primeiro busca por área de atuação
    const candidatosAtuacaoRef = ref(externalDb, 'candidatos');
    const atuacaoQuery = query(candidatosAtuacaoRef, orderByChild('areasDeActuacao'), equalTo(areaBusca));
    
    // Depois busca por área de formação
    const formacaoQuery = query(candidatosAtuacaoRef, orderByChild('areasDeFormacao'), equalTo(areaBusca));

    const promises = [
      new Promise(resolve => onValue(atuacaoQuery, snapshot => resolve(snapshot.val()))),
      new Promise(resolve => onValue(formacaoQuery, snapshot => resolve(snapshot.val())))
    ];

    Promise.all(promises).then(([atuacaoData, formacaoData]) => {
      const candidatosUnicos = new Map();
      
      // Processa candidatos por área de atuação
      if (atuacaoData) {
        Object.entries(atuacaoData).forEach(([id, cand]) => {
          candidatosUnicos.set(id, { ...cand, matchType: 'Atuação' });
        });
      }
      
      // Processa candidatos por área de formação
      if (formacaoData) {
        Object.entries(formacaoData).forEach(([id, cand]) => {
          if (!candidatosUnicos.has(id)) {
            candidatosUnicos.set(id, { ...cand, matchType: 'Formação' });
          }
        });
      }
      
      setCandidatos(Array.from(candidatosUnicos.values()));
      setLoading(prev => ({ ...prev, candidatos: false }));
    });
  };

  const publicarVaga = async () => {
    if (!novaVaga.titulo || !novaVaga.descricao || (!novaVaga.areaAtuacao && !novaVaga.areaFormacao)) {
      alert('Preencha os campos obrigatórios');
      return;
    }

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
        status: 'Ativa',
        candidatos: []
      });

      setNovaVaga({
        titulo: '',
        descricao: '',
        areaAtuacao: '',
        areaFormacao: '',
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
    // Implemente a lógica de contato aqui
    console.log('Contatando:', candidato.email);
    setDialogOpen(false);
  };

  const filteredVagas = vagas.filter(vaga =>
    vaga.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vaga.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>
        Recrutamento Avançado
      </Typography>

      {/* Seção de Publicação de Vagas */}
      <Card sx={{ p: 3, mb: 3, boxShadow: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Publicar Nova Vaga
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Título da Vaga*"
              fullWidth
              value={novaVaga.titulo}
              onChange={(e) => setNovaVaga({...novaVaga, titulo: e.target.value})}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={areasAtuacao}
              getOptionLabel={(option) => option}
              renderInput={(params) => (
                <TextField {...params} label="Área de Atuação" />
              )}
              value={novaVaga.areaAtuacao}
              onChange={(_, newValue) => setNovaVaga({...novaVaga, areaAtuacao: newValue})}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={areasFormacao}
              getOptionLabel={(option) => option}
              renderInput={(params) => (
                <TextField {...params} label="Área de Formação" />
              )}
              value={novaVaga.areaFormacao}
              onChange={(_, newValue) => setNovaVaga({...novaVaga, areaFormacao: newValue})}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Descrição Completa*"
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
              sx={{ mt: 2 }}
            >
              {loading.vagas ? <CircularProgress size={24} /> : 'Publicar Vaga'}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Seção de Busca de Candidatos */}
      <Card sx={{ p: 3, mb: 3, boxShadow: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
          Encontrar Talentos
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Autocomplete
              options={[...areasAtuacao, ...areasFormacao]}
              getOptionLabel={(option) => option}
              renderInput={(params) => (
                <TextField {...params} label="Buscar por área de atuação ou formação" />
              )}
              value={areaBusca}
              onChange={(_, newValue) => setAreaBusca(newValue)}
              fullWidth
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Button
              variant="contained"
              onClick={buscarCandidatos}
              disabled={!areaBusca || loading.candidatos}
              fullWidth
              sx={{ height: '56px' }}
            >
              {loading.candidatos ? <CircularProgress size={24} /> : 'Buscar Candidatos'}
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
                    onClick={() => setSelectedCandidato(candidato)}
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

      {/* Seção de Vagas Publicadas */}
      <Card sx={{ p: 3, boxShadow: 3 }}>
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
                  <TableRow key={vaga.id} hover>
                    <TableCell>{vaga.titulo}</TableCell>
                    <TableCell>
                      <Box>
                        {vaga.areaAtuacao && <Chip label={vaga.areaAtuacao} size="small" sx={{ mr: 1 }} />}
                        {vaga.areaFormacao && <Chip label={vaga.areaFormacao} size="small" color="info" />}
                      </Box>
                    </TableCell>
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
      <Dialog 
        open={!!selectedCandidato} 
        onClose={() => setSelectedCandidato(null)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        {selectedCandidato && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Perfil Completo</Typography>
                <IconButton onClick={() => setSelectedCandidato(null)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Coluna Esquerda - Informações Pessoais */}
                <Grid item xs={12} md={4}>
                  <Box display="flex" flexDirection="column" alignItems="center">
                    <Avatar 
                      src={selectedCandidato.fotoPerfil} 
                      sx={{ width: 120, height: 120, mb: 2 }}
                    />
                    
                    <Typography variant="h6" align="center">
                      {selectedCandidato.nome}
                    </Typography>
                    
                    <Typography color="textSecondary" align="center" sx={{ mb: 2 }}>
                      {selectedCandidato.profissao || 'Profissional'}
                    </Typography>
                    
                    <Box width="100%" sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        CONTATO
                      </Typography>
                      
                      <Box sx={{ pl: 1 }}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Email sx={{ mr: 1, color: 'text.secondary' }} />
                          {selectedCandidato.email}
                        </Typography>
                        
                        {selectedCandidato.telefone && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                            <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                            {selectedCandidato.telefone}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    
                    <Box width="100%">
                      <Typography variant="subtitle2" gutterBottom>
                        ÁREAS DE ATUAÇÃO
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedCandidato.areasDeActuacao?.map((area, i) => (
                          <Chip key={`atuacao-${i}`} label={area} size="small" />
                        )) || <Typography variant="body2">Não informado</Typography>}
                      </Box>
                    </Box>
                    
                    <Box width="100%" sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        ÁREAS DE FORMAÇÃO
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {selectedCandidato.areasDeFormacao?.map((area, i) => (
                          <Chip key={`formacao-${i}`} label={area} size="small" color="info" />
                        )) || <Typography variant="body2">Não informado</Typography>}
                      </Box>
                    </Box>
                  </Box>
                </Grid>
                
                {/* Coluna Direita - Detalhes Profissionais */}
                <Grid item xs={12} md={8}>
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                      <Star color="primary" sx={{ mr: 1 }} />
                      Avaliação: {selectedCandidato.rating || 'Não avaliado'}
                    </Typography>
                    
                    <Typography variant="body1">
                      {selectedCandidato.resumo || 'Nenhum resumo profissional disponível.'}
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    Experiência Profissional
                  </Typography>
                  
                  {selectedCandidato.experiencia?.length > 0 ? (
                    selectedCandidato.experiencia.map((exp, index) => (
                      <Box key={index} sx={{ mb: 3 }}>
                        <Typography fontWeight="bold">{exp.cargo}</Typography>
                        <Typography variant="body2">{exp.empresa}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {exp.periodo} • {exp.duracao}
                        </Typography>
                        {exp.descricao && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            {exp.descricao}
                          </Typography>
                        )}
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2">Nenhuma experiência registrada</Typography>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    Formação Acadêmica
                  </Typography>
                  
                  {selectedCandidato.formacao?.length > 0 ? (
                    selectedCandidato.formacao.map((form, index) => (
                      <Box key={index} sx={{ mb: 3 }}>
                        <Typography fontWeight="bold">{form.curso}</Typography>
                        <Typography variant="body2">{form.instituicao}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {form.periodo} • {form.status || 'Concluído'}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography variant="body2">Nenhuma formação registrada</Typography>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="h6" gutterBottom>
                    Habilidades e Certificações
                  </Typography>
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {selectedCandidato.habilidades?.map((hab, index) => (
                      <Chip key={index} label={hab} />
                    )) || <Typography variant="body2">Nenhuma habilidade informada</Typography>}
                  </Box>
                  
                  {selectedCandidato.certificacoes?.length > 0 && (
                    <>
                      <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                        Certificações:
                      </Typography>
                      <ul style={{ paddingLeft: 20 }}>
                        {selectedCandidato.certificacoes.map((cert, index) => (
                          <li key={index}>
                            <Typography variant="body2">
                              {cert.nome} - {cert.instituicao} ({cert.ano})
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </Grid>
              </Grid>
            </DialogContent>
            
            <DialogActions sx={{ p: 3 }}>
              <Button 
                variant="contained" 
                startIcon={<Email />}
                onClick={() => handleContactarCandidato(selectedCandidato)}
                sx={{ borderRadius: 2 }}
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
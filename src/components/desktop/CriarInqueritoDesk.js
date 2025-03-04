import React, { useEffect, useState } from 'react';
import { ref, push, onValue } from 'firebase/database';
import { db } from '../../fb';
import { Provincias, SectorDeActividades } from '../../utils/formUtils';
import {
  TextField,
  Button,
  Grid,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  ListItemText,
  Checkbox,
  Paper,
  Box,
} from '@mui/material';
import { Delete, Add } from '@mui/icons-material';

const CriarInqueritoDesk = ({ user }) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoInquerito, setTipoInquerito] = useState('');
  const [perguntas, setPerguntas] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [selectedProvincias, setSelectedProvincias] = useState([]);
  const [selectedSectores, setSelectedSectores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: '' });

  const tiposInqueritos = [
    'Satisfação do Cliente',
    'Pesquisa de Mercado',
    'Avaliação Interna',
    'Outro',
  ];

  useEffect(() => {
    const provinciasRef = ref(db, 'provincias');
    const sectoresRef = ref(db, 'sectores_de_atividade');

    onValue(provinciasRef, (snapshot) => setProvincias(snapshot.val() || []));
    onValue(sectoresRef, (snapshot) => setSectores(snapshot.val() || []));
   
  }, []);

  const adicionarPergunta = (tipo) => {
    setPerguntas([
      ...perguntas,
      { tipo, texto: '', opcoes: tipo === 'multipla_escolha' ? [''] : [] },
    ]);
  };

  const atualizarPergunta = (index, texto) => {
    const novasPerguntas = [...perguntas];
    novasPerguntas[index].texto = texto;
    setPerguntas(novasPerguntas);
  };

  const atualizarOpcao = (indexPergunta, indexOpcao, texto) => {
    const novasPerguntas = [...perguntas];
    novasPerguntas[indexPergunta].opcoes[indexOpcao] = texto;
    setPerguntas(novasPerguntas);
  };

  const adicionarOpcao = (index) => {
    const novasPerguntas = [...perguntas];
    novasPerguntas[index].opcoes.push('');
    setPerguntas(novasPerguntas);
  };

  const removerPergunta = (index) => {
    setPerguntas(perguntas.filter((_, i) => i !== index));
  };

  const removerOpcao = (indexPergunta, indexOpcao) => {
    const novasPerguntas = [...perguntas];
    novasPerguntas[indexPergunta].opcoes = novasPerguntas[indexPergunta].opcoes.filter(
      (_, i) => i !== indexOpcao
    );
    setPerguntas(novasPerguntas);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: '', severity: '' });
  };

  const salvarInquerito = async () => {
    if (
      perguntas.some((p) => !p.texto || (p.tipo === 'multipla_escolha' && p.opcoes.some((o) => !o)))
    ) {
      setSnackbar({
        open: true,
        message: 'Certifique-se de que todas as perguntas e opções estão preenchidas.',
        severity: 'warning',
      });
      return;
    }

    if (!sectores.length || !provincias.length) {
      setSnackbar({
        open: true,
        message: 'Selecione pelo menos um setor e uma província.',
        severity: 'warning',
      });
      return;
    }

    setLoading(true);

    try {
      const inqueritoRef = ref(db, 'surveys');
      const novoInquerito = {
        title: titulo,
        description: descricao,
        provincia: provincias, // Array de províncias
        company: {
          nome: user.nome,
          logo: user.logoUrl,
          provincia: user.provincia,
          id: user.id,
        },
        sectores, // Array de setores
        tipoInquerito,
        questions: perguntas,
        createdAt: Date.now(),
      };

      await push(inqueritoRef, novoInquerito);

      //Notificar empresas do sector/ provincia do inquerito disponivel

      setTitulo('');
      setDescricao('');
      setSectores([]);
      setProvincias([]);
      setTipoInquerito('');
      setPerguntas([]);

      setSnackbar({ open: true, message: 'Inquérito criado com sucesso!', severity: 'success' });
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Erro ao criar inquérito: ' + error.message,
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Criar Novo Inquérito
      </Typography>

      {/* Título */}
      <TextField
        label="Título do Inquérito"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        fullWidth
        variant="outlined"
        margin="normal"
        sx={{ mb: 3 }}
      />

      {/* Descrição */}
      <TextField
        label="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        fullWidth
        variant="outlined"
        margin="normal"
        multiline
        rows={4}
        sx={{ mb: 3 }}
      />

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="provincias-label">Províncias *</InputLabel>
        <Select
          labelId="provincias-label"
          multiple
          value={selectedProvincias}
          onChange={(e) => setSelectedProvincias(e.target.value)}
          renderValue={(selected) => selected.join(', ')}
        >
          {provincias.map((provincia) => (
            <MenuItem key={provincia.provincia} value={provincia.provincia}>
              <Checkbox checked={selectedProvincias.includes(provincia.provincia)} />
              <ListItemText primary={provincia.provincia} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel id="sectores-label">Setores de Atividade *</InputLabel>
        <Select
          labelId="sectores-label"
          multiple
          value={selectedSectores}
          onChange={(e) => setSelectedSectores(e.target.value)}
          renderValue={(selected) => selected.join(', ')}
        >
          {sectores.map((setor) => (
            <MenuItem key={setor.setor} value={setor.setor}>
              <Checkbox checked={selectedSectores.includes(setor.setor)} />
              <ListItemText primary={setor.setor} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Tipo de Inquérito */}
      <FormControl fullWidth variant="outlined" margin="normal" sx={{ mb: 3 }}>
        <InputLabel>Tipo de Inquérito</InputLabel>
        <Select
          value={tipoInquerito}
          onChange={(e) => setTipoInquerito(e.target.value)}
          label="Tipo de Inquérito"
        >
          {tiposInqueritos.map((opcao, index) => (
            <MenuItem key={index} value={opcao}>
              {opcao}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Perguntas */}
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
        Perguntas
      </Typography>
      {perguntas.map((pergunta, index) => (
        <Box key={index} sx={{ border: '1px solid #ddd', p: 2, mb: 3, borderRadius: 1 }}>
          <TextField
            label={`Pergunta ${index + 1}`}
            value={pergunta.texto}
            onChange={(e) => atualizarPergunta(index, e.target.value)}
            fullWidth
            variant="outlined"
            margin="normal"
            sx={{ mb: 2 }}
          />
          {pergunta.tipo === 'multipla_escolha' && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Opções:</Typography>
              {pergunta.opcoes.map((opcao, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <TextField
                    label={`Opção ${i + 1}`}
                    value={opcao}
                    onChange={(e) => atualizarOpcao(index, i, e.target.value)}
                    variant="outlined"
                    fullWidth
                  />
                  <IconButton color="error" onClick={() => removerOpcao(index, i)}>
                    <Delete />
                  </IconButton>
                </Box>
              ))}
              <Button
                onClick={() => adicionarOpcao(index)}
                variant="contained"
                color="primary"
                startIcon={<Add />}
              >
                Adicionar Opção
              </Button>
            </Box>
          )}
          <Button
            variant="outlined"
            color="error"
            onClick={() => removerPergunta(index)}
            sx={{ mt: 2 }}
            startIcon={<Delete />}
          >
            Remover Pergunta
          </Button>
        </Box>
      ))}

      {/* Botões para adicionar perguntas */}
      <Grid container spacing={2} sx={{ mt: 4 }}>
        <Grid item>
          <Button
            onClick={() => adicionarPergunta('aberta')}
            variant="outlined"
            color="secondary"
          >
            Adicionar Pergunta Aberta
          </Button>
        </Grid>
        <Grid item>
          <Button
            onClick={() => adicionarPergunta('multipla_escolha')}
            variant="contained"
            color="primary"
          >
            Adicionar Pergunta de Múltipla Escolha
          </Button>
        </Grid>
      </Grid>

      {/* Botão Salvar */}
      <Button
        onClick={salvarInquerito}
        variant="contained"
        color="success"
        fullWidth
        sx={{ mt: 4 }}
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Salvar Inquérito'}
      </Button>

      {/* Snackbar para mensagens */}
      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default CriarInqueritoDesk;
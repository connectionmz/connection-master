import React, { useState } from 'react';
import { ref, push } from 'firebase/database';
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
} from '@mui/material';

const CriarInqueritoDesk = ({ user }) => {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [setor, setSector] = useState('');
  const [tipoInquerito, setTipoInquerito] = useState('');
  const [perguntas, setPerguntas] = useState([]);
  const [provincias, setProvincias] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: '' });

  const tiposInqueritos = [
    'Satisfação do Cliente',
    'Pesquisa de Mercado',
    'Avaliação Interna',
    'Outro',
  ];

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

  const handleCloseSnackbar = () => {
    setSnackbar({ open: false, message: '', severity: '' });
  };

  const salvarInquerito = async () => {
    if (!titulo || !descricao || !setor || !tipoInquerito || perguntas.length === 0) {
      setSnackbar({ open: true, message: 'Por favor, preencha todos os campos.', severity: 'warning' });
      return;
    }

    setLoading(true);
    try {
      const inqueritoRef = ref(db, 'surveys');
      const novoInquerito = {
        title: titulo,
        description: descricao,
        provincia: provincias,
        company: {
          nome: user.nome,
          logo:user.logoUrl,
          provincia:user.provincia, 
          id:user.id
        },
        setor,
        tipoInquerito,
        questions: perguntas,
        createdAt: Date.now(),
      };

      await push(inqueritoRef, novoInquerito);

      setTitulo('');
      setDescricao('');
      setSector('');
      setTipoInquerito('');
      setPerguntas([]);
      setSnackbar({ open: true, message: 'Inquérito criado com sucesso!', severity: 'success' });
    } catch (error) {
      setSnackbar({ open: true, message: 'Erro ao criar inquérito: ' + error.message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 rounded">
      <Typography variant="h5" gutterBottom>
        Criar Novo Inquérito
      </Typography>
      <TextField
        label="Título do Inquérito"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        fullWidth
        variant="outlined"
        margin="normal"
      />
      <TextField
        label="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        fullWidth
        variant="outlined"
        margin="normal"
        multiline
        rows={4}
      />

      <SectorDeActividades
        companyData={setor}
        handleChange={(e) => setSector(e.target.value)}
        inputStyles="border p-2 w-full mb-4"
      />
      <Provincias
        companyData={provincias}
        handleChange={(e) => setProvincias(e.target.value)}
        inputStyles="border p-2 w-full mb-4"
      />

      <FormControl fullWidth variant="outlined" margin="normal">
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

      <Typography variant="h6" gutterBottom>
        Perguntas
      </Typography>
      {perguntas.map((pergunta, index) => (
        <div key={index} className="border p-2 mb-4 rounded">
          <TextField
            label={`Pergunta ${index + 1}`}
            value={pergunta.texto}
            onChange={(e) => atualizarPergunta(index, e.target.value)}
            fullWidth
            variant="outlined"
            margin="normal"
          />
          {pergunta.tipo === 'multipla_escolha' && (
            <div className="mt-2">
              <Typography variant="subtitle2">Opções:</Typography>
              {pergunta.opcoes.map((opcao, i) => (
                <TextField
                  key={i}
                  label={`Opção ${i + 1}`}
                  value={opcao}
                  onChange={(e) => atualizarOpcao(index, i, e.target.value)}
                  fullWidth
                  variant="outlined"
                  margin="normal"
                />
              ))}
              <Button
                onClick={() => adicionarOpcao(index)}
                variant="contained"
                color="primary"
                className="mt-2"
              >
                Adicionar Opção
              </Button>
            </div>
          )}
        </div>
      ))}

      <Grid container spacing={2} className="mt-4">
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

      <Button
        onClick={salvarInquerito}
        variant="contained"
        color="success"
        fullWidth
        className="mt-4"
        disabled={loading}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : 'Salvar Inquérito'}
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CriarInqueritoDesk;

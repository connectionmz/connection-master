import React, { useState } from 'react';
import { ref, push, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../../fb';
import {
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  Paper,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import { EditorText, SectorDeActividades } from '../../utils/formUtils';
import sendMessage from '../sms/sendMessage';

const NovaCotacao = ({ user }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState([]);
  const [deadline, setDeadline] = useState('');
  const [sector, setSector] = useState('');
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const handleAddItem = () => {
    setItems([...items, { name: '', description: '', imageUrl: '' }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSnackbarMessage('');

    try {
        const cotacaoRef = ref(db, 'cotacoes');
        const newCotacaoRef = push(cotacaoRef);
        const cotacaoId = newCotacaoRef.key;

        const linkDoPedido = `http://appconnectionmozambique.com/cotacao/${cotacaoId}`;

        await set(ref(db, `cotacoes/${cotacaoId}`), {
            title,
            description,
            id: cotacaoId,
            items,
            company: user,
            sector,
            timestamp: new Date().toISOString(),
            datalimite: new Date(deadline).toISOString(),
            status: 'open',
            link: linkDoPedido,
        });

        setSnackbarMessage('Cotação criada com sucesso!');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);

        // Consultar empresas do setor e aplicar critérios
        const empresasRef = ref(db, 'company');
        const setorQuery = query(empresasRef, orderByChild('sector'), equalTo(sector));
        const snapshot = await get(setorQuery);

        if (snapshot.exists()) {
            const empresas = snapshot.val();
            for (const key in empresas) {
              const empresa = empresas[key];
          
              // Validar campos básicos
              if (!empresa || !empresa.activeModules || !empresa.activeModules.moduloSMS) {
                  console.warn(`Dados incompletos para empresa ID: ${key}. Ignorando...`);
                  continue;
              }
          
              // Verificar status do módulo SMS
              const moduleSMS = empresa.activeModules.moduloSMS.status === "active";
              const smsCount = empresa.activeModules.moduloSMS.paymentDetails?.smsCount;
          
              // Adicionar logs para depuração
              console.log(`Empresa ID: ${key}`);
              console.log(`Módulo SMS Ativo: ${moduleSMS}`);
              console.log(`Saldo de SMS: ${smsCount}`);
          
              // Verificar critérios
              if (
                  empresa.provincia !== user.provincia || // Diferente província
                  !moduleSMS ||                          // Módulo SMS inativo
                  (smsCount === undefined || smsCount <= 0) // Sem saldo de SMS
              ) {
                  console.warn(`Empresa ${key} não atende aos critérios. Ignorando...`);
                  continue;
              }
          
              if (!empresa.contacto) {
                  console.warn(`Empresa ${key} não possui contato. Ignorando...`);
                  continue;
              }
          
              // Criar mensagem
              const message = `
                  Nova Cotação para sua Empresa
                  Título: ${title}
                  Descrição: ${description}
                  Data Limite: ${deadline}
                  Setor de Atividade: ${sector}
                  Acesse: ${linkDoPedido}
              `.trim();
          
              const cleanMessage = message.replace(/<\/?[^>]+(>|$)/g, "").replace(/\n/g, " ").replace(/\t/g, " ");
              const contatos = Array.isArray(empresa.contacto) ? empresa.contacto : [empresa.contacto];
          
              try {
                  // Enviar mensagem
                  await sendMessage(contatos, cleanMessage);
          
                  // Atualizar saldo de SMS
                  const updatedSmsCount = smsCount - 1; // Dedução do custo do SMS
                  console.log(`Atualizando saldo para Empresa ID: ${key}, Novo Saldo: ${updatedSmsCount}`);


                  window.location="/cotacoes"
                  await set(ref(db, `company/${key}/activeModules/moduloSMS/paymentDetails/smsCount`), updatedSmsCount);
              } catch (error) {
                  console.error(`Erro ao processar empresa ID: ${key}`, error);
              }
          }
          
          
        } else {
            console.log('Nenhuma empresa encontrada para este setor.');
        }

        // Reset form
        setTitle('');
        setDescription('');
        setItems([]);
        setSector('');
        setDeadline('');
    } catch (error) {
        setSnackbarMessage('Erro ao criar cotação. Tente novamente.');
        setSnackbarSeverity('error');
        setOpenSnackbar(true);
        console.error('Erro ao criar cotação:', error.message);
    } finally {
        setLoading(false);
    }
};


  const handleSectorChange = (e) => {
    setSector(e.target.value);
  };

  const handleSnackbarClose = () => {
    setOpenSnackbar(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Nova Cotação
      </Typography>
      <form onSubmit={handleSubmit}>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
          />
        </Box>
        <Box sx={{ mb: 2 }}>
        <EditorText
                        description={description}
                        setDescription={setDescription}/>
        </Box>
        <Box sx={{ mb: 2 }}>
          <SectorDeActividades 
            companyData={{ sector }} 
            handleChange={handleSectorChange} 
            inputStyles="w-full px-3 py-2 border rounded"
          />
        </Box>
        <Box sx={{ mb: 2 }}>
          <TextField
            label="Data Limite"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            required
          />
        </Box>
        <Typography variant="h6" gutterBottom>
          Itens
        </Typography>
        {items.map((item, index) => (
          <Paper key={index} sx={{ p: 2, mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Nome do Item"
                  value={item.name}
                  onChange={(e) =>
                    handleItemChange(index, 'name', e.target.value)
                  }
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Descrição do Item"
                  value={item.description}
                  onChange={(e) =>
                    handleItemChange(index, 'description', e.target.value)
                  }
                  fullWidth
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <IconButton
                  color="error"
                  onClick={() => handleRemoveItem(index)}
                >
                  <Delete />
                </IconButton>
              </Grid>
            </Grid>
          </Paper>
        ))}
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={handleAddItem}
          sx={{ mb: 2 }}
        >
          Adicionar Item
        </Button>
        <Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? 'Enviando...' : 'Criar Cotação'}
          </Button>
        </Box>
      </form>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NovaCotacao;

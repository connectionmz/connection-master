import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../../fb';
import { 
  Button, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TextField, 
  Dialog, 
  DialogActions, 
  DialogContent, 
  DialogTitle 
} from '@mui/material';
import BackButton from '../BackButton';

const DetalhesPropostaDesk = () => {
  const { id, propostaId } = useParams();
  const [proposta, setProposta] = useState(null);
  const [nota, setNota] = useState('');
  const [confirmAccept, setConfirmAccept] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const propostaRef = ref(db, `cotacoes/${id}/proposals/${propostaId}`);
    
    onValue(propostaRef, (snapshot) => {
      setProposta(snapshot.val());
    });
  }, [id, propostaId]);

  const handleStatusUpdate = (status) => {
    const propostaRef = ref(db, `cotacoes/${id}/proposals/${propostaId}`);
    update(propostaRef, { status });
  };

  const handleNotaChange = (event) => {
    setNota(event.target.value);
  };

  const handleNotaSubmit = () => {
    const propostaRef = ref(db, `cotacoes/${id}/proposals/${propostaId}`);
    update(propostaRef, { nota });
    setNota('');
  };

  const handleAccept = () => {
    setConfirmAccept(true);
  };

  const handleConfirmAccept = () => {
    handleStatusUpdate('Aceite');
    setConfirmAccept(false);
  };

  const handleCancelApproval = () => {
    handleStatusUpdate('Pendente'); 
  };

  if (!proposta) return <Typography>Carregando detalhes da proposta...</Typography>;

  return (
    <Paper sx={{  margin: 'auto', padding: 3 }}>
      <Typography variant="h5" sx={{ marginBottom: 2 }}>
        Detalhes da Proposta
      </Typography>
      
      <Typography variant="h6" sx={{ marginBottom: 1 }}>Empresa: {proposta.from.nome}</Typography>
      <Typography variant="body1" sx={{ marginBottom: 2 }}>Contacto: {proposta.from.contacto}</Typography>
      
      <div
        className="text-gray-600 mb-2"
        dangerouslySetInnerHTML={{ __html: proposta.proposal }}
      />
      {proposta.fileUrl && (
        <Button 
          href={proposta.fileUrl} 
          target="_blank" 
          sx={{ textDecoration: 'underline', color: 'blue' }}>
          Baixar Arquivo
        </Button>
      )}

      <Typography variant="body2" sx={{ color: 'gray', marginTop: 2 }}>
        Status: {proposta.status || 'Pendente'}
      </Typography>

      <div sx={{ marginTop: 4 }}>
        <Typography variant="h6">Produtos/Serviços:</Typography>
        {proposta.selectedProducts && proposta.selectedProducts.length > 0 ? (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Preço (MT)</TableCell>
                  <TableCell>Ação</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {proposta.selectedProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>{product.price}</TableCell>
                    <TableCell>
                      <Button 
                        href={product.url} 
                        target="_blank" 
                        sx={{ textDecoration: 'underline', color: 'blue' }}>
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body2" sx={{ color: 'gray' }}>
            Nenhum produto selecionado.
          </Typography>
        )}
      </div>

      <div sx={{ marginTop: 4 }}>
        {proposta.status === 'Aceite' ? (
          <Button
            onClick={handleCancelApproval}
            variant="contained"
            color="warning"
            sx={{ marginRight: 2 }}
          >
            Cancelar Aprovação
          </Button>
        ) : (
          <Button
            onClick={handleAccept}
            variant="contained"
            color="success"
            sx={{ marginRight: 2 }}
          >
            Aprovar
          </Button>
        )}
        <Button
          onClick={() => handleStatusUpdate('Recusada')}
          variant="contained"
          color="error"
        >
          Recusar
        </Button>
      </div>

      <Dialog open={confirmAccept} onClose={() => setConfirmAccept(false)}>
        <DialogTitle>Confirmação</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja aceitar esta proposta?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmAccept} color="success">Sim</Button>
          <Button onClick={() => setConfirmAccept(false)} color="error">Não</Button>
        </DialogActions>
      </Dialog>

      <div sx={{ marginTop: 4 }}>
        <TextField
          value={nota}
          onChange={handleNotaChange}
          label="Adicionar uma nota"
          multiline
          rows={4}
          fullWidth
          variant="outlined"
          sx={{ marginBottom: 2 }}
        />
        <Button
          onClick={handleNotaSubmit}
          variant="contained"
          color="primary"
        >
          Enviar Nota
        </Button>
      </div>
      <BackButton sx={{ mb: 2 }} />
    </Paper>
  );
};

export default DetalhesPropostaDesk;

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ref, onValue } from 'firebase/database';
import { db } from '../../fb';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Typography, Paper } from '@mui/material';
import BackButton from '../BackButton';

const PropostasDesk = () => {
  const { id } = useParams();
  const [propostas, setPropostas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const propostasRef = ref(db, `cotacoes/${id}/proposals`);
    
    onValue(propostasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const propostasArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          ...value,
        }));
        setPropostas(propostasArray);
      } else {
        setPropostas([]);
      }
    });
  }, [id]);

  const handlePropostaClick = (propostaId) => {
    navigate(`/cotacao/${id}/proposta/${propostaId}`);
  };

  const handleEmpresaClick = (empresaId) => {
    navigate(`/perfil/${empresaId}`);
  };

  return (
    <Paper sx={{ width: '100%', margin: 'auto', padding: 3, boxShadow: 3, borderRadius: 2 }}>
      <BackButton sx={{ mb: 2 }} />

      <Typography variant="h5" component="h1" sx={{ marginBottom: 3, fontWeight: 'bold', color: 'primary.main' }}>
        Propostas Recebidas
      </Typography>

      {propostas.length > 0 ? (
        <TableContainer component={Paper} sx={{ boxShadow: 2, borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="left" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>Empresa</TableCell>
                <TableCell align="left" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>Status</TableCell>
                <TableCell align="left" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>#</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {propostas.map((proposta) => (
                <TableRow 
                  key={proposta.id} 
                  hover 
                  onClick={() => handlePropostaClick(proposta.id)}
                  sx={{ cursor: 'pointer'}}
                >
                  <TableCell component="th" scope="row" onClick={(e) => { e.stopPropagation(); handleEmpresaClick(proposta.from.id); }}>
                    <Typography variant="body2" color="text.secondary" sx={{ cursor: 'pointer', textDecoration: 'underline' }}>
                      {proposta.from.nome}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={proposta.status === 'wait' ? 'warning.main' : 'text.primary'}>
                      {proposta.status === 'wait' ? 'Aguardar' : proposta.status || 'Pendente'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="primary" variant="body2" sx={{ textDecoration: 'underline' }}>
                      Abrir
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Typography sx={{ color: 'gray', marginTop: 2 }}>Nenhuma proposta recebida.</Typography>
      )}
    </Paper>
  );
};

export default PropostasDesk;

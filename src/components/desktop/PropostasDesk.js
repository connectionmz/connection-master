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

  return (
    <Paper sx={{ maxWidth: 900, margin: 'auto', padding: 3 }}>
      <Typography variant="h5" component="h1" sx={{ marginBottom: 2 }}>
        Propostas Recebidas
      </Typography>

      {propostas.length > 0 ? (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell align="left">Empresa</TableCell>
                <TableCell align="left">Status</TableCell>
                <TableCell align="left">#</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {propostas.map((proposta) => (
                <TableRow 
                  key={proposta.id} 
                  hover 
                  onClick={() => handlePropostaClick(proposta.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell component="th" scope="row">
                    <small>{proposta.from.nome}</small>
                  </TableCell>
                  <TableCell>{proposta.status || 'Pendente'}</TableCell>
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

<BackButton sx={{ mb: 2 }} />

    </Paper>
  );
};

export default PropostasDesk;

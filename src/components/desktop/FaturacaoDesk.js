import React, { useEffect, useState } from 'react';
import { ref, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import {
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Button,
  Paper,
  Typography,
} from '@mui/material';
import { db } from '../../fb';

const FaturacaoDesk = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [proformas, setProformas] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;



    const fetchInvoices = async () => {
      try {
        const invoicesRef = ref(db, `invoices/${user.id}`);
        const snapshot = await get(invoicesRef);
        if (snapshot.exists()) {
          setProformas(Object.values(snapshot.val()));
        } else {
          setProformas([]);
        }
      } catch (err) {
        setError('Erro ao carregar proformas.');
      }
    };

    fetchInvoices();
  }, [user]);

  const filteredProformas = proformas.filter((proforma) =>
    proforma.cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProformaClick = (proforma) => {
    navigate(`/proforma/${proforma.numeroProforma}`);
  };

  return (
    <div className="p-4">
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Gerenciamento de Proformas
        </Typography>
        <div className="flex items-center justify-between mb-4">
          <TextField
            label="Pesquisar proformas"
            variant="outlined"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mr: 2 }}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/proforma')}
          >
            Emitir Proforma
          </Button>
        </div>
      </Paper>

      {error && (
        <Typography color="error" gutterBottom>
          {error}
        </Typography>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center">Nr</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell align="center">Emitido</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProformas.length > 0 ? (
              filteredProformas.map((proforma, index) => (
                <TableRow
                  key={index}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleProformaClick(proforma)}
                >
                  <TableCell align="center">{proforma.numeroProforma}</TableCell>
                  <TableCell>{proforma.cliente || 'Indefinido'}</TableCell>
                  <TableCell align="center">{proforma.dataEmissao}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  Nenhuma proforma encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default FaturacaoDesk;

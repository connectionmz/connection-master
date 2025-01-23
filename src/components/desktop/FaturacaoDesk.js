import React, { useEffect, useState } from 'react';
import { ref, get, remove } from 'firebase/database';
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
  Menu,
  MenuItem,
  IconButton,
  Box,
  Tooltip,
} from '@mui/material';
import { db } from '../../fb';
import BackButton from '../BackButton';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const FaturacaoDesk = ({ user }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [proformas, setProformas] = useState([]);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProforma, setSelectedProforma] = useState(null);
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

  const handleMenuClick = (event, proforma) => {
    setAnchorEl(event.currentTarget);
    setSelectedProforma(proforma);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedProforma(null);
  };

  const handleProformaClick = (proforma) => {
    navigate(`/proforma/${proforma.numeroProforma}`);
  };

  const handleShare = () => {
    alert(`Compartilhar a proforma ${selectedProforma.numeroProforma}`);
    handleCloseMenu();
  };

  const handleEdit = () => {
    navigate(`/edit-proforma/${selectedProforma.numeroProforma}`);
    handleCloseMenu();
  };

  const handleDelete = async () => {
    if (window.confirm('Tem certeza de que deseja excluir esta proforma?')) {
      try {
        const proformaRef = ref(db, `invoices/${user.id}/${selectedProforma.numeroProforma}`);
        await remove(proformaRef);
        setProformas(proformas.filter((p) => p.numeroProforma !== selectedProforma.numeroProforma));
        alert('Proforma excluída com sucesso!');
      } catch (error) {
        alert('Erro ao excluir a proforma.');
      }
      handleCloseMenu();
    }
  };

  return (
    <Box width="100%" minHeight="100vh" p={3}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <BackButton sx={{ mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Gerenciamento de Proformas
        </Typography>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
        </Box>
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
              <TableCell align="center">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProformas.length > 0 ? (
              filteredProformas.map((proforma, index) => (
                <TableRow key={index} hover>
                  <TableCell align="center">{proforma.numeroProforma}</TableCell>
                  <TableCell>{proforma.cliente || 'Indefinido'}</TableCell>
                  <TableCell align="center">{proforma.dataEmissao}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="Opções">
                      <IconButton
                        aria-controls="simple-menu"
                        aria-haspopup="true"
                        onClick={(event) => handleMenuClick(event, proforma)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Menu
                      anchorEl={anchorEl}
                      keepMounted
                      open={Boolean(anchorEl)}
                      onClose={handleCloseMenu}
                    >
                      <MenuItem onClick={handleShare}>Compartilhar</MenuItem>
                      <MenuItem onClick={handleEdit}>Editar</MenuItem>
                      <MenuItem onClick={handleDelete}>Excluir</MenuItem>
                    </Menu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  Nenhuma proforma encontrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FaturacaoDesk;

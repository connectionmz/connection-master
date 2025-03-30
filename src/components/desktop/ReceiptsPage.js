import React, { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { db } from '../../fb';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  Dialog,
  DialogContent,
  DialogActions,
  useMediaQuery,
  LinearProgress,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Search,
  FilterList,
  Print,
  ArrowBack,
  PictureAsPdf,
  Download,
  DateRange,
  Add
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { Document, Page, PDFDownloadLink, StyleSheet, Text, View } from '@react-pdf/renderer';


const ReceiptsPage = ({ user }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  useEffect(() => {
    const receiptsRef = ref(db, `subscriptions/${user.id}`);
    
    const fetchData = onValue(receiptsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Processar a estrutura aninhada de recibos
        const allReceipts = [];
        
        // Ignorar objetos com status "active" e processar anos/meses
        Object.keys(data).forEach(year => {
          if (year !== "status" && typeof data[year] === 'object') {
            Object.keys(data[year]).forEach(month => {
              if (typeof data[year][month] === 'object') {
                Object.keys(data[year][month]).forEach(receiptId => {
                  const receipt = data[year][month][receiptId];
                  // Ignorar objetos que não são recibos (como status)
                  if (receipt && typeof receipt === 'object' && receipt.paidAt) {
                    allReceipts.push({
                      id: receiptId,
                      receiptNumber: receiptId,
                      ...receipt,
                      issuedDate: receipt.paidAt,
                      clientName: receipt.userName,
                      status: 'paid' // Todos os pagamentos na estrutura são considerados pagos
                    });
                  }
                });
              }
            });
          }
        });

        // Ordenar por data mais recente primeiro
        allReceipts.sort((a, b) => new Date(b.issuedDate) - new Date(a.issuedDate));
        setReceipts(allReceipts);
      } else {
        setReceipts([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching receipts:', error);
      setLoading(false);
    });

    return () => off(receiptsRef, 'value', fetchData);
  }, [user.id]);

  const filteredReceipts = receipts.filter(receipt => {
    // Filtro por termo de busca
    const matchesSearch = 
      receipt.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.receiptNumber?.toString().includes(searchTerm) ||
      receipt.amount?.toString().includes(searchTerm);

    // Filtro por status (todos são considerados pagos na estrutura fornecida)
    const matchesStatus = filterStatus === 'all' || filterStatus === 'paid';

    // Filtro por data
    const receiptDate = new Date(receipt.issuedDate);
    const matchesDate = 
      (!startDate || receiptDate >= new Date(startDate)) && 
      (!endDate || receiptDate <= new Date(endDate));

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handlePrint = (receipt) => {
    setSelectedReceipt(receipt);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-MZ', {
      style: 'currency',
      currency: 'MZN'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    // Formato: "04 Mar 2025 12:34"
    const months = [
      'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
      'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
    ];
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    return `${day} ${month} ${year} ${hours}:${minutes}`;
  };

  const getStatusChip = () => {
    return <Chip label="Pago" color="success" size="small" />;
  };
  
  // Estilos para o PDF
  const styles = StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: '#FFFFFF',
      padding: 20,
      fontFamily: 'Helvetica'
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 20,
      borderBottom: '1px solid #000',
      paddingBottom: 10
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      textAlign: 'center',
      marginVertical: 10
    },
    section: {
      marginVertical: 10
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginVertical: 5
    },
    label: {
      fontWeight: 'bold',
      width: '30%'
    },
    value: {
      width: '70%'
    },
    total: {
      fontSize: 14,
      fontWeight: 'bold',
      marginTop: 10,
      textAlign: 'right'
    },
    signatures: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 50
    },
    signatureLine: {
      width: '40%',
      borderTop: '1px solid #000',
      textAlign: 'center',
      paddingTop: 5
    },
    logo: {
      width: 100,
      height: 50,
      marginBottom: 10
    }
  });

  // Componente PDF
  const ReceiptPDF = ({ receipt, user }) => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{user.nome || 'Nome da Empresa'}</Text>
            <Text style={{ fontSize: 12 }}>{user.sector || 'Setor de Atividade'}</Text>
            <Text style={{ fontSize: 12 }}>{user.provincia || 'Localização'}</Text>
            <Text style={{ fontSize: 12 }}>NIF: {user.nif || 'N/A'}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>RECIBO DE PAGAMENTO</Text>
            <Text style={{ fontSize: 12 }}>Nº: {receipt.id.substring(0, 8)}</Text>
            <Text style={{ fontSize: 12 }}>Data: {formatDate(receipt.issuedDate)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Recebi de:</Text>
            <Text style={styles.value}>{receipt.clientName || 'Cliente Anônimo'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>NUIT:</Text>
            <Text style={styles.value}>{receipt.clientNif || 'N/A'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contacto:</Text>
            <Text style={styles.value}>{receipt.clientContact || 'N/A'}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Referente a:</Text>
          <Text>{receipt.description || `Pagamento pelo serviço: ${receipt.moduleKey?.replace('modulo', '').replace(/([A-Z])/g, ' $1').trim()}`}</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Método de Pagamento:</Text>
            <Text style={styles.value}>{receipt.method}</Text>
          </View>
        </View>

        <View style={styles.total}>
          <Text>Total: {formatCurrency(receipt.amount)}</Text>
        </View>

        <View style={styles.signatures}>
          <View style={styles.signatureLine}>
            <Text>Assinatura do Emitente</Text>
          </View>
          <View style={styles.signatureLine}>
            <Text>Assinatura do Cliente</Text>
          </View>
        </View>

        <View style={{ marginTop: 20, fontSize: 10, textAlign: 'center' }}>
          <Text>Este documento serve como comprovativo de pagamento</Text>
          <Text>Emitido eletronicamente - válido sem assinatura</Text>
        </View>
      </Page>
    </Document>
  );

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 4 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: isMobile ? 1 : 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Histórico de Pagamentos
        </Typography>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => navigate('/payment')}
          startIcon={<Add />}
          size={isMobile ? 'small' : 'medium'}
        >
          Novo Pagamento
        </Button>
      </Box>

      {/* Filtros e Busca */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />

          <Select
            size="small"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            startAdornment={
              <InputAdornment position="start">
                <FilterList fontSize="small" />
              </InputAdornment>
            }
            sx={{ minWidth: 180 }}
            disabled // Todos são pagos na estrutura fornecida
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="paid">Pago</MenuItem>
          </Select>

          <TextField
            size="small"
            type="date"
            label="De"
            InputLabelProps={{ shrink: true }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <DateRange fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            size="small"
            type="date"
            label="Até"
            InputLabelProps={{ shrink: true }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Box>
      </Card>

      {/* Lista de Recibos */}
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>Módulo</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Valor</TableCell>
                <TableCell>Método</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReceipts.length > 0 ? (
                filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id} hover>
                    <TableCell>#{receipt.id.substring(0, 8)}</TableCell>
                    <TableCell>
                      {receipt.moduleKey?.replace('modulo', '').replace(/([A-Z])/g, ' $1').trim()}
                    </TableCell>
                    <TableCell>{formatDate(receipt.issuedDate)}</TableCell>
                    <TableCell>{formatCurrency(receipt.amount)}</TableCell>
                    <TableCell>{receipt.method}</TableCell>
                    <TableCell>
                      {getStatusChip()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Imprimir">
                        <IconButton onClick={() => handlePrint(receipt)} size="small">
                          <Print fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" sx={{ py: 3 }}>
                      {receipts.length === 0 ? 'Nenhum pagamento encontrado' : 'Nenhum pagamento corresponde aos filtros'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Modal de Visualização/Impressão */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          {selectedReceipt && (
            <Box sx={{ p: 3 }} id="receipt-to-print">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h5">Recibo #{selectedReceipt.id.substring(0, 8)}</Typography>
                              <Box>
                <PDFDownloadLink 
                    document={<ReceiptPDF receipt={selectedReceipt} user={user} />} 
                    fileName={`recibo_${selectedReceipt.id.substring(0, 8)}.pdf`}
                  >
                    {({ loading }) => (
                      <Button
                        variant="outlined"
                        startIcon={<Download />}
                        disabled={loading}
                        sx={{ mr: 1 }}
                        size="small"
                      >
                        {loading ? 'Preparando...' : 'Baixar PDF'}
                      </Button>
                    )}
                  </PDFDownloadLink>
                  <Button
                    variant="outlined"
                    startIcon={<Print />}
                    onClick={() => window.print()}
                    sx={{ mr: 1 }}
                    size="small"
                  >
                    Imprimir
                  </Button>
                </Box>
              </Box>

              {/* Template do Recibo */}
              <Card sx={{ p: 3, border: '1px solid #ddd', maxWidth: 800, margin: '0 auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                  <Box>
                    <Typography variant="h6">{user.nome || 'Nome da Empresa'}</Typography>
                    <Typography variant="body2">{user.sector || 'Setor de Atividade'}</Typography>
                    <Typography variant="body2">{user.provincia || 'Localização'}</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h6">COMPROVANTE</Typography>
                    <Typography variant="body2">
                      Data: {formatDate(selectedReceipt.issuedDate)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Cliente: {selectedReceipt.clientName || 'Cliente Anônimo'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Detalhes do Pagamento:
                  </Typography>
                  <Typography variant="body1">
                    Módulo: {selectedReceipt.moduleKey?.replace('modulo', '').replace(/([A-Z])/g, ' $1').trim()}
                  </Typography>
                  <Typography variant="body1">
                    Método: {selectedReceipt.method}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
                  <Typography variant="h6">
                    Total: {formatCurrency(selectedReceipt.amount)}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6, pt: 2 }}>
                  <Box sx={{ textAlign: 'center', width: '200px', borderTop: '1px solid #000' }}>
                    <Typography variant="body2">Assinatura do Emitente</Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center', width: '200px', borderTop: '1px solid #000' }}>
                    <Typography variant="body2">Assinatura do Cliente</Typography>
                  </Box>
                </Box>
              </Card>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<ArrowBack />}>
            Voltar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReceiptsPage;
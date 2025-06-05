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
  Chip,
  Avatar,
  DialogTitle
} from '@mui/material';
import {
  Search,
  FilterList,
  Print,
  ArrowBack,
  PictureAsPdf,
  Download,
  DateRange,
  Add,
  Image,
  Receipt
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { Document, Page, PDFDownloadLink, StyleSheet, Text, View } from '@react-pdf/renderer';

const ReceiptsPage = ({ user }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  useEffect(() => {
    const paymentsRef = ref(db, 'payments');
    
    const fetchData = onValue(paymentsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const allReceipts = [];
        
        Object.keys(data).forEach(paymentId => {
          const payment = data[paymentId];
          if (payment.userId === user.id) {
            allReceipts.push({
              id: paymentId,
              ...payment,
              issuedDate: payment.timestamp || payment.paidAt,
              clientName: payment.userName || user.displayName,
              status: payment.status || 'pending',
              type: payment.comprovativoUrl ? 'comprovativo' : 'digital'
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

    return () => off(paymentsRef, 'value', fetchData);
  }, [user.id]);

  const filteredReceipts = receipts.filter(receipt => {
    // Filtro por termo de busca
    const matchesSearch = 
      receipt.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.id?.toString().includes(searchTerm) ||
      receipt.moduleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.amount?.toString().includes(searchTerm);

    // Filtro por status
    const matchesStatus = filterStatus === 'all' || receipt.status === filterStatus;
    
    // Filtro por tipo
    const matchesType = filterType === 'all' || receipt.type === filterType;

    // Filtro por data
    const receiptDate = new Date(receipt.issuedDate);
    const matchesDate = 
      (!startDate || receiptDate >= new Date(startDate)) && 
      (!endDate || receiptDate <= new Date(endDate));

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  const handleViewReceipt = (receipt) => {
    setSelectedReceipt(receipt);
    if (receipt.comprovativoUrl) {
      setOpenImageDialog(true);
    } else {
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setOpenImageDialog(false);
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

    const options = { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Intl.DateTimeFormat('pt-MZ', options).format(date);
  };

  const getStatusChip = (status) => {
    switch(status) {
      case 'aprovado':
        return <Chip label="Aprovado" color="success" size="small" />;
      case 'pendente':
        return <Chip label="Pendente" color="warning" size="small" />;
      case 'recusado':
        return <Chip label="Recusado" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const getTypeIcon = (type) => {
    return type === 'comprovativo' ? 
      <Image color="primary" /> : 
      <Receipt color="secondary" />;
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
    }
  });

  // Componente PDF
  const ReceiptPDF = ({ receipt, user }) => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={{ fontSize: 14, fontWeight: 'bold' }}>{user.nome || 'CONNECTION MOZAMBIQUE, LDA'}</Text>
          <Text style={{ fontSize: 12 }}>Número NUIT: {user.nif || 'N/A'}</Text>
          <Text style={{ fontSize: 12 }}>{user.provincia || 'CABO DELGADO - PEMBA'}</Text>
          <Text style={{ fontSize: 12 }}>{user.email || 'connectionmozambique@gmail.com'}</Text>
        </View>
        
        <View style={styles.title}>
          <Text>RECIBO DE PAGAMENTO</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Número:</Text>
            <Text style={styles.value}>{receipt.id.substring(0, 8)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Data:</Text>
            <Text style={styles.value}>{formatDate(receipt.issuedDate)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ marginBottom: 5 }}>Recebemos de:</Text>
          <Text style={{ fontWeight: 'bold' }}>{receipt.clientName || 'Cliente Particular'}</Text>
          <Text>Contacto: {receipt.telefone || receipt.contactoOpcional || 'N/A'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={{ marginBottom: 5 }}>Detalhes do Pagamento:</Text>
          <Text>Módulo: {receipt.moduleName || 'N/A'}</Text>
          <Text>Referência: {receipt.referencia || 'N/A'}</Text>
          <Text>Método: {receipt.method || 'Transferência Bancária'}</Text>
        </View>

        <View style={styles.total}>
          <Text>Total Pago: {formatCurrency(receipt.amount)}</Text>
        </View>

        <View style={styles.signatures}>
          <View style={styles.signatureLine}>
            <Text>Assinatura do Emitente</Text>
          </View>
          <View style={styles.signatureLine}>
            <Text>Assinatura do Cliente</Text>
          </View>
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
          Comprovativos de Pagamento
        </Typography>
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
          >
            <MenuItem value="all">Todos</MenuItem>
            <MenuItem value="aprovado">Aprovados</MenuItem>
            <MenuItem value="pendente">Pendentes</MenuItem>
            <MenuItem value="recusado">Recusados</MenuItem>
          </Select>

          <Select
            size="small"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">Todos Tipos</MenuItem>
            <MenuItem value="comprovativo">Com Imagem</MenuItem>
            <MenuItem value="digital">Digitais</MenuItem>
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
      <Card>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Módulo</TableCell>
                <TableCell>Data</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Comprovativo</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReceipts.length > 0 ? (
                filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id} hover>
                    <TableCell>{receipt.moduleName}</TableCell>
                    <TableCell>{formatDate(receipt.issuedDate)}</TableCell>
                    <TableCell>{getStatusChip(receipt.status)}</TableCell>
                    <TableCell>
                      {receipt.comprovativoUrl ? (
                        <Button 
                          size="small" 
                          onClick={() => handleViewReceipt(receipt)}
                          startIcon={<Image />}
                        >
                          Visualizar
                        </Button>
                      ) : (
                        <Typography variant="body2">N/A</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Ver detalhes">
                        <IconButton onClick={() => handleViewReceipt(receipt)} size="small">
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
                      {receipts.length === 0 ? 'Nenhum comprovativo encontrado' : 'Nenhum comprovativo corresponde aos filtros'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Modal de Visualização de Comprovativo Digital */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Detalhes do Pagamento</DialogTitle>
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
                    <Typography variant="h6">COMPROVANTE DE PAGAMENTO</Typography>
                    <Typography variant="body2">
                      Data: {formatDate(selectedReceipt.issuedDate)}
                    </Typography>
                    <Typography variant="body2">
                      Estado: {getStatusChip(selectedReceipt.status)}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Cliente: {selectedReceipt.clientName || 'Cliente Anônimo'}
                  </Typography>
                  <Typography variant="body2">
                    Contacto: {selectedReceipt.telefone || selectedReceipt.contactoOpcional || 'N/A'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 4 }}>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    Detalhes do Pagamento:
                  </Typography>
                  <Typography variant="body1">
                    Módulo: {selectedReceipt.moduleName}
                  </Typography>
                  <Typography variant="body1">
                    Referência: {selectedReceipt.referencia || 'N/A'}
                  </Typography>
                  <Typography variant="body1">
                    Método: {selectedReceipt.method || 'Transferência Bancária'}
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

      {/* Modal de Visualização de Imagem do Comprovativo */}
      <Dialog
        open={openImageDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Comprovativo de Pagamento</DialogTitle>
        <DialogContent>
          {selectedReceipt && (
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Módulo: {selectedReceipt.moduleName}
              </Typography>
              <Typography variant="body1" gutterBottom>
                Valor: {formatCurrency(selectedReceipt.amount)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Data: {formatDate(selectedReceipt.issuedDate)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                Estado: {getStatusChip(selectedReceipt.status)}
              </Typography>
              
              <Box sx={{ mt: 3, mb: 2 }}>
                <img 
                  src={selectedReceipt.comprovativoUrl} 
                  alt="Comprovativo de pagamento" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '70vh',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }} 
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<Download />}
                  href={selectedReceipt.comprovativoUrl}
                  download={`comprovativo_${selectedReceipt.id.substring(0, 8)}.jpg`}
                >
                  Baixar Imagem
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Print />}
                  onClick={() => {
                    const win = window.open('', '_blank');
                    win.document.write(`
                      <html>
                        <head>
                          <title>Comprovativo ${selectedReceipt.id.substring(0, 8)}</title>
                          <style>
                            body { text-align: center; padding: 20px; }
                            img { max-width: 100%; height: auto; }
                          </style>
                        </head>
                        <body>
                          <h3>Comprovativo de Pagamento</h3>
                          <p>Módulo: ${selectedReceipt.moduleName}</p>
                          <p>Valor: ${formatCurrency(selectedReceipt.amount)}</p>
                          <img src="${selectedReceipt.comprovativoUrl}" />
                          <script>
                            window.onload = function() {
                              setTimeout(function() {
                                window.print();
                              }, 500);
                            }
                          </script>
                        </body>
                      </html>
                    `);
                    win.document.close();
                  }}
                >
                  Imprimir
                </Button>
              </Box>
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
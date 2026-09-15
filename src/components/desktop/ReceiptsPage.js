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
  DialogTitle,
  Divider
} from '@mui/material';
import Search from '@mui/icons-material/Search';
import FilterList from '@mui/icons-material/FilterList';
import Print from '@mui/icons-material/Print';
import ArrowBack from '@mui/icons-material/ArrowBack';
import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import Download from '@mui/icons-material/Download';
import DateRange from '@mui/icons-material/DateRange';
import Add from '@mui/icons-material/Add';
import Image from '@mui/icons-material/Image';
import Receipt from '@mui/icons-material/Receipt';
import Event from '@mui/icons-material/Event';
import CalendarToday from '@mui/icons-material/CalendarToday';
import { useTheme } from '@mui/material/styles';
import { Document, Page, PDFDownloadLink, StyleSheet, Text, View } from '@react-pdf/renderer';

const ReceiptsPage = ({ user }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSubscription, setFilterSubscription] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
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
            // Adaptação para a estrutura de dados fornecida
            allReceipts.push({
              id: paymentId,
              ...payment,
              issuedDate: payment.timestamp || payment.updatedAt,
              clientName: payment.userName || payment.nome || user.displayName,
              status: payment.status || 'pendente',
              type: 'digital', // Todos os exemplos são digitais
              subscriptionType: payment.subscription?.subscriptionType || 'N/A',
              moduleName: payment.moduleName,
              amount: payment.amount,
              telefone: payment.telefone,
              mpesaResponse: payment.mpesaResponse
            });
          }
        });
        
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
    const matchesSearch = 
      receipt.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.id?.toString().includes(searchTerm) ||
      receipt.moduleName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.amount?.toString().includes(searchTerm);

    const matchesStatus = filterStatus === 'all' || receipt.status === filterStatus;
    const matchesSubscription = filterSubscription === 'all' || 
      (receipt.subscription?.subscriptionType === filterSubscription);
    
    const receiptDate = new Date(receipt.issuedDate);
    const matchesDate = 
      (!startDate || receiptDate >= new Date(startDate)) && 
      (!endDate || receiptDate <= new Date(endDate));

    return matchesSearch && matchesStatus && matchesSubscription && matchesDate;
  });

  const handleViewReceipt = (receipt) => {
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

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = new Date(Number(timestamp));
    if (isNaN(date.getTime())) return 'Data inválida';

    const options = { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Intl.DateTimeFormat('pt-MZ', options).format(date);
  };

  const formatDateShort = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = new Date(Number(timestamp));
    if (isNaN(date.getTime())) return 'Data inválida';

    const options = { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric'
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

  const getSubscriptionInfo = (receipt) => {
    if (!receipt.subscription) return null;
    
    const startDate = formatDateShort(receipt.subscription.start);
    const endDate = formatDateShort(receipt.subscription.end);
    
    return (
      <Box sx={{ mt: 1 }}>
        <Typography variant="body2">
          <strong>Tipo:</strong> {receipt.subscription.subscriptionType}
        </Typography>
        <Typography variant="body2">
          <strong>Duração:</strong> {receipt.subscription.durationDays} dias
        </Typography>
        <Typography variant="body2">
          <strong>Período:</strong> {startDate} - {endDate}
        </Typography>
        <Typography variant="body2">
          <strong>Status:</strong> {receipt.subscription.isActive ? 'Ativo' : 'Inativo'}
        </Typography>
      </Box>
    );
  };

  const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 0,
    fontFamily: 'Helvetica'
  },
  header: {
    backgroundColor: '#d32f2f', // Vermelho escuro
    color: 'white',
    padding: 20,
    alignItems: 'center',
    marginBottom: 20
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10
  },
  headerInfoItem: {
    fontSize: 10,
    textAlign: 'center',
    flex: 1
  },
  titleContainer: {
    borderBottom: '2px solid #d32f2f',
    paddingBottom: 10,
    marginBottom: 20,
    alignItems: 'center'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f'
  },
  subtitle: {
    fontSize: 12,
    color: '#666'
  },
  content: {
    padding: 20
  },
  section: {
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 5,
    borderBottom: '1px solid #eee',
    paddingBottom: 3
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    fontSize: 10
  },
  label: {
    fontWeight: 'bold',
    width: '40%',
    color: '#333'
  },
  value: {
    width: '60%',
    color: '#000'
  },
  totalContainer: {
    marginTop: 20,
    paddingTop: 10,
    borderTop: '2px solid #d32f2f',
    alignItems: 'flex-end'
  },
  totalText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d32f2f'
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    paddingHorizontal: 20
  },
  mpesaInfo: {
    marginTop: 10,
    padding: 10,
    border: '1px solid #ddd',
    borderRadius: 4,
    backgroundColor: '#f9f9f9'
  },
  signatureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingTop: 10,
    borderTop: '1px solid #ddd'
  },
  signatureBox: {
    width: '45%',
    alignItems: 'center'
  },
  signatureLine: {
    width: '80%',
    borderTop: '1px solid #000',
    marginTop: 30,
    textAlign: 'center',
    paddingTop: 5,
    fontSize: 10
  }
});

const ReceiptPDF = ({ receipt }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>CONNECTION MOZAMBIQUE</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.headerInfoItem}>NUIT: 401234567</Text>
          <Text style={styles.headerInfoItem}>Tel: +258 87 123 4567</Text>
          <Text style={styles.headerInfoItem}>Email: comercial@connectionmozambique.com</Text>
        </View>
      </View>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>COMPROVATIVO DE PAGAMENTO</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMAÇÕES DO DOCUMENTO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Número do Comprovativo:</Text>
            <Text style={styles.value}>{receipt.id.substring(0, 8)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Data de Emissão:</Text>
            <Text style={styles.value}>{formatDate(receipt.issuedDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Estado:</Text>
            <Text style={styles.value}>{receipt.status.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMAÇÕES DO CLIENTE</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nome:</Text>
            <Text style={styles.value}>{receipt.clientName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contacto:</Text>
            <Text style={styles.value}>{receipt.telefone || 'N/A'}</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETALHES DO PAGAMENTO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Módulo/Produto:</Text>
            <Text style={styles.value}>{receipt.moduleName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Método de Pagamento:</Text>
            <Text style={styles.value}>M-Pesa</Text>
          </View>
          {receipt.subscription && (
            <>
              <View style={styles.row}>
                <Text style={styles.label}>Tipo de Subscrição:</Text>
                <Text style={styles.value}>{receipt.subscription.subscriptionType}</Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.label}>Período:</Text>
                <Text style={styles.value}>
                  {formatDateShort(receipt.subscription.start)} - {formatDateShort(receipt.subscription.end)}
                </Text>
              </View>
            </>
          )}
        </View>
        {receipt.mpesaResponse && (
          <View style={[styles.section, styles.mpesaInfo]}>
            <Text style={styles.sectionTitle}>DETALHES DA TRANSAÇÃO M-PESA</Text>
            <View style={styles.row}>
              <Text style={styles.label}>ID da Transação:</Text>
              <Text style={styles.value}>{receipt.mpesaResponse.output_TransactionID}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Código de Referência:</Text>
              <Text style={styles.value}>{receipt.mpesaResponse.output_ThirdPartyReference}</Text>
            </View>
          </View>
        )}

        {/* Total */}
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>TOTAL PAGO: {formatCurrency(receipt.amount)}</Text>
        </View>

      </View>

      {/* Rodapé */}
      <View style={styles.footer}>
        <Text>Connection Mozambique, Lda - Av. Marginal, Pemba, Cabo Delgado</Text>
        <Text>Este documento é gerado automaticamente e não necessita de carimbo ou assinatura manual</Text>
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
    

      {/* Filtros e Busca */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Typography variant="h4" component="h1">
          Comprovativos de Pagamento
        </Typography>
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
            value={filterSubscription}
            onChange={(e) => setFilterSubscription(e.target.value)}
            sx={{ minWidth: 180 }}>
            <MenuItem value="all">Todos Tipos</MenuItem>
            <MenuItem value="mensal">Mensal</MenuItem>
            <MenuItem value="anual">Anual</MenuItem>
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
                  <CalendarToday fontSize="small" />
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
                <TableCell>Valor</TableCell>
                <TableCell>Tipo Subscrição</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell align="right">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredReceipts.length > 0 ? (
                filteredReceipts.map((receipt) => (
                  <TableRow key={receipt.id} hover>
                    <TableCell>{receipt.moduleName}</TableCell>
                    <TableCell>{formatDate(receipt.issuedDate)}</TableCell>
                    <TableCell>{formatCurrency(receipt.amount)}</TableCell>
                    <TableCell>
                      {receipt.subscription?.subscriptionType || 'N/A'}
                    </TableCell>
                    <TableCell>{getStatusChip(receipt.status)}</TableCell>
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
                  <TableCell colSpan={6} align="center">
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

      {/* Modal de Visualização */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedReceipt && (
          <>
            <DialogTitle>Detalhes do Pagamento</DialogTitle>
            <DialogContent>
              <Box sx={{ p: 3 }} id="receipt-to-print">
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h5">Comprovativo #{selectedReceipt.id.substring(0, 8)}</Typography>
                  <Box>
                    <PDFDownloadLink 
                      document={<ReceiptPDF receipt={selectedReceipt} />} 
                      fileName={`comprovativo_${selectedReceipt.id.substring(0, 8)}.pdf`}
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

                <Card sx={{ p: 3, border: '1px solid #ddd', maxWidth: 800, margin: '0 auto' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                    <Box>
                      <Typography variant="h6">CONNECTION MOZAMBIQUE, LDA</Typography>
                      <Typography variant="body2">NUIT: 401234567</Typography>
                      <Typography variant="body2">PEMBA - CABO DELGADO</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h6">COMPROVATIVO DE PAGAMENTO</Typography>
                      <Typography variant="body2">
                        Data: {formatDate(selectedReceipt.issuedDate)}
                      </Typography>
                      <Typography variant="body2">
                        Estado: {getStatusChip(selectedReceipt.status)}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Cliente: {selectedReceipt.clientName}
                    </Typography>
                    <Typography variant="body2">
                      Contacto: {selectedReceipt.telefone || 'N/A'}
                    </Typography>
                    <Typography variant="body2">
                      Email: {selectedReceipt.userEmail || 'N/A'}
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Detalhes do Pagamento:
                    </Typography>
                    <Typography variant="body1">
                      <strong>Módulo:</strong> {selectedReceipt.moduleName}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Referência:</strong> {selectedReceipt.reference || 'N/A'}
                    </Typography>
                    <Typography variant="body1">
                      <strong>Valor:</strong> {formatCurrency(selectedReceipt.amount)}
                    </Typography>
                    
                    {selectedReceipt.subscription && (
                      <>
                        <Typography variant="body1">
                          <strong>Tipo de Subscrição:</strong> {selectedReceipt.subscription.subscriptionType}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Duração:</strong> {selectedReceipt.subscription.durationDays} dias
                        </Typography>
                        <Typography variant="body1">
                          <strong>Início:</strong> {formatDate(selectedReceipt.subscription.start)}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Fim:</strong> {formatDate(selectedReceipt.subscription.end)}
                        </Typography>
                        <Typography variant="body1">
                          <strong>Status:</strong> {selectedReceipt.subscription.isActive ? 'Ativo' : 'Inativo'}
                        </Typography>
                      </>
                    )}
                  </Box>

                  {selectedReceipt.mpesaResponse && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1 }}>
                          Detalhes da Transação:
                        </Typography>
                        <Typography variant="body2">
                          <strong>ID da Transação:</strong> {selectedReceipt.mpesaResponse.output_TransactionID}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Referência:</strong> {selectedReceipt.mpesaResponse.output_ThirdPartyReference}
                        </Typography>
                      </Box>
                    </>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Typography variant="h6">
                      Total: {formatCurrency(selectedReceipt.amount)}
                    </Typography>
                  </Box>
                </Card>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} startIcon={<ArrowBack />}>
                Voltar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default ReceiptsPage;

import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { get, ref } from 'firebase/database';
import JsBarcode from 'jsbarcode';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Alert,
  useMediaQuery,
  useTheme,
  Chip,
  Divider,
} from "@mui/material";
import { db } from '../../fb';
import BackButton from '../BackButton';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatPrice } from '../../utils/utils';

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.4
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    alignItems: 'flex-start'
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333'
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
    textTransform: 'uppercase'
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tableHeader: {
    backgroundColor: '#f44336',
    color: 'white',
    padding: 6,
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  tableRow: {
    padding: 6,
    borderBottom: '1px solid #eee',
    fontSize: 9,
    textAlign: 'center'
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 9,
    color: '#666',
    borderTop: '1px solid #eee',
    paddingTop: 10
  },
  status: {
    padding: 4,
    borderRadius: 3,
    textAlign: 'center',
    marginTop: 5,
    fontSize: 10,
    fontWeight: 'bold'
  },
  validity: {
    backgroundColor: '#fff8e1',
    padding: 4,
    borderRadius: 3,
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: 10
  },
  totalRow: {
    fontWeight: 'bold',
    fontSize: 11
  },
  companyInfo: {
    width: '60%'
  },
  documentInfo: {
    width: '35%',
    textAlign: 'right'
  },
  clientInfo: {
    width: '48%'
  },
  barcodeContainer: {
    marginTop: 15,
    paddingTop: 10,
    borderTop: '1px dashed #ccc'
  }
});

// PDF Component
const FaturaPDF = ({ fatura, user, numeroProforma, subtotal, iva, total }) => {
  // Format dates
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-MZ', options);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            {user?.logoUrl && (
              <Image src={user.logoUrl} style={{ width: 80, marginBottom: 10 }} />
            )}
            <Text style={styles.title}>{fatura.emissor?.nome || user.nome}</Text>
            <Text style={styles.subtitle}>{fatura.emissor?.morada || user.endereco}</Text>
            <Text style={styles.subtitle}>NUIT: {fatura.emissor?.nuit || user.nuit}</Text>
            <Text style={styles.subtitle}>Tel: {fatura.emissor?.contacto || user.contacto}</Text>
            <Text style={styles.subtitle}>Email: {fatura.emissor?.email || user.email}</Text>
          </View>

          <View style={styles.documentInfo}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#f44336', marginBottom: 5 }}>
              PROFORMA {numeroProforma}
            </Text>
            <Text style={styles.subtitle}>Data de Emissão: {formatDate(fatura.dataEmissao)}</Text>
            <View style={styles.validity}>
              <Text>Validade: {fatura.dataVencimento} dias</Text>
            </View>
          </View>
        </View>

        {/* Client Info */}
        <View style={{ display: 'flex', flexDirection: 'row', marginBottom: 20 }}>
          <View style={styles.clientInfo}>
            <Text style={styles.sectionTitle}>Cliente</Text>
            <Text style={{ marginBottom: 3 }}>{fatura.cliente?.nome || "Cliente Desconhecido"}</Text>
            <Text style={{ marginBottom: 3 }}>{fatura.cliente?.morada}</Text>
            <Text style={{ marginBottom: 3 }}>NUIT: {fatura.cliente?.nuit}</Text>
            <Text style={{ marginBottom: 3 }}>Contacto: {fatura.cliente?.contacto}</Text>
            <Text>Email: {fatura.cliente?.email}</Text>
          </View>
        </View>

        {/* Table */}
        <View style={{ marginBottom: 20 }}>
          {/* Table Header */}
          <View style={{ display: 'flex', flexDirection: 'row', backgroundColor: '#f44336' }}>
            <Text style={[styles.tableHeader, { width: '10%' }]}>#</Text>
            <Text style={[styles.tableHeader, { width: '45%' }]}>DESCRIÇÃO</Text>
            <Text style={[styles.tableHeader, { width: '15%' }]}>QTD</Text>
            <Text style={[styles.tableHeader, { width: '15%' }]}>PREÇO UNIT.</Text>
            <Text style={[styles.tableHeader, { width: '15%' }]}>TOTAL (MT)</Text>
          </View>

          {/* Table Rows */}
          {fatura.itens.map((item, index) => (
            <View key={index} style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #eee' }}>
              <Text style={[styles.tableRow, { width: '10%' }]}>{index + 1}</Text>
              <Text style={[styles.tableRow, { width: '45%', textAlign: 'left' }]}>{item.descricao}</Text>
              <Text style={[styles.tableRow, { width: '15%' }]}>{Number(item.quantidade)}</Text>
              <Text style={[styles.tableRow, { width: '15%' }]}>{formatPrice(Number(item.preco).toFixed(2))}</Text>
              <Text style={[styles.tableRow, { width: '15%' }]}>
                {formatPrice((Number(item.quantidade) * Number(item.preco)).toFixed(2))}
              </Text>
            </View>
          ))}
        </View>

        {/* Totals */}
        <View style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 30 }}>
          <View style={{ width: '30%' }}>
            <View style={styles.row}>
              <Text>Subtotal:</Text>
              <Text>{formatPrice(subtotal.toFixed(2))} MT</Text>
            </View>
            <View style={styles.row}>
              <Text>IVA (16%):</Text>
              <Text>{formatPrice(iva.toFixed(2))} MT</Text>
            </View>
            <View style={[styles.row, styles.totalRow]}>
              <Text>TOTAL:</Text>
              <Text>{formatPrice(total.toFixed(2))} MT</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={{ marginBottom: 5 }}>Documento criado em: {new Date(fatura.dataCriacao).toLocaleString('pt-MZ')}</Text>
          <Text style={{ marginBottom: 10 }}>Gerado por Connection Mozambique - Sistema de Gestão Comercial</Text>
          <Text>Obrigado pela sua preferência!</Text>
        </View>
      </Page>
    </Document>
  );
};

const VerFaturaDesk = ({ user }) => {
  const faturaRef = useRef();
  const barcodeRef = useRef();
  const [fatura, setFatura] = useState(null);
  const [error, setError] = useState(null);
  const { numeroProforma, sender } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  useEffect(() => {
    const fetchProforma = async () => {
      try {
        const proformaSnap = await get(
          ref(db, `invoices/${sender}/${numeroProforma}`)
        );
        setFatura(proformaSnap.val());
      } catch (err) {
        setError("Erro ao carregar proforma.");
      }
    };

    if (numeroProforma) {
      fetchProforma();
    }
  }, [user, numeroProforma]);

  useEffect(() => {
    if (numeroProforma && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, numeroProforma, {
          format: "CODE128",
          lineColor: "#000",
          width: isMobile ? 1.2 : 1.5,
          height: isMobile ? 30 : 40,
          displayValue: true,
          fontSize: isMobile ? 10 : 12,
          margin: isMobile ? 5 : 8
        });
      } catch (error) {
        console.error("Error generating barcode:", error);
      }
    }
  }, [numeroProforma, isMobile]);

  const subtotal = fatura?.itens?.reduce(
    (acc, item) => acc + Number(item.quantidade) * Number(item.preco),
    0
  ) || 0;
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAGO': return 'success';
      case 'POR PAGAR': return 'warning';
      case 'CANCELADO': return 'error';
      default: return 'default';
    }
  };

  if (!fatura) return <CircularProgress />;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        p: isMobile ? 1 : 2,
        bgcolor: "background.default",
      }}
    >
      <BackButton sx={{ mb: 2, alignSelf: 'flex-start' }} />

      {error && <Alert severity="error">{error}</Alert>}

      <Paper
        ref={faturaRef}
        elevation={3}
        sx={{
          width: isMobile ? '100%' : isTablet ? '90%' : '210mm',
          minHeight: isMobile ? 'auto' : '297mm',
          p: isMobile ? 2 : 3,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          mb: 2,
        }}
      >
        {/* Header */}
        {/* Header */}
<Box sx={{ 
  display: "flex", 
  flexDirection: isMobile ? 'column' : 'row',
  justifyContent: "space-between", 
  mb: isMobile ? 2 : 4,
  gap: isMobile ? 2 : 0
}}>
  <Box>
    <Typography variant={isMobile ? "subtitle1" : "h6"} color="error" fontWeight="bold">
      {fatura.emissor?.nome || user.nome}
    </Typography>
    <Typography variant="body2">
      {fatura.emissor?.morada || user.endereco}
    </Typography>
  </Box>
  <Box textAlign={isMobile ? 'left' : 'right'} sx={{ mt: isMobile ? 1 : 0 }}>
    <Typography variant={isMobile ? "h5" : "h4"} fontWeight="bold" color="text.primary">
      PROFORMA <Typography component="span" color="error">{numeroProforma}</Typography>
    </Typography>
    <Typography variant="body2">Emissão: {fatura.dataEmissao}</Typography>
    <Box sx={{ 
      backgroundColor: '#fff9c4', 
      p: 0.5, 
      borderRadius: 1,
      mt: 0.5,
      display: 'inline-block'
    }}>
      <Typography variant="body2" fontWeight="bold">
        Vencimento: {fatura.dataVencimento} dias
      </Typography>
    </Box>
  </Box>
</Box>

        {/* Client Info */}
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: "space-between",
            mb: 3,
            fontSize: "0.875rem",
            gap: isMobile ? 2 : 0
          }}
        >
          <Box>
            <Typography fontWeight="bold">PARA:</Typography>
            <Typography>{fatura.cliente?.nome || "Cliente Desconhecido"}</Typography>
            <Typography>{fatura.cliente?.morada}</Typography>
            <Typography>NUIT: {fatura.cliente?.nuit}</Typography>
            <Typography>Contacto: {fatura.cliente?.contacto}</Typography>
            {!isMobile && <Typography>Email: {fatura.cliente?.email}</Typography>}
          </Box>
          <Box textAlign={isMobile ? 'left' : 'right'} sx={{ mt: isMobile ? 1 : 0 }}>
            <Typography fontWeight="bold">DE:</Typography>
            <Typography>{fatura.emissor?.nome || user.nome}</Typography>
            <Typography>NUIT: {fatura.emissor?.nuit || user.nuit}</Typography>
            <Typography>Contacto: {fatura.emissor?.contacto || user.contacto}</Typography>
            {!isMobile && <Typography>Email: {fatura.emissor?.email || user.email}</Typography>}
            <Typography>Morada: {fatura.emissor?.morada || user.endereco}</Typography>
          </Box>
        </Box>

        {/* Table */}
        <TableContainer sx={{ 
          maxWidth: '100%', 
          overflowX: 'auto',
          mb: 2
        }}>
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow sx={{ bgcolor: "error.main" }}>
                <TableCell sx={{ color: "white", padding: isMobile ? '6px' : '10px', width: '10%' }}>#</TableCell>
                <TableCell sx={{ color: "white", padding: isMobile ? '6px' : '10px', width: '20%' }}>QTD</TableCell>
                <TableCell sx={{ color: "white", padding: isMobile ? '6px' : '10px', width: '40%' }}>DESCRIÇÃO</TableCell>
                <TableCell sx={{ color: "white", padding: isMobile ? '6px' : '10px', width: '15%' }}>PREÇO UNIT.</TableCell>
                <TableCell sx={{ color: "white", padding: isMobile ? '6px' : '10px', width: '15%' }}>TOTAL (MT)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fatura.itens.map((item, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ padding: isMobile ? '6px' : '10px' }}>{index + 1}</TableCell>
                  <TableCell sx={{ padding: isMobile ? '6px' : '10px' }}>{Number(item.quantidade)}</TableCell>
                  <TableCell sx={{ padding: isMobile ? '6px' : '10px' }}>{item.descricao}</TableCell>
                  <TableCell sx={{ padding: isMobile ? '6px' : '10px' }}>
                    {Number(item.preco).toFixed(2)} 
                  </TableCell>
                  <TableCell sx={{ padding: isMobile ? '6px' : '10px' }}>
                    {(Number(item.quantidade) * Number(item.preco)).toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mt: 3,
            fontSize: "0.875rem",
          }}
        >
          <Box>
            <Typography>Subtotal:</Typography>
            <Typography>IVA (16%):</Typography>
            <Typography fontWeight="bold">Total:</Typography>
          </Box>
          <Box textAlign="right">
            <Typography>{formatPrice(subtotal.toFixed(2))} MT</Typography>
            <Typography>{iva.toFixed(2)} MT</Typography>
            <Typography fontWeight="bold">{formatPrice(total.toFixed(2))} MT</Typography>
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{ 
          mt: 4,
          pt: 2,
          borderTop: '1px solid #eee',
          fontSize: '0.75rem',
          textAlign: 'center'
        }}>
          

          <Typography sx={{ mt: 2 }}>
            Obrigado pela sua preferência!
          </Typography>
          <Typography>
            Tel: {fatura.emissor?.contacto || user.contacto} | Email: {fatura.emissor?.email || user.email}
          </Typography>
        </Box>
      </Paper>
      
      {/* PDF Download Button */}
      <Box sx={{ mt: 2, mb: 4 }}>
        <PDFDownloadLink
          document={
            <FaturaPDF
              fatura={fatura}
              user={user}
              numeroProforma={numeroProforma}
              subtotal={subtotal}
              iva={iva}
              total={total}
            />
          }
          fileName={`Proforma_${numeroProforma}.pdf`}
        >
          {({ loading }) => (
            <Button
              variant="contained"
              color="primary"
              disabled={loading}
              size={isMobile ? 'small' : 'medium'}
              startIcon={loading ? <CircularProgress size={20} /> : null}
              sx={{ minWidth: isMobile ? 140 : 180 }}
            >
              {loading ? 'Gerando PDF...' : 'Baixar PDF'}
            </Button>
          )}
        </PDFDownloadLink>
      </Box>
    </Box>
  );
};

export default VerFaturaDesk;
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
  Grid,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { db } from '../../fb';
import BackButton from '../BackButton';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatPrice } from '../../utils/utils';

// Create styles for PDF
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    fontFamily: 'Helvetica',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  section: {
    marginBottom: 10,
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  tableHeader: {
    backgroundColor: '#f44336',
    color: 'white',
    padding: 5,
    fontSize: 10,
  },
  validity: {
    backgroundColor: '#fff8e1',
    padding: 4,
    borderRadius: 3,
    fontWeight: 'bold',
    marginTop: 5,
    fontSize: 10
  },
  tableRow: {
    padding: 5,
    borderBottom: '1px solid #eee',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#000',
  },
});

// PDF Document Component
const FaturaPDF = ({ fatura, user, numeroProforma, subtotal, iva, total, logoBase64 }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          {logoBase64 ? (
            <Image src={logoBase64} style={{ width: 100 }} />
          ) : (
            <Image src={logoBase64} style={{ width: 100 }} />
          )}
          <Text style={{ fontWeight: 'bold', color: '#f44336' }}>{user.nome}</Text>
          <Text>{user.endereco}, {user.distrito}</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>
            PROFORMA <Text style={{ color: '#f44336' }}>{numeroProforma}</Text>
          </Text>
          <Text>Data: {fatura.dataEmissao}</Text>
          <View style={styles.validity}>
            <Text>Validade: {fatura.dataVencimento} dias</Text>
          </View>
        </View>
      </View>

      {/* Client Info */}
      <View style={styles.row}>
        <View style={styles.section}>
          <Text style={{ fontWeight: 'bold' }}>De:</Text>
          <Text>{user.nome}</Text>
          <Text>Nuit: {user.nuit}</Text>
          <Text>{user.contacto}</Text>
          <Text>{user.email}</Text>
          <Text>{user.endereco}</Text>
        </View>
        <View style={[styles.section, { textAlign: 'right' }]} >
          <Text style={{ fontWeight: 'bold' }}>Para:</Text>
          <Text>{fatura.cliente?.nome || "Cliente Desconhecido"}</Text>
          <Text>{fatura.cliente?.morada}</Text>
          <Text>Nuit: {fatura.cliente?.nuit}</Text>
          <Text>{fatura.cliente?.contacto}</Text>
          <Text>{fatura.cliente?.email}</Text>
        </View>
      </View>

      {/* Table */}
      <View style={{ marginTop: 20 }}>
        {/* Table Header */}
        <View style={{ display: 'flex', flexDirection: 'row', backgroundColor: '#f44336' }}>
          <Text style={[styles.tableHeader, { width: '20%' }]}>Quantidade</Text>
          <Text style={[styles.tableHeader, { width: '40%' }]}>Descrição</Text>
          <Text style={[styles.tableHeader, { width: '20%' }]}>Preço Unitário(MT)</Text>
          <Text style={[styles.tableHeader, { width: '20%' }]}>Total (MT)</Text>
        </View>

        {/* Table Rows */}
        {fatura.itens.map((item, index) => (
          <View key={index} style={{ display: 'flex', flexDirection: 'row', borderBottom: '1px solid #eee' }}>
            <Text style={[styles.tableRow, { width: '20%' }]}>{Number(item.quantidade)}</Text>
            <Text style={[styles.tableRow, { width: '40%' }]}>{item.descricao}</Text>
            <Text style={[styles.tableRow, { width: '20%' }]}>{Number(item.preco).toFixed(2)}</Text>
            <Text style={[styles.tableRow, { width: '20%' }]}>
              {(Number(item.quantidade) * Number(item.preco)).toFixed(2)}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        <View style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          justifyContent: 'flex-end',
          borderTop: '1px solid #ccc',
          paddingTop: 5,
          marginTop: 5
        }}>
          <View style={{ width: '30%', textAlign: 'right' }}>
            <Text>Subtotal:{formatPrice(subtotal.toFixed(2))} MT</Text>
            <Text>IVA: {iva.toFixed(2)} MT</Text>
            <Text style={{ fontWeight: 'bold' }}>Total: {formatPrice(total.toFixed(2))} MT</Text>
          </View>
        </View>

        <View style={{ 
          marginTop: 15,
          textAlign: 'center'
        }}>
          <Text>Obrigado pela sua preferência!</Text>
        </View>
      </View>
    </Page>
  </Document>
);

const FaturaDesk = ({ user }) => {
  const isMobile = useMediaQuery('(max-width:600px)');
  const faturaRef = useRef();
  const barcodeRef = useRef();
  const [fatura, setFatura] = useState(null);
  const [error, setError] = useState(null);
  const [logoBase64, setLogoBase64] = useState(null);
  const { numeroProforma } = useParams();

  useEffect(() => {
    const fetchProforma = async () => {
      try {
        const proformaSnap = await get(
          ref(db, `invoices/${user.id}/${numeroProforma}`)
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
      JsBarcode(barcodeRef.current, numeroProforma, {
        format: "CODE128",
        lineColor: "#000",
        width: 1,
        height: 20,
        displayValue: true,
      });
    }
  }, [numeroProforma]);

  useEffect(() => {
    if (user?.logoUrl) {
      const getBase64FromUrl = async (url) => {
        try {
          const data = await fetch(url);
          const blob = await data.blob();
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob); 
            reader.onloadend = () => {
              resolve(reader.result);
            };
          });
        } catch (error) {
          console.error("Erro ao carregar imagem:", error);
          return null;
        }
      };

      getBase64FromUrl(user.logoUrl).then(setLogoBase64);
    }
  }, [user?.logoUrl]);

  const subtotal = fatura?.itens?.reduce(
    (acc, item) => acc + Number(item.quantidade) * Number(item.preco),
    0
  ) || 0;
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  const renderDesktopView = () => (
    <Paper
      ref={faturaRef}
      elevation={3}
      sx={{
        width: "210mm",
        minHeight: "297mm",
        p: 3,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
        <Box>
          <img
            src={user?.logoUrl || "/imagens/default-logo.png"}
            alt="Logotipo"
            style={{ width: 100 }}
          />
          <Typography variant="h6" color="error" fontWeight="bold">
            {user.nome}
          </Typography>
          <Typography variant="body2">
            {user.endereco}, {user.distrito}
          </Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            PROFORMA{" "}
            <Typography color="error">
              {numeroProforma}
            </Typography>
          </Typography>
          <Typography variant="body2">
            Data: {fatura.dataEmissao}
          </Typography>
          <Typography variant="body2" sx={{color:'red'}} fontWeight="bold">
            Vencimento: {fatura.dataVencimento} dias
          </Typography>
        </Box>
      </Box>

      {/* Client Info */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 3,
          fontSize: "0.875rem",
        }}
      >
        <Box>
          <Typography fontWeight="bold">De:</Typography>
          <Typography>{user.nome}</Typography>
          <Typography>Nuit: {user.nuit}</Typography>
          <Typography>{user.contacto}</Typography>
          <Typography>{user.email}</Typography>
          <Typography>{user.endereco}</Typography>
        </Box>
        <Box textAlign="right">
          <Typography fontWeight="bold">Para:</Typography>
          <Typography>
            {fatura.cliente?.nome || "Cliente Desconhecido"}
          </Typography>
          <Typography>{fatura.cliente?.morada}</Typography>
          <Typography>Nuit: {fatura.cliente?.nuit}</Typography>
          <Typography>{fatura.cliente?.contacto}</Typography>
          <Typography>{fatura.cliente?.email}</Typography>
        </Box>
      </Box>

      {/* Table */}
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: "error.main" }}>
              <TableCell sx={{ color: "white" }}>Quantidade</TableCell>
              <TableCell sx={{ color: "white" }}>Descrição</TableCell>
              <TableCell sx={{ color: "white" }}>Preço Unitário(MT)</TableCell>
              <TableCell sx={{ color: "white" }}>Total (MT)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {fatura.itens.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{Number(item.quantidade)}</TableCell>
                <TableCell>{item.descricao}</TableCell>
                <TableCell>
                  {Number(item.preco).toFixed(2)} 
                </TableCell>
                <TableCell>
                  {(
                    Number(item.quantidade) * Number(item.preco)
                  ).toFixed(2)}{" "}
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
          <Typography>IVA:</Typography>
          <Typography fontWeight="bold">Total:</Typography>
        </Box>
        <Box textAlign="right">
          <Typography>{formatPrice(subtotal.toFixed(2))} MT</Typography>
          <Typography>{iva.toFixed(2)} MT</Typography>
          <Typography fontWeight="bold">{formatPrice(total.toFixed(2))} MT</Typography>
        </Box>
      </Box>

      {/* Footer */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          fontSize: "0.875rem",
          color: "text.secondary",
          p: 2,
          textAlign: 'center',
        }}
      >
        <Typography>Obrigado pela sua preferência!</Typography>
        <Typography>
          Tel: {user.contacto} | Email: {user.email}
        </Typography>
      </Box>
    </Paper>
  );

  const renderMobileView = () => (
    <Card elevation={3} sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h6" color="error" fontWeight="bold">
            {user.nome}
          </Typography>
          <Typography variant="body2">
            {user.endereco}, {user.distrito}
          </Typography>
        </Box>
        <Box textAlign="right">
          <Typography variant="h6" fontWeight="bold">
            PROFORMA {numeroProforma}
          </Typography>
          <Typography variant="body2">
            Data: {fatura.dataEmissao}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Client Info */}
      <Box mb={3}>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Cliente
        </Typography>
        <Typography>{fatura.cliente?.nome || "Cliente Desconhecido"}</Typography>
        <Typography variant="body2">{fatura.cliente?.morada}</Typography>
        <Typography variant="body2">Nuit: {fatura.cliente?.nuit}</Typography>
        <Typography variant="body2">Contacto: {fatura.cliente?.contacto}</Typography>
        <Typography variant="body2">Email: {fatura.cliente?.email}</Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Items List */}
      <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
        Itens
      </Typography>
      <List>
        {fatura.itens.map((item, index) => (
          <React.Fragment key={index}>
            <ListItem>
              <ListItemText
                primary={item.descricao}
                secondary={
                  <>
                    <Typography component="span" display="block">
                      Quantidade: {Number(item.quantidade)}
                    </Typography>
                    <Typography component="span" display="block">
                      Preço Unitário: {Number(item.preco).toFixed(2)} MT
                    </Typography>
                    <Typography component="span" display="block">
                      Total: {(Number(item.quantidade) * Number(item.preco)).toFixed(2)} MT
                    </Typography>
                  </>
                }
              />
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>

      <Divider sx={{ my: 2 }} />
      <Box>
        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
          Resumo
        </Typography>
        <Box display="flex" justifyContent="space-between">
          <Typography>Subtotal:</Typography>
          <Typography>{formatPrice(subtotal.toFixed(2))} MT</Typography>
        </Box>
        <Box display="flex" justifyContent="space-between">
          <Typography>IVA:</Typography>
          <Typography>{iva.toFixed(2)} MT</Typography>
        </Box>
        <Box display="flex" justifyContent="space-between" fontWeight="bold">
          <Typography>Total:</Typography>
          <Typography>{formatPrice(total.toFixed(2))} MT</Typography>
        </Box>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Footer */}
      <Box textAlign="center">
        <Typography variant="body2">Obrigado pela sua preferência!</Typography>
        <Typography variant="body2">
          Tel: {user.contacto} | Email: {user.email}
        </Typography>
      </Box>
    </Card>
  );

  return (
    <Box
      sx={{
        p: isMobile ? 1 : 3,
        bgcolor: "background.default",
      }}
    >
      <BackButton sx={{ mb: 2 }} />

      {error && <Alert severity="error">{error}</Alert>}
      {fatura ? (
        <>
          {isMobile ? renderMobileView() : renderDesktopView()}
          
          {/* PDF Download Button */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <PDFDownloadLink
              document={
                <FaturaPDF
                  fatura={fatura}
                  user={user}
                  numeroProforma={numeroProforma}
                  subtotal={subtotal}
                  iva={iva}
                  total={total}
                  logoBase64={logoBase64}
                />
              }
              fileName={`Proforma_${numeroProforma}.pdf`}
            >
              {({ loading }) => (
                <Button
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  fullWidth={isMobile}
                  size={isMobile ? "medium" : "large"}
                >
                  {loading ? 'Preparando PDF...' : 'Baixar PDF'}
                </Button>
              )}
            </PDFDownloadLink>
          </Box>
        </>
      ) : (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      )}
    </Box>
  );
};

export default FaturaDesk;
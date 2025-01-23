import React, { useEffect, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
} from "@mui/material";
import { db } from '../../fb';
import BackButton from '../BackButton';

const FaturaDesk = ({ user }) => {
  const faturaRef = useRef();
  const barcodeRef = useRef();
  const [fatura, setFatura] = useState(null);
  const [error, setError] = useState(null);
  const { numeroProforma } = useParams();

  useEffect(() => {
    const fetchProforma = async () => {
      try {
        const proformaSnap = await get(
          ref(db, `invoices/${user.id}/${numeroProforma}`)
        );
        if (proformaSnap.exists()) {
          setFatura(proformaSnap.val());
        } else {
          setError("Proforma não encontrada.");
        }
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

  const gerarPDF = () => {
    if (!faturaRef.current) {
      console.error("Elemento de referência da fatura não encontrado.");
      return;
    }

    html2canvas(faturaRef.current, { 
      scale: 2,
      useCORS: true, }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const ratio = Math.min(pdfWidth / canvasWidth, pdfHeight / canvasHeight);
      const imgWidth = canvasWidth * ratio;
      const imgHeight = canvasHeight * ratio;

      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`Proforma_${numeroProforma}.pdf`);
    });
  };

  const subtotal =
    fatura?.itens?.reduce(
      (acc, item) => acc + Number(item.quantidade) * Number(item.preco),
      0
    ) || 0;
  const iva = subtotal * 0.16;
  const total = subtotal + iva;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center", // Para centralizar verticalmente
        minHeight: "100vh",
        p: 2,
        bgcolor: "background.default",
      }}
>
    <BackButton sx={{ mb: 2 }} />

      {error && <Alert severity="error">{error}</Alert>}
      {fatura ? (
        <Paper
          ref={faturaRef}
          elevation={3}
          sx={{
            width: "210mm", // Largura do A4
            minHeight: "297mm", // Altura mínima do A4
            p: 3,
            display: "flex",
            flexDirection: "column",
            position: "relative", // Permite rodapé fixo
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
            </Box>
          </Box>

          {/* Informações do Cliente */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              mb: 3,
              fontSize: "0.875rem",
            }}
          >
            <Box>
              <Typography fontWeight="bold">Para:</Typography>
              <Typography>
                {fatura.cliente?.nome || "Cliente Desconhecido"}
              </Typography>
              <Typography>{fatura.cliente?.enderecoEnvio}</Typography>
            </Box>
            <Box textAlign="right">
              <Typography fontWeight="bold">De:</Typography>
              <Typography>{user.nome}</Typography>
              <Typography>Av. 25 de Setembro, Pemba</Typography>
            </Box>
          </Box>

          {/* Tabela */}
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

          {/* Resumo */}
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
              <Typography>{subtotal.toFixed(2)} MT</Typography>
              <Typography>{iva.toFixed(2)} MT</Typography>
              <Typography fontWeight="bold">{total.toFixed(2)} MT</Typography>
            </Box>
          </Box>

          {/* Rodapé fixo */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              fontSize: "0.875rem",
              color: "text.secondary",
              p: 2,
              textAlign: 'center', // Centraliza o conteúdo do rodapé
            }}
          >
            <Typography>Obrigado pela sua preferência!</Typography>
            <Typography>
              Tel: {user.contacto} | Email: {user.email}
            </Typography>
          </Box>
        </Paper>
      ) : (
        <CircularProgress />
      )}

      {fatura && (
        <Button
          variant="contained"
          color="primary"
          sx={{ mt: 3 }}
          onClick={gerarPDF}
        >
          Baixar PDF
        </Button>
      )}
    </Box>
  );
};

export default FaturaDesk;

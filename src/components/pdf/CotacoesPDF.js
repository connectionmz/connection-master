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

const CotacoesPDF = ({ user }) => {
  const faturaRef = useRef();
  const barcodeRef = useRef();
  const [error, setError] = useState(null);
  const { id } = useParams();
  const [cot, setCotacao] = useState(null);


  useEffect(() => {
    const fetchProforma = async () => {
      try {
        const proformaSnap = await get(
          ref(db, `cotacoes/${id}`)
        );
        if (proformaSnap.exists()) {
          setCotacao(proformaSnap.val());
        } else {
          setError("Proforma não encontrada.");
        }
      } catch (err) {
        setError("Erro ao carregar proforma.");
      }
    };

    if (id) {
      fetchProforma();
    }
  }, [user, id]);

  useEffect(() => {
    if (id && barcodeRef.current) {
      JsBarcode(barcodeRef.current, id, {
        format: "CODE128",
        lineColor: "#000",
        width: 1,
        height: 20,
        displayValue: true,
      });
    }
  }, [id]);

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
      pdf.save(`Proforma_${id}.pdf`);
    });
  };


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
      {cot ? (
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
            <Typography variant="h4" fontWeight="bold" color="text.primary">
                PEDIDO DE COTACAO{" "}
 
              </Typography>
              <Typography variant="h6" color="error" fontWeight="bold">
                {cot.company?.nome}
              </Typography>
              <Typography variant="body2">
                {cot.company?.endereco}, {cot.company?.distrito}
              </Typography>
            </Box>
            <Box textAlign="right">
             
              <Typography variant="body2">
                Data: {cot.timestamp}
              </Typography>
            </Box>
          </Box>

{/* Tabela */}
{cot.items && cot.items.length > 0 && (
  <section >
    <Typography variant="h6" className="text-gray-700 font-semibold">
      Itens da Cotação
    </Typography>
    <TableContainer component={Paper} className="mt-4">
      <Table>
        <TableHead>
          <TableRow sx={{ bgcolor: "error.main" }}>
            <TableCell><strong>Serviço/Produto</strong></TableCell>
            <TableCell><strong>Descrição</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cot.items.map((item, index) => (
            <TableRow key={index} hover>
              <TableCell>{item.name}</TableCell>
              <TableCell>
                {item.description ? (
                  <ul style={{ paddingLeft: "1rem", margin: 0 }}>
                    {item.description.split('\n').map((desc, idx) => (
                      <li key={idx} style={{ listStyleType: "disc" }}>
                        {desc}
                      </li>
                    ))}
                  </ul>
                ) : (
                  'Sem descrição'
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  </section>
)}

          
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
              Tel: {user?.contacto} | Email: {user?.email}
            </Typography>
          </Box>
        </Paper>
      ) : (
        <CircularProgress />
      )}

      {cot && (
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

export default CotacoesPDF;

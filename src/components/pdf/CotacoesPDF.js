import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { get, ref } from "firebase/database";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from "@mui/material";
import { db } from "../../fb";
import BackButton from "../BackButton";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";

const CotacoesPDF = ({ user }) => {
  const { id } = useParams();
  const [cot, setCotacao] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProforma = async () => {
      try {
        const proformaSnap = await get(ref(db, `cotacoes/${id}`));
        if (proformaSnap.exists()) {
          setCotacao(proformaSnap.val());
        } else {
          setError("Cotação não encontrada.");
        }
      } catch (err) {
        setError("Erro ao carregar cotação.");
      }
    };

    if (id) {
      fetchProforma();
    }
  }, [user, id]);

  // Função para formatar datas
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString("pt-PT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Componente PDF personalizado
  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>{cot?.company?.nome}</Text>
          <Text style={styles.title}>PEDIDO DE COTAÇÃO</Text>
          <Text style={styles.subtitle}>{cot?.title}</Text>
          <Text>{cot?.company?.provincia} - {cot?.company?.distrito}</Text>
          <Text>{cot?.company?.morada}</Text>
          <Text>Nuit: {cot?.company?.nuit}</Text>
          <Text>Sector: {cot?.company?.sector}</Text>
          <Text>Valor Máximo de Propostas: {cot?.maxProposals} MT</Text>
        </View>

        <View style={styles.info}>
          <Text>Publicado: {formatDate(cot?.timestamp)}</Text>
          <Text style={{ color: "#d32f2f" }}>Data Limite: {formatDate(cot?.datalimite)}</Text>
        </View>

        <View style={styles.tableContainer}>
          <Text style={styles.sectionTitle}>Itens da Cotação</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.headerRow]}>
              <Text style={[styles.tableCell, styles.headerCell]}>Serviço/Produto</Text>
              <Text style={[styles.tableCell, styles.headerCell]}>Qtd</Text>
              <Text style={[styles.tableCell, styles.headerCell]}>Descrição</Text>
            </View>
            {cot?.items && cot.items.length > 0 ? (
              cot.items.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{item.name}</Text>
                  <Text style={styles.tableCell}>{item?.qtd || "N/A"}</Text>
                  <Text style={styles.tableCell}>
                    {item.description ? item.description.split("\n").join(", ") : "Sem descrição"}
                  </Text>
                </View>
              ))
            ) : (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { textAlign: "center", color: "#d32f2f" }]}>
                  Nenhum item encontrado.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Contacto: {cot?.company?.contacto} | Email: {cot?.company?.email}</Text>
          <Text>connectionmozambique.com</Text>
        </View>
      </Page>
    </Document>
  );

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
        p: 2,
        bgcolor: "background.default",
        flexDirection: "column",
      }}
    >
      {/* Botões no topo */}
      <Box sx={{ width: "100%", display: "flex", justifyContent: "space-between", mb: 2 }}>
        <BackButton sx={{ mb: 2 }} variant="contained" color="primary" />
        {cot && (
          <Button variant="contained" color="primary" sx={{ mt: 3 }}>
            <PDFDownloadLink document={<MyDocument />} fileName={`Pedido_de_Cotacao_${cot.company.nome}.pdf`}>
              {({ blob, url, loading, error }) =>
                loading ? "Carregando documento..." : "Baixar PDF"
              }
            </PDFDownloadLink>
          </Button>
        )}
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      {cot ? (
        <Box sx={{ width: "210mm", minHeight: "297mm", p: 3, border:'1px solid #F1F1F1' }}>
          {/* Logo da empresa */}
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            {cot.company?.nome}
          </Typography>
          <Typography variant="h6" color="error" fontWeight="bold">
            PEDIDO DE COTAÇÃO
          </Typography>
          <Typography variant="h6" fontWeight="bold">
            {cot.title}
          </Typography>
          <Typography variant="body2">{cot.company?.provincia} - {cot.company?.distrito}</Typography>
          <Typography variant="body2">{cot.company?.morada}</Typography>
          <Typography variant="body2">Nuit:{cot.company?.nuit}</Typography>
          <Typography variant="body2">Sector: {cot.company?.sector}</Typography>
          <Typography variant="body2">Valor Máximo de Propostas: {cot.maxProposals} MT</Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2">Publicado: {formatDate(cot.timestamp)}</Typography>
          <Typography variant="body2" sx={{ color: "red" }}>
            Data Limite: {formatDate(cot.datalimite)}
          </Typography>

          <Divider sx={{ my: 2 }} />

          {/* Verificação para cot.items */}
          {cot && cot.items && cot.items.length > 0 ? (
            <>
              <Typography variant="h6">Itens da Cotação</Typography>
              {cot.items.map((item, index) => (
                <Box key={index} sx={{ mb: 1 }}>
                  <Typography variant="body2">
                    <strong>Serviço/Produto:</strong> {item.name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Quantidade:</strong> {item?.qtd || "N/A"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Descrição:</strong> {item.description || "Sem descrição"}
                  </Typography>
                </Box>
              ))}
            </>
          ) : (
            <Typography variant="body2" sx={{ color: "red" }}>
              Nenhum item encontrado para esta cotação.
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Typography variant="body2">
            Contacto: {cot.company?.contacto} | Email: {cot.company?.email}
          </Typography>
          <Typography variant="body2">connectionmozambique.com</Typography>
        </Box>
      ) : (
        <CircularProgress />
      )}
    </Box>
  );
};

// Estilos para o PDF
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 12,
    lineHeight: 1.6,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 30,
    textAlign: "center",
    borderBottom: "2px solid #d32f2f",
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 10,
  },
  info: {
    marginBottom: 20,
    textAlign: "center",
  },
  tableContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  table: {
    border: "1px solid #ddd",
    borderRadius: 5,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1px solid #ddd",
  },
  headerRow: {
    backgroundColor: "#f5f5f5",
  },
  tableCell: {
    flex: 1,
    padding: 8,
    textAlign: "center",
  },
  headerCell: {
    fontWeight: "bold",
    color: "#333",
  },
  footer: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 10,
    color: "#666",
    borderTop: "1px solid #ddd",
    paddingTop: 10,
  },
});

export default CotacoesPDF;
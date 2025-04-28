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
  useMediaQuery,
  useTheme,
  Stack,
} from "@mui/material";
import { db } from "../../fb";
import BackButton from "../BackButton";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { formatPrice } from "../../utils/utils";

const CotacoesPDF = ({ user }) => {
  const { id } = useParams();
  const [cot, setCotacao] = useState(null);
  const [error, setError] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

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
      hour: '2-digit',
      minute: '2-digit'
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
          <Text>Valor Máximo de Propostas:{cot?.valor || cot?.maxProposals}MT</Text>
          
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
        p: isMobile ? 1 : 3,
        bgcolor: "background.default",
        flexDirection: "column",
      }}
    >
      {/* Botões no topo */}
      <Box sx={{ 
        width: "100%", 
        display: "flex", 
        justifyContent: "space-between", 
        mb: 2,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 0
      }}>
        <BackButton 
          sx={{ mb: isMobile ? 0 : 2 }} 
          variant="contained" 
          color="primary" 
          size={isMobile ? 'small' : 'medium'}
        />
        {cot && (
          <Button 
            variant="contained" 
            color="primary" 
            sx={{ mt: isMobile ? 0 : 3 }}
            size={isMobile ? 'small' : 'medium'}
          >
            <PDFDownloadLink 
              document={<MyDocument />} 
              fileName={`Pedido_de_Cotacao_${cot.company.nome}.pdf`}
              style={{ 
                color: 'inherit', 
                textDecoration: 'none',
                fontSize: isMobile ? '0.8rem' : '1rem',
                padding: isMobile ? '6px 8px' : '8px 16px'
              }}
            >
              {({ blob, url, loading, error }) =>
                loading ? "Carregando..." : "Baixar PDF"
              }
            </PDFDownloadLink>
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
          {error}
        </Alert>
      )}

      {cot ? (
        <Box sx={{ 
          width: isMobile ? '100%' : '210mm', 
          minHeight: isMobile ? 'auto' : '297mm', 
          p: isMobile ? 2 : 3, 
          border: '1px solid #F1F1F1',
          borderRadius: 2,
          boxShadow: 1
        }}>
          {/* Logo da empresa */}
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            fontWeight="bold" 
            color="text.primary"
            gutterBottom
          >
            {cot.company?.nome}
          </Typography>
          
          <Typography 
            variant={isMobile ? "body1" : "h6"} 
            color="error" 
            fontWeight="bold"
            gutterBottom
          >
            PEDIDO DE COTAÇÃO
          </Typography>
          
          <Typography 
            variant={isMobile ? "body1" : "h6"} 
            fontWeight="bold"
            gutterBottom
          >
            {cot.title}
          </Typography>
          
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            <Typography variant="body2">{cot.company?.provincia} - {cot.company?.distrito}</Typography>
            <Typography variant="body2">{cot.company?.morada}</Typography>
            <Typography variant="body2">Nuit: {cot.company?.nuit}</Typography>
            <Typography variant="body2">Sector: {cot.company?.sector}</Typography>
            <Typography variant="body2">Valor Máximo de Propostas:{cot?.valor || cot?.maxProposals}MT</Typography>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1} sx={{ mb: 2 }}>
            <Typography variant="body2">Publicado: {formatDate(cot.timestamp)}</Typography>
            <Typography variant="body2" sx={{ color: "red" }}>
              Data Limite: {formatDate(cot.datalimite)}
            </Typography>
          </Stack>

          <Divider sx={{ my: 2 }} />

          {/* Verificação para cot.items */}
          {cot && cot.items && cot.items.length > 0 ? (
            <>
              <Typography 
                variant={isMobile ? "body1" : "h6"} 
                fontWeight="bold"
                gutterBottom
              >
                Itens da Cotação
              </Typography>
              
              <Stack spacing={2}>
                {cot.items.map((item, index) => (
                  <Box key={index} sx={{ 
                    p: 1, 
                    border: '1px solid #eee', 
                    borderRadius: 1,
                    backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'transparent'
                  }}>
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
              </Stack>
            </>
          ) : (
            <Typography variant="body2" sx={{ color: "red" }}>
              Nenhum item encontrado para esta cotação.
            </Typography>
          )}

          <Divider sx={{ my: 2 }} />

          <Stack spacing={0.5}>
            <Typography variant="body2">
              <strong>Contacto:</strong> {cot.company?.contacto}
            </Typography>
            <Typography variant="body2">
              <strong>Email:</strong> {cot.company?.email}
            </Typography>
            <Typography variant="body2">connectionmozambique.com</Typography>
          </Stack>
        </Box>
      ) : !error && (
        <CircularProgress size={isMobile ? 40 : 60} />
      )}
    </Box>
  );
};

// Estilos para o PDF (mantidos os mesmos)
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
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

const EditalConcursoPDF = ({ user }) => {
  const { id } = useParams();
  const [cot, setCotacao] = useState(null);
  const [error, setError] = useState(null);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  useEffect(() => {
    const fetchProforma = async () => {
      try {
        const proformaSnap = await get(ref(db, `concursos/${id}`));
        if (proformaSnap.exists()) {
          setCotacao(proformaSnap.val());
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
  const formatDate = (dateString) => {
    if (!dateString) return "Não especificado";
    const date = new Date(dateString);
    return date.toLocaleString("pt-PT", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Função para remover tags HTML
  const stripHtml = (html) => {
    if (!html) return "";
    return html.replace(/<[^>]*>/g, "");
  };

  // Componente PDF personalizado
  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>{cot?.company?.nome}</Text>
          <Text style={styles.title}>PROCESSO DE CONCURSO PÚBLICO</Text>
          <Text style={styles.subtitle}>{cot?.titulo}</Text>
          <Text>Número de Referência: {cot?.numeroReferencia || "Não especificado"}</Text>
          <Text>Modalidade: {cot?.modalidade}</Text>
          <Text>Setor: {cot?.setor}</Text>
          <Text>Valor Estimado: {formatPrice(cot?.valorEstimado)} MT</Text>
        </View>

        <View style={styles.info}>
          <Text>Data de Abertura: {formatDate(cot?.dataAbertura)}</Text>
          <Text style={{ color: "#d32f2f" }}>Prazo: {formatDate(cot?.prazo)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Objeto</Text>
          <Text style={styles.sectionContent}>{stripHtml(cot?.objeto)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requisitos Técnicos</Text>
          <Text style={styles.sectionContent}>{stripHtml(cot?.requisitosTecnicos)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Critérios de Avaliação</Text>
          <Text style={styles.sectionContent}>{stripHtml(cot?.criterios)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condições</Text>
          <Text style={styles.sectionContent}>{stripHtml(cot?.condicoes)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documentação Necessária</Text>
          <Text style={styles.sectionContent}>{stripHtml(cot?.documentacao)}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local de Entrega</Text>
          <Text style={styles.sectionContent}>{cot?.localEntrega || "Não especificado"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Províncias Abrangidas</Text>
          <Text style={styles.sectionContent}>
            {cot?.provincia?.join(", ") || "Não especificado"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Entidade Elegível</Text>
          <Text style={styles.sectionContent}>
            {cot?.tipoEntidade?.join(", ") || "Não especificado"}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>Entidade: {cot?.entidade}</Text>
          <Text>Status: {cot?.status}</Text>
          <Text>Publicado em: {formatDate(cot?.timestamp)}</Text>
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
              fileName={`Processo_Concurso_${cot.titulo}.pdf`}
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
            PROCESSO DE CONCURSO PÚBLICO
          </Typography>
          
          <Typography 
            variant={isMobile ? "body1" : "h6"} 
            fontWeight="bold"
            gutterBottom
          >
            {cot.titulo}
          </Typography>
          
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            <Typography variant="body2">Número de Referência: {cot.numeroReferencia || "Não especificado"}</Typography>
            <Typography variant="body2">Modalidade: {cot.modalidade}</Typography>
            <Typography variant="body2">Setor: {cot.setor}</Typography>
            <Typography variant="body2">Valor Estimado: {formatPrice(cot.valorEstimado)} MT</Typography>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1} sx={{ mb: 2 }}>
            <Typography variant="body2">Data de Abertura: {formatDate(cot.dataAbertura)}</Typography>
            <Typography variant="body2" sx={{ color: "red" }}>
              Prazo: {formatDate(cot.prazo)}
            </Typography>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Objeto
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
              {stripHtml(cot.objeto)}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Requisitos Técnicos
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
              {stripHtml(cot.requisitosTecnicos)}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Critérios de Avaliação
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
              {stripHtml(cot.criterios)}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Condições
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
              {stripHtml(cot.condicoes)}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Documentação Necessária
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: "pre-line" }}>
              {stripHtml(cot.documentacao)}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Local de Entrega
            </Typography>
            <Typography variant="body2">
              {cot.localEntrega || "Não especificado"}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Províncias Abrangidas
            </Typography>
            <Typography variant="body2">
              {cot.provincia?.join(", ") || "Não especificado"}
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Tipo de Entidade Elegível
            </Typography>
            <Typography variant="body2">
              {cot.tipoEntidade?.join(", ") || "Não especificado"}
            </Typography>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Stack spacing={0.5}>
            <Typography variant="body2">
              <strong>Entidade:</strong> {cot.entidade}
            </Typography>
            <Typography variant="body2">
              <strong>Status:</strong> {cot.status}
            </Typography>
            <Typography variant="body2">
              <strong>Publicado em:</strong> {formatDate(cot.timestamp)}
            </Typography>
          </Stack>
        </Box>
      ) : !error && (
        <CircularProgress size={isMobile ? 40 : 60} />
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
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  sectionContent: {
    fontSize: 12,
    textAlign: "justify",
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

export default EditalConcursoPDF;
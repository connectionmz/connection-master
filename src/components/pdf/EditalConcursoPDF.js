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
import { formatarValor, formatPrice } from "../../utils/utils";

const EditalConcurso = ({ user }) => {
  const { id } = useParams();
  const [concurso, setConcurso] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  useEffect(() => {
    const fetchConcurso = async () => {
      try {
        const concursoSnap = await get(ref(db, `concursos/${id}`));
        if (concursoSnap.exists()) {
          setConcurso(concursoSnap.val());
        } else {
          setError("Concurso não encontrado.");
        }
      } catch (err) {
        setError("Erro ao carregar edital do concurso.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchConcurso();
    }
  }, [id]);

  const formatDate = (dateString) => {
    if (!dateString) return "Não especificado";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("pt-PT", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return "Data inválida";
    }
  };

  const convertQuillToText = (html) => {
    if (!html) return "";
    
    let text = html.replace(/<ol[^>]*>/g, '')
                   .replace(/<\/ol>/g, '')
                   .replace(/<li>/g, '\n• ')
                   .replace(/<\/li>/g, '');
    
    text = text.replace(/<ul[^>]*>/g, '')
               .replace(/<\/ul>/g, '')
               .replace(/<li>/g, '\n• ');
    
    text = text.replace(/<[^>]*>/g, '');
    text = text.replace(/ +/g, ' ')
               .replace(/\n\s+/g, '\n')
               .trim();
    
    return text;
  };

  const renderQuillContentForPDF = (html) => {
    if (!html) return null;
    
    const text = convertQuillToText(html);
    return (
      <View>
        {text.split('\n').map((paragraph, i) => (
          paragraph.startsWith('•') ? (
            <View key={i} style={styles.listItem}>
              <Text style={styles.bulletPoint}>•</Text>
              <Text style={styles.listItemContent}>{paragraph.substring(1).trim()}</Text>
            </View>
          ) : (
            <Text key={i} style={styles.sectionContent}>
              {paragraph || ' '}
            </Text>
          )
        ))}
      </View>
    );
  };

  const MyDocument = () => (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.companyName}>{concurso?.company?.nome || "Entidade não especificada"}</Text>
          <Text style={styles.title}>PROCESSO DE CONCURSO PÚBLICO</Text>
          <Text style={styles.subtitle}>{concurso?.titulo || "Sem título"}</Text>
          <Text>Número de Referência: {concurso?.numeroReferencia || "Não especificado"}</Text>
          <Text>Modalidade: {concurso?.modalidade || "Não especificada"}</Text>
          <Text>Setor: {concurso?.setor || "Não especificado"}</Text>
          {concurso?.valorEstimado && (
            <Text>Valor Estimado: {formatarValor(concurso.valorEstimado)} MT</Text>
          )}
        </View>

        <View style={styles.info}>
          <Text>Data de Abertura: {formatDate(concurso?.dataAbertura)}</Text>
          <Text style={{ color: "#d32f2f" }}>Prazo: {formatDate(concurso?.prazo)}</Text>
        </View>

        {[
          { title: "Objeto", content: concurso?.objeto },
          { title: "Requisitos Técnicos", content: concurso?.requisitosTecnicos },
          { title: "Critérios de Avaliação", content: concurso?.criterios },
          { title: "Condições", content: concurso?.condicoes },
          { title: "Documentação Necessária", content: concurso?.documentacao },
        ].map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {renderQuillContentForPDF(section.content)}
          </View>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Local de Entrega</Text>
          <Text style={styles.sectionContent}>{concurso?.localEntrega || "Não especificado"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Províncias Abrangidas</Text>
          <Text style={styles.sectionContent}>
            {concurso?.provincia?.join(", ") || "Não especificado"}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Entidade Elegível</Text>
          <Text style={styles.sectionContent}>
            {concurso?.tipoEntidade?.join(", ") || "Não especificado"}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text>Entidade: {concurso?.entidade || "Não especificada"}</Text>
          <Text>Gerado por:Connection Mozambique, LDA</Text>
          <Text>Publicado em: {formatDate(concurso?.timestamp)}</Text>
        </View>
      </Page>
    </Document>
  );

  const renderQuillContent = (html) => {
    if (!html) return (
      <Typography variant="body2" color="textSecondary">
        Não especificado
      </Typography>
    );
    
    return (
      <Box sx={{
        '& ol, & ul': {
          pl: 3,
          my: 1,
        },
        '& li': {
          mb: 1,
        },
        '& p': {
          my: 1,
        },
        fontSize: '0.875rem',
        lineHeight: 1.6,
      }}>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </Box>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={isMobile ? 40 : 60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <BackButton />
      </Box>
    );
  }

  if (!concurso) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Nenhum concurso encontrado
        </Alert>
        <BackButton />
      </Box>
    );
  }

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
      <Box sx={{ 
        width: "100%", 
        display: "flex", 
        justifyContent: "space-between", 
        mb: 2,
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 2 : 0
      }}>
        <BackButton 
          sx={{ alignSelf: isMobile ? 'center' : 'flex-start' }} 
          variant="contained" 
          color="primary" 
          size={isMobile ? 'small' : 'medium'}
        />
        
        <Button 
          variant="contained" 
          color="primary" 
          sx={{ alignSelf: isMobile ? 'center' : 'flex-end' }}
          size={isMobile ? 'small' : 'medium'}
        >
          <PDFDownloadLink 
            document={<MyDocument />} 
            fileName={`Edital_Concurso_${concurso.titulo || 'sem_titulo'}.pdf`}
            style={{ 
              color: 'inherit', 
              textDecoration: 'none',
              fontSize: isMobile ? '0.8rem' : '1rem',
              padding: isMobile ? '6px 8px' : '8px 16px'
            }}
          >
            {({ loading }) => loading ? "Gerando PDF..." : "Baixar Edital"}
          </PDFDownloadLink>
        </Button>
      </Box>

      <Box sx={{ 
        width: isMobile ? '100%' : '210mm', 
        minHeight: isMobile ? 'auto' : '297mm', 
        p: isMobile ? 2 : 3, 
        border: '1px solid #F1F1F1',
        borderRadius: 2,
        boxShadow: 1,
        bgcolor: 'background.paper'
      }}>
        <Box sx={{ mb: 3, textAlign: 'center', borderBottom: '2px solid', borderColor: 'error.main', pb: 2 }}>
          <Typography 
            variant={isMobile ? "h5" : "h4"} 
            fontWeight="bold" 
            color="text.primary"
            gutterBottom
          >
            {concurso.company?.nome || "Entidade não especificada"}
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
            {concurso.titulo || "Sem título"}
          </Typography>
        </Box>
        
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Número de Referência:</strong> {concurso.numeroReferencia || "Não especificado"}
          </Typography>
          <Typography variant="body2">
            <strong>Modalidade:</strong> {concurso.modalidade || "Não especificada"}
          </Typography>
          <Typography variant="body2">
            <strong>Setor:</strong> {concurso.setor || "Não especificado"}
          </Typography>
          {concurso.valorEstimado && (
            <Typography variant="body2">
              <strong>Valor Estimado:</strong> {formatarValor(concurso.valorEstimado)} MT
            </Typography>
          )}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1} sx={{ mb: 2 }}>
          <Typography variant="body2">
            <strong>Data de Abertura:</strong> {formatDate(concurso.dataAbertura)}
          </Typography>
          <Typography variant="body2" sx={{ color: "error.main", fontWeight: 'bold' }}>
            <strong>Prazo:</strong> {formatDate(concurso.prazo)}
          </Typography>
        </Stack>

        <Divider sx={{ my: 2 }} />

        {[
          { title: "Objeto", content: concurso.objeto },
          { title: "Requisitos Técnicos", content: concurso.requisitosTecnicos },
          { title: "Critérios de Avaliação", content: concurso.criterios },
          { title: "Condições", content: concurso.condicoes },
          { title: "Documentação Necessária", content: concurso.documentacao },
        ].map((section, index) => (
          <Box key={index} sx={{ mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              {section.title}
            </Typography>
            {renderQuillContent(section.content)}
          </Box>
        ))}

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Local de Entrega
          </Typography>
          <Typography variant="body2">
            {concurso.localEntrega || "Não especificado"}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Províncias Abrangidas
          </Typography>
          <Typography variant="body2">
            {concurso.provincia?.join(", ") || "Não especificado"}
          </Typography>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Tipo de Entidade Elegível
          </Typography>
          <Typography variant="body2">
            {concurso.tipoEntidade?.join(", ") || "Não especificado"}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Stack spacing={1}>
          <Typography variant="body2">
            <strong>Entidade:</strong> {concurso.entidade || "Não especificada"}
          </Typography>
          <Typography variant="body2">
            <strong>Status:</strong> {concurso.status || "Não especificado"}
          </Typography>
          <Typography variant="body2">
            <strong>Publicado em:</strong> {formatDate(concurso.timestamp)}
          </Typography>
        </Stack>
      </Box>
    </Box>
  );
};

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
    marginBottom: 5,
  },
  listItem: {
    fontSize: 12,
    marginBottom: 5,
    display: 'flex',
    flexDirection: 'row',
  },
  bulletPoint: {
    width: 15,
    fontSize: 12,
  },
  listItemContent: {
    flex: 1,
    textAlign: 'justify',
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

export default EditalConcurso;
import React from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Link,
  Container,
  Grid,
  Divider,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Alert,
  Chip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import BusinessIcon from '@mui/icons-material/Business';
import ImageIcon from '@mui/icons-material/Image';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SecurityIcon from '@mui/icons-material/Security';
import VisibilityIcon from '@mui/icons-material/Visibility';

// =============================================
// PDF Document Component
// =============================================

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica'
  },
  header: {
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#2c3e50'
  },
  subheader: {
    fontSize: 18,
    marginTop: 15,
    marginBottom: 10,
    fontWeight: 'bold',
    color: '#2c3e50',
    backgroundColor: '#ecf0f1',
    padding: 5,
    borderRadius: 4
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: 'bold'
  },
  paragraph: {
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 1.5,
    textAlign: 'justify'
  },
  listItem: {
    fontSize: 12,
    marginBottom: 5,
    marginLeft: 15,
    lineHeight: 1.5
  },
  divider: {
    marginVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#bdc3c7',
    borderBottomStyle: 'solid'
  },
  contactInfo: {
    marginTop: 5
  },
  highlightBox: {
    backgroundColor: '#f0f9ff',
    padding: 10,
    marginVertical: 10,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
    borderLeftStyle: 'solid'
  }
});

const TermsPDFDocument = () => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>Termos de Uso e Política de Privacidade</Text>
      <Text style={styles.paragraph}>Última atualização: 7 de julho de 2025</Text>
      
      <View style={styles.divider} />
      
      {/* TERMOS DE USO */}
      <Text style={styles.subheader}>TERMOS DE USO</Text>
      
      <Text style={styles.sectionTitle}>1. Introdução</Text>
      <Text style={styles.paragraph}>
        A Connection Mozambique Lda. é uma plataforma digital que facilita a conexão entre empresas através de pedidos de cotações, concursos públicos e divulgação de produtos e serviços.
      </Text>
      <Text style={styles.paragraph}>
        Ao aceder ou utilizar a plataforma, o utilizador concorda com os presentes Termos de Uso e Política de Privacidade. Caso não concorde, não utilize a plataforma.
      </Text>
      
      <Text style={styles.sectionTitle}>2. Uso de Imagens e Dados das Empresas</Text>
      <Text style={styles.paragraph}>
        Ao cadastrar sua empresa na plataforma Connection Mozambique, você autoriza o uso das seguintes informações e elementos visuais:
      </Text>
      <Text style={styles.listItem}>• Logotipo da empresa</Text>
      <Text style={styles.listItem}>• Nome comercial e/ou razão social</Text>
      <Text style={styles.listItem}>• Imagens institucionais e de produtos/serviços</Text>
      <Text style={styles.listItem}>• Descrições e informações cadastrais não sensíveis</Text>
      <Text style={styles.paragraph}>
        Estes dados serão utilizados exclusivamente para fins de promoção, visibilidade e crescimento da sua empresa na plataforma,
        bem como para o desenvolvimento e melhoria dos serviços oferecidos pela Connection Mozambique.
      </Text>
      <Text style={styles.paragraph}>
        O uso dessas informações visa aumentar a exposição da sua empresa para potenciais clientes e parceiros de negócio,
        contribuindo para o networking e oportunidades comerciais. A Connection Mozambique não compartilha dados sensíveis
        e mantém o compromisso com a segurança das informações.
      </Text>
      
      <Text style={styles.sectionTitle}>3. Elegibilidade</Text>
      <Text style={styles.paragraph}>Para utilizar a plataforma, os utilizadores devem:</Text>
      <Text style={styles.listItem}>• Ter pelo menos 18 anos de idade</Text>
      <Text style={styles.listItem}>• Possuir NUIT e NUEL válidos da empresa</Text>
      <Text style={styles.listItem}>• Fornecer informações verdadeiras e precisas</Text>
      
      <Text style={styles.sectionTitle}>4. Gestão de Contas</Text>
      <Text style={styles.paragraph}>Para criar uma conta, é necessário fornecer:</Text>
      <Text style={styles.listItem}>• Nome da empresa, NUIT, NUEL</Text>
      <Text style={styles.listItem}>• Contacto e e-mail válidos</Text>
      <Text style={styles.listItem}>• Logotipo da empresa</Text>
      <Text style={styles.paragraph}>
        O utilizador é responsável pela segurança da sua conta e deve notificar imediatamente qualquer uso não autorizado.
      </Text>
      
      <Text style={styles.sectionTitle}>5. Obrigações do Utilizador</Text>
      <Text style={styles.paragraph}>Os utilizadores concordam em:</Text>
      <Text style={styles.listItem}>• Não utilizar a plataforma para fins ilegais</Text>
      <Text style={styles.listItem}>• Não publicar conteúdos ofensivos ou falsos</Text>
      <Text style={styles.listItem}>• Manter informações precisas e atualizadas</Text>
      
      <Text style={styles.sectionTitle}>6. Propriedade Intelectual</Text>
      <Text style={styles.paragraph}>
        Todos os direitos da plataforma pertencem à Connection Mozambique. O conteúdo publicado pelos utilizadores continua sendo de sua responsabilidade.
      </Text>
      
      <Text style={styles.sectionTitle}>7. Pagamentos</Text>
      <Text style={styles.paragraph}>Algumas funcionalidades requerem pagamento via:</Text>
      <Text style={styles.listItem}>• E-mola, M-pesa ou Mkesh</Text>
      
      <Text style={styles.sectionTitle}>8. Suspensão e Cancelamento</Text>
      <Text style={styles.paragraph}>Reservamo-nos o direito de suspender contas em caso de:</Text>
      <Text style={styles.listItem}>• Violação dos Termos</Text>
      <Text style={styles.listItem}>• Atividades fraudulentas</Text>
      
      <Text style={styles.sectionTitle}>9. Módulos</Text>
      <Text style={styles.paragraph}>Oferecemos diversos módulos incluindo:</Text>
      <Text style={styles.listItem}>• Proforma, Marketplace, Anúncios</Text>
      <Text style={styles.listItem}>• SMS, Call Center, Recrutamento</Text>
      
      <View style={styles.divider} />
      
      {/* POLÍTICA DE PRIVACIDADE */}
      <Text style={styles.subheader}>POLÍTICA DE PRIVACIDADE</Text>
      
      <Text style={styles.sectionTitle}>1. Dados Coletados</Text>
      <Text style={styles.paragraph}>Coletamos os seguintes dados para fornecer nossos serviços:</Text>
      <Text style={styles.listItem}>• Informações da empresa (nome, NUIT, NUEL) - dados institucionais</Text>
      <Text style={styles.listItem}>• Logotipo, imagens e elementos visuais da marca</Text>
      <Text style={styles.listItem}>• Dados de contacto (e-mail, telefone)</Text>
      <Text style={styles.listItem}>• Informações de localização (província, distrito)</Text>
      <Text style={styles.listItem}>• Dados de navegação e interação na plataforma</Text>
      
      <Text style={styles.sectionTitle}>2. Uso de Dados Não Sensíveis para Divulgação</Text>
      <Text style={styles.paragraph}>
        A Connection Mozambique utiliza os dados institucionais e imagens fornecidos pelas empresas para fins de divulgação, promoção e crescimento mútuo.
        Estes dados são considerados não sensíveis e incluem:
      </Text>
      <Text style={styles.listItem}>• Logotipo e identidade visual da empresa</Text>
      <Text style={styles.listItem}>• Nome, sigla e descrição institucional</Text>
      <Text style={styles.listItem}>• Imagens de produtos, serviços e instalações</Text>
      <Text style={styles.listItem}>• Informações de contacto empresarial</Text>
      <Text style={styles.paragraph}>
        Estes elementos são essenciais para a funcionalidade da plataforma, permitindo que outras empresas encontrem e se conectem com seus negócios.
        Ao aderir à plataforma, você concorda que estes dados possam ser exibidos publicamente e utilizados para fins de marketing e crescimento da rede.
      </Text>
      
      <Text style={styles.sectionTitle}>3. Cookies</Text>
      <Text style={styles.paragraph}>Utilizamos cookies para:</Text>
      <Text style={styles.listItem}>• Lembrar preferências e login</Text>
      <Text style={styles.listItem}>• Personalizar conteúdo</Text>
      <Text style={styles.listItem}>• Melhorar desempenho da plataforma</Text>
      <Text style={styles.paragraph}>
        Pode gerir as preferências de cookies nas configurações do seu navegador.
      </Text>
      
      <Text style={styles.sectionTitle}>4. Compartilhamento de Dados</Text>
      <Text style={styles.paragraph}>Não compartilhamos dados sensíveis com terceiros. Dados não sensíveis (como logotipo, nome e imagens) são:</Text>
      <Text style={styles.listItem}>• Exibidos publicamente para promover sua empresa na plataforma</Text>
      <Text style={styles.listItem}>• Compartilhados com potenciais clientes e parceiros dentro da plataforma</Text>
      <Text style={styles.listItem}>• Utilizados para melhorar a experiência de negócios</Text>
      
      <Text style={styles.sectionTitle}>5. Segurança de Dados</Text>
      <Text style={styles.paragraph}>Implementamos medidas robustas de segurança incluindo:</Text>
      <Text style={styles.listItem}>• Criptografia de dados sensíveis</Text>
      <Text style={styles.listItem}>• Autenticação de dois fatores</Text>
      <Text style={styles.listItem}>• Armazenamento seguro com backups</Text>
      
      <Text style={styles.sectionTitle}>6. Direitos do Utilizador</Text>
      <Text style={styles.paragraph}>De acordo com a LGPD, os utilizadores têm direito a:</Text>
      <Text style={styles.listItem}>• Acessar e corrigir seus dados</Text>
      <Text style={styles.listItem}>• Solicitar exclusão de dados</Text>
      <Text style={styles.listItem}>• Revogar consentimento</Text>
      <Text style={styles.listItem}>• Solicitar portabilidade de dados</Text>
      <Text style={styles.paragraph}>
        Importante ressaltar que a exclusão de dados não sensíveis (como logotipo e imagens) pode afetar a visibilidade da sua empresa na plataforma.
      </Text>
      
      <Text style={styles.sectionTitle}>7. Retenção de Dados</Text>
      <Text style={styles.paragraph}>Mantemos os dados apenas enquanto necessário para:</Text>
      <Text style={styles.listItem}>• Cumprir obrigações legais</Text>
      <Text style={styles.listItem}>• Manter contratos comerciais</Text>
      <Text style={styles.listItem}>• Prevenir fraudes e melhorar serviços</Text>
      <Text style={styles.listItem}>• Promover sua empresa e produtos associados</Text>
      
      <View style={styles.divider} />
      
      {/* DISPOSIÇÕES GERAIS */}
      <Text style={styles.subheader}>DISPOSIÇÕES GERAIS</Text>
      <Text style={styles.paragraph}>
        <Text style={{fontWeight: 'bold'}}>Alterações:</Text> Podemos atualizar estes Termos e Política periodicamente. Notificaremos sobre mudanças significativas.
      </Text>
      <Text style={styles.paragraph}>
        <Text style={{fontWeight: 'bold'}}>Jurisdição:</Text> Qualquer disputa será resolvida sob as leis de Moçambique.
      </Text>
      
      {/* CONTATO */}
      <Text style={styles.subheader}>CONTATO</Text>
      <Text style={styles.paragraph}>Para questões sobre privacidade ou termos de uso:</Text>
      <Text style={styles.contactInfo}>
        <Text style={{fontWeight: 'bold'}}>Endereço:</Text> Av. 25 de setembro, Pemba, Cabo-Delgado, Moçambique
      </Text>
      <Text style={styles.contactInfo}>
        <Text style={{fontWeight: 'bold'}}>E-mail:</Text> comercial@connectionmozambique.com
      </Text>
      <Text style={styles.contactInfo}>
        <Text style={{fontWeight: 'bold'}}>Telefone:</Text> +258 86 665 6104
      </Text>
    </Page>
  </Document>
);

// =============================================
// Main Component
// =============================================

const TermsAndPrivacy = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
        padding: { xs: "16px 0", md: "32px 0" },
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Sidebar Navigation */}
          <Grid item xs={12} md={3}>
            <Paper sx={{ padding: "16px", position: "sticky", top: "32px" }}>
              <Typography variant="h6" sx={{ fontWeight: "bold", mb: 2 }}>
                Navegação
              </Typography>
              
              <Accordion elevation={0} sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Termos de Uso</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <List dense>
                    <ListItem button component="a" href="#introduction">
                      <ListItemText primary="1. Introdução" />
                    </ListItem>
                    <ListItem button component="a" href="#image-usage">
                      <ListItemText primary="2. Uso de Imagens e Dados" />
                    </ListItem>
                    <ListItem button component="a" href="#eligibility">
                      <ListItemText primary="3. Elegibilidade" />
                    </ListItem>
                    <ListItem button component="a" href="#account-management">
                      <ListItemText primary="4. Gestão de Contas" />
                    </ListItem>
                    <ListItem button component="a" href="#user-obligations">
                      <ListItemText primary="5. Obrigações" />
                    </ListItem>
                    <ListItem button component="a" href="#intellectual-property">
                      <ListItemText primary="6. Propriedade Intelectual" />
                    </ListItem>
                    <ListItem button component="a" href="#payments">
                      <ListItemText primary="7. Pagamentos" />
                    </ListItem>
                    <ListItem button component="a" href="#termination">
                      <ListItemText primary="8. Suspensão" />
                    </ListItem>
                    <ListItem button component="a" href="#modules">
                      <ListItemText primary="9. Módulos" />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>
              
              <Accordion elevation={0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2">Política de Privacidade</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <List dense>
                    <ListItem button component="a" href="#data-collection">
                      <ListItemText primary="1. Dados Coletados" />
                    </ListItem>
                    <ListItem button component="a" href="#data-non-sensitive">
                      <ListItemText primary="2. Uso de Dados Não Sensíveis" />
                    </ListItem>
                    <ListItem button component="a" href="#cookies">
                      <ListItemText primary="3. Cookies" />
                    </ListItem>
                    <ListItem button component="a" href="#data-sharing">
                      <ListItemText primary="4. Compartilhamento" />
                    </ListItem>
                    <ListItem button component="a" href="#data-security">
                      <ListItemText primary="5. Segurança" />
                    </ListItem>
                    <ListItem button component="a" href="#user-rights">
                      <ListItemText primary="6. Direitos do Usuário" />
                    </ListItem>
                    <ListItem button component="a" href="#data-retention">
                      <ListItemText primary="7. Retenção de Dados" />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>
              
              <List dense>
                <ListItem button component="a" href="#general">
                  <ListItemText primary="Disposições Gerais" />
                </ListItem>
                <ListItem button component="a" href="#contact">
                  <ListItemText primary="Contato" />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={9}>
            <Paper sx={{ padding: { xs: "16px", md: "32px" } }}>
              {/* Header */}
              <Box sx={{ textAlign: "center", mb: 4 }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: "bold",
                    color: theme.palette.primary.main,
                    mb: 2,
                    fontSize: { xs: "2rem", md: "3rem" }
                  }}
                >
                  Termos de Uso e Política de Privacidade
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                  Última atualização: 7 de julho de 2025
                </Typography>
                
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => window.print()}
                  >
                    Imprimir Documento
                  </Button>
                  
                  <PDFDownloadLink 
                    document={<TermsPDFDocument />} 
                    fileName="Termos_e_Privacidade_Connection_Mozambique.pdf"
                  >
                    {({ loading }) => (
                      <Button
                        variant="contained"
                        disabled={loading}
                      >
                        {loading ? 'Preparando PDF...' : 'Baixar como PDF'}
                      </Button>
                    )}
                  </PDFDownloadLink>
                </Stack>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Terms of Use Section */}
              <Typography variant="h4" sx={{ 
                fontWeight: "bold", 
                color: theme.palette.primary.dark,
                mb: 3,
                padding: "8px 16px",
                backgroundColor: theme.palette.primary.light,
                borderRadius: "4px"
              }}>
                TERMOS DE USO
              </Typography>

              {/* Introduction */}
              <Box id="introduction" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                  1. Introdução
                </Typography>
                <Typography paragraph>
                  A Connection Mozambique Lda. é uma plataforma digital que
                  facilita a conexão entre empresas através de pedidos de
                  cotações, concursos públicos e divulgação de produtos e
                  serviços.
                </Typography>
                <Typography paragraph>
                  Ao aceder ou utilizar a plataforma, o utilizador concorda com
                  os presentes Termos de Uso e Política de Privacidade. Caso não
                  concorde, não utilize a plataforma.
                </Typography>
              </Box>

              {/* Image and Data Usage - NOVA SEÇÃO */}
              <Box id="image-usage" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ImageIcon sx={{ color: theme.palette.primary.main }} />
                  2. Uso de Imagens e Dados das Empresas
                </Typography>
                
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                  <Typography variant="body2">
                    <strong>Importante:</strong> Ao cadastrar sua empresa, você autoriza o uso de dados não sensíveis para promoção e visibilidade do seu negócio.
                  </Typography>
                </Alert>
                
                <Typography paragraph>
                  Ao cadastrar sua empresa na plataforma Connection Mozambique, você autoriza o uso das seguintes informações 
                  e elementos visuais:
                </Typography>
                <List sx={{ listStyleType: "disc", pl: 4 }}>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Logotipo da empresa" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Nome comercial e/ou razão social" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Imagens institucionais e de produtos/serviços" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Descrições e informações cadastrais não sensíveis" />
                  </ListItem>
                </List>
                <Typography paragraph sx={{ mt: 2 }}>
                  Estes dados serão utilizados exclusivamente para fins de <strong>promoção, visibilidade e crescimento da sua empresa na plataforma</strong>,
                  bem como para o desenvolvimento e melhoria dos serviços oferecidos pela Connection Mozambique.
                </Typography>
                <Box sx={{ 
                  bgcolor: '#e8f5e9', 
                  p: 2, 
                  borderRadius: 2, 
                  mt: 2,
                  borderLeft: `4px solid ${theme.palette.success.main}`
                }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingUpIcon color="success" />
                    <strong>Benefício para sua empresa:</strong> O uso dessas informações aumenta a exposição da sua empresa 
                    para potenciais clientes e parceiros de negócio, contribuindo para networking e oportunidades comerciais.
                  </Typography>
                </Box>
                <Typography paragraph sx={{ mt: 2 }}>
                  A Connection Mozambique não compartilha dados sensíveis (como informações bancárias, senhas, documentos pessoais) 
                  e mantém o compromisso com a segurança das informações.
                </Typography>
              </Box>

              {/* Eligibility */}
              <Box id="eligibility" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                  3. Elegibilidade
                </Typography>
                <Typography paragraph>
                  Para utilizar a plataforma, os utilizadores devem:
                </Typography>
                <List sx={{ listStyleType: "disc", pl: 4 }}>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Ter pelo menos 18 anos de idade" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Possuir NUIT e NUEL válidos da empresa" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Fornecer informações verdadeiras e precisas" />
                  </ListItem>
                </List>
              </Box>

              {/* Account Management */}
              <Box id="account-management" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                  4. Gestão de Contas
                </Typography>
                <Typography paragraph>
                  Para criar uma conta, é necessário fornecer:
                </Typography>
                <List sx={{ listStyleType: "disc", pl: 4 }}>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Nome da empresa, NUIT, NUEL" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Contacto e e-mail válidos" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Logotipo da empresa" />
                  </ListItem>
                </List>
                <Typography paragraph sx={{ mt: 2 }}>
                  O utilizador é responsável pela segurança da sua conta e deve
                  notificar imediatamente qualquer uso não autorizado.
                </Typography>
              </Box>

              {/* User Obligations */}
              <Box id="user-obligations" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                  5. Obrigações do Utilizador
                </Typography>
                <Typography paragraph>
                  Os utilizadores concordam em:
                </Typography>
                <List sx={{ listStyleType: "disc", pl: 4 }}>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Não utilizar a plataforma para fins ilegais" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Não publicar conteúdos ofensivos ou falsos" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Manter informações precisas e atualizadas" />
                  </ListItem>
                </List>
              </Box>

              {/* Intellectual Property */}
              <Box id="intellectual-property" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                  6. Propriedade Intelectual
                </Typography>
                <Typography paragraph>
                  Todos os direitos da plataforma pertencem à Connection
                  Mozambique. O conteúdo publicado pelos utilizadores continua
                  sendo de sua responsabilidade.
                </Typography>
              </Box>

              {/* Payments */}
              <Box id="payments" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                  7. Pagamentos
                </Typography>
                <Typography paragraph>
                  Algumas funcionalidades requerem pagamento via:
                </Typography>
                <List sx={{ listStyleType: "disc", pl: 4 }}>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="E-mola, M-pesa ou Mkesh" />
                  </ListItem>
                </List>
              </Box>

              {/* Termination */}
              <Box id="termination" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                  8. Suspensão e Cancelamento
                </Typography>
                <Typography paragraph>
                  Reservamo-nos o direito de suspender contas em caso de:
                </Typography>
                <List sx={{ listStyleType: "disc", pl: 4 }}>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Violação dos Termos" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Atividades fraudulentas" />
                  </ListItem>
                </List>
              </Box>

              {/* Modules */}
              <Box id="modules" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                  9. Módulos
                </Typography>
                <Typography paragraph>
                  Oferecemos diversos módulos incluindo:
                </Typography>
                <List sx={{ listStyleType: "disc", pl: 4 }}>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Proforma, Marketplace, Anúncios" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="SMS, Call Center, Recrutamento" />
                  </ListItem>
                </List>
              </Box>

              {/* Privacy Policy Section */}
              <Typography variant="h4" sx={{ 
                fontWeight: "bold", 
                color: theme.palette.primary.dark,
                mb: 3,
                mt: 6,
                padding: "8px 16px",
                backgroundColor: theme.palette.primary.light,
                borderRadius: "4px"
              }}>
                POLÍTICA DE PRIVACIDADE
              </Typography>

              {/* Data Collection */}
              <Box id="data-collection" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                  1. Dados Coletados
                </Typography>
                <Typography paragraph>
                  Coletamos os seguintes dados para fornecer nossos serviços:
                </Typography>
                <List sx={{ listStyleType: "disc", pl: 4 }}>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Informações da empresa (nome, NUIT, NUEL) - dados institucionais" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Logotipo, imagens e elementos visuais da marca" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Dados de contacto (e-mail, telefone)" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Informações de localização (província, distrito)" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Dados de navegação e interação na plataforma" />
                  </ListItem>
                </List>
              </Box>

              {/* Non-Sensitive Data Usage - NOVA SEÇÃO */}
              <Box id="data-non-sensitive" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon sx={{ color: theme.palette.primary.main }} />
                  2. Uso de Dados Não Sensíveis para Divulgação
                </Typography>
                
                <Typography paragraph>
                  A Connection Mozambique utiliza os dados institucionais e imagens fornecidos pelas empresas para fins de 
                  <strong> divulgação, promoção e crescimento mútuo</strong>. Estes dados são considerados <strong>não sensíveis</strong> e incluem:
                </Typography>
                <List sx={{ listStyleType: "disc", pl: 4 }}>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Logotipo e identidade visual da empresa" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Nome, sigla e descrição institucional" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Imagens de produtos, serviços e instalações" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Informações de contacto empresarial" />
                  </ListItem>
                </List>
                
                <Box sx={{ 
                  bgcolor: '#fff3e0', 
                  p: 2, 
                  borderRadius: 2, 
                  mt: 2,
                  borderLeft: `4px solid ${theme.palette.warning.main}`
                }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VisibilityIcon color="warning" />
                    <strong>Finalidade da Divulgação:</strong> Estes elementos são essenciais para a funcionalidade da plataforma, 
                    permitindo que outras empresas encontrem e se conectem com seus negócios.
                  </Typography>
                </Box>
                
                <Typography paragraph sx={{ mt: 2 }}>
                  Ao aderir à plataforma, você concorda que estes dados possam ser exibidos publicamente e utilizados 
                  para fins de marketing e crescimento da rede Connection Mozambique.
                </Typography>
              </Box>

              {/* Cookies */}
              <Box id="cookies" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                  3. Cookies
                </Typography>
                <Typography paragraph>
                  Utilizamos cookies para:
                </Typography>
                <List sx={{ listStyleType: "disc", pl: 4 }}>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Lembrar preferências e login" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Personalizar conteúdo" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Melhorar desempenho da plataforma" />
                  </ListItem>
                </List>
                <Typography paragraph sx={{ mt: 2 }}>
                  Pode gerir as preferências de cookies nas configurações do seu navegador.
                </Typography>
              </Box>

              {/* Data Sharing */}
              <Box id="data-sharing" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                  4. Compartilhamento de Dados
                </Typography>
                <Typography paragraph>
                  Não compartilhamos dados sensíveis com terceiros. Dados não sensíveis (como logotipo, nome e imagens) são:
                </Typography>
                <List sx={{ listStyleType: "disc", pl: 4 }}>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Exibidos publicamente para promover sua empresa na plataforma" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Compartilhados com potenciais clientes e parceiros dentro da plataforma" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Utilizados para melhorar a experiência de negócios" />
                  </ListItem>
                </List>
              </Box>

              {/* Data Security */}
              <Box id="data-security" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                  5. Segurança de Dados
                </Typography>
                <Typography paragraph>
                  Implementamos medidas robustas de segurança incluindo:
                </Typography>
                <List sx={{ listStyleType: "disc", pl: 4 }}>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Criptografia de dados sensíveis" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Autenticação de dois fatores" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Armazenamento seguro com backups" />
                  </ListItem>
                </List>
              </Box>

              {/* User Rights */}
              <Box id="user-rights" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                  6. Direitos do Utilizador
                </Typography>
                <Typography paragraph>
                  De acordo com a LGPD, os utilizadores têm direito a:
                </Typography>
                <List sx={{ listStyleType: "disc", pl: 4 }}>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Acessar e corrigir seus dados" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Solicitar exclusão de dados" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Revogar consentimento" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Solicitar portabilidade de dados" />
                  </ListItem>
                </List>
                <Alert severity="warning" sx={{ mt: 2, borderRadius: 2 }}>
                  <Typography variant="body2">
                    Importante: A exclusão de dados não sensíveis (como logotipo e imagens) pode afetar a visibilidade da sua empresa na plataforma.
                  </Typography>
                </Alert>
              </Box>

              {/* Data Retention */}
              <Box id="data-retention" sx={{ mb: 4 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                  7. Retenção de Dados
                </Typography>
                <Typography paragraph>
                  Mantemos os dados apenas enquanto necessário para:
                </Typography>
                <List sx={{ listStyleType: "disc", pl: 4 }}>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Cumprir obrigações legais" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Manter contratos comerciais" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Prevenir fraudes e melhorar serviços" />
                  </ListItem>
                  <ListItem sx={{ display: "list-item", padding: 0 }}>
                    <ListItemText primary="Promover sua empresa e produtos associados" />
                  </ListItem>
                </List>
              </Box>

              {/* General Provisions */}
              <Box id="general" sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
                  Disposições Gerais
                </Typography>
                <Typography paragraph>
                  <strong>Alterações:</strong> Podemos atualizar estes Termos e
                  Política periodicamente. Notificaremos sobre mudanças
                  significativas.
                </Typography>
                <Typography paragraph>
                  <strong>Jurisdição:</strong> Qualquer disputa será resolvida
                  sob as leis de Moçambique.
                </Typography>
              </Box>

              {/* Contact */}
              <Box id="contact">
                <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
                  Contato
                </Typography>
                <Typography paragraph>
                  Para questões sobre privacidade ou termos de uso:
                </Typography>
                <Typography paragraph>
                  <strong>Endereço:</strong> Av. 25 de setembro, Pemba,
                  Cabo-Delgado, Moçambique
                </Typography>
                <Typography paragraph>
                  <strong>E-mail:</strong>{' '}
                  <Link href="mailto:comercial@connectionmozambique.com">
                    comercial@connectionmozambique.com
                  </Link>
                </Typography>
                <Typography paragraph>
                  <strong>Telefone:</strong>{' '}
                  <Link href="tel:+258866656104">
                    +258 86 665 6104
                  </Link>
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default TermsAndPrivacy;
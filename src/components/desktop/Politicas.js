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
} from "@mui/material";

const Politicas = () => {
  return (
    <Box
      sx={{
        padding: { xs: "20px 0", md: "40px 0" }, // Padding responsivo
      }}
    >
      <Container>
        <Paper
          sx={{
            padding: { xs: "20px", md: "40px" },
            backgroundColor: "#ffffff", // Fundo branco
            borderRadius: "8px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)", // Sombra suave
          }}
        >
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "#003366", // Azul escuro
              marginBottom: "24px",
              textAlign: "center",
            }}>
            Políticas da Plataforma Connection Mozambique
          </Typography>

          {/* Seção 1: Coleta de Dados */}
          <Box sx={{ marginBottom: "24px" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#00509e", marginBottom: "16px" }}>
              1. Coleta de Dados
            </Typography>
            <Typography variant="body1" sx={{ color: "#333333", lineHeight: "1.8" }}>
              A Connections coleta os seguintes dados dos utilizadores:
              <List sx={{ listStyleType: "disc", pl: 4 }}>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Nome completo" />
                </ListItem>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Endereço de e-mail" />
                </ListItem>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Número de Identificação Fiscal (NUIT)" />
                </ListItem>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Número de telefone" />
                </ListItem>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Informacoes de Localizacao" />
                </ListItem>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Endereço físico" />
                </ListItem>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Logotipo da empresa (opcional)" />
                </ListItem>
              </List>
              Esses dados são coletados para garantir a prestação eficiente dos serviços oferecidos pela plataforma.
            </Typography>
          </Box>

          {/* Seção 2: Uso dos Dados Coletados */}
          <Box sx={{ marginBottom: "24px" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#00509e", marginBottom: "16px" }}>
              2. Uso dos Dados Coletados
            </Typography>
            <Typography variant="body1" sx={{ color: "#333333", lineHeight: "1.8" }}>
              Os dados coletados são utilizados para os seguintes fins:
              <List sx={{ listStyleType: "disc", pl: 4 }}>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Criação e gestão de contas de utilizadores." />
                </ListItem>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Facilitação de interações comerciais, como pedidos de cotação e concursos públicos." />
                </ListItem>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Melhoria contínua dos serviços oferecidos pela plataforma." />
                </ListItem>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Comunicação com os utilizadores sobre atualizações, promoções e suporte." />
                </ListItem> 
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Segmentação de anuncios de utilidade na plataforma." />
                </ListItem>
              </List>
              Os dados não serão compartilhados com terceiros sem o consentimento explícito do utilizador.
            </Typography>
          </Box>

          {/* Seção 3: Pagamentos */}
          <Box sx={{ marginBottom: "24px" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#00509e", marginBottom: "16px" }}>
              3. Pagamentos
            </Typography>
            <Typography variant="body1" sx={{ color: "#333333", lineHeight: "1.8" }}>
              A Connections oferece serviços pagos, como assinaturas premium e acesso a módulos específicos. Os pagamentos
              podem ser realizados através de:
              <List sx={{ listStyleType: "disc", pl: 4 }}>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Transferência bancária." />
                </ListItem>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Pagamento móvel (M-Pesa, E-Mola, etc.)." />
                </ListItem>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Cartões de crédito/débito (em breve)." />
                </ListItem>
              </List>
              Todos os pagamentos são processados de forma segura, com criptografia de dados.
            </Typography>
          </Box>

          {/* Seção 4: Reembolsos */}
          <Box sx={{ marginBottom: "24px" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#00509e", marginBottom: "16px" }}>
              4. Reembolsos
            </Typography>
            <Typography variant="body1" sx={{ color: "#333333", lineHeight: "1.8" }}>
              Em caso de insatisfação ou dificuldade no acesso à plataforma, os utilizadores podem solicitar reembolsos:
              <List sx={{ listStyleType: "disc", pl: 4 }}>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Reembolsos monetários: Até 60% do valor pago poderá ser devolvido, mediante análise." />
                </ListItem>
                
              </List>
              Para solicitar um reembolso, entre em contato com o suporte através do e-mail:  
<a href="mailto:suporte@mozambique.com">suporte@mozambique.com</a>
            </Typography>
          </Box>

          {/* Seção 5: Módulos e Seus Usos */}
          <Box sx={{ marginBottom: "24px" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#00509e", marginBottom: "16px" }}>
              5. Módulos e Seus Usos
            </Typography>
            <Typography variant="body1" sx={{ color: "#333333", lineHeight: "1.8" }}>
              A plataforma Connections oferece os seguintes módulos:
              <List sx={{ listStyleType: "disc", pl: 4 }}>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Módulo de Cotações: Permite a criação e gestão de pedidos de cotação." />
                </ListItem>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Módulo de Concursos: Facilita a participação em concursos públicos." />
                </ListItem>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Módulo de Análise: Oferece ferramentas para análise de dados e relatórios." />
                </ListItem>
              </List>
              Cada módulo é projetado para atender às necessidades específicas das empresas, garantindo eficiência e praticidade.
            </Typography>
          </Box>

          {/* Seção 6: Senhas */}
          <Box sx={{ marginBottom: "24px" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#00509e", marginBottom: "16px" }}>
              6. Senhas
            </Typography>
            <Typography variant="body1" sx={{ color: "#333333", lineHeight: "1.8" }}>
              Para garantir a segurança das contas, os utilizadores devem:
              <List sx={{ listStyleType: "disc", pl: 4 }}>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Criar senhas fortes, com pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos." />
                </ListItem>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Não compartilhar senhas com terceiros." />
                </ListItem>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Alterar a senha periodicamente." />
                </ListItem>
              </List>
              A Connections não solicita senhas por e-mail ou telefone.
            </Typography>
          </Box>

          {/* Seção 7: Segurança e Privacidade de Dados */}
          <Box sx={{ marginBottom: "24px" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#00509e", marginBottom: "16px" }}>
              7. Segurança e Privacidade de Dados
            </Typography>
            <Typography variant="body1" sx={{ color: "#333333", lineHeight: "1.8" }}>
              A Connections utiliza medidas de segurança avançadas para proteger os dados dos utilizadores, incluindo:
              <List sx={{ listStyleType: "disc", pl: 4 }}>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Criptografia de dados em trânsito e em repouso." />
                </ListItem>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Firewalls e sistemas de detecção de intrusões." />
                </ListItem>
                <ListItem sx={{ display: "list-item", padding: 0 }}>
                  <ListItemText primary="Auditorias regulares de segurança." />
                </ListItem>
              </List>
              A privacidade dos utilizadores é uma prioridade, e os dados são tratados de acordo com as leis de proteção de dados aplicáveis.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Politicas;
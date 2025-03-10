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

const Terms = () => {
  return (
    <Box
      sx={{
        backgroundColor: "#f5f7fa", // Fundo claro e suave
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
          {/* Título Principal */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: "bold",
              color: "#003366", // Azul escuro
              marginBottom: "24px",
              textAlign: "center",
            }}>
            Termos de Uso da Plataforma Connections
          </Typography>

          {/* Seção 1: Aceitação dos Termos */}
          <Box sx={{ marginBottom: "24px" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#00509e", marginBottom: "16px" }}>
              1. Aceitação dos Termos
            </Typography>
            <Typography variant="body1" sx={{ color: "#333333", lineHeight: "1.8" }}>
              Ao utilizar a plataforma Connections, os utilizadores concordam com os presentes Termos de Uso, que regem o uso
              dos serviços oferecidos, como pedidos de cotação e participação em concursos públicos.
            </Typography>
          </Box>

          {/* Seção 2: Descrição dos Serviços */}
          <Box sx={{ marginBottom: "24px" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#00509e", marginBottom: "16px" }}>
              2. Descrição dos Serviços
            </Typography>
            <Typography variant="body1" sx={{ color: "#333333", lineHeight: "1.8" }}>
              Connections facilita a conexão entre empresas do setor público e privado em Moçambique, permitindo interações
              comerciais como pedidos de cotação e concursos públicos.
            </Typography>
          </Box>

          {/* Seção 3: Regras de Utilização */}
          <Box sx={{ marginBottom: "24px" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#00509e", marginBottom: "16px" }}>
              3. Regras de Utilização
            </Typography>
            <List sx={{ listStyleType: "disc", pl: 4 }}>
              <ListItem sx={{ display: "list-item", padding: 0 }}>
                <ListItemText primary="Os utilizadores devem fornecer informações precisas ao criar contas e utilizar os serviços." />
              </ListItem>
              <ListItem sx={{ display: "list-item", padding: 0 }}>
                <ListItemText primary="É proibido uso indevido da plataforma, envio de spam, práticas de hacking ou qualquer ação que comprometa a integridade da plataforma." />
              </ListItem>
            </List>
          </Box>

          {/* Seção 4: Coleta de Dados */}
          <Box sx={{ marginBottom: "24px" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#00509e", marginBottom: "16px" }}>
              4. Coleta de Dados
            </Typography>
            <Typography variant="body1" sx={{ color: "#333333", lineHeight: "1.8" }}>
              Recolhemos dados como nome, email, NUIT, contacto, endereço e logotipo das empresas, conforme detalhado na{" "}
              <Link href="/politicas" color="primary" underline="hover">
                Política de Privacidade
              </Link>.
            </Typography>
          </Box>

          {/* Seção 5: Limitação de Responsabilidade */}
          <Box sx={{ marginBottom: "24px" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#00509e", marginBottom: "16px" }}>
              5. Limitação de Responsabilidade
            </Typography>
            <Typography variant="body1" sx={{ color: "#333333", lineHeight: "1.8" }}>
              A Connections não se responsabiliza por danos causados por falhas no serviço ou pelo uso indevido da plataforma.
              A responsabilidade será limitada conforme permitido pela lei aplicável.
            </Typography>
          </Box>

          {/* Seção 6: Cancelamento ou Suspensão de Contas */}
          <Box sx={{ marginBottom: "24px" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#00509e", marginBottom: "16px" }}>
              6. Cancelamento ou Suspensão de Contas
            </Typography>
            <Typography variant="body1" sx={{ color: "#333333", lineHeight: "1.8" }}>
              O cancelamento de contas requer uma justificativa plausível e será analisado caso a caso.
            </Typography>
          </Box>

          {/* Seção 7: Pagamentos e Política de Reembolso */}
          <Box sx={{ marginBottom: "24px" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#00509e", marginBottom: "16px" }}>
              7. Pagamentos e Política de Reembolso
            </Typography>
            <Typography variant="body1" sx={{ color: "#333333", lineHeight: "1.8" }}>
              Os pagamentos são feitos mediante acordo entre as empresas. Em situações de dificuldade no acesso à plataforma,
              os reembolsos podem ser realizados na forma de outros serviços dentro da plataforma. Para reembolsos monetários,
              até 60% do valor poderá ser devolvido.
            </Typography>
          </Box>

          {/* Seção 8: Alterações aos Termos */}
          <Box sx={{ marginBottom: "24px" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#00509e", marginBottom: "16px" }}>
              8. Alterações aos Termos
            </Typography>
            <Typography variant="body1" sx={{ color: "#333333", lineHeight: "1.8" }}>
              Os Termos de Uso podem ser alterados, com notificação prévia aos utilizadores através da plataforma.
            </Typography>
          </Box>

          {/* Seção 9: Informações Legais */}
          <Box sx={{ marginBottom: "24px" }}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#00509e", marginBottom: "16px" }}>
              9. Informações Legais
            </Typography>
            <Typography variant="body1" sx={{ color: "#333333", lineHeight: "1.8" }}>
              A sede da Connections está localizada em Pemba, Av. 25 de setembro, Moçambique. As disputas relacionadas ao uso
              da plataforma serão resolvidas sob a jurisdição das leis de Moçambique.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Terms;
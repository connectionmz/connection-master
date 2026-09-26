import React, { useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Button,
} from '@mui/material';
import { Search, ExpandMore, Email, Phone } from '@mui/icons-material';
import BackButton from '../BackButton';

const GOLD = '#C8903A';

const FAQ_ITEMS = [
  {
    category: 'Geral',
    question: 'O que é a Connection Mozambique?',
    answer: 'É uma plataforma que liga empresas em Moçambique a fornecedores, clientes e oportunidades de negócio — pedidos de cotação, um mercado de lojas, concursos públicos e entre empresas, e recrutamento, tudo num só lugar.',
  },
  {
    category: 'Geral',
    question: 'Preciso de verificar a minha conta para usar a plataforma?',
    answer: 'Pode navegar e explorar sem verificação, mas algumas funcionalidades — como publicar ou responder a cotações — exigem que a sua empresa esteja verificada. Encontra o estado da verificação e como avançar em "Perfil".',
  },
  {
    category: 'Cotações',
    question: 'Como publico um pedido de cotação?',
    answer: 'Em "Cotações" → "Novo Pedido", descreva o que precisa, o setor e o prazo. O pedido fica visível às empresas fornecedoras desse setor, que podem enviar propostas diretamente na plataforma.',
  },
  {
    category: 'Cotações',
    question: 'Como aceito ou recuso uma proposta recebida?',
    answer: 'Abra o pedido de cotação, veja as propostas em "Propostas Recebidas" e escolha aceitar ou recusar cada uma. Ao aceitar uma proposta, as restantes ficam automaticamente marcadas como recusadas.',
  },
  {
    category: 'Concursos',
    question: 'Qual a diferença entre "Concursos" e "Concursos (Empresas)"?',
    answer: '"Concursos" mostra os concursos públicos oficiais publicados pela UFSA (Unidade Funcional de Supervisão das Aquisições), atualizados automaticamente. "Concursos (Empresas)" são concursos publicados diretamente por outras empresas na plataforma.',
  },
  {
    category: 'Concursos',
    question: 'Preciso pagar para ver os concursos da UFSA?',
    answer: 'Não — a consulta dos concursos públicos é gratuita para todas as contas verificadas, porque essa informação já é pública. O módulo Alertas é opcional e serve apenas para receber um resumo por email sempre que surgem concursos novos, em vez de ter de consultar a página manualmente.',
  },
  {
    category: 'Módulos e pagamentos',
    question: 'O que é o módulo Alertas?',
    answer: 'É um módulo opcional que envia notificações (email e, dependendo do plano, SMS) sempre que surgem novas cotações ou concursos relevantes para a sua empresa, para não ter de verificar a plataforma constantemente.',
  },
  {
    category: 'Módulos e pagamentos',
    question: 'Que formas de pagamento são aceites?',
    answer: 'Os módulos pagos podem ser ativados por M-Pesa e outras formas de pagamento móvel. Após a confirmação do pagamento, o módulo fica ativo na sua conta automaticamente.',
  },
  {
    category: 'Mercado e lojas',
    question: 'Como crio uma loja no Mercado?',
    answer: 'Em "Lojas" → "Criar Loja", preencha os dados do seu negócio e adicione produtos. A sua loja fica visível a outras empresas e clientes que pesquisem por província ou categoria.',
  },
  {
    category: 'Conta e segurança',
    question: 'Esqueci-me da password. Como recupero o acesso?',
    answer: 'Na página de entrada, escolha "Esqueci-me da password" e siga as instruções enviadas para o email associado à conta.',
  },
  {
    category: 'Conta e segurança',
    question: 'Como mudo entre modo claro e escuro?',
    answer: 'Use o botão de tema no canto inferior direito da página, disponível em qualquer ecrã da plataforma.',
  },
];

const CATEGORIES = ['Todas', ...new Set(FAQ_ITEMS.map((item) => item.category))];

const Faq = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('Todas');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return FAQ_ITEMS.filter((item) => {
      const matchesCategory = category === 'Todas' || item.category === category;
      const matchesSearch = !term
        || item.question.toLowerCase().includes(term)
        || item.answer.toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [search, category]);

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: { xs: 4, md: 6 } }}>
      <Container maxWidth="md">
        <BackButton sx={{ mb: 2 }} />

        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography
            component="h1"
            variant="h3"
            sx={{ fontWeight: 800, color: 'text.primary', fontSize: { xs: '1.8rem', sm: '2.4rem' } }}
          >
            Perguntas Frequentes
          </Typography>
          <Typography sx={{ color: 'text.secondary', mt: 1.5, maxWidth: 560, mx: 'auto' }}>
            Respostas rápidas sobre cotações, concursos, módulos e a sua conta. Não encontrou o que procurava? Contacte o nosso suporte no final da página.
          </Typography>
        </Box>

        <TextField
          fullWidth
          placeholder="Pesquisar uma pergunta..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 4 }}>
          {CATEGORIES.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onClick={() => setCategory(cat)}
              sx={{
                fontWeight: 600,
                bgcolor: category === cat ? GOLD : 'background.paper',
                color: category === cat ? '#08192E' : 'text.secondary',
                border: '1px solid',
                borderColor: category === cat ? GOLD : 'divider',
                '&:hover': { bgcolor: category === cat ? GOLD : 'action.hover' },
              }}
            />
          ))}
        </Stack>

        {filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography sx={{ color: 'text.secondary' }}>
              Nenhuma pergunta encontrada para "{search}".
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {filtered.map((item) => (
              <Accordion
                key={item.question}
                disableGutters
                sx={{
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '12px !important',
                  overflow: 'hidden',
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary expandIcon={<ExpandMore sx={{ color: GOLD }} />}>
                  <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                    {item.question}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography sx={{ color: 'text.secondary', lineHeight: 1.7 }}>
                    {item.answer}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        )}

        <Box
          sx={{
            mt: 6,
            p: { xs: 3, sm: 4 },
            textAlign: 'center',
            borderRadius: '16px',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>
            Ainda tem dúvidas?
          </Typography>
          <Typography sx={{ color: 'text.secondary', mb: 3 }}>
            A nossa equipa de suporte está disponível para ajudar.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              startIcon={<Email />}
              href="mailto:admin@connectionmozambique.com"
              sx={{ bgcolor: GOLD, color: '#08192E', fontWeight: 700, '&:hover': { bgcolor: '#E8B96A' } }}
            >
              Enviar email
            </Button>
            <Button
              variant="outlined"
              startIcon={<Phone />}
              href="tel:+258866556104"
              sx={{ borderColor: 'divider', color: 'text.primary' }}
            >
              +258 86 655 6104
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
};

export default Faq;

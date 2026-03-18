import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Link,
  IconButton,
  Grid,
  Divider,
  Button,
  TextField,
  InputAdornment,
  Paper,
  Chip,
  useMediaQuery,
  useTheme
} from "@mui/material";
import {
  Facebook,
  Instagram,
  LinkedIn,
  Language,
  WhatsApp,
  Email,
  Phone,
  LocationOn,
  Send,
  ArrowForward,
  ArrowUpward,
  Business,
  Security,
  Help,
  PrivacyTip,
  Description,
  Storefront,
  RequestQuote,
  Handyman,
  Verified
} from "@mui/icons-material";
import { X, Mail, MapPin, Phone as PhoneIcon, Clock, Award, Shield, Users } from "lucide-react";

/* ── Design Tokens (mesmos da hero) ───────────────────────────────────── */
const T = {
  navy:     '#08192E',
  navyMid:  '#0E2849',
  navyLight:'#183A63',
  gold:     '#C8903A',
  goldLight:'#E8B96A',
  goldPale: '#FDF3E3',
  cream:    '#FAFAF7',
  white:    '#FFFFFF',
  text:     '#0F1C2D',
  textMid:  '#3D5A7A',
  textSub:  '#6B89A5',
  border:   '#E0E8F0',
  borderMid:'#C5D4E3',
  surface:  '#F4F7FB',
};

/* ── Keyframes ────────────────────────────────────────────────────────── */
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes pulse-gold {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.8; transform: scale(0.95); }
  }
  .animate-fade-up {
    animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) both;
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.22s; }
  .delay-3 { animation-delay: 0.34s; }
  
  .footer-link {
    transition: all 0.2s ease;
    position: relative;
  }
  .footer-link:hover {
    color: ${T.gold} !important;
    transform: translateX(4px);
  }
  .footer-link::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 0;
    height: 2px;
    background: ${T.gold};
    transition: width 0.2s ease;
  }
  .footer-link:hover::after {
    width: 100%;
  }
  .social-icon {
    transition: all 0.2s ease;
  }
  .social-icon:hover {
    transform: translateY(-4px);
    filter: drop-shadow(0 4px 8px rgba(200,144,58,0.3));
  }
  .newsletter-input {
    transition: all 0.2s ease;
  }
  .newsletter-input:hover, .newsletter-input:focus-within {
    border-color: ${T.gold} !important;
    box-shadow: 0 0 0 3px ${T.goldPale} !important;
  }
`;

const FooterDesk = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [email, setEmail] = React.useState("");
  const [showScrollTop, setShowScrollTop] = React.useState(false);

  // Detectar scroll para mostrar botão
  React.useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      // Aqui você pode adicionar a lógica para salvar o email
      console.log("Newsletter subscribed:", email);
      setEmail("");
      alert("Obrigado por se inscrever na nossa newsletter!");
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const quickLinks = [
    { label: "Início", path: "/", icon: <Business fontSize="small" /> },
    { label: "Explorar Empresas", path: "/explorar", icon: <Storefront fontSize="small" /> },
    { label: "Cotações", path: "/cotacoes", icon: <RequestQuote fontSize="small" /> },
    { label: "Serviços", path: "/servicos", icon: <Handyman fontSize="small" /> },
    { label: "Sobre Nós", path: "/sobre", icon: <Users size={16} /> },
    { label: "Contacto", path: "/contacto", icon: <Phone fontSize="small" /> },
  ];

  const legalLinks = [
    { label: "Termos e Condições", path: "/termos", icon: <Description fontSize="small" /> },
    { label: "Política de Privacidade", path: "/privacidade", icon: <PrivacyTip fontSize="small" /> },
    { label: "Política de Cookies", path: "/cookies", icon: <Security fontSize="small" /> },
    { label: "FAQ", path: "/faq", icon: <Help fontSize="small" /> },
  ];

  const contactInfo = [
    { icon: <LocationOn />, text: "Av. 24 de Julho, 123 - Maputo, Moçambique", link: null },
    { icon: <Phone />, text: "+258 21 123 456", link: "tel:+25821123456" },
    { icon: <Email />, text: "admin@connectionmozambique.com", link: "mailto:admin@connectionmozambique.co.mz" },
    { icon: <Clock />, text: "Seg - Sex: 8:00 - 17:00", link: null },
  ];

  const socialLinks = [
    { icon: <Facebook />, url: "https://facebook.com/connectionmozambique", label: "Facebook", color: "#1877F2" },
    { icon: <Instagram />, url: "https://instagram.com/connectionmozambique", label: "Instagram", color: "#E4405F" },
    { icon: <LinkedIn />, url: "https://linkedin.com/company/connectionmozambique", label: "LinkedIn", color: "#0A66C2" },
    { icon: <X />, url: "https://x.com/connectionmozambique", label: "X (Twitter)", color: "#000000" },
    { icon: <WhatsApp />, url: "https://wa.me/25821123456", label: "WhatsApp", color: "#25D366" },
    { icon: <Language />, url: "https://connectionmozambique.co.mz", label: "Website", color: T.gold },
  ];

  const certificates = [
    "Empresa Verificada",
    "Selos de Qualidade",
    "Parceiro Oficial"
  ];

  return (
    <Box 
      sx={{ 
        backgroundColor: T.navy, 
        color: T.white,
        position: 'relative',
        overflow: 'hidden',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        borderTop: `1px solid rgba(200,144,58,0.2)`,
      }}
    >
      <style>{KEYFRAMES}</style>

      {/* Background Decorations (mesmas da hero) */}
      <Box sx={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: `
          radial-gradient(ellipse 80% 60% at 90% 10%, rgba(200,144,58,0.08) 0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 5% 90%, rgba(200,144,58,0.05) 0%, transparent 50%)
        `,
      }} />
      
      <Box sx={{
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.02,
        backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
        backgroundSize: '56px 56px',
      }} />

      {/* Floating decoration */}
      <Box sx={{
        position: 'absolute',
        right: '2%',
        bottom: '10%',
        width: 200,
        height: 200,
        borderRadius: '50%',
        border: `1px solid rgba(200,144,58,0.1)`,
        animation: 'float 8s ease-in-out infinite',
      }} />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2, py: { xs: 4, md: 6 } }}>
        
        {/* Newsletter Section */}
        <Paper
          className="animate-fade-up"
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 5,
            borderRadius: '24px',
            background: `linear-gradient(135deg, ${T.navyLight} 0%, ${T.navyMid} 100%)`,
            border: `1px solid rgba(200,144,58,0.3)`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={7}>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 700,
                  color: T.white,
                  mb: 1
                }}
              >
                Fique por dentro das novidades
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Receba as melhores ofertas e oportunidades de negócio diretamente no seu email.
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <form onSubmit={handleNewsletterSubmit}>
                <TextField
                  fullWidth
                  placeholder="Seu melhor email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  variant="outlined"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'rgba(255,255,255,0.05)',
                      borderRadius: '14px',
                      '&:hover fieldset': {
                        borderColor: T.gold,
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: T.gold,
                        borderWidth: '2px',
                      },
                    },
                    '& input': {
                      color: T.white,
                      '&::placeholder': {
                        color: 'rgba(255,255,255,0.5)',
                        opacity: 1,
                      },
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Button
                          type="submit"
                          variant="contained"
                          endIcon={<Send />}
                          sx={{
                            bgcolor: T.gold,
                            color: T.white,
                            '&:hover': { bgcolor: T.goldLight },
                            borderRadius: '10px',
                            textTransform: 'none',
                            fontWeight: 600,
                            px: 3,
                          }}
                        >
                          {!isMobile && "Inscrever"}
                        </Button>
                      </InputAdornment>
                    ),
                  }}
                />
              </form>
            </Grid>
          </Grid>
        </Paper>

        {/* Main Footer Content */}
        <Grid container spacing={4} sx={{ mb: 4 }}>
          
          {/* About Section */}
          <Grid item xs={12} md={4}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 800,
                  color: T.white,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Box component="span" sx={{ color: T.gold }}>Connection Mozambique</Box>
                
              </Typography>
              
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, mb: 3 }}>
                A maior plataforma empresarial de Moçambique. Conectamos compradores a fornecedores verificados, facilitando negócios e impulsionando a economia nacional.
              </Typography>

              {/* Certificações */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                {certificates.map((cert, index) => (
                  <Chip
                    key={index}
                    icon={<Verified sx={{ fontSize: 14, color: T.gold }} />}
                    label={cert}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(200,144,58,0.1)',
                      color: T.goldLight,
                      border: `1px solid rgba(200,144,58,0.3)`,
                      '& .MuiChip-icon': { color: T.gold }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: T.gold,
                mb: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontSize: '0.85rem'
              }}
            >
              Links Rápidos
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {quickLinks.map((link, index) => (
                <Link
                  key={index}
                  component="button"
                  onClick={() => handleNavigation(link.path)}
                  className="footer-link"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: 'rgba(255,255,255,0.6)',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    textAlign: 'left',
                    '&:hover': { color: T.gold }
                  }}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </Box>
          </Grid>

          {/* Legal */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: T.gold,
                mb: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontSize: '0.85rem'
              }}
            >
              Informações Legais
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {legalLinks.map((link, index) => (
                <Link
                  key={index}
                  component="button"
                  onClick={() => handleNavigation(link.path)}
                  className="footer-link"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: 'rgba(255,255,255,0.6)',
                    textDecoration: 'none',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    textAlign: 'left',
                    '&:hover': { color: T.gold }
                  }}
                >
                  {link.icon}
                  {link.label}
                </Link>
              ))}
            </Box>
          </Grid>

          {/* Contact Info */}
          <Grid item xs={12} md={4}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: T.gold,
                mb: 2,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontSize: '0.85rem'
              }}
            >
              Contactos
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {contactInfo.map((info, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box sx={{ color: T.gold, minWidth: 24 }}>{info.icon}</Box>
                  {info.link ? (
                    <Link
                      href={info.link}
                      sx={{
                        color: 'rgba(255,255,255,0.6)',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        '&:hover': { color: T.gold }
                      }}
                    >
                      {info.text}
                    </Link>
                  ) : (
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                      {info.text}
                    </Typography>
                  )}
                </Box>
              ))}
            </Box>

            {/* Social Media */}
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  color: 'rgba(255,255,255,0.4)',
                  mb: 2,
                  fontSize: '0.8rem',
                  letterSpacing: '0.06em'
                }}
              >
                SIGA-NOS
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {socialLinks.map((social, index) => (
                  <IconButton
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="social-icon"
                    aria-label={social.label}
                    sx={{
                      color: 'rgba(255,255,255,0.7)',
                      bgcolor: 'rgba(255,255,255,0.05)',
                      '&:hover': {
                        color: social.color,
                        bgcolor: 'rgba(255,255,255,0.1)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {social.icon}
                  </IconButton>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Divider */}
        <Divider sx={{ borderColor: 'rgba(200,144,58,0.2)', my: 3 }} />

        {/* Bottom Bar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
            <small>
              © {new Date().getFullYear()} Connection Mozambique, LDA - Plataforma Empresarial de Moçambique. 
              Todos os direitos reservados.
            </small>
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem' }}>
              v2.0.1
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Link
                href="/termos"
                sx={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.7rem',
                  textDecoration: 'none',
                  '&:hover': { color: T.gold }
                }}
              >
                Termos
              </Link>
              <Typography sx={{ color: 'rgba(255,255,255,0.2)' }}>|</Typography>
              <Link
                href="/privacidade"
                sx={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.7rem',
                  textDecoration: 'none',
                  '&:hover': { color: T.gold }
                }}
              >
                Privacidade
              </Link>
              <Typography sx={{ color: 'rgba(255,255,255,0.2)' }}>|</Typography>
              <Link
                href="/cookies"
                sx={{
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: '0.7rem',
                  textDecoration: 'none',
                  '&:hover': { color: T.gold }
                }}
              >
                Cookies
              </Link>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <IconButton
          onClick={handleScrollTop}
          className="animate-float"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            bgcolor: T.gold,
            color: T.white,
            '&:hover': { bgcolor: T.goldLight, transform: 'translateY(-4px)' },
            boxShadow: '0 8px 24px rgba(200,144,58,0.3)',
            zIndex: 1000,
            transition: 'all 0.2s ease',
          }}
        >
          <ArrowUpward />
        </IconButton>
      )}
    </Box>
  );
};

export default FooterDesk;
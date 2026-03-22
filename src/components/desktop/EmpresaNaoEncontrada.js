import React from 'react';
import { 
  Typography, 
  Box, 
  Button, 
  Paper, 
  Container,
  Avatar,
  Fade,
  Zoom,
  useMediaQuery,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import HomeIcon from '@mui/icons-material/Home';
import SearchIcon from '@mui/icons-material/Search';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import { HelpOutline, Business, WarningAmber, SearchOff } from '@mui/icons-material';

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

/* ── Keyframes (mesmos da hero) ───────────────────────────────────────── */
const KEYFRAMES = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(28px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes pulse-gold {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.8; transform: scale(0.98); }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  .animate-fade-up {
    animation: fadeUp 0.65s cubic-bezier(0.22,1,0.36,1) both;
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease both;
  }
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
  .animate-pulse-gold {
    animation: pulse-gold 2s ease-in-out infinite;
  }
  .animate-rotate {
    animation: rotate 3s linear infinite;
  }
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.22s; }
  .delay-3 { animation-delay: 0.34s; }
  .delay-4 { animation-delay: 0.46s; }
  .delay-5 { animation-delay: 0.58s; }
  
  .info-card {
    transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease;
  }
  .info-card:hover {
    transform: translateY(-2px);
    border-color: ${T.gold} !important;
    box-shadow: 0 16px 48px rgba(8,25,46,0.1) !important;
  }
`;

const EmpresaNaoEncontrada = () => {
    const navigate = useNavigate();
    const isMobile = useMediaQuery('(max-width:600px)');

    return (
        <Box 
            sx={{ 
                backgroundColor: T.cream, 
                minHeight: '100vh',
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                display: 'flex',
                alignItems: 'center',
                py: 4
            }}
        >
            <style>{KEYFRAMES}</style>
            
            <Container maxWidth="sm">
                <Fade in={true} timeout={800}>
                    <Paper 
                        elevation={0}
                        className="info-card"
                        sx={{ 
                            p: { xs: 3, md: 5 },
                            borderRadius: '32px',
                            border: `1px solid ${T.border}`,
                            background: T.white,
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Background decoration */}
                        <Box sx={{
                            position: 'absolute',
                            top: -50,
                            right: -50,
                            width: 200,
                            height: 200,
                            borderRadius: '50%',
                            background: `radial-gradient(circle, ${T.goldPale} 0%, transparent 70%)`,
                            opacity: 0.3,
                            pointerEvents: 'none',
                        }} />
                        
                        <Box sx={{ position: 'relative', zIndex: 1 }}>
                            {/* Ícone animado */}
                            <Zoom in={true} timeout={600}>
                                <Avatar
                                    className="animate-float"
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        bgcolor: T.goldPale,
                                        color: T.gold,
                                        mx: 'auto',
                                        mb: 3,
                                        border: `3px solid ${T.gold}`,
                                        boxShadow: '0 8px 24px rgba(200,144,58,0.2)',
                                    }}
                                >
                                    <SearchOff sx={{ fontSize: 48 }} />
                                </Avatar>
                            </Zoom>

                            {/* Badge de erro */}
                            <Chip
                                icon={<WarningAmber sx={{ fontSize: 14 }} />}
                                label="Página Não Encontrada"
                                className="animate-pulse-gold"
                                sx={{
                                    bgcolor: T.goldPale,
                                    color: T.gold,
                                    fontWeight: 700,
                                    fontSize: '0.75rem',
                                    mb: 2,
                                    px: 1,
                                }}
                            />

                            {/* Título */}
                            <Typography 
                                variant="h4" 
                                gutterBottom 
                                sx={{ 
                                    fontWeight: 800,
                                    color: T.text,
                                    fontFamily: '"Playfair Display", serif',
                                    mb: 2
                                }}
                            >
                                404 - Página Não Encontrada
                            </Typography>

                            {/* Descrição principal */}
                            <Typography 
                                variant="body1" 
                                paragraph 
                                sx={{ 
                                    color: T.textMid,
                                    lineHeight: 1.8,
                                    mb: 4,
                                    px: { xs: 1, md: 3 }
                                }}
                            >
                                O perfil ou página que você está procurando não existe, 
                                foi removido ou o endereço digitado está incorreto.
                            </Typography>

                            {/* Card informativo */}
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    borderRadius: '16px',
                                    border: `1px solid ${T.border}`,
                                    background: T.surface,
                                    mb: 4,
                                    textAlign: 'left',
                                    position: 'relative',
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        bottom: 0,
                                        width: 4,
                                        background: `linear-gradient(180deg, ${T.gold} 0%, ${T.goldLight} 100%)`,
                                        borderTopLeftRadius: '16px',
                                        borderBottomLeftRadius: '16px',
                                    }
                                }}
                            >
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                                    <ErrorOutlineIcon sx={{ color: T.gold, fontSize: 28 }} />
                                    <Box>
                                        <Typography 
                                            variant="body1" 
                                            sx={{ 
                                                fontWeight: 600,
                                                color: T.text,
                                                mb: 0.5
                                            }}
                                        >
                                            O que pode ter acontecido?
                                        </Typography>
                                        <Typography 
                                            variant="body2" 
                                            sx={{ 
                                                color: T.textSub,
                                                lineHeight: 1.6
                                            }}
                                        >
                                            • O endereço pode estar incorreto<br />
                                            • A página pode ter sido removida<br />
                                            • O perfil pode não existir mais<br />
                                            • O link pode estar expirado
                                        </Typography>
                                    </Box>
                                </Box>
                            </Paper>

                            {/* Mensagem institucional */}
                            <Typography 
                                variant="body2" 
                                sx={{ 
                                    color: T.textSub,
                                    fontStyle: 'italic',
                                    mb: 3,
                                    fontSize: '0.9rem'
                                }}
                            >
                                "Uma organização | Uma Conexão | Um Futuro"
                            </Typography>

                            {/* Ações */}
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: 2,
                                justifyContent: 'center',
                                mt: 4
                            }}>
                                <Button 
                                    variant="contained"
                                    size="large"
                                    onClick={() => navigate('/')}
                                    startIcon={<HomeIcon />}
                                    sx={{
                                        bgcolor: T.navy,
                                        color: T.white,
                                        '&:hover': { bgcolor: T.navyLight },
                                        borderRadius: '12px',
                                        px: 4,
                                        py: 1.5,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.95rem',
                                        minWidth: 200,
                                        boxShadow: '0 8px 16px rgba(8,25,46,0.15)',
                                    }}
                                >
                                    Página Inicial
                                </Button>
                                
                                <Button 
                                    variant="outlined"
                                    size="large"
                                    onClick={() => navigate('/explorar')}
                                    startIcon={<SearchIcon />}
                                    sx={{
                                        borderColor: T.borderMid,
                                        color: T.text,
                                        '&:hover': { 
                                            borderColor: T.gold, 
                                            color: T.gold,
                                            bgcolor: T.goldPale
                                        },
                                        borderRadius: '12px',
                                        px: 4,
                                        py: 1.5,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.95rem',
                                        minWidth: 200,
                                    }}
                                >
                                    Explorar Empresas
                                </Button>
                            </Box>

                            {/* Link de suporte */}
                            <Box sx={{ mt: 4 }}>
                                <Button
                                    size="small"
                                    onClick={() => navigate('/suporte')}
                                    endIcon={<SupportAgentIcon />}
                                    sx={{
                                        color: T.textSub,
                                        textTransform: 'none',
                                        fontSize: '0.85rem',
                                        '&:hover': { 
                                            color: T.gold,
                                            bgcolor: 'transparent'
                                        }
                                    }}
                                >
                                    Precisa de ajuda? Contacte o suporte
                                </Button>
                            </Box>

                            {/* Rodapé com timestamp */}
                            <Typography 
                                variant="caption" 
                                sx={{ 
                                    display: 'block',
                                    mt: 3,
                                    color: T.borderMid,
                                    fontSize: '0.7rem'
                                }}
                            >
                                © {new Date().getFullYear()} Connection Mozambique - Todos os direitos reservados
                            </Typography>
                        </Box>
                    </Paper>
                </Fade>
            </Container>
        </Box>
    );
};

export default EmpresaNaoEncontrada;
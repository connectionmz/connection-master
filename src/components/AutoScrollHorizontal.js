import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Paper,
  useMediaQuery,
  Chip,
  Skeleton
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  PlayArrow,
  Image,
  Star
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';

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
  @keyframes fadeIn {
    from { opacity: 0; } to { opacity: 1; }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50%       { transform: translateY(-8px); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.5; }
  }
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to   { transform: translateX(0); opacity: 1; }
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
  .delay-1 { animation-delay: 0.1s; }
  .delay-2 { animation-delay: 0.22s; }
  .delay-3 { animation-delay: 0.34s; }
  .delay-4 { animation-delay: 0.46s; }
  
  .scroll-item {
    transition: all 0.3s ease;
  }
  .scroll-item:hover {
    transform: scale(1.02);
    box-shadow: 0 20px 40px rgba(8,25,46,0.15) !important;
    border-color: ${T.gold} !important;
  }
  .control-btn {
    transition: all 0.2s ease;
  }
  .control-btn:hover {
    background: ${T.gold} !important;
    color: ${T.white} !important;
    transform: scale(1.1);
  }
`;

// Styled components para o scroll
const ScrollContainer = styled(Box)({
  position: 'relative',
  width: '100%',
  overflow: 'hidden',
  maskImage: 'linear-gradient(90deg, transparent, black 5%, black 95%, transparent)',
  WebkitMaskImage: 'linear-gradient(90deg, transparent, black 5%, black 95%, transparent)',
});

const ScrollTrack = styled(Box)({
  display: 'flex',
  gap: '24px',
  transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)',
  willChange: 'transform',
});

const ImageCard = styled(Paper)({
  flex: '0 0 auto',
  width: '300px',
  borderRadius: '20px',
  overflow: 'hidden',
  cursor: 'pointer',
  border: `1px solid ${T.border}`,
  background: T.white,
  transition: 'all 0.3s ease',
  '&:hover': {
    borderColor: T.gold,
    transform: 'translateY(-4px)',
    boxShadow: `0 20px 40px rgba(8,25,46,0.15)`,
    '& .image-overlay': {
      opacity: 1,
    },
    '& .image-caption': {
      transform: 'translateY(0)',
    }
  }
});

const ImageWrapper = styled(Box)({
  position: 'relative',
  width: '100%',
  height: '200px',
  overflow: 'hidden',
  backgroundColor: T.surface,
});

const ImageOverlay = styled(Box)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)',
  padding: '20px 16px 16px',
  opacity: 0,
  transition: 'opacity 0.3s ease',
  color: T.white,
});

const AutoScrollHorizontal = ({
  images = [],
  title = "Galeria de Imagens",
  subtitle = "Explore nossa coleção",
  autoPlayInterval = 3000,
  showControls = true,
  showPause = true,
  itemsPerView = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = 24,
  height = 200,
  loading = false,
  onImageClick,
  showCaptions = true,
  showBadges = false,
  variant = "default" // 'default', 'featured', 'minimal'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [maxIndex, setMaxIndex] = useState(0);
  const [itemsToShow, setItemsToShow] = useState(4);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  
  const scrollRef = useRef(null);
  const trackRef = useRef(null);
  const intervalRef = useRef(null);
  
  const isMobile = useMediaQuery('(max-width:600px)');
  const isTablet = useMediaQuery('(max-width:960px)');

  // Determinar quantos itens mostrar baseado no breakpoint
  useEffect(() => {
    const updateItemsToShow = () => {
      if (isMobile) setItemsToShow(itemsPerView.xs || 1);
      else if (isTablet) setItemsToShow(itemsPerView.sm || 2);
      else setItemsToShow(itemsPerView.md || 3);
    };
    
    updateItemsToShow();
    window.addEventListener('resize', updateItemsToShow);
    return () => window.removeEventListener('resize', updateItemsToShow);
  }, [isMobile, isTablet, itemsPerView]);

  // Calcular índice máximo
  useEffect(() => {
    setMaxIndex(Math.max(0, images.length - itemsToShow));
  }, [images.length, itemsToShow]);

  // Auto-play
  useEffect(() => {
    if (isPlaying && images.length > itemsToShow) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIndex = prev + 1;
          return nextIndex > maxIndex ? 0 : nextIndex;
        });
      }, autoPlayInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, autoPlayInterval, maxIndex, images.length, itemsToShow]);

  // Scroll quando o índice muda
  useEffect(() => {
    if (trackRef.current) {
      const itemWidth = trackRef.current.children[0]?.offsetWidth || 0;
      const scrollAmount = (itemWidth + gap) * currentIndex;
      trackRef.current.style.transform = `translateX(-${scrollAmount}px)`;
    }
  }, [currentIndex, gap]);

  const handleNext = () => {
    setCurrentIndex((prev) => {
      const nextIndex = prev + 1;
      return nextIndex > maxIndex ? 0 : nextIndex;
    });
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => {
      const nextIndex = prev - 1;
      return nextIndex < 0 ? maxIndex : nextIndex;
    });
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleImageClick = (image, index) => {
    if (onImageClick) {
      onImageClick(image, index);
    }
  };

  // Dados mockados se não houver imagens
  const mockImages = [
    {
      url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600',
      title: 'Edifício Corporativo',
      subtitle: 'Centro Empresarial',
      badge: 'Destaque'
    },
    {
      url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600',
      title: 'Escritórios Modernos',
      subtitle: 'Espaço de Trabalho',
      badge: 'Novo'
    },
    {
      url: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=600',
      title: 'Sala de Reuniões',
      subtitle: 'Equipamento Completo',
      badge: 'Premium'
    },
    {
      url: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600',
      title: 'Área de Convivência',
      subtitle: 'Coffee Break',
      badge: 'Oferta'
    },
    {
      url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=600',
      title: 'Fachada',
      subtitle: 'Vista Exterior',
      badge: 'Popular'
    },
    {
      url: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600',
      title: 'Hall de Entrada',
      subtitle: 'Recepção',
      badge: 'Destaque'
    },
  ];

  const displayImages = images.length > 0 ? images : mockImages;

  if (loading) {
    return (
      <Box sx={{ width: '100%', py: 4 }}>
        <Container maxWidth="lg">
          <Skeleton 
            variant="rectangular" 
            width="100%" 
            height={height + 100} 
            sx={{ borderRadius: '20px' }}
          />
        </Container>
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        width: '100%',
        py: { xs: 4, md: 6 },
        backgroundColor: variant === 'featured' ? T.cream : 'transparent',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{KEYFRAMES}</style>

      <Container maxWidth="lg">
        {/* Header */}
        <Box 
          className="animate-fade-up"
          sx={{ 
            mb: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 700,
                color: T.text,
                mb: 1
              }}
            >
              {title}
            </Typography>
            <Typography sx={{ color: T.textSub }}>
              {subtitle}
            </Typography>
          </Box>

          {/* Controles */}
          {showControls && displayImages.length > itemsToShow && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {showPause && (
                <IconButton
                  onClick={togglePlay}
                  className="control-btn"
                  sx={{
                    bgcolor: T.white,
                    border: `1px solid ${T.border}`,
                    color: isPlaying ? T.gold : T.textSub,
                    '&:hover': {
                      bgcolor: T.gold,
                      color: T.white,
                    }
                  }}
                >
                  {isPlaying ? <Pause /> : <PlayArrow />}
                </IconButton>
              )}
              
              <IconButton
                onClick={handlePrev}
                className="control-btn"
                sx={{
                  bgcolor: T.white,
                  border: `1px solid ${T.border}`,
                  color: T.text,
                  '&:hover': {
                    bgcolor: T.gold,
                    color: T.white,
                  }
                }}
              >
                <ChevronLeft />
              </IconButton>
              
              <IconButton
                onClick={handleNext}
                className="control-btn"
                sx={{
                  bgcolor: T.white,
                  border: `1px solid ${T.border}`,
                  color: T.text,
                  '&:hover': {
                    bgcolor: T.gold,
                    color: T.white,
                  }
                }}
              >
                <ChevronRight />
              </IconButton>
            </Box>
          )}
        </Box>

        {/* Scroll Container */}
        <ScrollContainer ref={scrollRef}>
          <ScrollTrack 
            ref={trackRef}
            sx={{ gap: `${gap}px` }}
          >
            {displayImages.map((image, index) => (
              <ImageCard
                key={index}
                className={`scroll-item animate-fade-in delay-${(index % 4) + 1}`}
                onClick={() => handleImageClick(image, index)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                elevation={hoveredIndex === index ? 4 : 1}
                sx={{
                  width: {
                    xs: `calc(100vw - 48px)`,
                    sm: `calc((100vw - 96px) / ${itemsPerView.sm || 2})`,
                    md: `calc((100vw - 144px) / ${itemsPerView.md || 3})`,
                    lg: `${300}px`,
                  },
                  maxWidth: 350,
                }}
              >
                <ImageWrapper sx={{ height }}>
                  <Box
                    component="img"
                    src={image.url || image.imageUrl || image.src}
                    alt={image.title || image.alt || `Imagem ${index + 1}`}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.3s ease',
                      transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                    }}
                  />

                  {/* Overlay com informações */}
                  {showCaptions && (
                    <ImageOverlay className="image-overlay">
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 700,
                          color: T.white,
                          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          mb: 0.5
                        }}
                      >
                        {image.title || image.name || `Imagem ${index + 1}`}
                      </Typography>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          color: 'rgba(255,255,255,0.9)',
                          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                          fontSize: '0.8rem'
                        }}
                      >
                        {image.subtitle || image.description || 'Clique para ver mais detalhes'}
                      </Typography>
                    </ImageOverlay>
                  )}

                  {/* Badges */}
                  {showBadges && image.badge && (
                    <Chip
                      label={image.badge}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: T.gold,
                        color: T.white,
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        zIndex: 2
                      }}
                    />
                  )}

                  {/* Indicador de posição */}
                  {variant === 'featured' && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 12,
                        left: 12,
                        bgcolor: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        borderRadius: '20px',
                        px: 1.5,
                        py: 0.5,
                        zIndex: 2
                      }}
                    >
                      <Typography sx={{ color: T.white, fontSize: '0.7rem', fontWeight: 600 }}>
                        {String(index + 1).padStart(2, '0')}
                      </Typography>
                    </Box>
                  )}
                </ImageWrapper>

                {/* Informações abaixo da imagem (modo minimal) */}
                {variant === 'minimal' && (
                  <Box sx={{ p: 2 }}>
                    <Typography sx={{ fontWeight: 600, color: T.text, mb: 0.5 }}>
                      {image.title || `Item ${index + 1}`}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: T.textSub }}>
                      {image.subtitle || 'Clique para detalhes'}
                    </Typography>
                  </Box>
                )}
              </ImageCard>
            ))}
          </ScrollTrack>
        </ScrollContainer>

        {/* Indicadores de página */}
        {displayImages.length > itemsToShow && (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              gap: 1, 
              mt: 3 
            }}
          >
            {Array.from({ length: maxIndex + 1 }).map((_, index) => (
              <Box
                key={index}
                onClick={() => setCurrentIndex(index)}
                sx={{
                  width: index === currentIndex ? 24 : 8,
                  height: 8,
                  borderRadius: 4,
                  bgcolor: index === currentIndex ? T.gold : T.borderMid,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: T.goldLight,
                    width: 16,
                  }
                }}
              />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
};

// Componente específico para galeria de produtos
export const ProductGallery = ({ products, onProductClick }) => (
  <AutoScrollHorizontal
    images={products.map(p => ({
      url: p.imageUrl,
      title: p.name,
      subtitle: p.price ? `${p.price} MT` : p.description,
      badge: p.promotion ? 'Promoção' : null
    }))}
    title="Produtos em Destaque"
    subtitle="Explore nossa seleção especial"
    showBadges={true}
    variant="featured"
    onImageClick={(_, index) => onProductClick?.(products[index])}
  />
);

// Componente específico para galeria de empresas
export const CompanyGallery = ({ companies, onCompanyClick }) => (
  <AutoScrollHorizontal
    images={companies.map(c => ({
      url: c.logoUrl,
      title: c.nome,
      subtitle: c.sector,
      badge: c.verified ? 'Verificada' : null
    }))}
    title="Empresas Parceiras"
    subtitle="Conheça quem confia na nossa plataforma"
    showBadges={true}
    variant="minimal"
    height={150}
    onImageClick={(_, index) => onCompanyClick?.(companies[index])}
  />
);

// Componente específico para depoimentos em vídeo
export const VideoGallery = ({ videos }) => (
  <AutoScrollHorizontal
    images={videos.map(v => ({
      url: v.thumbnail,
      title: v.title,
      subtitle: v.author,
      icon: <PlayArrow />
    }))}
    title="Vídeos em Destaque"
    subtitle="Assista aos depoimentos e apresentações"
    showCaptions={true}
    variant="featured"
    height={250}
  />
);

export default AutoScrollHorizontal;
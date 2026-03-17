import React, { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "../../fb";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Avatar,
  Typography,
  CircularProgress,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

/* ── Design tokens — idênticos ao Home / Explore / Dashboard ───────────── */
const T = {
  navy:      '#08192E',
  navyCard:  '#0D2240',
  gold:      '#C8903A',
  goldLight: '#E8B96A',
  goldPale:  '#FDF3E3',
  white:     '#FFFFFF',
  textSub:   '#6B89A5',
  border:    '#E0E8F0',
  borderMid: '#C5D4E3',
  surface:   '#F4F7FB',
  darkBorder:    'rgba(255,255,255,0.08)',
  darkBorderHov: 'rgba(200,144,58,0.55)',
  darkText:      'rgba(255,255,255,0.88)',
  darkTextSub:   'rgba(255,255,255,0.48)',
  darkMuted:     'rgba(255,255,255,0.28)',
};

const KEYFRAMES = `
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0 rgba(200,144,58,0.45); }
    70%  { box-shadow: 0 0 0 6px rgba(200,144,58,0); }
    100% { box-shadow: 0 0 0 0 rgba(200,144,58,0); }
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(12px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .story-item {
    animation: fadeUp .4s cubic-bezier(.22,1,.36,1) both;
    cursor: pointer;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    transition: transform .2s ease;
  }
  .story-item:hover { transform: translateY(-3px); }
  .story-item:hover .story-ring { border-color: ${T.gold} !important; }
  .story-item:hover .story-label { color: ${T.goldLight} !important; }
  .story-ring {
    border: 2px solid rgba(255,255,255,0.12);
    border-radius: 50%;
    transition: border-color .2s ease;
    padding: 2px;
  }
  .story-ring.active { border-color: ${T.gold}; animation: pulse-ring 2.4s ease infinite; }
`;

const StorieListDesk = ({ user }) => {
  const [stories, setStories]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const navigate                = useNavigate();
  const isMobile                = useMediaQuery('(max-width:600px)');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const snap = await get(ref(db, 'company'));
        if (snap.exists()) {
          const data = snap.val();
          const prov = user ? user.provinciaTemp || user.provincia : 'Cabo Delgado';
          const list = Object.keys(data)
            .map((k) => ({ id: k, ...data[k] }))
            .filter((c) => c.provincia === prov && (c.type || '').trim().toLowerCase() !== 'singular');
          setStories(list.sort(() => Math.random() - 0.5).slice(0, 7));
        }
      } catch (e) {
        setError('Erro ao carregar empresas: ' + e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, [user]);

  const avatarSize = isMobile ? 48 : 60;

  if (loading) return (
    <Box display="flex" justifyContent="center" alignItems="center" height={120}>
      <CircularProgress size={28} thickness={4} sx={{ color: T.gold }} />
    </Box>
  );

  if (error) return (
    <Box display="flex" justifyContent="center" alignItems="center" height={100}>
      <Typography sx={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
        {error}
      </Typography>
    </Box>
  );

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* Section label */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Box sx={{ width: 3, height: 16, borderRadius: '2px', bgcolor: T.gold }} />
        <Typography sx={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontSize: '0.72rem', fontWeight: 700,
          color: T.darkMuted, textTransform: 'uppercase', letterSpacing: '0.07em',
        }}>
          Empresas em Destaque
        </Typography>
      </Box>

      <Box sx={{
        display: 'flex',
        flexDirection: 'row',
        gap: isMobile ? 1.5 : 2.5,
        pb: 1.5,
        overflowX: 'auto',
        '&::-webkit-scrollbar': { display: 'none' },
        scrollbarWidth: 'none',
      }}>

        {stories.map((store, i) => (
          <Box
            key={store.id}
            className="story-item"
            onClick={() => navigate(`/empresa/${store.slug}`)}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {/* Avatar ring */}
            <Box
              className={`story-ring${i === 0 ? ' active' : ''}`}
              sx={{ width: avatarSize + 8, height: avatarSize + 8, borderRadius: '50%', flexShrink: 0 }}
            >
              <Avatar
                src={store.logoUrl}
                alt={store.nome}
                sx={{
                  width: avatarSize, height: avatarSize,
                  bgcolor: T.navyCard,
                  border: '2px solid rgba(255,255,255,0.06)',
                  fontSize: avatarSize * 0.38,
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 700, color: 'rgba(255,255,255,0.7)',
                }}
              >
                {(store.sigla || store.nome || '?')[0]}
              </Avatar>
            </Box>

            {/* Label */}
            <Box sx={{ maxWidth: avatarSize + 16, textAlign: 'center' }}>
              <Typography
                className="story-label"
                sx={{
                  fontFamily: '"Plus Jakarta Sans", sans-serif',
                  fontSize: isMobile ? '0.68rem' : '0.75rem',
                  fontWeight: 700,
                  color: T.darkText,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  transition: 'color .2s',
                  maxWidth: avatarSize + 16,
                  display: 'block',
                }}
              >
                {store.sigla || store.nome}
              </Typography>
              <Typography sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: isMobile ? '0.6rem' : '0.66rem',
                color: T.darkTextSub,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                maxWidth: avatarSize + 16, display: 'block',
              }}>
                {store.sector || 'Setor'}
              </Typography>
            </Box>
          </Box>
        ))}

        {/* Ver mais */}
        <Box
          className="story-item"
          onClick={() => navigate('/explorar')}
          style={{ animationDelay: `${stories.length * 0.05}s` }}
        >
          <Box
            className="story-ring"
            sx={{
              width: avatarSize + 8, height: avatarSize + 8,
              borderRadius: '50%',
              border: '2px dashed rgba(255,255,255,0.15) !important',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Box sx={{
              width: avatarSize, height: avatarSize, borderRadius: '50%',
              bgcolor: 'rgba(200,144,58,0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <AddIcon sx={{ fontSize: isMobile ? 20 : 24, color: T.gold }} />
            </Box>
          </Box>
          <Box sx={{ maxWidth: avatarSize + 16, textAlign: 'center' }}>
            <Typography
              className="story-label"
              sx={{
                fontFamily: '"Plus Jakarta Sans", sans-serif',
                fontSize: isMobile ? '0.68rem' : '0.75rem',
                fontWeight: 700,
                color: T.gold,
                transition: 'color .2s',
              }}
            >
              Ver mais
            </Typography>
            <Typography sx={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: isMobile ? '0.6rem' : '0.66rem',
              color: T.darkTextSub,
            }}>
              Explorar
            </Typography>
          </Box>
        </Box>

      </Box>
    </>
  );
};

export default StorieListDesk;
import React, { useEffect, useState, useCallback } from "react";
import { ref, get } from "firebase/database";
import { db } from "../../fb";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Avatar,
  Typography,
  useMediaQuery,
  Skeleton,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

/* ── Design tokens ─────────────────────────────────────────────────────── */
const T = {
  navy:          '#08192E',
  navyCard:      '#0D2240',
  gold:          '#C8903A',
  goldLight:     '#E8B96A',
  white:         '#FFFFFF',
  darkBorder:    'rgba(255,255,255,0.08)',
  darkBorderHov: 'rgba(200,144,58,0.55)',
  darkText:      'rgba(255,255,255,0.88)',
  darkTextSub:   'rgba(255,255,255,0.48)',
  darkMuted:     'rgba(255,255,255,0.28)',
};

const MAX_STORIES    = 7;
const EXCLUDED_TYPES = ['singular'];

/* ── CSS animations (injected once) ────────────────────────────────────── */
const KEYFRAMES = `
  @keyframes pulse-ring {
    0%   { box-shadow: 0 0 0 0   rgba(200,144,58,0.5); }
    70%  { box-shadow: 0 0 0 7px rgba(200,144,58,0);   }
    100% { box-shadow: 0 0 0 0   rgba(200,144,58,0);   }
  }
  @keyframes fadeUp {
    from { opacity:0; transform:translateY(10px); }
    to   { opacity:1; transform:translateY(0);    }
  }
  .story-item {
    animation: fadeUp .35s cubic-bezier(.22,1,.36,1) both;
    cursor: pointer;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    transition: transform .2s ease;
    -webkit-tap-highlight-color: transparent;
  }
  .story-item:hover               { transform: translateY(-3px); }
  .story-item:hover .story-ring   { border-color: ${T.gold} !important; }
  .story-item:hover .story-label  { color: ${T.goldLight} !important; }
  .story-item:focus-visible       { outline: 2px solid ${T.gold}; border-radius: 50%; }

  .story-ring {
    border: 2px solid rgba(255,255,255,0.10);
    border-radius: 50%;
    padding: 2px;
    transition: border-color .2s ease;
    flex-shrink: 0;
  }
  .story-ring.active {
    border-color: ${T.gold};
    animation: pulse-ring 2.4s ease infinite;
  }
`;

/* ── Helpers ────────────────────────────────────────────────────────────── */
// provinciaTemp === '' significa "Todas as províncias" escolhido explicitamente
// no dashboard — nesse caso não deve cair para a província permanente/default.
const getProvince = (user) =>
  user?.provinciaTemp !== undefined ? user.provinciaTemp : (user?.provincia || 'Cabo Delgado');

const shuffleAndSlice = (arr, n) =>
  [...arr].sort(() => Math.random() - 0.5).slice(0, n);

const normalizeType = (type = '') => type.trim().toLowerCase();

/* ── Sub-components ─────────────────────────────────────────────────────── */
const StoryRing = ({ isActive, size, children }) => (
  <Box
    className={`story-ring${isActive ? ' active' : ''}`}
    sx={{
      width:  size + 8,
      height: size + 8,
      borderRadius: '50%',
      flexShrink: 0,
    }}
  >
    {children}
  </Box>
);

const StoryLabel = ({ primary, secondary, maxWidth, isMobile }) => (
  <Box sx={{ width: maxWidth, textAlign: 'center' }}>
    <Typography
      className="story-label"
      component="span"
      sx={{
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        fontSize:   isMobile ? '0.68rem' : '0.74rem',
        fontWeight: 700,
        color:      T.gold,
        display:    'block',
        whiteSpace: 'nowrap',
        overflow:   'hidden',
        textOverflow: 'ellipsis',
        transition: 'color .2s',
      }}
    >
      {primary}
    </Typography>
    <Typography
      component="span"
      sx={{
        fontFamily:   '"Plus Jakarta Sans", sans-serif',
        fontSize:     isMobile ? '0.60rem' : '0.65rem',
        color:        T.goldLight,
        display:      'block',
        whiteSpace:   'nowrap',
        overflow:     'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {secondary}
    </Typography>
  </Box>
);

/* ── Skeleton placeholder ───────────────────────────────────────────────── */
const StorySkeleton = ({ count, avatarSize }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <Box
        key={i}
        sx={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           '6px',
          flexShrink:    0,
        }}
      >
        <Skeleton
          variant="circular"
          width={avatarSize + 8}
          height={avatarSize + 8}
          sx={{ bgcolor: 'rgba(255,255,255,0.06)' }}
        />
        <Skeleton
          variant="text"
          width={avatarSize}
          height={12}
          sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 1 }}
        />
        <Skeleton
          variant="text"
          width={avatarSize * 0.7}
          height={10}
          sx={{ bgcolor: 'rgba(255,255,255,0.04)', borderRadius: 1 }}
        />
      </Box>
    ))}
  </>
);

/* ── Main component ─────────────────────────────────────────────────────── */
const StorieListDesk = ({ user }) => {
  const [stories, setStories] = useState([]);
  const [status,  setStatus]  = useState('loading'); // 'loading' | 'ok' | 'empty' | 'error'
  const navigate              = useNavigate();
  const isMobile              = useMediaQuery('(max-width:600px)');
  const avatarSize            = isMobile ? 48 : 60;
  const labelWidth            = avatarSize + 16;

  const fetchCompanies = useCallback(async () => {
    setStatus('loading');
    try {
      const snap = await get(ref(db, 'company'));
      if (!snap.exists()) { setStatus('empty'); return; }

      const province = getProvince(user);
      const filtered = Object.entries(snap.val())
        .map(([id, data]) => ({ id, ...data }))
        .filter(
          (c) =>
            (!province || c.provincia === province) &&
            !EXCLUDED_TYPES.includes(normalizeType(c.type))
        );

      if (!filtered.length) { setStatus('empty'); return; }

      setStories(shuffleAndSlice(filtered, MAX_STORIES));
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }, [user]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  /* Loading */
  if (status === 'loading') return (
    <>
      <style>{KEYFRAMES}</style>
      <SectionHeader />
      <ScrollRow isMobile={isMobile}>
        <StorySkeleton count={MAX_STORIES} avatarSize={avatarSize} />
      </ScrollRow>
    </>
  );

  if (status === 'empty' || status === 'error') return (
    <>
      <style>{KEYFRAMES}</style>
      <SectionHeader />
      <ScrollRow isMobile={isMobile}>
        <VerMaisItem
          navigate={navigate}
          avatarSize={avatarSize}
          labelWidth={labelWidth}
          isMobile={isMobile}
          delay={0}
        />
      </ScrollRow>
    </>
  );

  return (
    <>
      <style>{KEYFRAMES}</style>
      <SectionHeader />

      <ScrollRow isMobile={isMobile}>
        {stories.map((store, i) => (
          <Box
            key={store.id}
            className="story-item"
            role="button"
            tabIndex={0}
            aria-label={`Ver empresa ${store.nome}`}
            onClick={() => navigate(`/empresa/${store.slug}`)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/empresa/${store.slug}`)}
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <StoryRing isActive={i === 0} size={avatarSize}>
              <Avatar
                src={store.logoUrl}
                alt={store.nome}
                sx={{
                  width:      avatarSize,
                  height:     avatarSize,
                  bgcolor:    T.navyCard,
                  border:     '2px solid rgba(255,255,255,0.06)',
                  fontSize:   avatarSize * 0.38,
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 700,
                  color:     T.gold,
                }}
              >
                {(store.sigla || store.nome || '?')[0].toUpperCase()}
              </Avatar>
            </StoryRing>

            <StoryLabel
              primary={store.sigla || store.nome}
              secondary={store.sector || 'Setor'}
              maxWidth={labelWidth}
              isMobile={isMobile}
            />
          </Box>
        ))}

        <VerMaisItem
          navigate={navigate}
          avatarSize={avatarSize}
          labelWidth={labelWidth}
          isMobile={isMobile}
          delay={stories.length * 0.05}
        />
      </ScrollRow>
    </>
  );
};

/* ── Small layout helpers ───────────────────────────────────────────────── */
const SectionHeader = () => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
    <Box sx={{ width: 3, height: 16, borderRadius: '2px', bgcolor: T.darkBorder }} />
    <Typography sx={{
      fontFamily:    '"Plus Jakarta Sans", sans-serif',
      fontSize:      '0.72rem',
      fontWeight:    700,
      color:         T.darkMuted,
      textTransform: 'uppercase',
      letterSpacing: '0.07em',
    }}>
      Empresas em Destaque
    </Typography>
  </Box>
);

const ScrollRow = ({ children, isMobile }) => (
  <Box sx={{
    display:    'flex',
    flexDirection: 'row',
    gap:        isMobile ? 1.5 : 2.5,
    pb:         1.5,
    overflowX:  'auto',
    '&::-webkit-scrollbar': { display: 'none' },
    scrollbarWidth: 'none',
  }}>
    {children}
  </Box>
);

const VerMaisItem = ({ navigate, avatarSize, labelWidth, isMobile, delay }) => (
  <Box
    className="story-item"
    role="button"
    tabIndex={0}
    aria-label="Ver mais empresas"
    onClick={() => navigate('/explorar')}
    onKeyDown={(e) => e.key === 'Enter' && navigate('/explorar')}
    style={{ animationDelay: `${delay}s` }}
  >
    <Box
      className="story-ring"
      sx={{
        width:   avatarSize + 8,
        height:  avatarSize + 8,
        borderRadius: '50%',
        border:  '2px dashed rgba(255,255,255,0.15) !important',
        display: 'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}
    >
      <Box sx={{
        width:   avatarSize,
        height:  avatarSize,
        borderRadius: '50%',
        bgcolor: 'rgba(200,144,58,0.10)',
        display: 'flex',
        alignItems:     'center',
        justifyContent: 'center',
      }}>
        <AddIcon sx={{ fontSize: isMobile ? 20 : 24, color: T.gold }} />
      </Box>
    </Box>

    <Box sx={{ width: labelWidth, textAlign: 'center' }}>
      <Typography
        className="story-label"
        component="span"
        sx={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontSize:   isMobile ? '0.68rem' : '0.74rem',
          fontWeight: 700,
          color:      T.gold,
          display:    'block',
          transition: 'color .2s',
        }}
      >
        Ver mais
      </Typography>
      <Typography
        component="span"
        sx={{
          fontFamily: '"Plus Jakarta Sans", sans-serif',
          fontSize:   isMobile ? '0.60rem' : '0.65rem',
          color:      T.darkTextSub,
          display:    'block',
        }}
      >
        Explorar
      </Typography>
    </Box>
  </Box>
);

export default StorieListDesk;
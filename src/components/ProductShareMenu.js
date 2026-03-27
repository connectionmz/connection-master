import React from 'react';
import {
  Menu, MenuItem, ListItemIcon, ListItemText, Box, Typography,
} from "@mui/material";
import {
  Share as ShareIcon,
  WhatsApp as WhatsAppIcon,
} from "@mui/icons-material";

const ProductShareMenu = ({ anchorEl, onClose, onShare, product, storeInfo }) => {
  const open = Boolean(anchorEl);
  
  const handleShare = (platform) => {
    onShare(platform);
    onClose();
  };
  
  return (
    <Menu 
      anchorEl={anchorEl} 
      open={open}
      onClose={onClose}
      PaperProps={{ 
        sx: { 
          bgcolor: '#0D2240', 
          border: '1px solid rgba(255,255,255,0.08)', 
          borderRadius: 2,
          minWidth: 260,
        } 
      }}>
      
      {/* Product Preview Card */}
      {product?.imageUrl && (
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          gap: 2,
          alignItems: 'center'
        }}>
          <Box 
            component="img"
            src={product.imageUrl}
            alt={product.name}
            sx={{ 
              width: 56, 
              height: 56, 
              objectFit: 'cover', 
              borderRadius: 1.5,
              bgcolor: '#08192E',
            }}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/56x56?text=Produto';
            }}
          />
          <Box sx={{ flex: 1 }}>
            <Typography sx={{ 
              color: '#FFFFFF', 
              fontSize: '0.85rem', 
              fontWeight: 600,
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              mb: 0.5
            }}>
              {product.name?.length > 35 ? `${product.name.substring(0, 35)}...` : product.name}
            </Typography>
            <Typography sx={{ 
              color: '#C8903A', 
              fontSize: '0.7rem',
              fontFamily: '"Plus Jakarta Sans", sans-serif'
            }}>
              {storeInfo?.company?.nome || 'Loja'}
            </Typography>
          </Box>
        </Box>
      )}
      
      {/* Share Options */}
      {navigator.share && (
        <MenuItem onClick={() => handleShare('native')}
          sx={{ color: 'rgba(255,255,255,0.88)', '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}>
          <ListItemIcon>
            <ShareIcon sx={{ fontSize: 20, color: '#C8903A' }} />
          </ListItemIcon>
          <ListItemText 
            primary="Partilhar nativamente"
            primaryTypographyProps={{ 
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: '0.9rem'
            }} 
          />
        </MenuItem>
      )}
      
      <MenuItem onClick={() => handleShare('whatsapp')}
        sx={{ color: 'rgba(255,255,255,0.88)', '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}>
        <ListItemIcon>
          <WhatsAppIcon sx={{ fontSize: 20, color: '#25D366' }} />
        </ListItemIcon>
        <ListItemText 
          primary="WhatsApp"
          primaryTypographyProps={{ 
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '0.9rem'
          }} 
        />
      </MenuItem>
      
      <MenuItem onClick={() => handleShare('facebook')}
        sx={{ color: 'rgba(255,255,255,0.88)', '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}>
        <ListItemIcon>
          <Box component="img" src="https://cdn-icons-png.flaticon.com/512/124/124010.png" sx={{ width: 20, height: 20 }} />
        </ListItemIcon>
        <ListItemText 
          primary="Facebook"
          primaryTypographyProps={{ 
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '0.9rem'
          }} 
        />
      </MenuItem>
      
      <MenuItem onClick={() => handleShare('twitter')}
        sx={{ color: 'rgba(255,255,255,0.88)', '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}>
        <ListItemIcon>
          <Box component="img" src="https://cdn-icons-png.flaticon.com/512/124/124021.png" sx={{ width: 20, height: 20 }} />
        </ListItemIcon>
        <ListItemText 
          primary="Twitter/X"
          primaryTypographyProps={{ 
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '0.9rem'
          }} 
        />
      </MenuItem>
      
      <MenuItem onClick={() => handleShare('copy')}
        sx={{ color: 'rgba(255,255,255,0.88)', '&:hover': { bgcolor: 'rgba(255,255,255,0.06)' } }}>
        <ListItemIcon>
          <ShareIcon sx={{ fontSize: 20, color: '#C8903A' }} />
        </ListItemIcon>
        <ListItemText 
          primary="Copiar link"
          primaryTypographyProps={{ 
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            fontSize: '0.9rem'
          }} 
        />
      </MenuItem>
    </Menu>
  );
};

export default ProductShareMenu;
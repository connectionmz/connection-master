import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Chip
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';

const ProductGridDesk = ({ products, storeId }) => {
  const [shareAnchorEl, setShareAnchorEl] = useState(null);
  const [shareProductId, setShareProductId] = useState(null);

  const handleOpenShareMenu = (event, productId) => {
    event.preventDefault();
    event.stopPropagation();
    setShareProductId(productId);
    setShareAnchorEl(event.currentTarget);
  };

  const handleCloseShareMenu = () => {
    setShareAnchorEl(null);
    setShareProductId(null);
  };

  const shareOnPlatform = (platform) => {
    if (!shareProductId) return;
    
    const productUrl = `${window.location.origin}/product/${shareProductId}/store/${storeId}`;
    let shareUrl = '';
    
    switch(platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=Confira este produto: ${productUrl}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(productUrl)}`;
        break;
      case 'copy':
        navigator.clipboard.writeText(productUrl);
        // Consider adding a toast notification here
        handleCloseShareMenu();
        return;
      default:
        return;
    }
    
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
    handleCloseShareMenu();
  };

  if (!products || Object.keys(products).length === 0) {
    return <p className="text-center text-gray-500 py-8">Nenhum produto disponível no momento.</p>;
  }

  return (
    <div className="relative">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Object.entries(products).map(([productId, product]) => (
          <div
            key={productId}
            className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow relative"
          >
            <Link to={`/product/${productId}/store/${storeId}`} className="block">
              {/* Product Image with Discount Badge */}
              <div className="relative">
                <img
                  src={product.imageUrl || 'https://via.placeholder.com/300'}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                  loading="lazy"
                />
                {product.discount && (
                  <Chip
                    label={`${product.discount}% OFF`}
                    color="error"
                    size="small"
                    className="absolute top-2 left-2 font-bold"
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      fontWeight: 'bold',
                      zIndex: 1
                    }}
                  />
                )}
              </div>

              {/* Product Details */}
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-1 text-gray-900 line-clamp-2">
                  {product.name}
                </h2>
                <p className="text-sm text-gray-500 mb-1">
                  {product.sales ? `${product.sales} vendido(s)` : ''}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-base font-bold text-red-600">
                    {product.price} MT
                  </p>
                  <IconButton
                    size="small"
                    onClick={(e) => handleOpenShareMenu(e, productId)}
                    aria-label="Compartilhar produto"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ShareIcon fontSize="small" />
                  </IconButton>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>

      {/* Share Menu */}
      <Menu
        anchorEl={shareAnchorEl}
        open={Boolean(shareAnchorEl)}
        onClose={handleCloseShareMenu}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => shareOnPlatform('whatsapp')}>
          <ListItemIcon>
            <img 
              src="https://cdn-icons-png.flaticon.com/512/124/124034.png" 
              alt="WhatsApp" 
              width={24} 
              height={24} 
            />
          </ListItemIcon>
          <ListItemText>WhatsApp</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => shareOnPlatform('facebook')}>
          <ListItemIcon>
            <img 
              src="https://cdn-icons-png.flaticon.com/512/124/124010.png" 
              alt="Facebook" 
              width={24} 
              height={24} 
            />
          </ListItemIcon>
          <ListItemText>Facebook</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => shareOnPlatform('twitter')}>
          <ListItemIcon>
            <img 
              src="https://cdn-icons-png.flaticon.com/512/124/124021.png" 
              alt="Twitter" 
              width={24} 
              height={24} 
            />
          </ListItemIcon>
          <ListItemText>Twitter</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => shareOnPlatform('copy')}>
          <ListItemIcon>
            <ShareIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Copiar link</ListItemText>
        </MenuItem>
      </Menu>
    </div>
  );
};

export default ProductGridDesk;
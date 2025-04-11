import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ref, get } from 'firebase/database';
import { db } from '../../fb';
import ProductGridDesk from './ProductGridDesk';
import { 
  Box, 
  Typography, 
  IconButton, 
  CircularProgress, 
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Store, Share } from '@mui/icons-material';
import BackButton from '../BackButton';

const StoreDetailDesk = () => {
    const { storeId } = useParams();
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [shareAnchorEl, setShareAnchorEl] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    useEffect(() => {
        const fetchStoreDetails = async () => {
            try {
                setLoading(true);
                const storeRef = ref(db, `stores/${storeId}`);
                const storeSnapshot = await get(storeRef);
                
                if (storeSnapshot.exists()) {
                    const storeData = storeSnapshot.val();
                    setStore({
                        ...storeData,
                        products: storeData.products || {},
                        company: storeData.company || {}
                    });
                } else {
                    setStore(null);
                }
            } catch (error) {
                console.error("Erro ao buscar os detalhes da loja:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStoreDetails();
    }, [storeId]);

    const handleOpenShareMenu = (event) => {
        event.preventDefault();
        setShareAnchorEl(event.currentTarget);
    };

    const handleCloseShareMenu = () => {
        setShareAnchorEl(null);
    };

    const shareOnPlatform = (platform) => {
        if (!store) return;
        
        const storeUrl = `${window.location.origin}/loja/${storeId}`;
        let shareUrl = '';
        
        switch(platform) {
            case 'whatsapp':
                shareUrl = `https://wa.me/?text=Confira esta loja: ${store.name} - ${storeUrl}`;
                break;
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storeUrl)}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(storeUrl)}&text=Confira esta loja: ${store.name}`;
                break;
            case 'copy':
                navigator.clipboard.writeText(storeUrl);
                // Consider adding a toast notification here
                handleCloseShareMenu();
                return;
            default:
                return;
        }
        
        window.open(shareUrl, '_blank', 'noopener,noreferrer');
        handleCloseShareMenu();
    };

    if (loading) {
        return (
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                backgroundColor: '#f5f5f5'
            }}>
                <CircularProgress size={isMobile ? 40 : 60} />
            </Box>
        );
    }

    if (!store) {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: '#f5f5f5'
            }}>
                <Typography variant="h6" align="center" color="error">
                    Loja não encontrada
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            minHeight: '100vh', 
            backgroundColor: '#f5f5f5',
            pb: 4
        }}>
            {/* Header */}
            <Box sx={{ 
                backgroundColor: '#fff', 
                boxShadow: 3, 
                position: 'sticky', 
                top: 0, 
                zIndex: 10, 
                p: isMobile ? 2 : 3
            }}>
                <BackButton sx={{ mb: 2 }} />
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2
                }}>
                    <Typography variant={isMobile ? "h6" : "h5"} sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        fontWeight: 'bold',
                        color: theme.palette.primary.main
                    }}>
                        <Store sx={{ mr: 1 }} /> 
                        {store.name}
                    </Typography>

                    <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        gap: 1
                    }}>
                        <Avatar 
                            alt={store.company?.nome || 'Logo da loja'} 
                            src={store.company?.logo} 
                            sx={{ 
                                width: 32, 
                                height: 32,
                                border: `1px solid ${theme.palette.divider}`
                            }}
                        />
                        <Typography variant="body1">
                            {store.company?.nome || 'Loja'}
                        </Typography>
                    </Box>

                    <IconButton 
                        onClick={handleOpenShareMenu}
                        aria-label="Compartilhar loja"
                        sx={{
                            color: theme.palette.primary.main,
                            '&:hover': {
                                backgroundColor: theme.palette.primary.light
                            }
                        }}
                    >
                        <Share />
                    </IconButton>
                </Box>
            </Box>

            {/* Store Details */}
            <Box sx={{ 
                p: isMobile ? 2 : 4,
                maxWidth: 1400,
                mx: 'auto'
            }}>
                <Typography variant="h6" sx={{ 
                    fontWeight: 'bold', 
                    mb: 2,
                    color: theme.palette.text.primary
                }}>
                    Sobre a Loja
                </Typography>
                <Typography variant="body1" sx={{ 
                    mb: 4,
                    color: theme.palette.text.secondary,
                    lineHeight: 1.6
                }}>
                    {store.description || 'Esta loja ainda não adicionou uma descrição.'}
                </Typography>

                <Typography variant="h6" sx={{ 
                    fontWeight: 'bold', 
                    mb: 3,
                    color: theme.palette.text.primary
                }}>
                    Produtos
                </Typography>
                
                <ProductGridDesk 
                    products={store.products} 
                    storeId={storeId} 
                />
            </Box>

            {/* Share Menu */}
            <Menu
                anchorEl={shareAnchorEl}
                open={Boolean(shareAnchorEl)}
                onClose={handleCloseShareMenu}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
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
                        <Share fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Copiar link</ListItemText>
                </MenuItem>
            </Menu>
        </Box>
    );
};

export default StoreDetailDesk;
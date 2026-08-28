import React, { useEffect, useState } from 'react';
import {
    Button,
    Typography,
    Tabs,
    Tab,
    Avatar,
    Snackbar,
    Alert,
    Box,
    CircularProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Divider,
    IconButton,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    useMediaQuery,
    Container,
    Chip,
    Card,
    CardContent,
    Tooltip,
    Badge,
    Fade,
    Grid,
    Menu,
    MenuItem,
    ListItemIcon,
    Collapse,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    TextField,
} from '@mui/material';
import { 
    Delete, 
    AccessTime, 
    CheckCircle, 
    History, 
    Edit,
    Add,
    Business,
    LocationOn,
    Category,
    CalendarToday,
    Visibility,
    VisibilityOff,
    Warning,
    Close,
    Reply,
    Phone,
    Email,
    WhatsApp,
    MoreVert,
    Receipt,
    Person,
    Store,
    ExpandMore,
    ExpandLess,
    Inventory,
    Description
} from '@mui/icons-material';
import { ref, onValue, update, remove, set, get } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../../fb';
import EditarCotacao from './EditarCotacao'; 
import { useActiveModules } from '../../context/ActiveModulesContext';
import { buildQuoteResponseUpdates, validateQuoteResponse } from '../market/quoteResponse';

/* ── Design tokens ───────────────────────────────────────────────────── */
const T = {
    navy:        '#08192E',
    navyMid:     '#0E2849',
    navyLight:   '#183A63',
    navyCard:    '#0D2240',
    gold:        '#C8903A',
    goldLight:   '#E8B96A',
    goldPale:    '#FDF3E3',
    white:       '#FFFFFF',
    text:        '#0F1C2D',
    textSub:     '#6B89A5',
    border:      '#E0E8F0',
    borderMid:   '#C5D4E3',
    surface:     '#F4F7FB',
    darkBorder:  'rgba(255,255,255,0.08)',
    darkBorderMid:'rgba(255,255,255,0.14)',
    darkText:    'rgba(255,255,255,0.88)',
    darkTextSub: 'rgba(255,255,255,0.52)',
    darkMuted:   'rgba(255,255,255,0.30)',
    success:     '#10b981',
    error:       '#ef4444',
    warning:     '#f59e0b',
};

const KEYFRAMES = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
    @keyframes fadeUp {
        from { opacity:0; transform:translateY(20px); }
        to   { opacity:1; transform:translateY(0); }
    }
    .fade-up {
        animation: fadeUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .quote-card {
        background: ${T.navyCard};
        border: 1px solid ${T.darkBorder};
        border-radius: 16px;
        transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        margin-bottom: 12px;
    }
    .quote-card:hover {
        transform: translateY(-2px);
        border-color: ${T.gold} !important;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2) !important;
    }
    .quote-card.unread {
        border-left: 3px solid ${T.gold};
    }
`;

const BG_GRID = {
    position:'absolute', inset:0, pointerEvents:'none', opacity:0.02,
    backgroundImage:`linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)`,
    backgroundSize:'56px 56px',
};

const CotacoesDesk = ({ user, onModuleActivation }) => {
    const [cotacoes, setCotacoes] = useState([]);
    const [quotesReceived, setQuotesReceived] = useState([]);
    const [activeTab, setActiveTab] = useState('recentes');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [loading, setLoading] = useState(true);
    const [clickedCotacoes, setClickedCotacoes] = useState({});
    const [clickedQuotes, setClickedQuotes] = useState({});
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedCotacao, setSelectedCotacao] = useState(null);
    const [selectedQuote, setSelectedQuote] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedQuoteForMenu, setSelectedQuoteForMenu] = useState(null);
    const [expandedQuote, setExpandedQuote] = useState(null);
    const [responseDialogOpen, setResponseDialogOpen] = useState(false);
    const [responseQuote, setResponseQuote] = useState(null);
    const [responseForm, setResponseForm] = useState({ message: '', totalPrice: '', validityDays: '7' });
    const [responseSubmitting, setResponseSubmitting] = useState(false);
    const [responseError, setResponseError] = useState('');
    
    const { activeModules, isLoading: modulesLoading } = useActiveModules();
    const navigate = useNavigate();
    const isMobile = useMediaQuery('(max-width:600px)');
    const isTablet = useMediaQuery('(max-width:900px)');

    const hasSmsModule = Boolean(activeModules?.moduloSMS);
    const hasMarketModule = Boolean(activeModules?.moduloMarket);
    const hasQuotesAccess = hasSmsModule || hasMarketModule;

    useEffect(() => {
        if (!hasSmsModule && hasMarketModule) {
            setActiveTab('recebidas');
        }
    }, [hasSmsModule, hasMarketModule]);

    // Buscar cotações recebidas (solicitações de clientes)
    useEffect(() => {
        if (!hasMarketModule || !user?.id) return;

        const quotesRef = ref(db, `quotes/${user.id}`);
        const unsubscribeQuotes = onValue(quotesRef, (snapshot) => {
            const quotesData = snapshot.val();
            
            if (quotesData) {
                const quotesArray = Object.entries(quotesData).map(([id, quote]) => ({
                    id,
                    ...quote,
                    type: 'received_quote',
                    isClicked: Boolean(quote.viewed)
                }));

                setClickedQuotes(Object.fromEntries(
                    quotesArray.filter(quote => quote.viewed).map(quote => [quote.id, true])
                ));
                
                setQuotesReceived(quotesArray.sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                ));
            } else {
                setQuotesReceived([]);
            }
        });
        
        return () => unsubscribeQuotes();
    }, [user?.id, hasMarketModule]);

    // Buscar cotações publicadas (normais)
    useEffect(() => {
        if (!hasSmsModule || !user?.id) {
            setCotacoes([]);
            setLoading(false);
            return;
        }

        const cotacoesRef = ref(db, 'cotacoes');
        const unsubscribeCotacoes = onValue(cotacoesRef, (snapshot) => {
            const cotacoesData = snapshot.val();
            
            if (cotacoesData) {
                const now = new Date();
                setClickedCotacoes((prevClickedCotacoes) => {
                    const cotacoesArray = Object.entries(cotacoesData).map(([id, cotacao]) => {
                        const dataLimite = new Date(cotacao.datalimite);
                        const isExpired = dataLimite < now && cotacao.status !== 'Fechada' && cotacao.status !== 'Expirada';
                        
                        if (isExpired) {
                            update(ref(db, `cotacoes/${id}`), { status: 'Expirada' });
                            return {
                                id,
                                ...cotacao,
                                status: 'Expirada',
                                isClicked: prevClickedCotacoes[id] || false,
                                type: 'published_quote'
                            };
                        }
                        
                        return {
                            id,
                            ...cotacao,
                            isClicked: prevClickedCotacoes[id] || false,
                            type: 'published_quote'
                        };
                    });
                    
                    const filteredCotacoes = activeTab === 'minhas' 
                        ? cotacoesArray.filter(cotacao => 
                            cotacao.company?.id === user.id || 
                            cotacao.userId === user.id ||
                            cotacao.createdBy === user.id
                          )
                        : cotacoesArray.filter(cotacao => {
                            if (cotacao.company?.id === user.id || 
                                cotacao.userId === user.id || 
                                cotacao.createdBy === user.id) {
                                return true;
                            }
                            
                            const cotacaoSector = cotacao.sector || cotacao.company?.sector;
                            const sectorMatch = !cotacaoSector || 
                                             (user?.sector && cotacaoSector === user.sector);
                        
                            const cotacaoProvincias = cotacao.provincias || [];
                            const provinciaMatch = cotacaoProvincias.length === 0 || 
                                                 cotacaoProvincias.includes('Todas') ||
                                                 (user?.provincia && cotacaoProvincias.includes(user.provincia));
                            
                            return sectorMatch && provinciaMatch;
                        });
                    
                    setCotacoes(filteredCotacoes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
                    
                    return prevClickedCotacoes;
                });
            } else {
                setCotacoes([]);
            }
            setLoading(false);
        });
        
        return () => unsubscribeCotacoes();
    }, [user?.id, user?.provincia, user?.sector, activeTab, hasSmsModule]);

    const isDateValid = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        return date >= now;
    };

    const handlePublishQuotation = () => {
        if (!user) {
            navigate('/auth', { state: { from: '/cotacao' } });
            return;
        }
        navigate('/cotacao');
    };

    const deleteCotacao = async (cotacaoId) => {
        try {
            const propostasRef = ref(db, `cotacoes/${cotacaoId}/proposals`);
            const snapshot = await get(propostasRef);

            if (snapshot.exists()) {
                setSnackbar({ 
                    open: true, 
                    message: 'Não é possível excluir esta cotação pois já existem propostas associadas. Apenas feche o pedido de cotação.', 
                    severity: 'error' 
                });
                return;
            }
            
            if (window.confirm('Tem certeza que deseja excluir esta cotação?')) {
                const cotacaoRef = ref(db, `cotacoes/${cotacaoId}`);
                await remove(cotacaoRef);
                setSnackbar({ 
                    open: true, 
                    message: 'Cotação excluída com sucesso!', 
                    severity: 'success' 
                });
            }
        } catch (error) {
            console.error('Erro ao excluir a cotação: ', error);
            setSnackbar({ 
                open: true, 
                message: 'Erro ao excluir a cotação.', 
                severity: 'error' 
            });
        }
    };

    // Marcar cotação recebida como visualizada
    const markQuoteAsViewed = async (quoteId) => {
        if (user && hasMarketModule && !clickedQuotes[quoteId]) {
            try {
                await update(ref(db, `quotes/${user.id}/${quoteId}`), {
                    viewed: true,
                    viewedAt: new Date().toISOString()
                });
                setClickedQuotes(prev => ({
                    ...prev,
                    [quoteId]: true
                }));
            } catch (error) {
                console.error('Error marking quote as viewed:', error);
            }
        }
    };

    const handleQuoteClick = (quote) => {
        markQuoteAsViewed(quote.id);
        setSelectedQuote(quote);
        // Alternar expansão do item
        setExpandedQuote(expandedQuote === quote.id ? null : quote.id);
    };

    const handleQuoteResponse = (event, quote) => {
        event.stopPropagation();
        setSelectedQuoteForMenu(quote);
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedQuoteForMenu(null);
    };

    const handleOpenPlatformResponse = (quote) => {
        setResponseQuote(quote);
        setResponseForm({
            message: quote.response?.message || '',
            totalPrice: quote.response?.totalPrice ? String(quote.response.totalPrice) : '',
            validityDays: '7',
        });
        setResponseError('');
        setResponseDialogOpen(true);
        handleMenuClose();
    };

    const handleClosePlatformResponse = () => {
        if (responseSubmitting) return;
        setResponseDialogOpen(false);
        setResponseQuote(null);
        setResponseError('');
    };

    const handleSubmitPlatformResponse = async () => {
        const validation = validateQuoteResponse(responseForm);
        const firstValidationError = Object.values(validation.errors)[0];
        if (firstValidationError) {
            setResponseError(firstValidationError);
            return;
        }
        if (!responseQuote || !hasMarketModule || auth.currentUser?.uid !== responseQuote.storeId) {
            setResponseError('Não tem autorização para responder a este pedido.');
            return;
        }

        setResponseSubmitting(true);
        setResponseError('');

        try {
            const { updates: responseUpdates } = buildQuoteResponseUpdates({
                quote: responseQuote,
                form: responseForm,
                responderId: auth.currentUser.uid,
            });

            await update(ref(db), responseUpdates);
            setSnackbar({ open: true, message: 'Resposta enviada ao cliente.', severity: 'success' });
            setResponseDialogOpen(false);
            setResponseQuote(null);
        } catch (error) {
            console.error('Erro ao responder ao pedido da loja:', error);
            setResponseError('Não foi possível enviar a resposta. Tente novamente.');
        } finally {
            setResponseSubmitting(false);
        }
    };

    const handleContactCustomer = (type, quote) => {
        const customerContact = quote.customerContact;
        const customerEmail = quote.customerEmail;
        
        if (type === 'whatsapp' && customerContact) {
            const message = `Olá! Recebi sua solicitação de cotação através da BizMoz.\n\n`;
            const itemsList = quote.items.map((item, idx) => 
                `${idx + 1}. ${item.productName} - Quantidade: ${item.quantity}${item.specifications ? ` (${item.specifications})` : ''}`
            ).join('\n');
            
            const fullMessage = `${message}**Itens solicitados:**\n${itemsList}\n\nComo posso ajudar?`;
            const whatsappUrl = `https://wa.me/${customerContact.replace(/\D/g, '')}?text=${encodeURIComponent(fullMessage)}`;
            window.open(whatsappUrl, '_blank');
        } else if (type === 'phone' && customerContact) {
            window.location.href = `tel:${customerContact}`;
        } else if (type === 'email' && customerEmail) {
            const subject = `Resposta à sua cotação - ${quote.storeName}`;
            const itemsList = quote.items.map((item, idx) => 
                `${idx + 1}. ${item.productName} - Quantidade: ${item.quantity}${item.specifications ? ` (${item.specifications})` : ''}`
            ).join('\n');
            
            const body = `Olá,\n\nRecebi sua solicitação de cotação através da BizMoz.\n\n**Itens solicitados:**\n${itemsList}\n\nAguardo seu contato para mais detalhes.\n\nAtenciosamente.`;
            window.location.href = `mailto:${customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        }
        
        handleMenuClose();
    };

    const getFilteredItems = () => {
        const now = new Date();
        const userCotacoes = cotacoes.filter(c => 
            c.company?.id === user?.id || 
            c.userId === user?.id || 
            c.createdBy === user?.id
        );
        
        switch (activeTab) {
            case 'recentes':
                return {
                    published: cotacoes.filter(
                        (cotacao) => new Date(cotacao.datalimite) >= now && 
                                    cotacao.status !== 'Fechada' &&
                                    cotacao.status !== 'Expirada' &&
                                    cotacao.company?.id !== user?.id 
                    ),
                    received: quotesReceived.filter(quote => quote.status === 'pending')
                };
            case 'expiradas':
                return {
                    published: cotacoes.filter(
                        (cotacao) => (new Date(cotacao.datalimite) < now || 
                                     cotacao.status === 'Expirada') && 
                                    cotacao.status !== 'Fechada'
                    ),
                    received: quotesReceived.filter(quote => quote.status === 'expired')
                };
            case 'fechada':
                return {
                    published: cotacoes.filter(
                        (cotacao) => cotacao.status === 'Fechada'
                    ),
                    received: quotesReceived.filter(quote => quote.status === 'answered')
                };
            case 'minhas':
                return {
                    published: userCotacoes,
                    received: []
                };
            case 'recebidas':
                return {
                    published: [],
                    received: quotesReceived
                };
            default:
                return {
                    published: cotacoes,
                    received: quotesReceived
                };
        }
    };

    const handleCotacaoClick = async (id) => {
        if (user && hasSmsModule) {
            try {
                await set(ref(db, `cotacoes/${id}/clicks/${user.id}`), true);
                setClickedCotacoes(prev => ({
                    ...prev,
                    [id]: true
                }));
            } catch (error) {
                console.error('Error recording click:', error);
            }
        }
        navigate(`/cotacao/${id}`);
    };

    const handleEditClick = (cotacao) => {
        if (!user || !hasSmsModule) return;
        setSelectedCotacao(cotacao);
        setEditDialogOpen(true);
    };

    const handleCloseEditDialog = () => {
        setEditDialogOpen(false);
        setSelectedCotacao(null);
    };

    const getStatusColor = (cotacao) => {
        if (cotacao.status === 'Fechada') return T.success;
        if (cotacao.status === 'Expirada' || !isDateValid(cotacao.datalimite)) return T.error;
        return T.gold;
    };

    const getStatusLabel = (cotacao) => {
        if (cotacao.status === 'Fechada') return 'Fechada';
        if (cotacao.status === 'Expirada' || !isDateValid(cotacao.datalimite)) return 'Expirada';
        return 'Ativa';
    };

    const getQuoteStatusColor = (quote) => {
        if (quote.status === 'answered') return T.success;
        if (quote.status === 'expired') return T.error;
        return T.gold;
    };

    const getQuoteStatusLabel = (quote) => {
        if (quote.status === 'answered') return 'Respondida';
        if (quote.status === 'expired') return 'Expirada';
        return 'Pendente';
    };

    const renderCotacoes = () => {
        if (loading) {
            return (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <CircularProgress size={48} thickness={4} sx={{ color: T.gold }} />
                </Box>
            );
        }
    
        const { published, received } = getFilteredItems();
        const totalItems = published.length + received.length;
        
        if (totalItems === 0) {
            let message = '';
            if (activeTab === 'recebidas') {
                message = 'Nenhuma solicitação de cotação recebida';
            } else if (activeTab === 'minhas') {
                message = 'Você ainda não publicou nenhuma cotação';
            } else {
                message = 'Não há cotações disponíveis no momento';
            }
            
            return (
                <Paper sx={{ 
                    p: 6, 
                    textAlign: 'center',
                    bgcolor: T.navyCard,
                    border: `1px solid ${T.darkBorder}`,
                    borderRadius: 3,
                }}>
                    <Box sx={{ mb: 2 }}>
                        <Warning sx={{ fontSize: 48, color: T.darkMuted }} />
                    </Box>
                    <Typography sx={{ color: T.darkText, fontSize: '1.1rem', mb: 1 }}>
                        {message}
                    </Typography>
                    {activeTab === 'recebidas' && (
                        <Typography sx={{ color: T.darkTextSub, fontSize: '0.9rem' }}>
                            Quando clientes solicitarem cotações através da sua loja, elas aparecerão aqui.
                        </Typography>
                    )}
                </Paper>
            );
        }
    
        return (
            <Box className="fade-up">
                {/* Cotações Recebidas (da loja) */}
                {received.length > 0 && (
                    <Box sx={{ mb: 4 }}>
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                color: T.gold, 
                                mb: 2, 
                                fontFamily: '"Playfair Display", serif',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}
                        >
                            <Receipt sx={{ fontSize: 24 }} /> Solicitações Recebidas ({received.length})
                        </Typography>
                        
                        {received.map((quote, index) => (
                            <Card 
                                key={quote.id} 
                                className={`quote-card ${!clickedQuotes[quote.id] ? 'unread' : ''}`}
                                sx={{ 
                                    animation: `fadeUp 0.5s ease ${index * 0.05}s both`,
                                    cursor: 'pointer',
                                    overflow: 'visible',
                                }}
                            >
                                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={9}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                <Avatar 
                                                    sx={{ 
                                                        width: 56, 
                                                        height: 56, 
                                                        border: `2px solid ${T.gold}`,
                                                        bgcolor: T.navy,
                                                    }}
                                                >
                                                    <Person sx={{ fontSize: 28 }} />
                                                </Avatar>
                                                
                                                <Box sx={{ flex: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                                        <Typography 
                                                            variant="h6" 
                                                            sx={{ 
                                                                fontFamily: '"Playfair Display", serif',
                                                                fontWeight: 700,
                                                                color: T.white,
                                                                fontSize: { xs: '1rem', sm: '1.1rem' }
                                                            }}
                                                        >
                                                            Cotação de {quote.customerName || 'Cliente Anônimo'}
                                                        </Typography>
                                                        <Chip
                                                            label={getQuoteStatusLabel(quote)}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: `${getQuoteStatusColor(quote)}20`,
                                                                color: getQuoteStatusColor(quote),
                                                                border: `1px solid ${getQuoteStatusColor(quote)}40`,
                                                                fontWeight: 600,
                                                                fontSize: '0.7rem',
                                                            }}
                                                        />
                                                        {!clickedQuotes[quote.id] && (
                                                            <Badge 
                                                                variant="dot" 
                                                                color="error"
                                                                sx={{ '& .MuiBadge-dot': { bgcolor: T.gold } }}
                                                            />
                                                        )}
                                                    </Box>

                                                    <Typography sx={{ color: T.darkTextSub, mb: 2, fontSize: '0.9rem' }}>
                                                        {quote.customerContact && `📞 ${quote.customerContact}`}
                                                        {quote.customerContact && quote.customerEmail && ' • '}
                                                        {quote.customerEmail && `✉️ ${quote.customerEmail}`}
                                                    </Typography>

                                                    {/* Resumo dos itens */}
                                                    <Box 
                                                        sx={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            gap: 1, 
                                                            mb: 1,
                                                            cursor: 'pointer',
                                                            color: T.gold,
                                                        }}
                                                        onClick={() => handleQuoteClick(quote)}
                                                    >
                                                        <Inventory sx={{ fontSize: 18 }} />
                                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                                            {quote.totalItems} {quote.totalItems === 1 ? 'item solicitado' : 'itens solicitados'}
                                                        </Typography>
                                                        {expandedQuote === quote.id ? <ExpandLess /> : <ExpandMore />}
                                                    </Box>

                                                    {/* Lista de itens (expansível) */}
                                                    <Collapse in={expandedQuote === quote.id}>
                                                        <Box sx={{ mt: 2, pl: 2, borderLeft: `2px solid ${T.gold}` }}>
                                                            {quote.items?.map((item, idx) => (
                                                                <Box key={idx} sx={{ mb: 2 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                                        {item.productType === 'product' ? (
                                                                            <Inventory sx={{ color: T.gold, fontSize: 16 }} />
                                                                        ) : (
                                                                            <Description sx={{ color: T.gold, fontSize: 16 }} />
                                                                        )}
                                                                        <Typography sx={{ color: T.white, fontWeight: 600, fontSize: '0.9rem' }}>
                                                                            {item.productName}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', pl: 3 }}>
                                                                        <Typography sx={{ color: T.darkTextSub, fontSize: '0.75rem' }}>
                                                                            Quantidade: <strong style={{ color: T.white }}>{item.quantity}</strong>
                                                                        </Typography>
                                                                        {item.specifications && (
                                                                            <Typography sx={{ color: T.darkTextSub, fontSize: '0.75rem' }}>
                                                                                Especificações: {item.specifications}
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    </Collapse>

                                                    {quote.message && (
                                                        <Typography sx={{ 
                                                            color: T.darkTextSub, 
                                                            fontSize: '0.85rem', 
                                                            mt: 2,
                                                            bgcolor: 'rgba(255,255,255,0.05)',
                                                            p: 1,
                                                            borderRadius: 1,
                                                            borderLeft: `3px solid ${T.gold}`
                                                        }}>
                                                            💬 "{quote.message}"
                                                        </Typography>
                                                    )}

                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mt: 2 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <CalendarToday sx={{ color: T.darkMuted, fontSize: 14 }} />
                                                            <Typography sx={{ color: T.darkMuted, fontSize: '0.75rem' }}>
                                                                Recebido: {new Date(quote.createdAt).toLocaleDateString('pt-PT')}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <AccessTime sx={{ color: T.gold, fontSize: 14 }} />
                                                            <Typography sx={{ color: T.gold, fontSize: '0.75rem', fontWeight: 600 }}>
                                                                Preferência: {quote.contactPreference === 'whatsapp' ? 'WhatsApp' : 'Email'}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={12} sm={3}>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                flexDirection: { xs: 'row', sm: 'column' }, 
                                                justifyContent: 'flex-end',
                                                alignItems: { xs: 'center', sm: 'flex-end' },
                                                gap: 1,
                                                height: '100%',
                                            }}>
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleQuoteResponse(e, quote)}
                                                    sx={{ 
                                                        color: T.gold,
                                                        border: `1px solid ${T.darkBorder}`,
                                                        '&:hover': { borderColor: T.gold }
                                                    }}
                                                >
                                                    <MoreVert />
                                                </IconButton>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}

                {/* Cotações Publicadas */}
                {published.length > 0 && (
                    <Box>
                        {activeTab !== 'recebidas' && (
                            <Typography 
                                variant="h6" 
                                sx={{ 
                                    color: T.gold, 
                                    mb: 2, 
                                    fontFamily: '"Playfair Display", serif',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}
                            >
                                <Store sx={{ fontSize: 24 }} /> Cotações Disponíveis ({published.length})
                            </Typography>
                        )}
                        
                        {published.map((cotacao, index) => (
                            <Card 
                                key={cotacao.id} 
                                className={`quote-card ${!clickedCotacoes[cotacao.id] && user ? 'unread' : ''}`}
                                sx={{ 
                                    animation: `fadeUp 0.5s ease ${index * 0.05}s both`,
                                    cursor: 'pointer'
                                }}
                                onClick={() => handleCotacaoClick(cotacao.id)}
                            >
                                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={9}>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                <Avatar 
                                                    src={cotacao.company?.logoUrl} 
                                                    sx={{ 
                                                        width: 56, 
                                                        height: 56, 
                                                        border: `2px solid ${T.gold}`,
                                                        bgcolor: T.navy,
                                                    }}
                                                >
                                                    {cotacao.company?.nome?.charAt(0)}
                                                </Avatar>
                                                
                                                <Box sx={{ flex: 1 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                                        <Typography 
                                                            variant="h6" 
                                                            sx={{ 
                                                                fontFamily: '"Playfair Display", serif',
                                                                fontWeight: 700,
                                                                color: T.white,
                                                                fontSize: { xs: '1rem', sm: '1.1rem' }
                                                            }}
                                                        >
                                                            {cotacao.title}
                                                        </Typography>
                                                        <Chip
                                                            label={getStatusLabel(cotacao)}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: `${getStatusColor(cotacao)}20`,
                                                                color: getStatusColor(cotacao),
                                                                border: `1px solid ${getStatusColor(cotacao)}40`,
                                                                fontWeight: 600,
                                                                fontSize: '0.7rem',
                                                            }}
                                                        />
                                                        {!clickedCotacoes[cotacao.id] && user && (
                                                            <Badge 
                                                                variant="dot" 
                                                                color="error"
                                                                sx={{ '& .MuiBadge-dot': { bgcolor: T.gold } }}
                                                            />
                                                        )}
                                                    </Box>

                                                    <Typography sx={{ color: T.darkTextSub, mb: 2, fontSize: '0.9rem' }}>
                                                        {cotacao.company?.nome || 'Anônimo'}
                                                    </Typography>

                                                    <Grid container spacing={2} sx={{ mb: 1 }}>
                                                        <Grid item xs={12} sm={6}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Category sx={{ color: T.gold, fontSize: 16 }} />
                                                                <Typography sx={{ color: T.darkTextSub, fontSize: '0.8rem' }}>
                                                                    Sector: <strong style={{ color: T.white }}>{cotacao.sector || cotacao.company?.sector}</strong>
                                                                </Typography>
                                                            </Box>
                                                        </Grid>
                                                        <Grid item xs={12} sm={6}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <LocationOn sx={{ color: T.gold, fontSize: 16 }} />
                                                                <Typography sx={{ color: T.darkTextSub, fontSize: '0.8rem' }}>
                                                                    Província: <strong style={{ color: T.white }}>{cotacao.company?.provincia}</strong>
                                                                </Typography>
                                                            </Box>
                                                        </Grid>
                                                    </Grid>

                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <CalendarToday sx={{ color: T.darkMuted, fontSize: 14 }} />
                                                            <Typography sx={{ color: T.darkMuted, fontSize: '0.75rem' }}>
                                                                Publicado: {new Date(cotacao.timestamp).toLocaleDateString('pt-PT')}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <AccessTime sx={{ color: isDateValid(cotacao.datalimite) ? T.gold : T.error, fontSize: 14 }} />
                                                            <Typography sx={{ color: isDateValid(cotacao.datalimite) ? T.gold : T.error, fontSize: '0.75rem', fontWeight: 600 }}>
                                                                Limite: {new Date(cotacao.datalimite).toLocaleDateString('pt-PT')}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Grid>

                                        <Grid item xs={12} sm={3}>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                flexDirection: { xs: 'row', sm: 'column' }, 
                                                justifyContent: 'flex-end',
                                                alignItems: { xs: 'center', sm: 'flex-end' },
                                                gap: 1,
                                                height: '100%',
                                            }}>
                                                <Button
                                                    variant="contained"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleCotacaoClick(cotacao.id);
                                                    }}
                                                    sx={{
                                                        bgcolor: T.gold,
                                                        color: T.navy,
                                                        '&:hover': { bgcolor: T.goldLight },
                                                        borderRadius: '8px',
                                                        px: 3,
                                                        minWidth: 120,
                                                    }}
                                                >
                                                    Ver detalhes
                                                </Button>
                                                
                                                {user && hasSmsModule && (
                                                    (cotacao?.company?.id === user.id || 
                                                     cotacao?.userId === user.id || 
                                                     cotacao?.createdBy === user.id) && (
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <Tooltip title="Editar cotação" arrow>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleEditClick(cotacao);
                                                                    }}
                                                                    sx={{ 
                                                                        color: T.gold,
                                                                        border: `1px solid ${T.darkBorder}`,
                                                                        '&:hover': { borderColor: T.gold }
                                                                    }}
                                                                >
                                                                    <Edit fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Excluir cotação" arrow>
                                                                <IconButton
                                                                    size="small"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        deleteCotacao(cotacao.id);
                                                                    }}
                                                                    sx={{ 
                                                                        color: T.error,
                                                                        border: `1px solid ${T.darkBorder}`,
                                                                        '&:hover': { borderColor: T.error }
                                                                    }}
                                                                >
                                                                    <Delete fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </Box>
                                                    )
                                                )}
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                )}
            </Box>
        );
    };

    // Menu de ações para cotações recebidas
    const actionMenu = (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
                sx: {
                    bgcolor: T.navyCard,
                    border: `1px solid ${T.darkBorder}`,
                    borderRadius: '12px',
                    mt: 1,
                }
            }}
        >
            {selectedQuoteForMenu && (
                <MenuItem onClick={() => handleOpenPlatformResponse(selectedQuoteForMenu)}>
                    <ListItemIcon>
                        <Reply sx={{ color: T.gold }} />
                    </ListItemIcon>
                    <ListItemText primary={selectedQuoteForMenu.responded ? 'Atualizar resposta na plataforma' : 'Responder na plataforma'} />
                </MenuItem>
            )}
            {selectedQuoteForMenu?.customerContact && (
                <>
                    <MenuItem onClick={() => handleContactCustomer('whatsapp', selectedQuoteForMenu)}>
                        <ListItemIcon>
                            <WhatsApp sx={{ color: '#25D366' }} />
                        </ListItemIcon>
                        <ListItemText primary="Responder via WhatsApp" />
                    </MenuItem>
                    <MenuItem onClick={() => handleContactCustomer('phone', selectedQuoteForMenu)}>
                        <ListItemIcon>
                            <Phone sx={{ color: T.gold }} />
                        </ListItemIcon>
                        <ListItemText primary="Ligar para Cliente" />
                    </MenuItem>
                </>
            )}
            {selectedQuoteForMenu?.customerEmail && (
                <MenuItem onClick={() => handleContactCustomer('email', selectedQuoteForMenu)}>
                    <ListItemIcon>
                        <Email sx={{ color: '#EA4335' }} />
                    </ListItemIcon>
                    <ListItemText primary="Responder por Email" />
                </MenuItem>
            )}
            {(!selectedQuoteForMenu?.customerContact && !selectedQuoteForMenu?.customerEmail) && (
                <MenuItem disabled>
                    <ListItemText primary="Nenhum contacto disponível" />
                </MenuItem>
            )}
        </Menu>
    );

    if (modulesLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: T.navy }}>
                <CircularProgress size={48} thickness={4} sx={{ color: T.gold }} />
            </Box>
        );
    }

    return (
        <Box sx={{ 
            backgroundColor: T.navy, 
            minHeight: '100vh',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            position: 'relative',
        }}>
            <style>{KEYFRAMES}</style>
            
            {/* Background Grid */}
            <Box sx={BG_GRID} />

            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 4 }}>
                {/* Header */}
                <Paper sx={{ 
                    p: 3, 
                    mb: 3, 
                    bgcolor: T.navyCard,
                    border: `1px solid ${T.darkBorder}`,
                    borderRadius: 3,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                }}>
                    <Box>
                        <Typography 
                            variant="h4" 
                            sx={{ 
                                fontFamily: '"Playfair Display", serif',
                                fontWeight: 800,
                                color: T.white,
                                fontSize: { xs: '1.5rem', sm: '2rem' }
                            }}
                        >
                            Pedidos de Cotações
                        </Typography>
                        <Typography sx={{ color: T.darkTextSub, mt: 1 }}>
                            {user ? 'Encontre oportunidades para o seu negócio' : 'Faça login para ver cotações relevantes'}
                        </Typography>
                    </Box>
                    
                    {hasSmsModule && user && (
                        <Button
                            variant="contained"
                            startIcon={<Add />}
                            onClick={handlePublishQuotation}
                            sx={{
                                bgcolor: T.gold,
                                color: T.navy,
                                '&:hover': { bgcolor: T.goldLight },
                                borderRadius: '10px',
                                px: 3,
                                py: 1.2,
                                fontFamily: '"Plus Jakarta Sans", sans-serif',
                                fontWeight: 600,
                            }}
                        >
                            Novo Pedido
                        </Button>
                    )}
                </Paper>

                {/* Module Activation Alert */}
                {user && !hasQuotesAccess && (
                    <Alert
                        severity="warning"
                        icon={<Warning />}
                        sx={{
                            mb: 3,
                            bgcolor: 'rgba(245,158,11,0.12)',
                            color: T.warning,
                            border: `1px solid rgba(245,158,11,0.25)`,
                            borderRadius: '12px',
                            '& .MuiAlert-icon': { color: T.warning },
                        }}
                        action={
                            <Button
                                variant="contained"
                                size="medium"
                                onClick={() => navigate('/pagar/moduloSMS')}
                                sx={{
                                    bgcolor: T.warning,
                                    color: T.navy,
                                    '&:hover': { bgcolor: '#e67e22' },
                                    borderRadius: '8px',
                                }}>
                                Ativar Módulo
                            </Button>
                        }>
                        O módulo <strong>Alerta</strong> está inativo. Ative-o agora para acessar todos os recursos!
                    </Alert>
                )}

                {hasQuotesAccess && user && (
                    <>
                        {/* Tabs */}
                        <Paper sx={{ 
                            mb: 3, 
                            bgcolor: T.navyCard,
                            border: `1px solid ${T.darkBorder}`,
                            borderRadius: 2,
                            overflow: 'hidden',
                        }}>
                            <Tabs
                                value={activeTab}
                                onChange={(_, newValue) => setActiveTab(newValue)}
                                variant={isMobile ? "scrollable" : "standard"}
                                scrollButtons="auto"
                                sx={{
                                    '& .MuiTab-root': {
                                        color: T.darkTextSub,
                                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        fontSize: '0.9rem',
                                        minHeight: 56,
                                        '&.Mui-selected': { color: T.gold }
                                    },
                                    '& .MuiTabs-indicator': { bgcolor: T.gold }
                                }}
                            >
                                {hasSmsModule && <Tab value="recentes" label="Recentes" icon={<AccessTime sx={{ fontSize: 18 }} />} iconPosition="start" />}
                                {hasSmsModule && <Tab value="expiradas" label="Expiradas" icon={<History sx={{ fontSize: 18 }} />} iconPosition="start" />}
                                {hasSmsModule && <Tab value="fechada" label="Fechadas" icon={<CheckCircle sx={{ fontSize: 18 }} />} iconPosition="start" />}
                                {hasSmsModule && (
                                    <Tab
                                        value="minhas"
                                        label="Minhas"
                                        icon={<Avatar src={user?.logoUrl} sx={{ width: 20, height: 20 }} />}
                                        iconPosition="start"
                                    />
                                )}
                                {hasMarketModule && (
                                    <Tab
                                        value="recebidas"
                                        label="Recebidas da loja"
                                        icon={<Receipt sx={{ fontSize: 18 }} />}
                                        iconPosition="start"
                                        sx={{ position: 'relative' }}
                                    />
                                )}
                            </Tabs>
                        </Paper>

                        {/* Content */}
                        <Paper sx={{ 
                            p: { xs: 2, sm: 3 }, 
                            bgcolor: T.navyCard,
                            border: `1px solid ${T.darkBorder}`,
                            borderRadius: 3,
                            minHeight: '60vh',
                        }}>
                            {renderCotacoes()}
                        </Paper>
                    </>
                )}
            </Container>

            {/* Edit Dialog */}
            {user && hasSmsModule && (
                <Dialog
                    open={editDialogOpen}
                    onClose={handleCloseEditDialog}
                    fullWidth
                    maxWidth="md"
                    PaperProps={{
                        sx: {
                            bgcolor: T.navyCard,
                            border: `1px solid ${T.darkBorder}`,
                            borderRadius: '16px',
                        }
                    }}
                >
                    <DialogTitle sx={{ 
                        color: T.white, 
                        fontFamily: '"Playfair Display", serif',
                        borderBottom: `1px solid ${T.darkBorder}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        Editar Cotação
                        <IconButton onClick={handleCloseEditDialog} sx={{ color: T.darkMuted }}>
                            <Close />
                        </IconButton>
                    </DialogTitle>
                    <DialogContent sx={{ pt: 3 }}>
                        {selectedCotacao && (
                            <EditarCotacao 
                                cotacao={selectedCotacao} 
                                user={user} 
                                onClose={handleCloseEditDialog}
                                onSuccess={() => {
                                    setSnackbar({ open: true, message: 'Cotação atualizada com sucesso!', severity: 'success' });
                                    handleCloseEditDialog();
                                }}
                                onError={(error) => {
                                    setSnackbar({ open: true, message: `Erro ao atualizar cotação: ${error}`, severity: 'error' });
                                }}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            )}

            {/* Action Menu for Received Quotes */}
            {actionMenu}

            <Dialog
                open={responseDialogOpen}
                onClose={handleClosePlatformResponse}
                fullWidth
                maxWidth="sm"
                PaperProps={{ sx: { bgcolor: T.navyCard, color: T.white, borderRadius: 3 } }}
            >
                <DialogTitle>Responder ao pedido</DialogTitle>
                <DialogContent>
                    <Typography sx={{ color: T.darkTextSub, mb: 2 }}>
                        A resposta ficará disponível no histórico do cliente.
                    </Typography>
                    {responseError && <Alert severity="error" sx={{ mb: 2 }}>{responseError}</Alert>}
                    <TextField
                        autoFocus
                        required
                        fullWidth
                        multiline
                        minRows={4}
                        label="Mensagem"
                        value={responseForm.message}
                        onChange={(event) => setResponseForm(form => ({ ...form, message: event.target.value }))}
                        disabled={responseSubmitting}
                        sx={{ mb: 2 }}
                    />
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={7}>
                            <TextField
                                fullWidth
                                label="Preço total (MT, opcional)"
                                inputMode="decimal"
                                value={responseForm.totalPrice}
                                onChange={(event) => setResponseForm(form => ({ ...form, totalPrice: event.target.value }))}
                                disabled={responseSubmitting}
                            />
                        </Grid>
                        <Grid item xs={12} sm={5}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Validade (dias)"
                                value={responseForm.validityDays}
                                onChange={(event) => setResponseForm(form => ({ ...form, validityDays: event.target.value }))}
                                inputProps={{ min: 1, max: 90 }}
                                disabled={responseSubmitting}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={handleClosePlatformResponse} disabled={responseSubmitting}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handleSubmitPlatformResponse}
                        disabled={responseSubmitting}
                        startIcon={responseSubmitting ? <CircularProgress size={18} /> : <Reply />}
                    >
                        {responseSubmitting ? 'A enviar...' : 'Enviar resposta'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    severity={snackbar.severity}
                    sx={{
                        bgcolor: snackbar.severity === 'success' ? T.gold : T.error,
                        color: T.white,
                        borderRadius: '12px',
                        '& .MuiAlert-icon': { color: T.white }
                    }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default CotacoesDesk;

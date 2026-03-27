import { useEffect } from 'react';

const ProductMetaTags = ({ product, storeInfo, productId, store }) => {
  useEffect(() => {
    if (!product || !storeInfo) return;

    const url = `${window.location.origin}/product/${productId}/store/${store}`;
    const title = `${product.name} | Connection MZ`;
    const description = product.description 
      ? (product.description.length > 160 
          ? `${product.description.substring(0, 157)}...` 
          : product.description)
      : `Confira ${product.name} na loja ${storeInfo?.company?.nome || 'Connection MZ'}. Encontre os melhores produtos e serviços em Moçambique.`;
    
    // Usar imagem do produto ou fallback
    const imageUrl = product.imageUrl 
      ? product.imageUrl 
      : `${window.location.origin}/og-image.png`;
    
    // Função para atualizar meta tags
    const updateMetaTag = (property, content) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    const updateMetaTagName = (name, content) => {
      let meta = document.querySelector(`meta[name="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };
    
    // Atualizar Open Graph tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:image', imageUrl);
    updateMetaTag('og:url', url);
    updateMetaTag('og:type', 'product');
    
    // Adicionar tags específicas para produto
    updateMetaTag('product:price:amount', product.discountPrice || product.price || '');
    updateMetaTag('product:price:currency', 'MZN');
    updateMetaTag('product:availability', product.qtd > 0 ? 'in stock' : 'out of stock');
    updateMetaTag('product:brand', storeInfo?.company?.nome || 'Connection MZ');
    
    // Atualizar Twitter Cards
    updateMetaTagName('twitter:card', 'summary_large_image');
    updateMetaTagName('twitter:title', title);
    updateMetaTagName('twitter:description', description);
    updateMetaTagName('twitter:image', imageUrl);
    updateMetaTagName('twitter:url', url);
    
    // Atualizar meta tags básicas
    updateMetaTagName('description', description);
    
    // Adicionar tags para imagem (tamanho recomendado)
    updateMetaTag('og:image:width', '1200');
    updateMetaTag('og:image:height', '630');
    updateMetaTag('og:image:alt', product.name);
    
    // Atualizar título da página
    document.title = title;
    
    // Cleanup: restaurar meta tags originais quando desmontar
    return () => {
      updateMetaTag('og:title', 'Connection Mozambique');
      updateMetaTag('og:description', 'Descubra oportunidades de negócio em Moçambique com o nosso software especializado em cotações, concursos e muito mais.');
      updateMetaTag('og:image', `${window.location.origin}/og-image.png`);
      updateMetaTagName('twitter:title', 'Connection Mozambique');
      updateMetaTagName('twitter:description', 'Plataforma de oportunidades de negócio com cotações, concursos e fornecedores.');
      document.title = 'Connection Mozambique';
    };
  }, [product, storeInfo, productId, store]);
  
  return null;
};

export default ProductMetaTags;
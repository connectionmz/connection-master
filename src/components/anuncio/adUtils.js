// utils/adUtils.js
export const formatPrice = (value) => {
    return new Intl.NumberFormat('pt-MZ').format(value);
  };
  
  export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  export const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'expired': return 'error';
      default: return 'default';
    }
  };
  
  export const calculateCTR = (clicks, impressions) => {
    return impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : 0;
  };

  export const isAdExpired = (ad) => {
  if (!ad.expireDate) return false;
  const expireDate = new Date(ad.expireDate);
  const now = new Date();
  return now > expireDate;
};
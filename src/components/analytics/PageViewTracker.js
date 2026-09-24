import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../../utils/analytics';

// SPA routing não dispara o page_view automático do GA4 (esse assume
// carregamentos de página inteiros), por isso registamos um por navegação.
const PageViewTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  return null;
};

export default PageViewTracker;

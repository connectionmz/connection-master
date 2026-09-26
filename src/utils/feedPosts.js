import { isPostPublic } from './postData';
import { decodeEntities } from './richText';
import { normalizeDirectoryText } from './companyDirectory';

export const FEED_PAGE_SIZE = 12;
export const MIN_SEARCH_LENGTH = 2;

const stripHtml = (value = '') => decodeEntities(String(value).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

export const toTimestamp = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const numericValue = Number(value);
    if (Number.isFinite(numericValue)) return numericValue;
    const parsedValue = Date.parse(value);
    return Number.isNaN(parsedValue) ? 0 : parsedValue;
  }
  return 0;
};

export const normalizeFeedPost = (postId, value) => {
  const post = value && typeof value === 'object' ? value : {};
  const company = post.company && typeof post.company === 'object' ? post.company : {};

  return {
    id: post.id || postId,
    description: stripHtml(post.description),
    imageUrl: post.url || post.imageUrl || '',
    timestamp: toTimestamp(post.timestamp || post.createdAt),
    company: {
      id: company.id || post.companyId || '',
      name: company.name || post.companyName || 'Empresa',
      logo: company.logo || post.logoUrl || '',
      province: company.provincia || post.provincia || '',
      sector: company.sector || '',
    },
  };
};

export const normalizePublicFeedPosts = (data) => (data && typeof data === 'object'
  ? Object.entries(data)
    .filter(([, post]) => isPostPublic(post))
    .map(([postId, post]) => normalizeFeedPost(postId, post))
    .sort((a, b) => b.timestamp - a.timestamp)
  : []);

export const companyKey = (company) => company.id || company.name;

export const isSearchActive = (search) => normalizeDirectoryText(search).length >= MIN_SEARCH_LENGTH;

// Todas as palavras pesquisadas têm de existir no texto, na empresa, no setor ou na província.
export const filterFeedPosts = (posts, { search = '', companyId = 'all' } = {}) => {
  const terms = normalizeDirectoryText(search).split(/\s+/).filter(Boolean);
  return posts.filter((post) => {
    if (companyId !== 'all' && companyKey(post.company) !== companyId) return false;
    if (!terms.length) return true;
    const haystack = normalizeDirectoryText([post.description, post.company.name, post.company.sector, post.company.province].join(' '));
    return terms.every((term) => haystack.includes(term));
  });
};

export const uniqueCompanies = (posts) => {
  const companies = new Map();
  posts.forEach(({ company }) => {
    const key = companyKey(company);
    if (key && !companies.has(key)) companies.set(key, { ...company, key });
  });
  return Array.from(companies.values());
};

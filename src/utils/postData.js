const plainText = (value = '') => String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const normalizePostDetail = (data, postId, companyFallback = '') => {
  if (!data) return null;
  return {
    id: postId,
    description: plainText(data.description),
    url: typeof data.url === 'string' ? data.url.trim() : '',
    companyName: data.company?.name || companyFallback,
    logoUrl: data.company?.logo || '',
    companyId: data.company?.id || '',
    storagePath: data.storagePath || '',
    createdAt: data.createdAt || data.timestamp || null,
    verified: Boolean(data.company?.verified),
  };
};

const postTime = (post) => {
  const value = post?.timestamp ?? post?.createdAt ?? 0;
  const numericValue = Number(value);
  if (Number.isFinite(numericValue)) return numericValue;
  const dateValue = new Date(value).getTime();
  return Number.isFinite(dateValue) ? dateValue : 0;
};

const normalizeCompanyPosts = (data, companyId) => Object.entries(data || {})
  .map(([id, post]) => ({ ...post, id: post?.id || id }))
  .filter(post => post?.company?.id === companyId)
  .sort((a, b) => postTime(b) - postTime(a));

export { normalizeCompanyPosts, normalizePostDetail, plainText };

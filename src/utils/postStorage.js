const isOwnedPostStoragePath = (storagePath, userId) => {
  if (typeof storagePath !== 'string' || !userId) return false;
  const segments = storagePath.split('/');
  return segments.length >= 3
    && segments[0] === 'published'
    && segments[1] === userId
    && segments.slice(2).every(segment => segment && segment !== '.' && segment !== '..');
};

export { isOwnedPostStoragePath };

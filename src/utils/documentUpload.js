export const DOCUMENT_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export const plainDocumentText = (value = '') => String(value)
  .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);

export const safeDocumentName = (value = 'document') => String(value)
  .normalize('NFKD').replace(/[^a-zA-Z0-9._-]/g, '_').slice(-120);

export const classifyDocuments = (existing, selected, { maxFiles = 10, maxBytes = 10 * 1024 * 1024 } = {}) => {
  const names = new Set(existing.map(({ name }) => name));
  const accepted = [];
  const rejected = [];
  selected.forEach((file) => {
    let reason = null;
    if (names.has(file.name)) reason = 'duplicate';
    else if (!DOCUMENT_TYPES.has(file.type)) reason = 'type';
    else if (file.size > maxBytes) reason = 'size';
    else if (existing.length + accepted.length >= maxFiles) reason = 'limit';
    if (reason) rejected.push({ file, reason });
    else { accepted.push(file); names.add(file.name); }
  });
  return { accepted, rejected };
};

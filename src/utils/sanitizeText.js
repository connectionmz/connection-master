// Strips characters that let free-text fields (company/person name, store
// name, etc.) be used to inject markup — e.g. a "nome" of
// `Francisco Gonsalves<img src=x onerror=alert('XSS')>` found live in
// production. React escapes JSX text by default, so this isn't exploitable
// through normal {value} rendering, but it costs nothing to keep tags out of
// fields that only ever hold a plain name, and it protects any current or
// future consumer (PDFs, emails, admin tools, exports) that isn't React JSX.
export const sanitizePlainText = (value, maxLength = 200) => {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').trim().slice(0, maxLength);
};

// Validates a free-text name field (company name, person name, store name):
// reasonable length, no HTML tags or inline-event/javascript: payloads.
// Used at submit time so the form can reject with a clear message instead of
// silently mangling what the user typed.
export const isSafePlainName = (value, { minLength = 2, maxLength = 150 } = {}) => {
  const name = String(value || '').trim();
  return name.length >= minLength
    && name.length <= maxLength
    && !/<[^>]*>|javascript:|on\w+\s*=/i.test(name);
};

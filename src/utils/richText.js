const NAMED_ENTITIES = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

export const decodeEntities = (value = '') => String(value).replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity) => {
  const key = entity.toLowerCase();
  if (key[0] === '#') {
    const code = key[1] === 'x' ? parseInt(key.slice(2), 16) : parseInt(key.slice(1), 10);
    return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
  }
  return key in NAMED_ENTITIES ? NAMED_ENTITIES[key] : match;
});

// Converte HTML do editor (ou texto com entidades) em texto simples que mantém parágrafos,
// quebras de linha e listas — sem nunca guardar ou renderizar HTML.
export const toReadableText = (value) => {
  let text = String(value ?? '');
  if (/<[a-z!/][^>]*>/i.test(text)) {
    let ordered = false;
    let counter = 0;
    text = text
      .replace(/<(ol|ul)[^>]*>|<\/(?:ol|ul)>|<li[^>]*>/gi, (tag, list) => {
        if (list) { ordered = list.toLowerCase() === 'ol'; counter = 0; return '\n'; }
        if (tag.startsWith('</')) return '\n';
        counter += 1;
        return ordered ? `\n${counter}. ` : '\n• ';
      })
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|h[1-6]|blockquote|pre)>/gi, '\n')
      .replace(/<[^>]*>/g, '');
  }
  return decodeEntities(text)
    .replace(/\r\n?/g, '\n')
    .replace(/​/g, '')
    .replace(/[ \t ]+/g, ' ')
    .replace(/ +([.,;:])/g, '$1')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const escapeHtml = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Texto guardado (simples, com quebras de linha) → HTML de parágrafos para o editor Quill.
export const textToEditorHtml = (value) => {
  const text = toReadableText(value);
  if (!text) return '';
  return text.split('\n').map((line) => (line ? `<p>${escapeHtml(line)}</p>` : '<p><br></p>')).join('');
};

const SECTION_LABEL = /(Miss[ãa]o|Vis[ãa]o|Valores)/g;
const canonicalLabel = (label) => {
  const lower = label.toLowerCase();
  if (lower.startsWith('miss')) return 'Missão';
  if (lower.startsWith('vis')) return 'Visão';
  return 'Valores';
};

// "Missão", "Visão" e "Valores" só abrem uma secção no início de uma frase/linha e quando
// seguidos de ":" / "-" / fim de linha ou de uma palavra com maiúscula — evita falsos positivos.
const opensSection = (text, index, end) => {
  let before = index - 1;
  while (before >= 0 && (text[before] === ' ' || text[before] === '\t')) before -= 1;
  if (before >= 0 && !'\n.!?…'.includes(text[before])) return false;
  const rest = text.slice(end);
  return /^\s*(?:[:\-–]|\n|$)/.test(rest) || /^\s+[A-ZÀ-ÖØ-Þ“"'(]/.test(rest);
};

export const splitAboutSections = (value) => {
  const text = String(value ?? '').trim();
  if (!text) return [];

  const matches = [];
  const finder = new RegExp(SECTION_LABEL.source, 'g');
  let found = finder.exec(text);
  while (found !== null) {
    const end = found.index + found[0].length;
    if (opensSection(text, found.index, end)) matches.push({ index: found.index, end, heading: canonicalLabel(found[0]) });
    found = finder.exec(text);
  }

  if (matches.length < 2 && !(matches.length === 1 && matches[0].index === 0)) {
    return [{ heading: null, body: text }];
  }

  const sections = [];
  const preamble = text.slice(0, matches[0].index).trim();
  if (preamble) sections.push({ heading: null, body: preamble });
  matches.forEach((match, i) => {
    const next = matches[i + 1];
    const body = text.slice(match.end, next ? next.index : undefined).replace(/^\s*[:\-–]\s*/, '').trim();
    if (body) sections.push({ heading: match.heading, body });
  });
  return sections.length ? sections : [{ heading: null, body: text }];
};

const BULLET = /^(?:[•\-*–]|\d+[.)])\s+/;

const isShortValue = (line) => line.length <= 60 && line.split(' ').length <= 6 && !/[.!?]$/.test(line);

// Divide o corpo em parágrafos, listas (linhas com marcador) e — com valuesMode, para "Valores" —
// em etiquetas: uma por linha curta, ou por palavra com maiúscula quando a lista veio achatada.
export const toBlocks = (body, { valuesMode = false } = {}) => String(body ?? '')
  .split(/\n{2,}/)
  .map((chunk) => chunk.trim())
  .filter(Boolean)
  .map((chunk) => {
    const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean);
    if (lines.length >= 2 && lines.every((line) => BULLET.test(line))) {
      return { type: 'list', items: lines.map((line) => line.replace(BULLET, '')) };
    }
    if (valuesMode && lines.length >= 2 && lines.every(isShortValue)) {
      return { type: 'chips', items: lines };
    }
    if (valuesMode && lines.length === 1 && !/[.,;:!?]/.test(lines[0])) {
      const words = lines[0].split(' ');
      if (words.length >= 2 && words.length <= 12 && words.every((word) => /^[A-ZÀ-ÖØ-Þ]/.test(word))) {
        return { type: 'chips', items: words };
      }
    }
    return { type: 'text', text: chunk };
  });

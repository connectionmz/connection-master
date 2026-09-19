import { sanitizePlainText, isSafePlainName } from './sanitizeText';

describe('sanitizePlainText', () => {
  it('strips angle brackets so markup cannot be injected', () => {
    expect(sanitizePlainText("Francisco Gonsalves<img src=x onerror=alert('XSS')>"))
      .toBe("Francisco Gonsalvesimg src=x onerror=alert('XSS')");
  });

  it('trims surrounding whitespace', () => {
    expect(sanitizePlainText('  Empresa Teste  ')).toBe('Empresa Teste');
  });

  it('caps length', () => {
    expect(sanitizePlainText('a'.repeat(300), 10)).toBe('a'.repeat(10));
  });

  it('returns empty string for non-string input', () => {
    expect(sanitizePlainText(undefined)).toBe('');
    expect(sanitizePlainText(null)).toBe('');
  });
});

describe('isSafePlainName', () => {
  it('rejects names containing HTML tags', () => {
    expect(isSafePlainName("Francisco Gonsalves<img src=x onerror=alert('XSS')>")).toBe(false);
  });

  it('rejects javascript: and inline event handler payloads even without a tag', () => {
    expect(isSafePlainName('javascript:alert(1)')).toBe(false);
    expect(isSafePlainName('foo onclick=alert(1)')).toBe(false);
  });

  it('accepts a normal name', () => {
    expect(isSafePlainName('Connection Mozambique, Lda')).toBe(true);
  });

  it('rejects names that are too short or too long', () => {
    expect(isSafePlainName('A')).toBe(false);
    expect(isSafePlainName('a'.repeat(151))).toBe(false);
  });
});

import { getPaymentErrorKey, getSafeReturnPath, validatePaymentResponse } from './paymentFlow';

describe('payment flow helpers', () => {
  test('preserves an internal route including query and hash', () => {
    expect(getSafeReturnPath({
      from: { pathname: '/market/products/new', search: '?draft=1', hash: '#details' },
    })).toBe('/market/products/new?draft=1#details');
  });

  test('rejects external return destinations', () => {
    expect(getSafeReturnPath({ from: '//malicious.example' }, '/market')).toBe('/market');
    expect(getSafeReturnPath({ from: 'https://malicious.example' }, '/market')).toBe('/market');
  });

  test('rejects malformed, failed, mismatched and non-activated responses', () => {
    expect(validatePaymentResponse(null, 'moduloMarket').valid).toBe(false);
    expect(validatePaymentResponse({}, 'moduloMarket').valid).toBe(false);
    expect(validatePaymentResponse({ success: false }, 'moduloMarket').valid).toBe(false);
    expect(validatePaymentResponse({ success: true, moduleKey: 'moduloSMS' }, 'moduloMarket').valid).toBe(false);
    expect(validatePaymentResponse({ success: true, moduleActivated: false }, 'moduloMarket').valid).toBe(false);
  });

  test('accepts a successful response while realtime activation is confirmed separately', () => {
    expect(validatePaymentResponse({ success: true, moduleKey: 'moduloMarket' }, 'moduloMarket')).toEqual({ valid: true });
  });

  test.each([
    [{ status: 401 }, 'payment.error.authentication'],
    [{ status: 403 }, 'payment.error.authentication'],
    [{ status: 400 }, 'payment.error.validation'],
    [{ status: 422 }, 'payment.error.validation'],
    [{ status: 409 }, 'payment.error.duplicate'],
    [{ name: 'TypeError' }, 'payment.error.connection'],
    [{ name: 'AbortError' }, 'payment.error.connection'],
    [{ status: 500 }, 'payment.error.generic'],
  ])('maps payment failures to a safe user-facing key', (error, expectedKey) => {
    expect(getPaymentErrorKey(error)).toBe(expectedKey);
  });
});

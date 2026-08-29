import { normalizeProduct, parseProductNumber, validateProduct } from './productData';

describe('productData', () => {
  test('aceita vírgula decimal e normaliza campos textuais', () => {
    expect(parseProductNumber('10,5')).toBe(10.5);
    expect(normalizeProduct({ type: 'service', name: ' Consultoria ', price: '250,5' }, { imageUrl: 'img' }))
      .toMatchObject({ name: 'Consultoria', price: 250.5, qtd: null, nationalShipping: false, imageUrl: 'img' });
  });

  test('valida dimensões apenas para produto com entrega nacional', () => {
    const errors = validateProduct({
      type: 'product', name: 'Produto', price: '10', qtd: '2', nationalShipping: true,
    });

    expect(errors).toMatchObject({ weight: expect.any(String), height: expect.any(String), width: expect.any(String), length: expect.any(String) });
  });
});

import { isOwnedPostStoragePath } from './postStorage';

describe('isOwnedPostStoragePath', () => {
  it('aceita apenas ficheiros dentro da pasta de publicações do proprietário', () => {
    expect(isOwnedPostStoragePath('published/company-1/image.jpg', 'company-1')).toBe(true);
    expect(isOwnedPostStoragePath('published/company-2/image.jpg', 'company-1')).toBe(false);
    expect(isOwnedPostStoragePath('published/company-1/../company-2/image.jpg', 'company-1')).toBe(false);
    expect(isOwnedPostStoragePath('company/company-1/logo.jpg', 'company-1')).toBe(false);
  });
});

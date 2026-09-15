import { createTheme } from '@mui/material/styles';
import { createProfileThemeTokens } from './profileTheme';

describe('createProfileThemeTokens', () => {
  it('acompanha as superfícies e o texto dos modos claro e escuro', () => {
    const light = createProfileThemeTokens(createTheme({ palette: { mode: 'light' } }));
    const dark = createProfileThemeTokens(createTheme({ palette: { mode: 'dark' } }));

    expect(light.background).not.toBe(dark.background);
    expect(light.surface).not.toBe(dark.surface);
    expect(light.text).not.toBe(dark.text);
    expect(light.divider).not.toBe(dark.divider);
  });
});

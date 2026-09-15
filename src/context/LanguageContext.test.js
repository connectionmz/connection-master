import { fireEvent, render, screen } from '@testing-library/react';
import { LanguageProvider, useLanguage } from './LanguageContext';

const TranslationProbe = () => {
  const { changeLanguage, t } = useLanguage();
  return (
    <>
      <span>{t('profile.tabs.posts')}</span>
      <span>{t('profile.block')}</span>
      <button onClick={() => changeLanguage('en')}>English</button>
    </>
  );
};

describe('LanguageContext profile translations', () => {
  beforeEach(() => localStorage.setItem('connection-language', 'pt'));

  it('altera imediatamente os textos centrais do perfil para inglês', () => {
    render(<LanguageProvider><TranslationProbe /></LanguageProvider>);
    expect(screen.getByText('Publicações')).toBeInTheDocument();
    expect(screen.getByText('Bloquear empresa')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByText('Posts')).toBeInTheDocument();
    expect(screen.getByText('Block company')).toBeInTheDocument();
  });
});

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend) // Carrega arquivos de tradução
  .use(LanguageDetector) // Detecta automaticamente o idioma
  .use(initReactI18next) // Integra com o React
  .init({
    fallbackLng: 'en', // Idioma padrão
    supportedLngs: ['en', 'pt', 'fr'], // Idiomas suportados
    debug: true,
    interpolation: {
      escapeValue: false, // React já faz a sanitização
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json', // Caminho dos arquivos de tradução
    },
  });

export default i18n;

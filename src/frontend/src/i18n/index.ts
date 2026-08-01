import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from './vi.json';
import en from './en.json';
import viLanding from './locales/vi/landing.json';
import enLanding from './locales/en/landing.json';

i18n.use(initReactI18next).init({
  resources: {
    vi: { 
      translation: vi,
      landing: viLanding 
    },
    en: { 
      translation: en,
      landing: enLanding 
    },
  },
  lng: 'vi', // default language
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

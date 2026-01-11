import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager } from 'react-native';

// Import translations
import ar from './locales/ar.json';
import en from './locales/en.json';
import fr from './locales/fr.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
};

const initI18n = async () => {
    let savedLanguage = await AsyncStorage.getItem('user-language');

    if (!savedLanguage) {
        // Fallback to device locale
         const deviceLanguage = Localization.getLocales()[0].languageCode;
         savedLanguage = deviceLanguage || 'en';
    }

    i18n.use(initReactI18next).init({
      resources,
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
          useSuspense: false // Handle async loading
      }
    });
    
    // Handle RTL Layout mapping check
    const isRTL = savedLanguage === 'ar';
    if (I18nManager.isRTL !== isRTL) {
        I18nManager.allowRTL(isRTL);
        I18nManager.forceRTL(isRTL);
       // In a real app, we might need to reload here updates layout
    }
};

initI18n();

export default i18n;

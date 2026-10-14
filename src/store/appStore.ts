import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LangCode, TRANSLATIONS } from '../constants';

interface AppState {
  // Language
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  t: (key: string) => string;

  // Auth
  isLoggedIn: boolean;
  shopId: string | null;
  shopName: string;
  shopCity: string;
  phone: string | null;
  setAuth: (shopId: string, phone: string, shopName?: string) => void;
  logout: () => void;

  // Network
  isOnline: boolean;
  setOnline: (val: boolean) => void;

  // Onboarding
  hasSelectedLanguage: boolean;
  setHasSelectedLanguage: (val: boolean) => void;

  // Hydration
  _hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Language
      lang: 'ta',
      setLang: (lang) => set({ lang }),
      t: (key: string) => {
        const { lang } = get();
        return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS['en']?.[key] ?? key;
      },

      // Auth
      isLoggedIn: false,
      shopId: null,
      shopName: 'My Store',
      shopCity: 'Chennai',
      phone: null,
      setAuth: (shopId, phone, shopName = 'My Store') =>
        set({ isLoggedIn: true, shopId, phone, shopName }),
      logout: () => set({ isLoggedIn: false, shopId: null, phone: null }),

      // Network
      isOnline: true,
      setOnline: (val) => set({ isOnline: val }),

      // Onboarding
      hasSelectedLanguage: false,
      setHasSelectedLanguage: (val) => set({ hasSelectedLanguage: val }),

      // Hydration
      _hasHydrated: false,
      setHasHydrated: (val) => set({ _hasHydrated: val }),
    }),
    {
      name: 'ai-store-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lang: state.lang,
        isLoggedIn: state.isLoggedIn,
        shopId: state.shopId,
        shopName: state.shopName,
        phone: state.phone,
        hasSelectedLanguage: state.hasSelectedLanguage,
      }),
      onRehydrateStorage: () => (state) => {
        // Called once AsyncStorage has finished loading into the store
        state?.setHasHydrated(true);
      },
    }
  )
);

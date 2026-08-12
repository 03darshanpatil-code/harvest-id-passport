import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { en, type TranslationKey } from "./en";
import { hi } from "./hi";
import { kn } from "./kn";
import { te } from "./te";
import { ta } from "./ta";
import { ml } from "./ml";
import { mr } from "./mr";
import { bn } from "./bn";
import { gu } from "./gu";
import { pa } from "./pa";
import { or } from "./or";
import { as } from "./as";
import { ur } from "./ur";

export type LanguageCode =
  | "en"
  | "hi"
  | "kn"
  | "te"
  | "ta"
  | "ml"
  | "mr"
  | "bn"
  | "gu"
  | "pa"
  | "or"
  | "as"
  | "ur";

export type LanguageMeta = {
  code: LanguageCode;
  /** Name shown in the language selector, in its own script. */
  native: string;
  /** English name, used for accessibility and tooltips. */
  english: string;
  /** BCP-47 tag for date/number formatting. */
  locale: string;
  /** BCP-47 tag for the Web Speech API. */
  speech: string;
};

export const LANGUAGES: LanguageMeta[] = [
  { code: "en", native: "English", english: "English", locale: "en-IN", speech: "en-IN" },
  { code: "hi", native: "हिन्दी", english: "Hindi", locale: "hi-IN", speech: "hi-IN" },
  { code: "kn", native: "ಕನ್ನಡ", english: "Kannada", locale: "kn-IN", speech: "kn-IN" },
  { code: "te", native: "తెలుగు", english: "Telugu", locale: "te-IN", speech: "te-IN" },
  { code: "ta", native: "தமிழ்", english: "Tamil", locale: "ta-IN", speech: "ta-IN" },
  { code: "ml", native: "മലയാളം", english: "Malayalam", locale: "ml-IN", speech: "ml-IN" },
  { code: "mr", native: "मराठी", english: "Marathi", locale: "mr-IN", speech: "mr-IN" },
  { code: "bn", native: "বাংলা", english: "Bengali", locale: "bn-IN", speech: "bn-IN" },
  { code: "gu", native: "ગુજરાતી", english: "Gujarati", locale: "gu-IN", speech: "gu-IN" },
  { code: "pa", native: "ਪੰਜਾਬੀ", english: "Punjabi", locale: "pa-IN", speech: "pa-IN" },
  { code: "or", native: "ଓଡ଼ିଆ", english: "Odia", locale: "or-IN", speech: "or-IN" },
  { code: "as", native: "অসমীয়া", english: "Assamese", locale: "as-IN", speech: "as-IN" },
  { code: "ur", native: "اردو", english: "Urdu", locale: "ur-IN", speech: "ur-IN" },
];

export const DEFAULT_LANGUAGE: LanguageCode = "en";
const STORAGE_KEY = "harvestid-language";

const catalogs: Record<LanguageCode, Record<TranslationKey, string>> = {
  en,
  hi,
  kn,
  te,
  ta,
  ml,
  mr,
  bn,
  gu,
  pa,
  or,
  as,
  ur,
};

function isLanguageCode(value: unknown): value is LanguageCode {
  return typeof value === "string" && value in catalogs;
}

type I18nContextValue = {
  lang: LanguageCode;
  setLang: (code: LanguageCode) => void;
  /** Translate a key; falls back to English when a translation is missing. */
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  /** BCP-47 locale for date/number formatting in the current language. */
  locale: string;
  /** BCP-47 tag for the Web Speech API in the current language. */
  speechTag: string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function translate(
  catalog: Record<TranslationKey, string>,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const template = catalog[key] ?? en[key] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Initial render always matches the SSR English output; the saved language
  // (if any) is applied right after hydration to avoid SSR hydration issues.
  const [lang, setLangState] = useState<LanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isLanguageCode(saved) && saved !== DEFAULT_LANGUAGE) {
        setLangState(saved);
      }
    } catch {
      // localStorage unavailable — keep the default language.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch {
      // localStorage unavailable — language still works for this session.
    }
  }, [lang]);

  const setLang = useCallback((code: LanguageCode) => {
    setLangState(code);
  }, []);

  // LANGUAGES is a non-empty compile-time constant, so the fallback is always defined.
  const meta = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0]!;

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) =>
      translate(catalogs[lang], key, params),
    [lang],
  );

  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, t, locale: meta.locale, speechTag: meta.speech }),
    [lang, meta.locale, meta.speech, setLang, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export type { TranslationKey };

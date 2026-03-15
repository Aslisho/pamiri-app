import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { type UILanguage, t, type TranslationKey } from "@/lib/translations";

interface LanguageContextType {
  lang: UILanguage;
  setLang: (lang: UILanguage) => void;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "ru",
  setLang: () => {},
  toggleLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<UILanguage>(() => {
    // Persist preference in localStorage
    const saved = localStorage.getItem("deve-ui-lang");
    return (saved === "sgh" ? "sgh" : "ru") as UILanguage;
  });

  const setLang = useCallback((l: UILanguage) => {
    setLangState(l);
    localStorage.setItem("deve-ui-lang", l);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => {
      const next = prev === "ru" ? "sgh" : "ru";
      localStorage.setItem("deve-ui-lang", next);
      return next;
    });
  }, []);

  const translate = useCallback(
    (key: TranslationKey) => t(key, lang),
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import de from "./locales/de.json";
import en from "./locales/en.json";
import { withLegalIdentity } from "@/lib/legalConfig";

const legalIdentityPostProcessor = {
  type: "postProcessor" as const,
  name: "legalIdentity",
  process(value: string) {
    return withLegalIdentity(value);
  },
};

i18n
  .use(legalIdentityPostProcessor)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
    },
    fallbackLng: "de",
    supportedLngs: ["de", "en"],
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      caches: ["localStorage"],
      lookupLocalStorage: "zivvo_lang",
    },
    interpolation: { escapeValue: false },
    postProcess: ["legalIdentity"],
  });

// Ensure DE is default for first-time visitors
if (!localStorage.getItem("zivvo_lang")) {
  i18n.changeLanguage("de");
  localStorage.setItem("zivvo_lang", "de");
}

// Sync <html lang="">
document.documentElement.lang = i18n.language || "de";
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { CountryCode, CountryConfig, countryConfigs, getCountryFromCode } from "@/lib/countryConfig";

interface CountryContextType {
  country: CountryCode;
  config: CountryConfig;
  setCountry: (code: CountryCode) => void;
  detecting: boolean;
}

const CountryContext = createContext<CountryContextType>({
  country: "GB",
  config: countryConfigs.GB,
  setCountry: () => {},
  detecting: true,
});

export const useCountry = () => useContext(CountryContext);

const STORAGE_KEY = "autovault_country";

export const CountryProvider = ({ children }: { children: ReactNode }) => {
  const [country, setCountryState] = useState<CountryCode>(
    () => (localStorage.getItem(STORAGE_KEY) as CountryCode) || "GB"
  );
  const [detecting, setDetecting] = useState(!localStorage.getItem(STORAGE_KEY));

  useEffect(() => {
    // Skip detection if user has manually chosen
    if (localStorage.getItem(STORAGE_KEY)) {
      setDetecting(false);
      return;
    }

    const detectCountry = async () => {
      try {
        // Use a free IP geolocation API
        const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(4000) });
        if (res.ok) {
          const data = await res.json();
          const code = data.country_code;
          if (code) {
            const mapped = getCountryFromCode(code);
            setCountryState(mapped);
            localStorage.setItem(STORAGE_KEY, mapped);
          }
        }
      } catch {
        // Fallback to GB on error/timeout
      }
      setDetecting(false);
    };

    detectCountry();
  }, []);

  const setCountry = useCallback((code: CountryCode) => {
    setCountryState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const config = countryConfigs[country];

  return (
    <CountryContext.Provider value={{ country, config, setCountry, detecting }}>
      {children}
    </CountryContext.Provider>
  );
};

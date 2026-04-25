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

const STORAGE_KEY = "zivvo_country";

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

    // Geo-detection disabled while only GB is active
    setDetecting(false);
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

import { createContext, useContext, ReactNode } from "react";
import { CountryCode, CountryConfig, countryConfigs } from "@/lib/countryConfig";

interface CountryContextType {
  country: CountryCode;
  config: CountryConfig;
  setCountry: (code: CountryCode) => void;
  detecting: boolean;
}

// Germany-only mode. The context is kept so existing consumers keep working,
// but the market is fixed to DE and cannot be switched.
const CountryContext = createContext<CountryContextType>({
  country: "DE",
  config: countryConfigs.DE,
  setCountry: () => {},
  detecting: false,
});

export const useCountry = () => useContext(CountryContext);

export const CountryProvider = ({ children }: { children: ReactNode }) => {
  return (
    <CountryContext.Provider
      value={{
        country: "DE",
        config: countryConfigs.DE,
        setCountry: () => {},
        detecting: false,
      }}
    >
      {children}
    </CountryContext.Provider>
  );
};

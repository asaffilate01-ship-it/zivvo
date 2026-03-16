import { useCountry } from "@/contexts/CountryContext";
import { allCountries, countryConfigs, CountryCode } from "@/lib/countryConfig";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const CountrySwitcher = ({ variant = "icon" }: { variant?: "icon" | "full" }) => {
  const { country, config, setCountry } = useCountry();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <Button variant="ghost" size="icon" title={config.name}>
            <span className="text-lg leading-none">{config.flag}</span>
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <span className="mr-1.5 text-base leading-none">{config.flag}</span>
            {config.name}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {allCountries.map((code) => {
          const c = countryConfigs[code];
          return (
            <DropdownMenuItem key={code} onClick={() => setCountry(code)}>
              <span className="mr-2 text-base leading-none">{c.flag}</span>
              {c.name}
              {country === code && <span className="ml-auto text-xs text-primary">✓</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CountrySwitcher;

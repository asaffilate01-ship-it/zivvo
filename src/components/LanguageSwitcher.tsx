import { useTranslation } from "react-i18next";
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LanguageSwitcher = ({ variant = "compact" }: { variant?: "compact" | "full" }) => {
  const { i18n, t } = useTranslation();
  const current = i18n.language?.startsWith("en") ? "en" : "de";

  const change = (lng: "de" | "en") => {
    i18n.changeLanguage(lng);
    localStorage.setItem("zivvo_lang", lng);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "full" ? "sm" : "icon"}
          className={variant === "full" ? "gap-2" : "h-8 w-8"}
          aria-label={t("language.switch")}
        >
          <Globe className="h-4 w-4" />
          {variant === "full" && (
            <span className="text-xs font-medium uppercase">{current}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuItem onClick={() => change("de")}>
          <span className="mr-2">🇩🇪</span> {t("language.de")}
          {current === "de" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => change("en")}>
          <span className="mr-2">🇬🇧</span> {t("language.en")}
          {current === "en" && <span className="ml-auto text-xs text-primary">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;

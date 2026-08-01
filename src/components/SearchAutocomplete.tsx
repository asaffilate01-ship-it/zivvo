import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

interface Suggestion {
  label: string;
  type: "make" | "model" | "listing";
}

const SearchAutocomplete = ({ value, onChange, placeholder, className }: SearchAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value || value.length < 2) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      const q = value.toLowerCase();
      const { data } = await supabase
        .from("car_listings_public")
        .select("make, model, title")
        .eq("status", "active")
        .or(`make.ilike.%${q}%,model.ilike.%${q}%,title.ilike.%${q}%`)
        .limit(20);

      if (!data) return;

      const makes = new Set<string>();
      const models = new Set<string>();
      const results: Suggestion[] = [];

      data.forEach((row) => {
        if (row.make?.toLowerCase().includes(q) && !makes.has(row.make)) {
          makes.add(row.make);
          results.push({ label: row.make, type: "make" });
        }
        const makeModel = `${row.make} ${row.model}`;
        if (row.model?.toLowerCase().includes(q) && !models.has(makeModel)) {
          models.add(makeModel);
          results.push({ label: makeModel, type: "model" });
        }
      });

      setSuggestions(results.slice(0, 8));
      setOpen(results.length > 0);
      setActiveIndex(-1);
    }, 250);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      onChange(suggestions[activeIndex].label);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const selectSuggestion = (s: Suggestion) => {
    onChange(s.label);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder={placeholder || "Search make, model, or keyword..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onKeyDown={handleKeyDown}
        className={cn("h-11 pl-10", className)}
        autoComplete="off"
      />
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
          {suggestions.map((s, i) => (
            <button
              key={`${s.type}-${s.label}`}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                i === activeIndex && "bg-accent"
              )}
              onMouseDown={() => selectSuggestion(s)}
            >
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="text-foreground">{s.label}</span>
              <span className="ml-auto text-[10px] text-muted-foreground capitalize">{s.type}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;

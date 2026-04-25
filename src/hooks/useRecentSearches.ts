import { useEffect, useState, useCallback } from "react";

const KEY = "zivvo_recent_searches";
const MAX = 6;

export interface RecentSearch {
  label: string;
  query: string; // querystring (without leading ?)
  ts: number;
}

const read = (): RecentSearch[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const write = (items: RecentSearch[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("recent-searches-updated"));
  } catch {
    /* ignore */
  }
};

export const useRecentSearches = () => {
  const [items, setItems] = useState<RecentSearch[]>([]);

  useEffect(() => {
    setItems(read());
    const onUpdate = () => setItems(read());
    window.addEventListener("recent-searches-updated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("recent-searches-updated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  const add = useCallback((label: string, query: string) => {
    if (!label.trim()) return;
    const next = [
      { label: label.trim(), query, ts: Date.now() },
      ...read().filter((r) => r.label.toLowerCase() !== label.trim().toLowerCase()),
    ].slice(0, MAX);
    write(next);
  }, []);

  const remove = useCallback((label: string) => {
    write(read().filter((r) => r.label !== label));
  }, []);

  const clear = useCallback(() => write([]), []);

  return { items, add, remove, clear };
};

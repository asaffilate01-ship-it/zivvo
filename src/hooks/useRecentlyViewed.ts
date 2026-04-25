import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "zivvo_recently_viewed";
const MAX_ITEMS = 20;

interface RecentCar {
  id: string;
  title: string;
  price: number;
  image: string;
  make: string;
  model: string;
  year: number;
  viewedAt: number;
}

export const useRecentlyViewed = () => {
  const [items, setItems] = useState<RecentCar[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  const addViewed = useCallback((car: Omit<RecentCar, "viewedAt">) => {
    setItems((prev) => {
      const filtered = prev.filter((c) => c.id !== car.id);
      const updated = [{ ...car, viewedAt: Date.now() }, ...filtered].slice(0, MAX_ITEMS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setItems([]);
  }, []);

  return { items, addViewed, clearAll };
};

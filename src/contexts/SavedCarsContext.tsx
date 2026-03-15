import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SavedCarsContextType {
  savedIds: Set<string>;
  toggle: (listingId: string) => Promise<void>;
  isSaved: (listingId: string) => boolean;
}

const SavedCarsContext = createContext<SavedCarsContextType>({
  savedIds: new Set(),
  toggle: async () => {},
  isSaved: () => false,
});

export const useSavedCars = () => useContext(SavedCarsContext);

export const SavedCarsProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) { setSavedIds(new Set()); return; }
    supabase.from("saved_cars").select("listing_id").eq("user_id", user.id).then(({ data }) => {
      if (data) setSavedIds(new Set(data.map((r: any) => r.listing_id)));
    });
  }, [user]);

  const toggle = useCallback(async (listingId: string) => {
    if (!user) return;
    if (savedIds.has(listingId)) {
      await supabase.from("saved_cars").delete().eq("user_id", user.id).eq("listing_id", listingId);
      setSavedIds((prev) => { const s = new Set(prev); s.delete(listingId); return s; });
    } else {
      await supabase.from("saved_cars").insert({ user_id: user.id, listing_id: listingId });
      setSavedIds((prev) => new Set(prev).add(listingId));
    }
  }, [user, savedIds]);

  const isSaved = useCallback((listingId: string) => savedIds.has(listingId), [savedIds]);

  return (
    <SavedCarsContext.Provider value={{ savedIds, toggle, isSaved }}>
      {children}
    </SavedCarsContext.Provider>
  );
};

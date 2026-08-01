import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Heart, Loader2, Bookmark, Bell, BellOff, Trash2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SavedSearch {
  id: string;
  name: string;
  filters: Record<string, any>;
  notify: boolean;
  created_at: string;
}

const filtersToQS = (filters: Record<string, any>) => {
  const params = new URLSearchParams();
  Object.entries(filters || {}).forEach(([k, v]) => {
    if (v != null && v !== "" && v !== false) params.set(k, String(v));
  });
  return params.toString();
};

const SavedCars = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<any[]>([]);
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetchAll = async () => {
      const [savedRes, searchRes] = await Promise.all([
        supabase.from("saved_cars").select("listing_id").eq("user_id", user.id),
        supabase.from("saved_searches").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);

      if (savedRes.data && savedRes.data.length > 0) {
        const ids = savedRes.data.map((s: any) => s.listing_id);
        const { data: cars } = await supabase.from("car_listings_public").select("*").in("id", ids);
        if (cars) setListings(cars);
      }
      if (searchRes.data) setSearches(searchRes.data as SavedSearch[]);
      setLoading(false);
    };
    fetchAll();
  }, [user]);

  const toggleNotify = async (id: string, current: boolean) => {
    setSearches((prev) => prev.map((s) => (s.id === id ? { ...s, notify: !current } : s)));
    await supabase.from("saved_searches").update({ notify: !current }).eq("id", id);
  };

  const deleteSearch = async (id: string) => {
    setSearches((prev) => prev.filter((s) => s.id !== id));
    await supabase.from("saved_searches").delete().eq("id", id);
    toast({ title: t("savedCars.searchRemoved") });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">{t("savedCars.title")}</h1>
        <p className="text-muted-foreground">{t("savedCars.subtitle")}</p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !user ? (
          <div className="mt-12 flex flex-col items-center text-center">
            <Heart className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 font-display text-xl font-bold">{t("savedCars.signInTitle")}</h2>
            <p className="mt-2 text-muted-foreground">{t("savedCars.signInDesc")}</p>
            <Link to="/login"><Button className="gradient-primary mt-6 border-0">{t("nav.signIn")}</Button></Link>
          </div>
        ) : (
          <>
            {/* Saved Searches */}
            <section className="mt-8">
              <div className="mb-3 flex items-center gap-2">
                <Bookmark className="h-5 w-5 text-primary" />
                <h2 className="font-display text-lg font-semibold text-foreground">{t("savedCars.savedSearches")}</h2>
                <Badge variant="outline" className="text-xs">{searches.length}</Badge>
              </div>
              {searches.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                  {t("savedCars.noSearches")}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {searches.map((s) => (
                    <div key={s.id} className="rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:shadow-card">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-sm font-semibold text-card-foreground line-clamp-1">{s.name}</h3>
                        <button onClick={() => deleteSearch(s.id)} aria-label={t("savedCars.removeSearch")} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(s.filters || {}).slice(0, 4).map(([k, v]) => (
                          v && v !== "any" && v !== "0" && v !== 0 ? (
                            <Badge key={k} variant="secondary" className="text-[10px] capitalize">
                              {k}: {String(v)}
                            </Badge>
                          ) : null
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                        <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                          {s.notify ? <Bell className="h-3.5 w-3.5 text-primary" /> : <BellOff className="h-3.5 w-3.5" />}
                          <Switch checked={s.notify} onCheckedChange={() => toggleNotify(s.id, s.notify)} />
                          {t("savedCars.alerts")}
                        </label>
                        <Link to={`/browse?${filtersToQS(s.filters)}`}>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-primary">
                            {t("savedCars.resume")} <ArrowRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Saved Cars */}
            <section className="mt-10">
              <div className="mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5 text-accent" />
                <h2 className="font-display text-lg font-semibold text-foreground">{t("savedCars.savedCarsHeading")}</h2>
                <Badge variant="outline" className="text-xs">{listings.length}</Badge>
              </div>
              {listings.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
                  {t("savedCars.noCars")}
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {listings.map((car, i) => (
                    <CarCard key={car.id} car={car} index={i} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SavedCars;

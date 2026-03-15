import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CarCard from "@/components/CarCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Heart, Loader2 } from "lucide-react";

const SavedCars = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const fetch = async () => {
      const { data: saved } = await supabase
        .from("saved_cars")
        .select("listing_id")
        .eq("user_id", user.id);

      if (saved && saved.length > 0) {
        const ids = saved.map((s: any) => s.listing_id);
        const { data: cars } = await supabase
          .from("car_listings")
          .select("*")
          .in("id", ids);
        if (cars) setListings(cars);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Saved Cars</h1>
        <p className="text-muted-foreground">Your favourite vehicles in one place</p>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !user ? (
          <div className="mt-12 flex flex-col items-center text-center">
            <Heart className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 font-display text-xl font-bold">Sign in to save cars</h2>
            <p className="mt-2 text-muted-foreground">Create an account to save and track your favourite listings.</p>
            <Link to="/login"><Button className="gradient-primary mt-6 border-0">Sign In</Button></Link>
          </div>
        ) : listings.length === 0 ? (
          <div className="mt-12 flex flex-col items-center text-center">
            <Heart className="h-16 w-16 text-muted-foreground" />
            <h2 className="mt-4 font-display text-xl font-bold">No saved cars yet</h2>
            <p className="mt-2 text-muted-foreground">Browse listings and tap the heart icon to save vehicles.</p>
            <Link to="/browse"><Button className="gradient-primary mt-6 border-0">Browse Cars</Button></Link>
          </div>
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {listings.map((car, i) => (
              <CarCard key={car.id} car={car} index={i} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default SavedCars;

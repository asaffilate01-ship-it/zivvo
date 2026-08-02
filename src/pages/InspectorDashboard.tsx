import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, MapPin, Phone, Calendar, ClipboardCheck, Settings, AlertCircle } from "lucide-react";

interface Job {
  id: string;
  status: string;
  inspection_type: string;
  scheduled_at: string | null;
  buyer_phone: string | null;
  buyer_address: string | null;
  buyer_notes: string | null;
  price: number;
  listing_id: string;
  car_listings?: {
    title: string;
    make: string;
    model: string;
    year: number;
    registration: string | null;
    location: string | null;
  };
}

interface Profile {
  id: string;
  full_name: string;
  is_active: boolean;
  is_verified: boolean;
  total_inspections: number;
  rating: number;
  coverage_postcodes: string[];
  base_address: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  paid: "bg-warning/20 text-warning",
  scheduled: "bg-primary/20 text-primary",
  in_progress: "bg-accent/20 text-accent",
  completed: "bg-success/20 text-success",
};

const InspectorDashboard = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [payouts, setPayouts] = useState<{ pending: number; paid: number }>({ pending: 0, paid: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: profileData }, { data: jobsData }, { data: payoutData }] = await Promise.all([
      supabase.from("inspector_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("inspection_bookings")
        .select("*, car_listings(title, make, model, year, registration, location)")
        .eq("inspector_id", user.id)
        .in("status", ["paid", "scheduled", "in_progress", "completed"])
        .order("scheduled_at", { ascending: true, nullsFirst: false }),
      supabase
        .from("inspector_payouts")
        .select("amount, status")
        .eq("inspector_id", user.id),
    ]);
    setProfile((profileData as any) || null);
    setJobs((jobsData as any) || []);
    const pending = (payoutData || [])
      .filter((p: any) => p.status === "pending" || p.status === "approved")
      .reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
    const paid = (payoutData || [])
      .filter((p: any) => p.status === "paid")
      .reduce((a: number, b: any) => a + Number(b.amount || 0), 0);
    setPayouts({ pending, paid });
    setLoading(false);
  };

  // Reload when the authenticated inspector changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" /> Complete your inspector profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                You need to complete your inspector onboarding before you can receive jobs.
              </p>
              <Button asChild><Link to="/inspector/onboard">Set up profile</Link></Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const active = jobs.filter((j) => j.status !== "completed");
  const completed = jobs.filter((j) => j.status === "completed");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Inspector Dashboard</h1>
            <p className="text-muted-foreground text-sm">Welcome back, {profile.full_name}</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/inspector/onboard"><Settings className="w-4 h-4 mr-2" /> Profile</Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card><CardContent className="p-4"><div className="text-2xl font-bold text-primary">{active.length}</div><p className="text-xs text-muted-foreground">Active jobs</p></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold">{profile.total_inspections}</div><p className="text-xs text-muted-foreground">Completed</p></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold text-warning">€{payouts.pending.toFixed(0)}</div><p className="text-xs text-muted-foreground">Owed to you</p></CardContent></Card>
          <Card><CardContent className="p-4"><div className="text-2xl font-bold text-success">€{payouts.paid.toFixed(0)}</div><p className="text-xs text-muted-foreground">Paid to date</p></CardContent></Card>
        </div>

        {!profile.is_verified && (
          <Card className="mb-6 border-warning/50 bg-warning/5">
            <CardContent className="p-4 text-sm">
              <AlertCircle className="w-4 h-4 text-warning inline mr-2" />
              Your profile is awaiting admin verification. You won't receive new assignments until approved.
            </CardContent>
          </Card>
        )}

        {/* Active jobs */}
        <h2 className="font-semibold text-lg mb-3">Active jobs ({active.length})</h2>
        <div className="space-y-3 mb-8">
          {active.length === 0 ? (
            <Card><CardContent className="p-8 text-center text-muted-foreground">No active jobs assigned.</CardContent></Card>
          ) : active.map((job) => (
            <Card key={job.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge className={STATUS_COLORS[job.status]}>{job.status.replace("_", " ")}</Badge>
                      <Badge variant="outline">{job.inspection_type === "premium_300" ? "Premium 300pt" : "Standard 200pt"}</Badge>
                    </div>
                    <h3 className="font-semibold">
                      {job.car_listings?.year} {job.car_listings?.make} {job.car_listings?.model}
                    </h3>
                    {job.car_listings?.registration && (
                      <p className="text-xs font-mono uppercase text-muted-foreground">{job.car_listings.registration}</p>
                    )}
                    <div className="text-sm text-muted-foreground space-y-1 mt-2">
                      {job.scheduled_at && <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {new Date(job.scheduled_at).toLocaleString()}</div>}
                      {job.buyer_address && <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {job.buyer_address}</div>}
                      {job.buyer_phone && <a href={`tel:${job.buyer_phone}`} className="flex items-center gap-2 text-primary"><Phone className="w-3 h-3" /> {job.buyer_phone}</a>}
                    </div>
                  </div>
                  <Button asChild size="sm">
                    <Link to={`/inspector/job/${job.id}`}><ClipboardCheck className="w-4 h-4 mr-2" /> Open scorecard</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Completed */}
        {completed.length > 0 && (
          <>
            <h2 className="font-semibold text-lg mb-3">Recently completed</h2>
            <div className="space-y-2">
              {completed.slice(0, 5).map((job) => (
                <Card key={job.id}>
                  <CardContent className="p-3 text-sm flex items-center justify-between">
                    <div>
                      <span className="font-medium">{job.car_listings?.year} {job.car_listings?.make} {job.car_listings?.model}</span>
                      <span className="text-muted-foreground ml-2">{job.scheduled_at && new Date(job.scheduled_at).toLocaleDateString()}</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/inspector/job/${job.id}`}>View</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InspectorDashboard;

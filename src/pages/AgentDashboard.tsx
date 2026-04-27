import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  PoundSterling,
  Building2,
  Clock,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Download,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import SalesPipeline from "@/components/SalesPipeline";

// Tier MRR assumptions (GBP / month) — used to forecast pending commission
const TIER_MRR: Record<string, number> = {
  starter: 49,
  professional: 149,
  premium: 299,
  enterprise: 599,
};

const COMMISSION_RATE = 0.30;

const AgentDashboard = () => {
  const { user } = useAuth();
  const [dealers, setDealers] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [dealersRes, commissionsRes] = await Promise.all([
        supabase.from("dealers").select("*").eq("onboarded_by_agent", user.id).order("created_at", { ascending: false }),
        supabase.from("agent_commissions").select("*").eq("agent_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (dealersRes.data) setDealers(dealersRes.data);
      if (commissionsRes.data) setCommissions(commissionsRes.data);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const totalEarned = commissions
    .filter((c) => c.status === "paid")
    .reduce((acc, c) => acc + Number(c.amount), 0);

  const totalPending = commissions
    .filter((c) => c.status === "pending")
    .reduce((acc, c) => acc + Number(c.amount), 0);

  const activeDealers = dealers.filter((d) => d.subscription_status === "active");
  const pendingOnboarding = dealers.filter((d) => !d.kyc_verified).length;

  // Live MRR forecast: 30% of active dealer subscription value
  const forecastMonthly = useMemo(
    () => activeDealers.reduce((sum, d) => sum + (TIER_MRR[d.tier as string] || 0) * COMMISSION_RATE, 0),
    [activeDealers]
  );

  // Per-dealer commission rollup (paid + pending grouped by dealer)
  const commissionByDealer = useMemo(() => {
    const map = new Map<string, { dealerId: string; paid: number; pending: number }>();
    commissions.forEach((c) => {
      const cur = map.get(c.dealer_id) || { dealerId: c.dealer_id, paid: 0, pending: 0 };
      if (c.status === "paid") cur.paid += Number(c.amount);
      else if (c.status === "pending") cur.pending += Number(c.amount);
      map.set(c.dealer_id, cur);
    });
    const dealerNameById = new Map(dealers.map((d) => [d.id, d.business_name]));
    return Array.from(map.values())
      .map((row) => ({ ...row, businessName: dealerNameById.get(row.dealerId) || "Unknown dealer" }))
      .sort((a, b) => (b.paid + b.pending) - (a.paid + a.pending));
  }, [commissions, dealers]);

  // Next payout: first day of next month
  const nextPayoutDate = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 1).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }, []);

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((r) => Object.values(r).map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Agent Dashboard — Track Commissions & Onboarding"
        description="Track your dealer onboarding pipeline, monthly recurring commissions, payouts, and per-dealer earnings on Zivvo."
        noindex
      />
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">
              Agent Dashboard
            </h1>
            <p className="text-muted-foreground">Track your onboarding and commissions</p>
          </div>
          <Link to="/agent/onboard">
            <Button className="gradient-primary border-0">
              <UserPlus className="mr-1 h-4 w-4" />
              Onboard Dealer
            </Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Earned", value: `£${totalEarned.toLocaleString()}`, icon: PoundSterling, color: "text-success" },
            { label: "Pending Payout", value: `£${totalPending.toLocaleString()}`, icon: Clock, color: "text-primary" },
            { label: "Forecast / month", value: `£${forecastMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: "text-primary", hint: `${activeDealers.length} active dealer${activeDealers.length === 1 ? "" : "s"}` },
            { label: "Pending Onboarding", value: pendingOnboarding, icon: AlertCircle, color: "text-destructive" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="font-display text-2xl font-bold text-card-foreground">{stat.value}</p>
                    {stat.hint && <p className="text-[11px] text-muted-foreground">{stat.hint}</p>}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Next payout banner */}
        <Card className="mt-4 border-primary/20 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-card-foreground">Next payout: {nextPayoutDate}</p>
                <p className="text-xs text-muted-foreground">
                  £{totalPending.toLocaleString()} pending · paid monthly to your registered bank account
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">{COMMISSION_RATE * 100}% recurring commission</Badge>
          </CardContent>
        </Card>

        {/* Sales Pipeline Analytics */}
        <div className="mt-8">
          <h2 className="mb-4 font-display text-lg font-bold text-foreground">Dealer Sales Pipeline</h2>
          <SalesPipeline mode="agent" />
        </div>

        <Tabs defaultValue="pipeline" className="mt-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pipeline">Onboarding</TabsTrigger>
            <TabsTrigger value="dealers">By Dealer</TabsTrigger>
            <TabsTrigger value="commissions">Commissions</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
          </TabsList>

          <TabsContent value="pipeline" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Onboarding Pipeline</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV(dealers, "pipeline")}>
                  <Download className="mr-1 h-4 w-4" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent>
                {dealers.length === 0 ? (
                  <div className="flex flex-col items-center py-12">
                    <Building2 className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-3 text-muted-foreground">No dealers onboarded yet</p>
                    <Link to="/agent/onboard">
                      <Button className="gradient-primary mt-4 border-0" size="sm">
                        Onboard Your First Dealer
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Tier</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>KYC</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dealers.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell className="font-medium">{d.business_name}</TableCell>
                          <TableCell><Badge variant="secondary" className="capitalize">{d.tier}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={d.subscription_status === "active" ? "default" : "destructive"}>
                              {d.subscription_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {d.kyc_verified ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(d.created_at).toLocaleDateString("en-GB")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dealers" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Earnings by Dealer</CardTitle>
              </CardHeader>
              <CardContent>
                {commissionByDealer.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No commission history yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                        <TableHead className="text-right">Pending</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissionByDealer.map((row) => (
                        <TableRow key={row.dealerId}>
                          <TableCell className="font-medium">{row.businessName}</TableCell>
                          <TableCell className="text-right font-display font-semibold text-success">
                            £{row.paid.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            £{row.pending.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-display font-bold text-primary">
                            £{(row.paid + row.pending).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commissions" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Commission History</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV(commissions, "commissions")}>
                  <Download className="mr-1 h-4 w-4" />
                  CSV
                </Button>
              </CardHeader>
              <CardContent>
                {commissions.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No commissions yet</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            {c.period_start ? `${c.period_start} → ${c.period_end}` : "N/A"}
                          </TableCell>
                          <TableCell className="text-right font-display font-semibold text-primary">
                            £{Number(c.amount).toFixed(2)}
                          </TableCell>
                          <TableCell>{c.commission_rate}%</TableCell>
                          <TableCell>
                            <Badge variant={c.status === "paid" ? "default" : "secondary"}>
                              {c.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payout Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Total Earned (All Time)</p>
                    <p className="mt-1 font-display text-2xl font-bold text-success">£{totalEarned.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="mt-1 font-display text-2xl font-bold text-card-foreground">£{totalPending.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Forecast / month</p>
                    <p className="mt-1 font-display text-2xl font-bold text-primary">£{forecastMonthly.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">
                  Payouts are processed on the 1st of each month for all commissions earned in the prior month.
                  Forecast is based on currently active dealer subscriptions × {COMMISSION_RATE * 100}% commission rate.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
};

export default AgentDashboard;

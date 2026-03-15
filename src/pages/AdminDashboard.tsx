import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, Building2, Car, DollarSign, ShieldCheck, XCircle,
  CheckCircle, Search, TrendingUp, BarChart3, Download, Calendar,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import DashboardChart from "@/components/DashboardChart";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [dealers, setDealers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [dealersRes, listingsRes, commissionsRes] = await Promise.all([
      supabase.from("dealers").select("*").order("created_at", { ascending: false }),
      supabase.from("car_listings").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("agent_commissions").select("*").order("created_at", { ascending: false }),
    ]);
    if (dealersRes.data) setDealers(dealersRes.data);
    if (listingsRes.data) setListings(listingsRes.data);
    if (commissionsRes.data) setCommissions(commissionsRes.data);
    setLoading(false);
  };

  const approveKYC = async (dealerId: string) => {
    const { error } = await supabase.from("dealers").update({ kyc_verified: true, kyc_approved_at: new Date().toISOString() }).eq("id", dealerId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "KYC Approved" }); fetchAll(); }
  };

  const rejectKYC = async (dealerId: string) => {
    const { error } = await supabase.from("dealers").update({ kyc_verified: false, is_active: false }).eq("id", dealerId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Dealer rejected" }); fetchAll(); }
  };

  const toggleListingStatus = async (listingId: string, newStatus: "active" | "draft" | "sold" | "expired" | "under_review") => {
    const { error } = await supabase.from("car_listings").update({ status: newStatus }).eq("id", listingId);
    if (!error) { toast({ title: `Listing ${newStatus}` }); fetchAll(); }
  };

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((r) => Object.values(r).map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([headers + "\n" + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const pendingKYC = dealers.filter((d) => !d.kyc_verified && d.subscription_status === "active");
  const activeListings = listings.filter((l) => l.status === "active");
  const prices: Record<string, number> = { starter: 49, professional: 99, enterprise: 199 };
  const totalRevenue = dealers.filter((d) => d.subscription_status === "active").reduce((acc, d) => acc + (prices[d.tier] || 0), 0);

  const filteredDealers = dealers.filter((d) =>
    d.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.business_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Revenue chart data (last 6 months simulated)
  const revenueChartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { label: d.toLocaleDateString("en-US", { month: "short" }), value: 0 };
    });
    // Simulate growth
    const base = Math.max(totalRevenue * 0.5, 100);
    return months.map((m, i) => ({ ...m, value: Math.round(base + (totalRevenue - base) * (i / 5)) }));
  }, [totalRevenue]);

  // Dealers growth chart
  const dealerGrowthData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const count = dealers.filter((dl) => new Date(dl.created_at) <= monthEnd).length;
      return { label: d.toLocaleDateString("en-US", { month: "short" }), value: count };
    });
    return months;
  }, [dealers]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Admin Dashboard</h1>
            <p className="text-muted-foreground">Platform overview & management</p>
          </div>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32"><Calendar className="mr-1 h-4 w-4" /><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Total Dealers", value: dealers.length, icon: Building2, color: "text-primary" },
            { label: "Active Listings", value: activeListings.length, icon: Car, color: "text-info" },
            { label: "Monthly Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-success" },
            { label: "Pending KYC", value: pendingKYC.length, icon: ShieldCheck, color: "text-destructive" },
          ].map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="font-display text-2xl font-bold text-card-foreground">{stat.value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <DashboardChart title="Revenue Trend (6 Months)" data={revenueChartData} type="area" color="hsl(16, 90%, 54%)" />
          <DashboardChart title="Dealer Growth" data={dealerGrowthData} type="bar" color="hsl(210, 100%, 52%)" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="dealers" className="mt-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dealers">Dealers</TabsTrigger>
            <TabsTrigger value="kyc">KYC Queue ({pendingKYC.length})</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
          </TabsList>

          <TabsContent value="dealers" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">All Dealers</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search dealers..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportCSV(dealers, "dealers")}><Download className="mr-1 h-4 w-4" /> CSV</Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>KYC</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDealers.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.business_name}</TableCell>
                        <TableCell><Badge variant="secondary">{d.tier}</Badge></TableCell>
                        <TableCell><Badge variant={d.subscription_status === "active" ? "default" : "destructive"}>{d.subscription_status}</Badge></TableCell>
                        <TableCell>
                          {d.kyc_verified ? (
                            <Badge variant="outline" className="border-success text-success">Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="border-destructive text-destructive">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kyc" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">KYC Approval Queue</CardTitle></CardHeader>
              <CardContent>
                {pendingKYC.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">No pending KYC reviews</p>
                ) : (
                  <div className="space-y-3">
                    {pendingKYC.map((d) => (
                      <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                        <div>
                          <p className="font-medium text-card-foreground">{d.business_name}</p>
                          <p className="text-sm text-muted-foreground">{d.business_email || "No email"} · {d.city || "No location"}</p>
                          <p className="text-xs text-muted-foreground">Submitted: {d.kyc_submitted_at ? new Date(d.kyc_submitted_at).toLocaleDateString() : "N/A"}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-destructive text-destructive" onClick={() => rejectKYC(d.id)}>
                            <XCircle className="mr-1 h-4 w-4" /> Reject
                          </Button>
                          <Button size="sm" className="gradient-primary border-0" onClick={() => approveKYC(d.id)}>
                            <CheckCircle className="mr-1 h-4 w-4" /> Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">All Listings ({listings.length})</CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV(listings, "listings")}><Download className="mr-1 h-4 w-4" /> CSV</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {listings.slice(0, 20).map((l) => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.year} {l.make} {l.model}</TableCell>
                        <TableCell>${Number(l.price).toLocaleString()}</TableCell>
                        <TableCell><Badge variant={l.status === "active" ? "default" : "secondary"}>{l.status}</Badge></TableCell>
                        <TableCell>{l.views_count}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {l.status !== "active" && <Button size="sm" variant="ghost" onClick={() => toggleListingStatus(l.id, "active")}>Approve</Button>}
                            {l.status === "active" && <Button size="sm" variant="ghost" onClick={() => toggleListingStatus(l.id, "under_review")}>Suspend</Button>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4 text-primary" /> Revenue Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {["starter", "professional", "enterprise"].map((tier) => {
                      const count = dealers.filter((d) => d.tier === tier && d.subscription_status === "active").length;
                      const revenue = count * prices[tier];
                      const maxRevenue = totalRevenue || 1;
                      return (
                        <div key={tier}>
                          <div className="flex justify-between text-sm">
                            <span className="capitalize text-card-foreground">{tier}</span>
                            <span className="text-muted-foreground">{count} dealers · ${revenue}/mo</span>
                          </div>
                          <div className="mt-1 h-2 rounded-full bg-muted">
                            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(revenue / maxRevenue) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-6 border-t border-border pt-4">
                    <div className="flex justify-between font-display font-bold">
                      <span className="text-card-foreground">Total MRR</span>
                      <span className="text-primary">${totalRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4 text-primary" /> Agent Commissions</CardTitle>
                </CardHeader>
                <CardContent>
                  {commissions.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">No commission data yet</p>
                  ) : (
                    <div className="space-y-3">
                      {commissions.slice(0, 5).map((c) => (
                        <div key={c.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-card-foreground">Commission #{c.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">{c.status}</p>
                          </div>
                          <span className="font-display font-semibold text-primary">${Number(c.amount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;

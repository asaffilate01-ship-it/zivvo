import { useEffect, useState, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
  Eye, Loader2, UserPlus, Ban, MoreHorizontal, Flag, Mail, Bug,
  Gavel, Shield, FileText, Package, Clock, ClipboardCheck,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import DashboardChart from "@/components/DashboardChart";
import SalesPipeline from "@/components/SalesPipeline";
import AdminInspectionPanel from "@/components/AdminInspectionPanel";
import AdminDmsHealthPanel from "@/components/AdminDmsHealthPanel";
import AdminAnalyticsPanel from "@/components/AdminAnalyticsPanel";
import AdminInspectionBookingsPanel from "@/components/AdminInspectionBookingsPanel";
import AdminInspectorsPanel from "@/components/AdminInspectorsPanel";
import AdminVerificationDialog from "@/components/AdminVerificationDialog";



const AdminDashboard = () => {
  const { toast } = useToast();
  const [dealers, setDealers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [allRoles, setAllRoles] = useState<any[]>([]);
  const [listingReports, setListingReports] = useState<any[]>([]);
  const [contactMessages, setContactMessages] = useState<any[]>([]);
  const [bugReports, setBugReports] = useState<any[]>([]);
  const [verifyListing, setVerifyListing] = useState<any>(null);
  const [auctions, setAuctions] = useState<any[]>([]);
  const [auctionEscrows, setAuctionEscrows] = useState<any[]>([]);
  const [auctionAuditLog, setAuctionAuditLog] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [listingStatusFilter, setListingStatusFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [auctionStatusFilter, setAuctionStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("month");
  const [loading, setLoading] = useState(true);
  const [selectedDealer, setSelectedDealer] = useState<any>(null);
  const [selectedAuction, setSelectedAuction] = useState<any>(null);
  const [roleDialog, setRoleDialog] = useState<{ userId: string; currentRoles: string[] } | null>(null);
  const [inspectingAuction, setInspectingAuction] = useState<any>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [dealersRes, listingsRes, commissionsRes, profilesRes, rolesRes, reportsRes, contactsRes, bugsRes, auctionsRes, escrowsRes, auditRes] = await Promise.all([
      supabase.from("dealers").select("*").order("created_at", { ascending: false }),
      supabase.from("car_listings").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("agent_commissions").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
      supabase.from("listing_reports").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("bug_reports").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("auctions").select("*, car_listings!inner(title, make, model, year, registration)").order("created_at", { ascending: false }),
      supabase.from("auction_escrow").select("*").order("created_at", { ascending: false }),
      supabase.from("auction_audit_log").select("*").order("created_at", { ascending: false }).limit(200),
    ]);
    if (dealersRes.data) setDealers(dealersRes.data);
    if (listingsRes.data) setListings(listingsRes.data);
    if (commissionsRes.data) setCommissions(commissionsRes.data);
    if (profilesRes.data) setAllProfiles(profilesRes.data);
    if (rolesRes.data) setAllRoles(rolesRes.data);
    if (reportsRes.data) setListingReports(reportsRes.data);
    if (contactsRes.data) setContactMessages(contactsRes.data);
    if (bugsRes.data) setBugReports(bugsRes.data);
    if (auctionsRes.data) setAuctions(auctionsRes.data);
    if (escrowsRes.data) setAuctionEscrows(escrowsRes.data);
    if (auditRes.data) setAuctionAuditLog(auditRes.data);
    setLoading(false);
  };

  const approveKYC = async (dealerId: string) => {
    const { error } = await supabase.from("dealers").update({
      kyc_verified: true,
      kyc_approved_at: new Date().toISOString(),
    }).eq("id", dealerId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "KYC Approved" }); fetchAll(); }
  };

  const rejectKYC = async (dealerId: string) => {
    const { error } = await supabase.from("dealers").update({
      kyc_verified: false,
      is_active: false,
    }).eq("id", dealerId);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: "Dealer rejected" }); fetchAll(); }
  };

  const toggleDealerActive = async (dealerId: string, active: boolean) => {
    await supabase.from("dealers").update({ is_active: active }).eq("id", dealerId);
    toast({ title: active ? "Dealer activated" : "Dealer suspended" });
    fetchAll();
  };

  const toggleListingStatus = async (listingId: string, newStatus: "active" | "draft" | "sold" | "expired" | "under_review") => {
    await supabase.from("car_listings").update({ status: newStatus }).eq("id", listingId);
    toast({ title: `Listing ${newStatus}` });
    fetchAll();
  };

  const deleteListing = async (listingId: string) => {
    await supabase.from("car_listings").delete().eq("id", listingId);
    toast({ title: "Listing deleted" });
    fetchAll();
  };

  const addRole = async (userId: string, role: string) => {
    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: role as any,
    });
    if (error) {
      if (error.code === "23505") toast({ title: "Role already assigned" });
      else toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Role "${role}" assigned` });
      fetchAll();
    }
    setRoleDialog(null);
  };

  const removeRole = async (userId: string, role: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    toast({ title: `Role "${role}" removed` });
    fetchAll();
  };

  const updateReportStatus = async (id: string, status: string) => {
    await supabase.from("listing_reports").update({ status }).eq("id", id);
    toast({ title: `Report ${status}` });
    fetchAll();
  };

  const updateContactStatus = async (id: string, status: string) => {
    await supabase.from("contact_messages").update({ status }).eq("id", id);
    toast({ title: `Message ${status}` });
    fetchAll();
  };

  const updateBugStatus = async (id: string, status: string) => {
    await supabase.from("bug_reports").update({ status }).eq("id", id);
    toast({ title: `Bug ${status}` });
    fetchAll();
  };

  const approveAuction = async (auctionId: string, rating: number) => {
    await supabase.from("auctions").update({
      status: "live" as any,
      inspection_rating: rating,
      hpi_clear: true,
      ownership_verified: true,
      seller_verified: true,
      starts_at: new Date().toISOString(),
    }).eq("id", auctionId);
    toast({ title: "Auction approved & live!" });
    fetchAll();
  };

  const rejectAuction = async (auctionId: string) => {
    await supabase.from("auctions").update({ status: "cancelled" as any }).eq("id", auctionId);
    toast({ title: "Auction rejected" });
    fetchAll();
  };

  const updateEscrowStatus = async (escrowId: string, status: string) => {
    const update: any = { status };
    if (status === "released_to_seller") update.released_at = new Date().toISOString();
    await supabase.from("auction_escrow").update(update).eq("id", escrowId);
    toast({ title: `Payment protection ${status.replace(/_/g, " ")}` });
    fetchAll();
  };

  const pendingAuctions = auctions.filter((a: any) => a.status === "pending_inspection");
  const liveAuctions = auctions.filter((a: any) => a.status === "live");
  const filteredAuctions = auctions.filter((a: any) => auctionStatusFilter === "all" || a.status === auctionStatusFilter);

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

  const pendingKYC = dealers.filter((d) => !d.kyc_verified && d.kyc_submitted_at);
  const activeListings = listings.filter((l) => l.status === "active");
  const pendingReports = listingReports.filter((r) => r.status === "pending");
  const prices: Record<string, number> = { starter: 49, professional: 99, enterprise: 199 };
  const totalRevenue = dealers.filter((d) => d.subscription_status === "active").reduce((acc, d) => acc + (prices[d.tier] || 0), 0);
  const totalUsers = allProfiles.length;

  const filteredDealers = dealers.filter((d) =>
    d.business_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.business_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredListings = listings.filter((l) => {
    const matchesSearch = l.title?.toLowerCase().includes(listingSearch.toLowerCase()) ||
      l.make?.toLowerCase().includes(listingSearch.toLowerCase()) ||
      l.model?.toLowerCase().includes(listingSearch.toLowerCase());
    const matchesStatus = listingStatusFilter === "all" || l.status === listingStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredUsers = allProfiles.filter((p) =>
    !userSearch || p.full_name?.toLowerCase().includes(userSearch.toLowerCase()) || p.phone?.includes(userSearch)
  );

  const revenueChartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { label: d.toLocaleDateString("en-US", { month: "short" }), value: 0 };
    });
    const base = Math.max(totalRevenue * 0.5, 100);
    return months.map((m, i) => ({ ...m, value: Math.round(base + (totalRevenue - base) * (i / 5)) }));
  }, [totalRevenue]);

  const dealerGrowthData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const count = dealers.filter((dl) => new Date(dl.created_at) <= monthEnd).length;
      return { label: d.toLocaleDateString("en-US", { month: "short" }), value: count };
    });
  }, [dealers]);

  const getUserRoles = (userId: string) => allRoles.filter((r) => r.user_id === userId).map((r) => r.role);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { label: "Total Users", value: totalUsers, icon: Users, color: "text-primary" },
            { label: "Total Dealers", value: dealers.length, icon: Building2, color: "text-info" },
            { label: "Active Listings", value: activeListings.length, icon: Car, color: "text-success" },
            { label: "Monthly Revenue", value: `£${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-warning" },
            { label: "Pending Reports", value: pendingReports.length, icon: Flag, color: "text-destructive" },
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
          <TabsList className="flex w-full overflow-x-auto">
            <TabsTrigger value="dealers">Dealers</TabsTrigger>
            <TabsTrigger value="kyc">KYC ({pendingKYC.length})</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="auctions" className="gap-1"><Gavel className="h-3 w-3" /> Auctions ({pendingAuctions.length})</TabsTrigger>
            <TabsTrigger value="reports">Reports ({pendingReports.length})</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="contacts">Messages</TabsTrigger>
            <TabsTrigger value="bugs">Bugs</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
            <TabsTrigger value="dms" className="gap-1"><Package className="h-3 w-3" /> DMS Health</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1"><BarChart3 className="h-3 w-3" /> Analytics</TabsTrigger>
            <TabsTrigger value="inspections" className="gap-1"><Shield className="h-3 w-3" /> Inspections</TabsTrigger>
            <TabsTrigger value="inspectors" className="gap-1"><Shield className="h-3 w-3" /> Inspectors</TabsTrigger>
          </TabsList>

          {/* Dealers Tab */}
          <TabsContent value="dealers" className="mt-4">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">All Dealers ({dealers.length})</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search dealers..." className="pl-9 w-56" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportCSV(dealers, "dealers")}><Download className="mr-1 h-4 w-4" /> CSV</Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>KYC</TableHead>
                      <TableHead>Listings</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDealers.map((d) => {
                      const dealerListings = listings.filter((l) => l.dealer_id === d.id);
                      return (
                        <TableRow key={d.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-card-foreground">{d.business_name}</p>
                              <p className="text-xs text-muted-foreground">{d.business_email || d.city || "—"}</p>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="secondary">{d.tier}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={d.subscription_status === "active" ? "default" : "destructive"}>
                              {d.subscription_status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={d.kyc_verified ? "border-success text-success" : "border-destructive text-destructive"}>
                              {d.kyc_verified ? "Verified" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{dealerListings.length}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedDealer(d)}>
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                                </DropdownMenuItem>
                                {d.is_active ? (
                                  <DropdownMenuItem onClick={() => toggleDealerActive(d.id, false)} className="text-destructive">
                                    <Ban className="mr-2 h-4 w-4" /> Suspend
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => toggleDealerActive(d.id, true)}>
                                    <CheckCircle className="mr-2 h-4 w-4" /> Activate
                                  </DropdownMenuItem>
                                )}
                                {!d.kyc_verified && (
                                  <DropdownMenuItem onClick={() => approveKYC(d.id)}>
                                    <ShieldCheck className="mr-2 h-4 w-4" /> Approve KYC
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {filteredDealers.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">No dealers found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc" className="mt-4">
            <Card>
              <CardHeader><CardTitle className="text-base">KYC Approval Queue</CardTitle></CardHeader>
              <CardContent>
                {pendingKYC.length === 0 ? (
                  <div className="flex flex-col items-center py-12">
                    <ShieldCheck className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-3 text-muted-foreground">No pending KYC reviews</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingKYC.map((d) => (
                      <div key={d.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-card-foreground">{d.business_name}</p>
                          <p className="text-sm text-muted-foreground">{d.business_email || "No email"} · {d.city || "No location"}</p>
                          <p className="text-xs text-muted-foreground">
                            Submitted: {d.kyc_submitted_at ? new Date(d.kyc_submitted_at).toLocaleDateString() : "N/A"}
                            {d.onboarded_by_agent && " · Agent onboarded"}
                          </p>
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

          {/* Listings Tab */}
          <TabsContent value="listings" className="mt-4">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">All Listings ({listings.length})</CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Select value={listingStatusFilter} onValueChange={setListingStatusFilter}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search listings..." className="pl-9 w-56" value={listingSearch} onChange={(e) => setListingSearch(e.target.value)} />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => exportCSV(filteredListings, "listings")}><Download className="mr-1 h-4 w-4" /> CSV</Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Logbook</TableHead>
                      <TableHead>HPI</TableHead>
                      <TableHead>Views</TableHead>
                      <TableHead>Posted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredListings.slice(0, 50).map((l) => {
                      const hasLogbook = !!(l as any).logbook_url;
                      const hpiData = (l as any).hpi_check_data;
                      const hasHpi = !!hpiData;
                      const hpiClean = hasHpi && !hpiData?.stolen_reported && !hpiData?.finance_outstanding && !hpiData?.write_off;
                      return (
                        <TableRow key={l.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {l.images?.[0] && <img src={l.images[0]} alt="" className="h-8 w-12 rounded object-cover" />}
                              <div>
                                <p className="font-medium text-card-foreground">{l.year} {l.make} {l.model}</p>
                                <p className="text-xs text-muted-foreground">{l.dealer_id ? "Dealer" : "Private"} · {l.registration || "No reg"}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>£{Number(l.price).toLocaleString()}</TableCell>
                          <TableCell><Badge variant={l.status === "active" ? "default" : l.status === "under_review" ? "destructive" : "secondary"}>{l.status}</Badge></TableCell>
                          <TableCell>
                            <Badge variant="outline" className={hasLogbook ? "border-success text-success" : "border-destructive text-destructive"}>
                              {hasLogbook ? "✓" : "✗"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {hasHpi ? (
                              <Badge variant="outline" className={hpiClean ? "border-success text-success" : "border-destructive text-destructive"}>
                                {hpiClean ? "Clear" : "Issues"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-muted-foreground text-muted-foreground">None</Badge>
                            )}
                          </TableCell>
                          <TableCell>{l.views_count || 0}</TableCell>
                          <TableCell className="text-muted-foreground">{new Date(l.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setVerifyListing(l)}>
                                  <Eye className="mr-2 h-4 w-4" /> View verification
                                </DropdownMenuItem>
                                {l.status !== "active" && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      if (!hasLogbook) {
                                        toast({ title: "Cannot approve", description: "Seller has not uploaded a logbook.", variant: "destructive" });
                                        return;
                                      }
                                      toggleListingStatus(l.id, "active");
                                    }}
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" /> Approve
                                    {!hasLogbook && <span className="ml-1 text-xs text-destructive">(no logbook)</span>}
                                  </DropdownMenuItem>
                                )}
                                {l.status === "active" && (
                                  <DropdownMenuItem onClick={() => toggleListingStatus(l.id, "under_review")}>
                                    <Ban className="mr-2 h-4 w-4" /> Suspend
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => deleteListing(l.id)} className="text-destructive">
                                  <XCircle className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {filteredListings.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">No listings found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Auctions Tab */}
          <TabsContent value="auctions" className="mt-4">
            <div className="space-y-4">
              {/* Pending Inspection Queue */}
              {pendingAuctions.length > 0 && (
                <Card className="border-amber-200 dark:border-amber-800">
                  <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" /> Pending Inspection ({pendingAuctions.length})</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {pendingAuctions.map((a: any) => {
                      const l = a.car_listings;
                      return (
                        <div key={a.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-border p-4">
                          <div>
                            <p className="font-medium text-card-foreground">{l?.year} {l?.make} {l?.model}</p>
                            <p className="text-xs text-muted-foreground">Reg: {l?.registration || "N/A"} · Starting: £{Number(a.starting_price).toLocaleString()} · Format: {a.format}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="default" className="gap-1" onClick={() => setInspectingAuction(a)}>
                              <ClipboardCheck className="h-3 w-3" /> Full Inspection
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => approveAuction(a.id, 3)} title="Quick approve with 3/5">
                              ⭐ Quick 3/5
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive" onClick={() => rejectAuction(a.id)}>
                              <XCircle className="mr-1 h-3 w-3" /> Reject
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {/* All Auctions */}
              <Card>
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-base flex items-center gap-2"><Gavel className="h-4 w-4" /> All Auctions ({auctions.length})</CardTitle>
                  <Select value={auctionStatusFilter} onValueChange={setAuctionStatusFilter}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="pending_inspection">Pending</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="ended">Ended</SelectItem>
                      <SelectItem value="reserve_not_met">Reserve Not Met</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Current Bid</TableHead>
                        <TableHead>Bids</TableHead>
                        <TableHead>Ends</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAuctions.slice(0, 50).map((a: any) => {
                        const l = a.car_listings;
                        return (
                          <TableRow key={a.id}>
                            <TableCell>
                              <p className="font-medium text-card-foreground">{l?.year} {l?.make} {l?.model}</p>
                              <p className="text-xs text-muted-foreground">{a.format} · {l?.registration || "N/A"}</p>
                            </TableCell>
                            <TableCell><Badge variant={a.status === "live" ? "default" : a.status === "sold" ? "secondary" : "outline"}>{a.status}</Badge></TableCell>
                            <TableCell>{a.inspection_rating ? `${a.inspection_rating}/5` : "—"}</TableCell>
                            <TableCell>£{Number(a.current_bid || a.starting_price).toLocaleString()}</TableCell>
                            <TableCell>{a.bid_count || 0}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{a.ends_at ? new Date(a.ends_at).toLocaleDateString() : "—"}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setSelectedAuction(a)}><Eye className="mr-2 h-4 w-4" /> Details</DropdownMenuItem>
                                  {a.status === "pending_inspection" && <DropdownMenuItem onClick={() => approveAuction(a.id, 3)}><CheckCircle className="mr-2 h-4 w-4" /> Quick Approve (3/5)</DropdownMenuItem>}
                                  {a.status !== "cancelled" && <DropdownMenuItem onClick={() => rejectAuction(a.id)} className="text-destructive"><XCircle className="mr-2 h-4 w-4" /> Cancel</DropdownMenuItem>}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Payment Protection Management */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Payment Protection ({auctionEscrows.length})</CardTitle></CardHeader>
                <CardContent className="overflow-x-auto">
                  {auctionEscrows.length === 0 ? (
                    <p className="py-8 text-center text-muted-foreground">No payment protection records yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Auction</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>V5C</TableHead>
                          <TableHead>Keys</TableHead>
                          <TableHead>Contract</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auctionEscrows.map((e: any) => (
                          <TableRow key={e.id}>
                            <TableCell className="text-xs">{e.auction_id.slice(0, 8)}...</TableCell>
                            <TableCell>£{Number(e.total_amount).toLocaleString()}</TableCell>
                            <TableCell><Badge variant="outline" className="capitalize">{(e.status as string).replace(/_/g, " ")}</Badge></TableCell>
                            <TableCell>{e.v5c_received ? "✅" : "⏳"}</TableCell>
                            <TableCell>{e.keys_handed_over ? "✅" : "⏳"}</TableCell>
                            <TableCell>{e.contract_signed ? "✅" : "⏳"}</TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {e.v5c_received && e.keys_handed_over && e.contract_signed && e.status !== "released_to_seller" && (
                                    <DropdownMenuItem onClick={() => updateEscrowStatus(e.id, "released_to_seller")}><CheckCircle className="mr-2 h-4 w-4" /> Release to Seller</DropdownMenuItem>
                                  )}
                                  {e.status !== "refunded" && <DropdownMenuItem onClick={() => updateEscrowStatus(e.id, "refunded")} className="text-destructive">Refund Buyer</DropdownMenuItem>}
                                  {e.status !== "disputed" && <DropdownMenuItem onClick={() => updateEscrowStatus(e.id, "disputed")}>Mark Disputed</DropdownMenuItem>}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {/* Audit Log */}
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" /> Auction Audit Log (last 200)</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-72">
                    <div className="space-y-1">
                      {auctionAuditLog.map((log: any) => (
                        <div key={log.id} className="flex items-center justify-between py-1.5 px-2 rounded text-xs hover:bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[9px] py-0">{log.action}</Badge>
                            <span className="text-muted-foreground">{log.actor_role || "system"}</span>
                          </div>
                          <span className="text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                      ))}
                      {auctionAuditLog.length === 0 && <p className="text-center text-muted-foreground py-4">No audit entries</p>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="mt-4">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Flag className="h-4 w-4 text-destructive" /> Listing Reports ({listingReports.length})
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => exportCSV(listingReports, "listing-reports")}><Download className="mr-1 h-4 w-4" /> CSV</Button>
              </CardHeader>
              <CardContent>
                {listingReports.length === 0 ? (
                  <div className="flex flex-col items-center py-12">
                    <Flag className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-3 text-muted-foreground">No listing reports</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reason</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {listingReports.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="font-medium text-card-foreground">{r.reason}</TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">{r.details || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={r.status === "pending" ? "destructive" : r.status === "resolved" ? "default" : "secondary"}>
                              {r.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {r.status === "pending" && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => updateReportStatus(r.id, "resolved")}>
                                    <CheckCircle className="mr-1 h-3 w-3" /> Resolve
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateReportStatus(r.id, "dismissed")}>
                                    Dismiss
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pipeline Tab */}
          <TabsContent value="pipeline" className="mt-4">
            <SalesPipeline mode="admin" />
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-base">All Users ({allProfiles.length})</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search users..." className="pl-9 w-56" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Roles</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((p) => {
                      const roles = getUserRoles(p.user_id);
                      return (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-card-foreground">{p.full_name || "No name"}</p>
                              <p className="text-xs text-muted-foreground">{p.phone || "—"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {roles.map((role) => (
                                <Badge key={role} variant="secondary" className="text-xs">
                                  {role}
                                  <button className="ml-1 text-destructive hover:text-destructive/80" onClick={() => removeRole(p.user_id, role)}>×</button>
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRoleDialog({ userId: p.user_id, currentRoles: roles })}
                            >
                              <UserPlus className="mr-1 h-4 w-4" /> Add Role
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {allProfiles.length === 0 && (
                  <p className="py-8 text-center text-muted-foreground">No users found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Messages Tab */}
          <TabsContent value="contacts" className="mt-4">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mail className="h-4 w-4 text-primary" /> Contact Messages ({contactMessages.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {contactMessages.length === 0 ? (
                  <div className="flex flex-col items-center py-12">
                    <Mail className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-3 text-muted-foreground">No contact messages</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {contactMessages.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-card-foreground">{m.name}</p>
                              <p className="text-xs text-muted-foreground">{m.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-card-foreground">{m.subject}</TableCell>
                          <TableCell className="max-w-xs truncate text-muted-foreground">{m.message}</TableCell>
                          <TableCell>
                            <Badge variant={m.status === "new" ? "destructive" : "default"}>{m.status}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            {m.status === "new" && (
                              <Button size="sm" variant="outline" onClick={() => updateContactStatus(m.id, "read")}>
                                Mark Read
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bug Reports Tab */}
          <TabsContent value="bugs" className="mt-4">
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bug className="h-4 w-4 text-warning" /> Bug Reports ({bugReports.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bugReports.length === 0 ? (
                  <div className="flex flex-col items-center py-12">
                    <Bug className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-3 text-muted-foreground">No bug reports</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Page</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bugReports.map((b) => (
                        <TableRow key={b.id}>
                          <TableCell className="max-w-xs truncate font-medium text-card-foreground">{b.description}</TableCell>
                          <TableCell>
                            <Badge variant={b.severity === "high" ? "destructive" : b.severity === "medium" ? "default" : "secondary"}>
                              {b.severity}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[120px] truncate text-muted-foreground">{b.page_url || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={b.status === "open" ? "destructive" : b.status === "in_progress" ? "default" : "secondary"}>
                              {b.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{new Date(b.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => updateBugStatus(b.id, "in_progress")}>In Progress</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateBugStatus(b.id, "resolved")}>Resolved</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateBugStatus(b.id, "wont_fix")}>Won't Fix</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Finance Tab */}
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
                      <span className="text-primary">£{totalRevenue.toLocaleString()}</span>
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
                    <div className="flex flex-col items-center py-8">
                      <DollarSign className="h-12 w-12 text-muted-foreground" />
                      <p className="mt-3 text-muted-foreground">No commission data yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {commissions.slice(0, 5).map((c) => (
                        <div key={c.id} className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-card-foreground">Commission #{c.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">{c.status} · {c.period_start ? new Date(c.period_start).toLocaleDateString() : ""}</p>
                          </div>
                          <span className="font-display font-semibold text-primary">£{Number(c.amount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* DMS Health Tab */}
          <TabsContent value="dms" className="mt-4">
            <AdminDmsHealthPanel />
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-4">
            <AdminAnalyticsPanel />
          </TabsContent>

          <TabsContent value="inspections" className="mt-4">
            <AdminInspectionBookingsPanel />
          </TabsContent>

          <TabsContent value="inspectors" className="mt-4">
            <AdminInspectorsPanel />
          </TabsContent>
        </Tabs>

        {/* Dealer Detail Dialog */}
        <Dialog open={!!selectedDealer} onOpenChange={() => setSelectedDealer(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">{selectedDealer?.business_name}</DialogTitle>
              <DialogDescription>Dealer details and configuration</DialogDescription>
            </DialogHeader>
            {selectedDealer && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Email:</span> <span className="text-foreground">{selectedDealer.business_email || "—"}</span></div>
                  <div><span className="text-muted-foreground">Phone:</span> <span className="text-foreground">{selectedDealer.business_phone || "—"}</span></div>
                  <div><span className="text-muted-foreground">City:</span> <span className="text-foreground">{selectedDealer.city || "—"}</span></div>
                  <div><span className="text-muted-foreground">Postcode:</span> <span className="text-foreground">{selectedDealer.postcode || "—"}</span></div>
                  <div><span className="text-muted-foreground">Tier:</span> <Badge variant="secondary">{selectedDealer.tier}</Badge></div>
                  <div><span className="text-muted-foreground">Status:</span> <Badge variant={selectedDealer.subscription_status === "active" ? "default" : "destructive"}>{selectedDealer.subscription_status}</Badge></div>
                  <div><span className="text-muted-foreground">Max Listings:</span> <span className="text-foreground">{selectedDealer.max_listings === 9999 ? "Unlimited" : selectedDealer.max_listings}</span></div>
                  <div><span className="text-muted-foreground">KYC:</span> <Badge variant="outline" className={selectedDealer.kyc_verified ? "border-success text-success" : "border-destructive text-destructive"}>{selectedDealer.kyc_verified ? "Verified" : "Pending"}</Badge></div>
                </div>
                <div className="flex gap-2 pt-2">
                  {!selectedDealer.kyc_verified && (
                    <Button size="sm" className="gradient-primary border-0" onClick={() => { approveKYC(selectedDealer.id); setSelectedDealer(null); }}>
                      Approve KYC
                    </Button>
                  )}
                  <Button size="sm" variant={selectedDealer.is_active ? "destructive" : "default"} onClick={() => { toggleDealerActive(selectedDealer.id, !selectedDealer.is_active); setSelectedDealer(null); }}>
                    {selectedDealer.is_active ? "Suspend" : "Activate"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Role Dialog */}
        <Dialog open={!!roleDialog} onOpenChange={() => setRoleDialog(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Assign Role</DialogTitle>
              <DialogDescription>Select a role to assign to this user</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-2 pt-2">
              {["buyer", "seller", "dealer", "agent", "admin"].filter(
                (r) => !roleDialog?.currentRoles.includes(r)
              ).map((role) => (
                <Button key={role} variant="outline" className="capitalize" onClick={() => roleDialog && addRole(roleDialog.userId, role)}>
                  {role}
                </Button>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        {/* Auction Detail Dialog */}
        <Dialog open={!!selectedAuction} onOpenChange={() => setSelectedAuction(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2"><Gavel className="h-5 w-5" /> Auction Details</DialogTitle>
              <DialogDescription>Full auction information and controls</DialogDescription>
            </DialogHeader>
            {selectedAuction && (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Vehicle:</span> <span className="text-foreground">{selectedAuction.car_listings?.year} {selectedAuction.car_listings?.make} {selectedAuction.car_listings?.model}</span></div>
                  <div><span className="text-muted-foreground">Status:</span> <Badge variant="outline">{selectedAuction.status}</Badge></div>
                  <div><span className="text-muted-foreground">Format:</span> <span className="text-foreground">{selectedAuction.format}</span></div>
                  <div><span className="text-muted-foreground">Rating:</span> <span className="text-foreground">{selectedAuction.inspection_rating ? `${selectedAuction.inspection_rating}/5` : "Pending"}</span></div>
                  <div><span className="text-muted-foreground">Starting:</span> <span className="text-foreground">£{Number(selectedAuction.starting_price).toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">Current:</span> <span className="text-foreground font-bold">£{Number(selectedAuction.current_bid || selectedAuction.starting_price).toLocaleString()}</span></div>
                  <div><span className="text-muted-foreground">Reserve:</span> <span className="text-foreground">{selectedAuction.reserve_price ? `£${Number(selectedAuction.reserve_price).toLocaleString()}` : "None"}</span></div>
                  <div><span className="text-muted-foreground">Bids:</span> <span className="text-foreground">{selectedAuction.bid_count || 0}</span></div>
                  <div><span className="text-muted-foreground">HPI:</span> <span>{selectedAuction.hpi_clear ? "✅ Clear" : "⏳"}</span></div>
                  <div><span className="text-muted-foreground">Verified:</span> <span>{selectedAuction.seller_verified ? "✅" : "⏳"}</span></div>
                </div>
                <Separator />
                <div className="flex gap-2 pt-2">
                  {selectedAuction.status === "pending_inspection" && (
                    <Button size="sm" variant="default" className="gap-1" onClick={() => { setInspectingAuction(selectedAuction); setSelectedAuction(null); }}>
                      <ClipboardCheck className="h-3 w-3" /> Full Inspection
                    </Button>
                  )}
                  {selectedAuction.status !== "cancelled" && (
                    <Button size="sm" variant="destructive" onClick={() => { rejectAuction(selectedAuction.id); setSelectedAuction(null); }}>Cancel</Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Full Inspection Panel Dialog */}
        <Dialog open={!!inspectingAuction} onOpenChange={() => setInspectingAuction(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2"><ClipboardCheck className="h-5 w-5" /> Vehicle Inspection</DialogTitle>
              <DialogDescription>Complete the full inspection report before approving this auction</DialogDescription>
            </DialogHeader>
            {inspectingAuction && (
              <AdminInspectionPanel auction={inspectingAuction} onComplete={() => { setInspectingAuction(null); fetchAll(); }} />
            )}
          </DialogContent>
        </Dialog>
      </div>
      <AdminVerificationDialog listing={verifyListing} open={!!verifyListing} onClose={() => setVerifyListing(null)} />
      <Footer />
    </div>
  );
};

export default AdminDashboard;

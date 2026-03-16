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
  Eye, Loader2, UserPlus, Ban, MoreHorizontal,
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
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import DashboardChart from "@/components/DashboardChart";
import SalesPipeline from "@/components/SalesPipeline";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [dealers, setDealers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [allRoles, setAllRoles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [listingStatusFilter, setListingStatusFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [dateRange, setDateRange] = useState("month");
  const [loading, setLoading] = useState(true);
  const [selectedDealer, setSelectedDealer] = useState<any>(null);
  const [roleDialog, setRoleDialog] = useState<{ userId: string; currentRoles: string[] } | null>(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    const [dealersRes, listingsRes, commissionsRes, profilesRes, rolesRes] = await Promise.all([
      supabase.from("dealers").select("*").order("created_at", { ascending: false }),
      supabase.from("car_listings").select("*").order("created_at", { ascending: false }).limit(200),
      supabase.from("agent_commissions").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("*"),
    ]);
    if (dealersRes.data) setDealers(dealersRes.data);
    if (listingsRes.data) setListings(listingsRes.data);
    if (commissionsRes.data) setCommissions(commissionsRes.data);
    if (profilesRes.data) setAllProfiles(profilesRes.data);
    if (rolesRes.data) setAllRoles(rolesRes.data);
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
            { label: "Monthly Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: DollarSign, color: "text-warning" },
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dealers">Dealers</TabsTrigger>
            <TabsTrigger value="kyc">KYC ({pendingKYC.length})</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="finance">Finance</TabsTrigger>
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
      </div>
      <Footer />
    </div>
  );
};

export default AdminDashboard;

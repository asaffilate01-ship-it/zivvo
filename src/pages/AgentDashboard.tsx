import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
  DollarSign,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  UserPlus,
  Download,
  FileText,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import SalesPipeline from "@/components/SalesPipeline";

const AgentDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
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

  const activeDealer = dealers.filter((d) => d.subscription_status === "active").length;
  const pendingOnboarding = dealers.filter((d) => !d.kyc_verified).length;

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
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
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
            { label: "Total Earned", value: `£${totalEarned.toLocaleString()}`, icon: DollarSign, color: "text-primary" },
            { label: "Pending Payout", value: `£${totalPending.toLocaleString()}`, icon: Clock, color: "text-accent-foreground" },
            { label: "Active Dealers", value: activeDealer, icon: Building2, color: "text-primary" },
            { label: "Pending Onboarding", value: pendingOnboarding, icon: AlertCircle, color: "text-destructive" },
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

        {/* Sales Pipeline Analytics */}
        <div className="mt-8">
          <h2 className="font-display text-lg font-bold text-foreground mb-4">Dealer Sales Pipeline</h2>
          <SalesPipeline mode="agent" />
        </div>

        <Tabs defaultValue="pipeline" className="mt-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pipeline">Onboarding</TabsTrigger>
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
                          <TableCell><Badge variant="secondary">{d.tier}</Badge></TableCell>
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
                            {new Date(d.created_at).toLocaleDateString()}
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
                        <TableHead>Amount</TableHead>
                        <TableHead>Rate</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map((c) => (
                        <TableRow key={c.id}>
                          <TableCell>
                            {c.period_start ? `${c.period_start} - ${c.period_end}` : "N/A"}
                          </TableCell>
                          <TableCell className="font-display font-semibold text-primary">
                            ${Number(c.amount).toFixed(2)}
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
                    <p className="mt-1 font-display text-2xl font-bold text-primary">£{totalEarned.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Pending</p>
                    <p className="mt-1 font-display text-2xl font-bold text-card-foreground">£{totalPending.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Commission Rate</p>
                    <p className="mt-1 font-display text-2xl font-bold text-card-foreground">30%</p>
                  </div>
                </div>
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

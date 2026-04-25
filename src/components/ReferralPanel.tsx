import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Gift, Copy, Users, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const ReferralPanel = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [code, setCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [codeRes, refRes] = await Promise.all([
        supabase.from("referral_codes").select("code").eq("user_id", user.id).maybeSingle(),
        supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (codeRes.data) setCode(codeRes.data.code);
      if (refRes.data) setReferrals(refRes.data);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const generateCode = async () => {
    if (!user) return;
    const newCode = `AV-${user.id.slice(0, 6).toUpperCase()}`;
    const { data, error } = await supabase
      .from("referral_codes")
      .insert({ user_id: user.id, code: newCode })
      .select("code")
      .single();
    if (!error && data) {
      setCode(data.code);
      toast({ title: "Referral code created!" });
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/signup?ref=${code}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Referral link copied!" });
  };

  const shareLink = () => {
    const link = `${window.location.origin}/signup?ref=${code}`;
    if (navigator.share) {
      navigator.share({ title: "Join Zivvo", text: "Sign up using my referral link!", url: link });
    } else {
      copyLink();
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gift className="h-4 w-4 text-primary" /> Refer & Earn
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Share your referral link with friends. When they sign up and list a car, you both benefit!
          </p>

          {code ? (
            <div className="mt-4">
              <label className="text-sm font-medium text-foreground">Your Referral Link</label>
              <div className="mt-1 flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}/signup?ref=${code}`}
                  className="font-mono text-sm"
                />
                <Button variant="outline" size="icon" onClick={copyLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="mt-3 flex gap-2">
                <Button size="sm" className="gradient-primary border-0" onClick={shareLink}>
                  <Gift className="mr-1 h-3.5 w-3.5" /> Share Link
                </Button>
              </div>
            </div>
          ) : (
            <Button className="gradient-primary mt-4 border-0" onClick={generateCode}>
              <Gift className="mr-2 h-4 w-4" /> Generate My Referral Code
            </Button>
          )}
        </CardContent>
      </Card>

      {referrals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" /> Your Referrals ({referrals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {referrals.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm text-card-foreground">Referral</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === "completed" ? "default" : "secondary"}>{r.status}</Badge>
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReferralPanel;

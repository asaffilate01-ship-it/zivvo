import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Users, UserPlus, Trash2, Copy, Mail } from "lucide-react";

interface Props { dealerId: string; }

interface Staff {
  id: string;
  email: string;
  full_name: string | null;
  role: "manager" | "sales" | "admin_assistant";
  is_active: boolean;
  accepted_at: string | null;
  invited_at: string;
  invite_token: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  manager: "Manager",
  sales: "Sales",
  admin_assistant: "Admin Assistant",
};

const StaffManager = ({ dealerId }: Props) => {
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", role: "sales" as Staff["role"] });

  const load = async () => {
    const { data } = await supabase
      .from("dealer_staff" as any)
      .select("*")
      .eq("dealer_id", dealerId)
      .order("invited_at", { ascending: false });
    setStaff((data as any) || []);
  };

  useEffect(() => { load(); }, [dealerId]);

  const invite = async () => {
    if (!form.email) { toast({ title: "Email required", variant: "destructive" }); return; }
    const token = crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabase.from("dealer_staff" as any).insert({
      dealer_id: dealerId,
      email: form.email.toLowerCase().trim(),
      full_name: form.full_name || null,
      role: form.role,
      invite_token: token,
    });
    if (error) {
      toast({ title: "Error", description: error.message.includes("unique") ? "This email is already invited" : error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Invitation sent", description: "Share the invite link with your team member." });
    setOpen(false);
    setForm({ email: "", full_name: "", role: "sales" });
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("dealer_staff" as any).delete().eq("id", id);
    if (error) { toast({ title: "Error", variant: "destructive" }); return; }
    toast({ title: "Staff removed" });
    load();
  };

  const toggleActive = async (s: Staff) => {
    await supabase.from("dealer_staff" as any).update({ is_active: !s.is_active }).eq("id", s.id);
    load();
  };

  const copyInvite = (token: string) => {
    const link = `${window.location.origin}/signup?invite=${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: "Invite link copied", description: link });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Staff & Team</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">Invite sales staff, managers and admin assistants under your dealership.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary border-0"><UserPlus className="mr-1 h-4 w-4" /> Invite Staff</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Invite a Team Member</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" /></div>
              <div><Label>Email *</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" /></div>
              <div>
                <Label>Role</Label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">Manager — full access</SelectItem>
                    <SelectItem value="sales">Sales — manage stock & enquiries</SelectItem>
                    <SelectItem value="admin_assistant">Admin Assistant — paperwork only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={invite} className="gradient-primary border-0">Send Invite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {staff.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center"><Users className="h-10 w-10 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">No team members yet. Invite your first.</p></div>
        ) : (
          <div className="space-y-2">
            {staff.map(s => (
              <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-3 text-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{(s.full_name || s.email)[0].toUpperCase()}</div>
                  <div>
                    <p className="font-medium">{s.full_name || s.email}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {s.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{ROLE_LABELS[s.role]}</Badge>
                  {s.accepted_at ? (
                    <Badge className="bg-success text-success-foreground">Active</Badge>
                  ) : (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                  {!s.accepted_at && s.invite_token && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyInvite(s.invite_token!)} title="Copy invite link"><Copy className="h-4 w-4" /></Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleActive(s)} title={s.is_active ? "Disable" : "Enable"}>
                    <Badge variant={s.is_active ? "default" : "outline"} className="px-1 text-[10px]">{s.is_active ? "ON" : "OFF"}</Badge>
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StaffManager;

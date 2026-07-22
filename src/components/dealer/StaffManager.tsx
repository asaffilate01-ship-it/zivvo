import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
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

const StaffManager = ({ dealerId }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ email: "", full_name: "", role: "sales" as Staff["role"] });

  const ROLE_LABELS: Record<string, string> = {
    manager: t("dealer.staffManager.roleManager"),
    sales: t("dealer.staffManager.roleSales"),
    admin_assistant: t("dealer.staffManager.roleAdminAssistant"),
  };

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
    if (!form.email) { toast({ title: t("dealer.staffManager.emailRequired"), variant: "destructive" }); return; }
    const token = crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabase.from("dealer_staff" as any).insert({
      dealer_id: dealerId,
      email: form.email.toLowerCase().trim(),
      full_name: form.full_name || null,
      role: form.role,
      invite_token: token,
    });
    if (error) {
      toast({ title: t("common.error"), description: error.message.includes("unique") ? t("dealer.staffManager.alreadyInvited") : error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("dealer.staffManager.invitationSentTitle"), description: t("dealer.staffManager.invitationSentDescription") });
    setOpen(false);
    setForm({ email: "", full_name: "", role: "sales" });
    load();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("dealer_staff" as any).delete().eq("id", id);
    if (error) { toast({ title: t("common.error"), variant: "destructive" }); return; }
    toast({ title: t("dealer.staffManager.staffRemoved") });
    load();
  };

  const toggleActive = async (s: Staff) => {
    await supabase.from("dealer_staff" as any).update({ is_active: !s.is_active }).eq("id", s.id);
    load();
  };

  const copyInvite = (token: string) => {
    const link = `${window.location.origin}/signup?invite=${token}`;
    navigator.clipboard.writeText(link);
    toast({ title: t("dealer.staffManager.linkCopied"), description: link });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> {t("dealer.staffManager.title")}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">{t("dealer.staffManager.subtitle")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-primary border-0"><UserPlus className="mr-1 h-4 w-4" /> {t("dealer.staffManager.inviteStaff")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{t("dealer.staffManager.inviteTitle")}</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div><Label>{t("dealer.staffManager.fullName")}</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" /></div>
              <div><Label>{t("dealer.staffManager.email")}</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" /></div>
              <div>
                <Label>{t("dealer.staffManager.role")}</Label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manager">{t("dealer.staffManager.roleManagerFull")}</SelectItem>
                    <SelectItem value="sales">{t("dealer.staffManager.roleSalesFull")}</SelectItem>
                    <SelectItem value="admin_assistant">{t("dealer.staffManager.roleAdminAssistantFull")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>{t("common.cancel")}</Button>
              <Button onClick={invite} className="gradient-primary border-0">{t("dealer.staffManager.sendInvite")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {staff.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center"><Users className="h-10 w-10 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">{t("dealer.staffManager.empty")}</p></div>
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
                    <Badge className="bg-success text-success-foreground">{t("dealer.staffManager.active")}</Badge>
                  ) : (
                    <Badge variant="secondary">{t("dealer.staffManager.pending")}</Badge>
                  )}
                  {!s.accepted_at && s.invite_token && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => copyInvite(s.invite_token!)} title={t("dealer.staffManager.copyInviteLink")}><Copy className="h-4 w-4" /></Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleActive(s)} title={s.is_active ? t("dealer.staffManager.disable") : t("dealer.staffManager.enable")}>
                    <Badge variant={s.is_active ? "default" : "outline"} className="px-1 text-[10px]">{s.is_active ? t("dealer.staffManager.on") : t("dealer.staffManager.off")}</Badge>
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

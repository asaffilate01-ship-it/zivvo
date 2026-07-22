import { useState } from "react";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Car, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().max(1000).optional(),
});

interface Props {
  listingId: string;
  dealerId?: string | null;
  vehicleLabel?: string;
  trigger?: React.ReactNode;
}

const TIMES = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const TestDriveDialog = ({ listingId, dealerId, vehicleLabel, trigger }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: t("dealer.testDrive.checkDetailsTitle"), description: t("dealer.testDrive.checkDetailsDescription"), variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("test_drive_bookings").insert({
      listing_id: listingId,
      dealer_id: dealerId ?? null,
      buyer_id: user?.id ?? null,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      message: parsed.data.message || null,
      preferred_date: date ? format(date, "yyyy-MM-dd") : null,
      preferred_time: time || null,
      status: "pending",
    });
    setLoading(false);
    if (error) {
      toast({ title: t("dealer.testDrive.couldNotBook"), description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: t("dealer.testDrive.requestedTitle"), description: t("dealer.testDrive.requestedDescription") });
    setOpen(false);
    setForm({ name: "", email: "", phone: "", message: "" });
    setDate(undefined); setTime("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline"><Car className="w-4 h-4 mr-2" /> {t("dealer.testDrive.trigger")}</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dealer.testDrive.title")}</DialogTitle>
          <DialogDescription>{vehicleLabel ?? t("dealer.testDrive.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t("dealer.testDrive.name")}</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">{t("dealer.testDrive.phone")}</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">{t("dealer.testDrive.email")}</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">{t("dealer.testDrive.preferredDate")}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : t("dealer.testDrive.pickDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus className={cn("p-3 pointer-events-auto")} />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label className="text-xs">{t("dealer.testDrive.preferredTime")}</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger><SelectValue placeholder={t("dealer.testDrive.select")} /></SelectTrigger>
                <SelectContent>
                  {TIMES.map((tm) => <SelectItem key={tm} value={tm}>{tm}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">{t("dealer.testDrive.notes")}</Label>
            <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Car className="w-4 h-4 mr-2" />}
            {t("dealer.testDrive.requestTestDrive")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestDriveDialog;

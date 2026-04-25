import { useState } from "react";
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
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<string>("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });

  const submit = async () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast({ title: "Check your details", description: "Please enter a valid name and email.", variant: "destructive" });
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
      toast({ title: "Could not book", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Test drive requested", description: "The dealer will be in touch to confirm." });
    setOpen(false);
    setForm({ name: "", email: "", phone: "", message: "" });
    setDate(undefined); setTime("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button variant="outline"><Car className="w-4 h-4 mr-2" /> Test Drive</Button>}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Book a test drive</DialogTitle>
          <DialogDescription>{vehicleLabel ?? "Choose a date and time that suits you."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs">Phone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Preferred date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
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
              <Label className="text-xs">Preferred time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {TIMES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Notes (optional)</Label>
            <Textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <Button onClick={submit} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Car className="w-4 h-4 mr-2" />}
            Request test drive
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TestDriveDialog;

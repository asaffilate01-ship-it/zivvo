import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";

interface DealerEnquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealerName: string;
  dealerEmail?: string | null;
  accent?: string;
}

const DealerEnquiryDialog = ({ open, onOpenChange, dealerName, dealerEmail, accent }: DealerEnquiryDialogProps) => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast({ title: "Missing fields", description: "Please fill in your name, email and message.", variant: "destructive" });
      return;
    }
    setLoading(true);
    // Open user's mail client as a reliable fallback (no public dealer contact endpoint exists)
    const subject = encodeURIComponent(`Enquiry from ${name} via AutoSouq`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "—"}\n\n${message}`
    );
    if (dealerEmail) {
      window.location.href = `mailto:${dealerEmail}?subject=${subject}&body=${body}`;
    }
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Enquiry ready to send", description: "Your email client should now open with your message." });
      onOpenChange(false);
      setName(""); setEmail(""); setPhone(""); setMessage("");
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Enquire with {dealerName}</DialogTitle>
          <DialogDescription>
            Send a quick message — we usually reply within a few hours during opening times.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="enq-name" className="text-xs">Your name *</Label>
            <Input id="enq-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="enq-email" className="text-xs">Email *</Label>
              <Input id="enq-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
            </div>
            <div>
              <Label htmlFor="enq-phone" className="text-xs">Phone</Label>
              <Input id="enq-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07…" />
            </div>
          </div>
          <div>
            <Label htmlFor="enq-msg" className="text-xs">Message *</Label>
            <Textarea
              id="enq-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, I'm interested in your inventory…"
              rows={4}
              required
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full border-0 text-white"
            style={accent ? { backgroundColor: accent } : undefined}
          >
            {loading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
            Send enquiry
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DealerEnquiryDialog;

import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast({ title: t("dealer.enquiryDialog.missingFieldsTitle"), description: t("dealer.enquiryDialog.missingFieldsDescription"), variant: "destructive" });
      return;
    }
    setLoading(true);
    // Open user's mail client as a reliable fallback (no public dealer contact endpoint exists)
    const subject = encodeURIComponent(t("dealer.enquiryDialog.mailSubject", { name }));
    const body = encodeURIComponent(
      t("dealer.enquiryDialog.mailBody", { name, email, phone: phone || "—", message })
    );
    if (dealerEmail) {
      window.location.href = `mailto:${dealerEmail}?subject=${subject}&body=${body}`;
    }
    setTimeout(() => {
      setLoading(false);
      toast({ title: t("dealer.enquiryDialog.readyTitle"), description: t("dealer.enquiryDialog.readyDescription") });
      onOpenChange(false);
      setName(""); setEmail(""); setPhone(""); setMessage("");
    }, 400);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dealer.enquiryDialog.title", { dealerName })}</DialogTitle>
          <DialogDescription>
            {t("dealer.enquiryDialog.description")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="enq-name" className="text-xs">{t("dealer.enquiryDialog.yourName")}</Label>
            <Input id="enq-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="enq-email" className="text-xs">{t("dealer.enquiryDialog.email")}</Label>
              <Input id="enq-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" required />
            </div>
            <div>
              <Label htmlFor="enq-phone" className="text-xs">{t("dealer.enquiryDialog.phone")}</Label>
              <Input id="enq-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07…" />
            </div>
          </div>
          <div>
            <Label htmlFor="enq-msg" className="text-xs">{t("dealer.enquiryDialog.message")}</Label>
            <Textarea
              id="enq-msg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("dealer.enquiryDialog.messagePlaceholder")}
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
            {t("dealer.enquiryDialog.sendEnquiry")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DealerEnquiryDialog;

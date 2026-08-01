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
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/hooks/useAnalytics";

interface DealerEnquiryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealerId: string;
  dealerName: string;
  accent?: string;
}

const DealerEnquiryDialog = ({ open, onOpenChange, dealerId, dealerName, accent }: DealerEnquiryDialogProps) => {
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
    const { error } = await supabase.functions.invoke("contact-submit", {
      body: {
        dealer_id: dealerId,
        name,
        email,
        phone,
        subject: t("dealer.enquiryDialog.mailSubject", { name }),
        message,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: t("dealer.enquiryDialog.errorTitle"), description: error.message, variant: "destructive" });
      return;
    }
    void trackEvent("dealer_enquiry_sent", { dealer_id: dealerId });
    toast({ title: t("dealer.enquiryDialog.readyTitle"), description: t("dealer.enquiryDialog.readyDescription") });
    onOpenChange(false);
    setName(""); setEmail(""); setPhone(""); setMessage("");
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
            <Input id="enq-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Erika Mustermann" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="enq-email" className="text-xs">{t("dealer.enquiryDialog.email")}</Label>
              <Input id="enq-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sie@beispiel.de" required />
            </div>
            <div>
              <Label htmlFor="enq-phone" className="text-xs">{t("dealer.enquiryDialog.phone")}</Label>
              <Input id="enq-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+49 30 …" />
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

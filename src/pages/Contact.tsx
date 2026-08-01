import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";
import { legalConfig } from "@/lib/legalConfig";

const Contact = () => {
  const { t } = useTranslation("contact");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.functions.invoke("contact-submit", { body: form });
    setLoading(false);

    if (error) {
      toast({ title: t("toastFailTitle"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("toastSuccessTitle"), description: t("toastSuccessDesc") });
      setForm({ name: "", email: "", subject: "", message: "" });
    }
  };

  const infoItems = [
    { icon: Mail, title: t("email"), detail: legalConfig.email, sub: t("emailSub") },
    { icon: Phone, title: t("phone"), detail: legalConfig.phone, sub: t("phoneSub") },
    { icon: MapPin, title: t("office"), detail: `${legalConfig.street}, ${legalConfig.postcode} ${legalConfig.city}`, sub: `${legalConfig.companyName} ${legalConfig.legalForm}` },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={t("metaTitle")} description={t("metaDescription")} />
      <Navbar />
      <div className="container mx-auto max-w-5xl px-4 py-12">
        <div className="text-center">
          <h1 className="font-display text-3xl font-bold text-foreground md:text-4xl">{t("title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {infoItems.map((item) => (
            <Card key={item.title}>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mt-3 font-display font-semibold text-card-foreground">{item.title}</h3>
                <p className="mt-1 text-sm font-medium text-card-foreground">{item.detail}</p>
                <p className="text-xs text-muted-foreground">{item.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-12">
          <CardContent className="p-6 md:p-8">
            <h2 className="font-display text-xl font-bold text-card-foreground">{t("sendMessageTitle")}</h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t("nameLabel")}</label>
                  <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder={t("namePlaceholder")} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-foreground">{t("emailLabel")}</label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} placeholder={t("emailPlaceholder")} required />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("subjectLabel")}</label>
                <Input value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} placeholder={t("subjectPlaceholder")} required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">{t("messageLabel")}</label>
                <Textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))} placeholder={t("messagePlaceholder")} rows={5} required />
              </div>
              <Button type="submit" className="gradient-primary border-0" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {t("sendMessage")}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Mail, Loader2, Send, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Inbox = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [received, setReceived] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      const [receivedRes, sentRes] = await Promise.all([
        supabase.from("enquiries").select("*, car_listings(title, make, model, year)").eq("seller_id", user.id).order("created_at", { ascending: false }),
        supabase.from("enquiries").select("*, car_listings(title, make, model, year)").eq("sender_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (receivedRes.data) setReceived(receivedRes.data);
      if (sentRes.data) setSent(sentRes.data);
      setLoading(false);
    };
    fetchAll();

    // Realtime subscription for new enquiries
    const channel = supabase
      .channel("enquiries-inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "enquiries", filter: `seller_id=eq.${user.id}` }, (payload) => {
        setReceived((prev) => [payload.new as any, ...prev]);
        toast({ title: "New enquiry received!" });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleReply = async (enquiryId: string) => {
    const text = replyText[enquiryId];
    if (!text?.trim()) return;
    setReplyingId(enquiryId);
    const { error } = await supabase.from("enquiries").update({
      reply: text,
      replied_at: new Date().toISOString(),
      status: "replied",
    }).eq("id", enquiryId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setReceived((prev) => prev.map((e) => e.id === enquiryId ? { ...e, reply: text, status: "replied", replied_at: new Date().toISOString() } : e));
      setReplyText((prev) => ({ ...prev, [enquiryId]: "" }));
      toast({ title: "Reply sent" });
    }
    setReplyingId(null);
  };

  const markRead = async (id: string) => {
    await supabase.from("enquiries").update({ status: "read" }).eq("id", id);
    setReceived((prev) => prev.map((e) => e.id === id ? { ...e, status: "read" } : e));
  };

  const unreadCount = received.filter((e) => e.status === "unread").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Inbox</h1>
        <p className="text-muted-foreground">Manage your enquiries and messages</p>

        <Tabs defaultValue="received" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">
              Received {unreadCount > 0 && <Badge className="ml-2 gradient-primary border-0 text-xs text-primary-foreground">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="mt-4 space-y-4">
            {received.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center py-12"><MessageSquare className="h-12 w-12 text-muted-foreground" /><p className="mt-3 text-muted-foreground">No enquiries received yet</p></CardContent></Card>
            ) : received.map((e) => (
              <Card key={e.id} className={e.status === "unread" ? "border-primary/30" : ""}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display font-semibold text-card-foreground">
                        {e.car_listings?.title || `${e.car_listings?.year} ${e.car_listings?.make} ${e.car_listings?.model}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        From: {e.sender_name || "Anonymous"} {e.sender_email && `· ${e.sender_email}`}
                      </p>
                      <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
                    </div>
                    <Badge variant={e.status === "unread" ? "default" : e.status === "replied" ? "secondary" : "outline"}>{e.status}</Badge>
                  </div>
                  <p className="mt-3 rounded-lg bg-muted p-3 text-sm text-foreground">{e.message}</p>

                  {e.reply && (
                    <div className="mt-3 rounded-lg border border-success/20 bg-success/5 p-3">
                      <p className="text-xs font-medium text-success">Your Reply</p>
                      <p className="mt-1 text-sm text-foreground">{e.reply}</p>
                    </div>
                  )}

                  {!e.reply && (
                    <div className="mt-3 flex gap-2">
                      {e.status === "unread" && <Button size="sm" variant="ghost" onClick={() => markRead(e.id)}>Mark Read</Button>}
                      <div className="flex flex-1 gap-2">
                        <Textarea
                          value={replyText[e.id] || ""}
                          onChange={(ev) => setReplyText((p) => ({ ...p, [e.id]: ev.target.value }))}
                          placeholder="Type your reply..."
                          rows={2}
                          className="flex-1"
                        />
                        <Button size="sm" className="gradient-primary border-0 self-end" onClick={() => handleReply(e.id)} disabled={replyingId === e.id}>
                          {replyingId === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="sent" className="mt-4 space-y-4">
            {sent.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center py-12"><Mail className="h-12 w-12 text-muted-foreground" /><p className="mt-3 text-muted-foreground">No enquiries sent yet</p></CardContent></Card>
            ) : sent.map((e) => (
              <Card key={e.id}>
                <CardContent className="p-5">
                  <p className="font-display font-semibold text-card-foreground">
                    {e.car_listings?.title || "Listing"}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
                  <p className="mt-3 rounded-lg bg-muted p-3 text-sm text-foreground">{e.message}</p>
                  {e.reply && (
                    <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <p className="text-xs font-medium text-primary">Seller's Reply</p>
                      <p className="mt-1 text-sm text-foreground">{e.reply}</p>
                    </div>
                  )}
                  <Badge variant="outline" className="mt-2">{e.status}</Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Inbox;

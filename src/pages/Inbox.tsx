import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Mail, Loader2, Send, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ChatWindow from "@/components/ChatWindow";

interface Conversation {
  conversationId: string;
  recipientId: string;
  recipientName: string;
  listingTitle: string;
  lastMessage: string;
  lastAt: string;
  unreadCount: number;
}

const Inbox = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [received, setReceived] = useState<any[]>([]);
  const [sent, setSent] = useState<any[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);
  const [tab, setTab] = useState("messages");

  // Auto-open chat from sessionStorage (e.g. from CarDetail page)
  useEffect(() => {
    const stored = sessionStorage.getItem("openChat");
    if (stored) {
      sessionStorage.removeItem("openChat");
      try {
        const chatInfo = JSON.parse(stored);
        setActiveChat({
          conversationId: chatInfo.conversationId,
          recipientId: chatInfo.recipientId,
          recipientName: chatInfo.recipientName,
          listingTitle: chatInfo.listingTitle,
          lastMessage: "",
          lastAt: "",
          unreadCount: 0,
        });
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchAll = async () => {
      // Fetch enquiries
      const [receivedRes, sentRes] = await Promise.all([
        supabase.from("enquiries").select("*, car_listings(title, make, model, year)").eq("seller_id", user.id).order("created_at", { ascending: false }),
        supabase.from("enquiries").select("*, car_listings(title, make, model, year)").eq("sender_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (receivedRes.data) setReceived(receivedRes.data);
      if (sentRes.data) setSent(sentRes.data);

      // Fetch conversations from messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (msgs) {
        const convMap = new Map<string, any[]>();
        msgs.forEach((m: any) => {
          if (!convMap.has(m.conversation_id)) convMap.set(m.conversation_id, []);
          convMap.get(m.conversation_id)!.push(m);
        });

        // Get all unique user IDs we need profiles for
        const userIds = new Set<string>();
        msgs.forEach((m: any) => {
          if (m.sender_id !== user.id) userIds.add(m.sender_id);
          if (m.recipient_id !== user.id) userIds.add(m.recipient_id);
        });

        // Fetch profiles
        const profileMap: Record<string, string> = {};
        if (userIds.size > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, full_name")
            .in("user_id", Array.from(userIds));
          profiles?.forEach((p) => {
            profileMap[p.user_id] = p.full_name || "User";
          });
        }

        const convList: Conversation[] = [];
        convMap.forEach((messages, convId) => {
          const lastMsg = messages[0];
          const otherUserId = lastMsg.sender_id === user.id ? lastMsg.recipient_id : lastMsg.sender_id;
          const unread = messages.filter((m: any) => m.recipient_id === user.id && !m.read).length;

          // Extract listing title from conversation_id format: "listing_id:user1:user2"
          const parts = convId.split(":");
          const listingTitle = parts.length > 0 ? "" : "";

          convList.push({
            conversationId: convId,
            recipientId: otherUserId,
            recipientName: profileMap[otherUserId] || "User",
            listingTitle,
            lastMessage: lastMsg.content,
            lastAt: lastMsg.created_at,
            unreadCount: unread,
          });
        });

        convList.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
        setConversations(convList);
      }

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

    // Realtime for new messages
    const msgChannel = supabase
      .channel("messages-inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as any;
        if (msg.sender_id !== user.id && msg.recipient_id === user.id) {
          toast({ title: "New message received!" });
          // Update conversations
          setConversations((prev) => {
            const existing = prev.find((c) => c.conversationId === msg.conversation_id);
            if (existing) {
              return prev.map((c) =>
                c.conversationId === msg.conversation_id
                  ? { ...c, lastMessage: msg.content, lastAt: msg.created_at, unreadCount: c.unreadCount + 1 }
                  : c
              ).sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
            }
            return prev;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(msgChannel);
    };
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

  const startChat = (enquiry: any) => {
    if (!user) return;
    const otherId = enquiry.seller_id === user.id ? enquiry.sender_id : enquiry.seller_id;
    const ids = [user.id, otherId].sort();
    const conversationId = `${enquiry.listing_id}:${ids[0]}:${ids[1]}`;
    const otherName = enquiry.sender_name || "User";
    const title = enquiry.car_listings?.title || "Listing";

    setActiveChat({
      conversationId,
      recipientId: otherId,
      recipientName: otherName,
      listingTitle: title,
      lastMessage: "",
      lastAt: "",
      unreadCount: 0,
    });
    setTab("messages");
  };

  const unreadCount = received.filter((e) => e.status === "unread").length;
  const totalUnreadMessages = conversations.reduce((s, c) => s + c.unreadCount, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </div>
    );
  }

  // If chat is active, show full-screen chat
  if (activeChat) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto max-w-3xl px-4 py-4">
          <Card className="h-[calc(100vh-180px)] overflow-hidden">
            <ChatWindow
              conversationId={activeChat.conversationId}
              recipientId={activeChat.recipientId}
              recipientName={activeChat.recipientName}
              listingTitle={activeChat.listingTitle}
              onBack={() => setActiveChat(null)}
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold text-foreground md:text-3xl">Inbox</h1>
        <p className="text-muted-foreground">Manage your enquiries and messages</p>

        <Tabs value={tab} onValueChange={setTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="received">
              Enquiries {unreadCount > 0 && <Badge className="ml-2 gradient-primary border-0 text-xs text-primary-foreground">{unreadCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="messages">
              Messages {totalUnreadMessages > 0 && <Badge className="ml-2 gradient-primary border-0 text-xs text-primary-foreground">{totalUnreadMessages}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>

          {/* Received Enquiries */}
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
                    <div className="flex items-center gap-2">
                      <Badge variant={e.status === "unread" ? "default" : e.status === "replied" ? "secondary" : "outline"}>{e.status}</Badge>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startChat(e)} title="Open chat">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
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

          {/* Real-time Messages */}
          <TabsContent value="messages" className="mt-4 space-y-3">
            {conversations.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-12">
                  <MessageCircle className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-3 text-muted-foreground">No conversations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start a chat from an enquiry or listing page</p>
                </CardContent>
              </Card>
            ) : conversations.map((conv) => (
              <Card
                key={conv.conversationId}
                className={`cursor-pointer transition-colors hover:border-primary/30 ${conv.unreadCount > 0 ? "border-primary/30" : ""}`}
                onClick={() => setActiveChat(conv)}
              >
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {conv.recipientName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-display font-semibold text-card-foreground truncate">{conv.recipientName}</p>
                      <span className="text-xs text-muted-foreground shrink-0 ml-2">
                        {new Date(conv.lastAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">{conv.lastMessage}</p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <Badge className="gradient-primary border-0 text-xs text-primary-foreground shrink-0">{conv.unreadCount}</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Sent Enquiries */}
          <TabsContent value="sent" className="mt-4 space-y-4">
            {sent.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center py-12"><Mail className="h-12 w-12 text-muted-foreground" /><p className="mt-3 text-muted-foreground">No enquiries sent yet</p></CardContent></Card>
            ) : sent.map((e) => (
              <Card key={e.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-display font-semibold text-card-foreground">{e.car_listings?.title || "Listing"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString()}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startChat(e)} title="Open chat">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
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
      <Footer />
    </div>
  );
};

export default Inbox;

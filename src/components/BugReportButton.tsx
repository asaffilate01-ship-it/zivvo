import { useState } from "react";
import { Bug, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const BugReportButton = () => {
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("medium");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!description.trim()) return;
    setLoading(true);
    const { error } = await supabase.from("bug_reports" as any).insert({
      user_id: user?.id || null,
      page_url: window.location.href,
      description: description.trim(),
      severity,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Failed to submit report", variant: "destructive" });
    } else {
      toast({ title: "Bug reported!", description: "Thank you for helping us improve." });
      setDescription("");
      setSeverity("medium");
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-transform hover:scale-110"
        aria-label="Report a bug"
      >
        <Bug className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-20 right-6 z-50 w-80 rounded-xl border border-border bg-card p-5 shadow-elevated"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-card-foreground">Report a Bug</h3>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Severity</Label>
                <Select value={severity} onValueChange={setSeverity}>
                  <SelectTrigger className="mt-1 h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">What went wrong?</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the issue..."
                  rows={3}
                  className="mt-1"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">Page: {window.location.pathname}</p>
              <Button
                onClick={handleSubmit}
                disabled={loading || !description.trim()}
                size="sm"
                className="w-full gradient-primary border-0"
              >
                <Send className="mr-1 h-3.5 w-3.5" />
                {loading ? "Sending..." : "Submit Report"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default BugReportButton;

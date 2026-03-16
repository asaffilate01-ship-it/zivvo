import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Bookmark, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SaveSearchDialogProps {
  filters: Record<string, any>;
}

const SaveSearchDialog = ({ filters }: SaveSearchDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [notify, setNotify] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("saved_searches").insert({
      user_id: user.id,
      name: name.trim(),
      filters,
      notify,
    });
    if (error) {
      toast({ title: "Error saving search", variant: "destructive" });
    } else {
      toast({ title: "Search saved!" });
      setOpen(false);
      setName("");
      setNotify(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Bookmark className="h-4 w-4" /> Save Search
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Save This Search</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. BMW under £20k" />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-sm">Notify me of new matches</Label>
            <Switch checked={notify} onCheckedChange={setNotify} />
          </div>
          <Button onClick={handleSave} className="w-full gradient-primary border-0" disabled={saving || !name.trim()}>
            {saving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Save Search
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SaveSearchDialog;

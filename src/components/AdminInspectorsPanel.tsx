import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Trash2, Shield } from "lucide-react";

interface InspectorRow {
  user_id: string;
  full_name: string | null;
  email?: string | null;
  coverage_areas?: string[] | null;
  qualifications?: string | null;
  is_active?: boolean | null;
  has_profile: boolean;
}

const AdminInspectorsPanel = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inspectors, setInspectors] = useState<InspectorRow[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ user_id: string; full_name: string | null }[]>([]);
  const [searching, setSearching] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "inspector");

    const ids = (roles || []).map((r: any) => r.user_id);
    if (ids.length === 0) {
      setInspectors([]);
      setLoading(false);
      return;
    }

    const [{ data: profs }, { data: insProfs }] = await Promise.all([
      supabase.from("profiles_public").select("user_id, full_name").in("user_id", ids),
      supabase.from("inspector_profiles").select("user_id, coverage_areas, qualifications, is_active").in("user_id", ids),
    ]);

    const merged: InspectorRow[] = ids.map((id) => {
      const p = profs?.find((x: any) => x.user_id === id);
      const ip: any = insProfs?.find((x: any) => x.user_id === id);
      return {
        user_id: id,
        full_name: p?.full_name ?? null,
        coverage_areas: ip?.coverage_areas ?? null,
        qualifications: ip?.qualifications ?? null,
        is_active: ip?.is_active ?? null,
        has_profile: !!ip,
      };
    });
    setInspectors(merged);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    const { data } = await supabase
      .from("profiles_public")
      .select("user_id, full_name")
      .ilike("full_name", `%${search.trim()}%`)
      .limit(10);
    setSearchResults(data || []);
    setSearching(false);
  };

  const grantInspector = async (userId: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "inspector" });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Inspector role granted" });
    setSearch("");
    setSearchResults([]);
    load();
  };

  const revokeInspector = async (userId: string) => {
    if (!confirm("Revoke inspector role for this user?")) return;
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "inspector");
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Inspector role revoked" });
    load();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" /> Grant Inspector Role
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Search users by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((u) => (
                <div key={u.user_id} className="flex items-center justify-between rounded-md border p-2">
                  <div>
                    <p className="text-sm font-medium">{u.full_name || "Unnamed"}</p>
                    <p className="text-xs text-muted-foreground">{u.user_id}</p>
                  </div>
                  <Button size="sm" onClick={() => grantInspector(u.user_id)}>
                    Grant
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" /> Active Inspectors ({inspectors.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : inspectors.length === 0 ? (
            <p className="text-sm text-muted-foreground">No inspectors yet. Grant the role above.</p>
          ) : (
            <div className="space-y-2">
              {inspectors.map((i) => (
                <div key={i.user_id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{i.full_name || "Unnamed"}</p>
                      {i.has_profile ? (
                        i.is_active ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )
                      ) : (
                        <Badge variant="outline">Not onboarded</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{i.user_id}</p>
                    {i.coverage_areas && i.coverage_areas.length > 0 && (
                      <p className="mt-1 text-xs">
                        <span className="text-muted-foreground">Coverage:</span> {i.coverage_areas.join(", ")}
                      </p>
                    )}
                    {i.qualifications && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{i.qualifications}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => revokeInspector(i.user_id)}
                    aria-label="Revoke"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminInspectorsPanel;

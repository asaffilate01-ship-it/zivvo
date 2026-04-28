import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ChevronLeft, Save, Upload, FileText, Camera, CheckCircle2, XCircle, AlertTriangle, MinusCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { INSPECTION_CHECKLIST, calculateScore, ChecklistData, CheckResult, TOTAL_POINTS } from "@/lib/inspectionChecklist";

const InspectorJob = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [scorecard, setScorecard] = useState<any>(null);
  const [data, setData] = useState<ChecklistData>({});
  const [overallNotes, setOverallNotes] = useState("");
  const [recommendation, setRecommendation] = useState("");
  const [activeTab, setActiveTab] = useState(INSPECTION_CHECKLIST[0].id);

  const load = async () => {
    if (!id || !user) return;
    setLoading(true);
    const { data: bk } = await supabase
      .from("inspection_bookings")
      .select("*, car_listings(title, make, model, year, registration, mileage, vin, location)")
      .eq("id", id).maybeSingle();
    setBooking(bk);

    let { data: sc } = await supabase
      .from("inspection_scorecards")
      .select("*").eq("booking_id", id).maybeSingle();

    if (!sc && bk?.inspector_id === user.id) {
      const { data: created } = await supabase.from("inspection_scorecards").insert({
        booking_id: id, inspector_id: user.id, checklist: {}, total_points: TOTAL_POINTS,
      }).select().single();
      sc = created;
      // Mark booking in_progress
      await supabase.from("inspection_bookings").update({ status: "in_progress" }).eq("id", id);
    }

    if (sc) {
      setScorecard(sc);
      setData((sc.checklist as ChecklistData) || {});
      setOverallNotes(sc.overall_notes || "");
      setRecommendation(sc.recommendation || "");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id, user]);

  const liveScore = useMemo(() => calculateScore(data), [data]);

  const setItem = (itemId: string, partial: Partial<{ result: CheckResult; notes: string; photo_url: string }>) => {
    setData((prev) => ({ ...prev, [itemId]: { result: prev[itemId]?.result || "pass", ...prev[itemId], ...partial } }));
  };

  const uploadPhoto = async (itemId: string, file: File) => {
    if (!user) return;
    const path = `${user.id}/${id}/${itemId}-${Date.now()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("inspection-photos").upload(path, file);
    if (error) { toast({ title: "Upload failed", description: error.message, variant: "destructive" }); return; }
    setItem(itemId, { photo_url: path });
    toast({ title: "Photo attached" });
  };

  const saveDraft = async () => {
    if (!scorecard) return;
    setSaving(true);
    const { score, total, grade } = calculateScore(data);
    await supabase.from("inspection_scorecards").update({
      checklist: data, overall_notes: overallNotes, recommendation, score, total_points: total, grade,
    }).eq("id", scorecard.id);
    setSaving(false);
    toast({ title: "Draft saved" });
  };

  const submit = async () => {
    if (!scorecard || !booking) return;
    // Require at least 80% of items rated
    const totalItems = INSPECTION_CHECKLIST.reduce((a, s) => a + s.items.length, 0);
    const ratedItems = Object.values(data).filter((d) => d.result).length;
    if (ratedItems / totalItems < 0.8) {
      toast({ title: "Incomplete", description: `Rate at least 80% of items (${ratedItems}/${totalItems} done)`, variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { score, total, grade } = calculateScore(data);
      await supabase.from("inspection_scorecards").update({
        checklist: data, overall_notes: overallNotes, recommendation, score, total_points: total, grade,
        submitted_at: new Date().toISOString(),
      }).eq("id", scorecard.id);

      // Generate PDF via edge function
      const { data: pdfRes, error: pdfErr } = await supabase.functions.invoke("generate-inspection-pdf", {
        body: { booking_id: booking.id, scorecard_id: scorecard.id },
      });
      if (pdfErr) throw pdfErr;

      toast({ title: "Inspection submitted", description: `Score: ${score}/${total} (Grade ${grade})` });
      navigate("/inspector");
    } catch (e: any) {
      toast({ title: "Submission failed", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background"><Navbar /><div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></div>;

  if (!booking) return <div className="min-h-screen bg-background"><Navbar /><div className="container mx-auto px-4 py-8">Job not found.</div></div>;

  const isCompleted = booking.status === "completed";
  const car = booking.car_listings;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-4 max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="mb-3">
          <Link to="/inspector"><ChevronLeft className="w-4 h-4 mr-1" /> Back to jobs</Link>
        </Button>

        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-bold">{car?.year} {car?.make} {car?.model}</h1>
                <p className="text-sm text-muted-foreground">{car?.registration} · {car?.mileage?.toLocaleString()} miles · {car?.location}</p>
                <Badge className="mt-2">{booking.inspection_type === "premium_300" ? "Premium 300pt" : "Standard 200pt"}</Badge>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">{liveScore.score}<span className="text-base text-muted-foreground">/{liveScore.total}</span></div>
                <p className="text-xs text-muted-foreground">Live score · Grade {liveScore.grade}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="overflow-x-auto -mx-4 px-4 mb-3">
            <TabsList className="w-max">
              {INSPECTION_CHECKLIST.map((s) => {
                const sectionItems = s.items;
                const done = sectionItems.filter((i) => data[i.id]?.result).length;
                return (
                  <TabsTrigger key={s.id} value={s.id} className="text-xs">
                    {s.icon} {s.title}
                    <Badge variant="outline" className="ml-2 text-[10px] py-0 px-1">{done}/{sectionItems.length}</Badge>
                  </TabsTrigger>
                );
              })}
              <TabsTrigger value="summary" className="text-xs">📝 Summary</TabsTrigger>
            </TabsList>
          </div>

          {INSPECTION_CHECKLIST.map((section) => (
            <TabsContent key={section.id} value={section.id}>
              <Card>
                <CardHeader><CardTitle className="text-base">{section.icon} {section.title}</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {section.items.map((item) => {
                    const entry = data[item.id] || { result: undefined as any };
                    return (
                      <div key={item.id} className="border rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{item.label}</p>
                            <p className="text-[10px] text-muted-foreground">{item.points} pt{item.points > 1 ? "s" : ""}</p>
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {(["pass", "advisory", "fail", "na"] as CheckResult[]).map((r) => {
                              const Icon = r === "pass" ? CheckCircle2 : r === "advisory" ? AlertTriangle : r === "fail" ? XCircle : MinusCircle;
                              const colorClass = r === "pass" ? "bg-success/20 text-success border-success" : r === "advisory" ? "bg-warning/20 text-warning border-warning" : r === "fail" ? "bg-destructive/20 text-destructive border-destructive" : "bg-muted text-muted-foreground";
                              const active = entry.result === r;
                              return (
                                <button
                                  key={r}
                                  type="button"
                                  disabled={isCompleted}
                                  onClick={() => setItem(item.id, { result: r })}
                                  className={`px-2 py-1 rounded border text-xs flex items-center gap-1 transition ${active ? colorClass : "bg-background hover:bg-muted/50"}`}
                                >
                                  <Icon className="w-3 h-3" /> {r.toUpperCase()}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        {(entry.result === "advisory" || entry.result === "fail") && (
                          <div className="space-y-2 mt-2">
                            <Textarea
                              placeholder="Notes / details..."
                              value={entry.notes || ""}
                              disabled={isCompleted}
                              onChange={(e) => setItem(item.id, { notes: e.target.value })}
                              rows={2}
                              className="text-sm"
                            />
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`photo-${item.id}`} className="cursor-pointer flex items-center gap-1 text-xs text-primary">
                                <Camera className="w-4 h-4" /> {entry.photo_url ? "Replace photo" : "Add photo"}
                              </Label>
                              <input
                                id={`photo-${item.id}`}
                                type="file"
                                accept="image/*"
                                capture="environment"
                                disabled={isCompleted}
                                className="hidden"
                                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(item.id, f); }}
                              />
                              {entry.photo_url && <span className="text-xs text-success">✓ Attached</span>}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </TabsContent>
          ))}

          <TabsContent value="summary">
            <Card>
              <CardHeader><CardTitle>Summary & recommendation</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Overall notes for buyer</Label>
                  <Textarea rows={4} value={overallNotes} disabled={isCompleted} onChange={(e) => setOverallNotes(e.target.value)} />
                </div>
                <div>
                  <Label>Buying recommendation</Label>
                  <Textarea rows={3} value={recommendation} disabled={isCompleted} onChange={(e) => setRecommendation(e.target.value)} placeholder="e.g. Recommended subject to advisories listed above..." />
                </div>
                <div className="bg-muted/50 p-3 rounded text-sm">
                  <strong>Final score:</strong> {liveScore.score}/{liveScore.total} (Grade {liveScore.grade})
                </div>
                {scorecard?.pdf_url && (
                  <Button variant="outline" asChild className="w-full">
                    <a href={`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/authenticated/listing-documents/${scorecard.pdf_url}`} target="_blank" rel="noopener noreferrer">
                      <FileText className="w-4 h-4 mr-2" /> View report PDF
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {!isCompleted && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 z-40">
            <div className="container mx-auto max-w-3xl flex gap-2">
              <Button variant="outline" onClick={saveDraft} disabled={saving} className="flex-1">
                {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} Save draft
              </Button>
              <Button onClick={submit} disabled={submitting} className="flex-1">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />} Submit & generate PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InspectorJob;

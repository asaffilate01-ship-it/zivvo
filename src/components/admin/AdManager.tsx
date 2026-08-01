import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import SponsoredAdCard, { type ManualAd } from "@/components/SponsoredAdCard";

const STORAGE_KEY = "zivvo_manual_ad";

const AdManager = () => {
  const [imageUrl, setImageUrl] = useState("");
  const [href, setHref] = useState("");
  const [alt, setAlt] = useState("");
  const [html, setHtml] = useState("");
  const [preview, setPreview] = useState<ManualAd | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ManualAd;
        setImageUrl(parsed.imageUrl ?? "");
        setHref(parsed.href ?? "");
        setAlt(parsed.alt ?? "");
        setHtml(parsed.html ?? "");
        setPreview(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const save = (mode: "image" | "html") => {
    const ad: ManualAd =
      mode === "image"
        ? { imageUrl: imageUrl.trim(), href: href.trim() || undefined, alt: alt.trim() || undefined }
        : { html: html.trim() };
    if (mode === "image" && !ad.imageUrl) return toast.error("Image URL is required");
    if (mode === "html" && !ad.html) return toast.error("HTML snippet is required");
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ad));
    setPreview(ad);
    toast.success("Sponsored ad saved (this browser)");
  };

  const clear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setImageUrl("");
    setHref("");
    setAlt("");
    setHtml("");
    setPreview(undefined);
    toast.success("Sponsored ad cleared");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sponsored Ad Slot</CardTitle>
        <CardDescription>
          Manage the manual ad shown as the 5th card on the Browse results page. Stored per-browser
          (localStorage) — for a global rollout, wire this to a database table later.
          Manual ads take priority over Google AdSense.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="image">
          <TabsList>
            <TabsTrigger value="image">Image + Link</TabsTrigger>
            <TabsTrigger value="html">HTML Snippet</TabsTrigger>
          </TabsList>

          <TabsContent value="image" className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label>Image URL</Label>
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://cdn.example.com/banner.jpg"
              />
            </div>
            <div className="space-y-1">
              <Label>Click-through URL (optional)</Label>
              <Input
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="https://sponsor.example.com"
              />
            </div>
            <div className="space-y-1">
              <Label>Alt text (optional)</Label>
              <Input value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="Sponsor" />
            </div>
            <Button onClick={() => save("image")}>Save image ad</Button>
          </TabsContent>

          <TabsContent value="html" className="mt-4 space-y-3">
            <div className="space-y-1">
              <Label>HTML / Script snippet (Media.net, affiliate, direct)</Label>
              <Textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                placeholder={`<a href="..."><img src="..." /></a>`}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Only paste snippets from trusted ad networks — this renders raw HTML.
              </p>
            </div>
            <Button onClick={() => save("html")}>Save HTML ad</Button>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            {preview ? "Ad is live in this browser." : "No manual ad set — falls back to AdSense/placeholder."}
          </div>
          <Button variant="outline" onClick={clear} disabled={!preview}>
            Clear ad
          </Button>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium">Preview</div>
          <div className="max-w-sm">
            <SponsoredAdCard manualAd={preview} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdManager;

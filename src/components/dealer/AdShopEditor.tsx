import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Image as ImageIcon, Download, Wand2, Share2, Facebook } from "lucide-react";
import { openExternalUrl } from "@/lib/safeNavigation";

interface Props { dealerId: string; logoUrl?: string | null; businessName: string; }

interface Listing { id: string; title: string; images: string[]; price: number; }

const AdShopEditor = ({ dealerId, logoUrl, businessName }: Props) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [imageIdx, setImageIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState({
    showLogo: true,
    logoSize: 120,
    showPrice: true,
    showBanner: false,
    bannerText: "SOLD",
    bannerColor: "#dc2626",
    watermarkOpacity: 90,
  });

  useEffect(() => {
    if (!dealerId) return;
    supabase.from("car_listings").select("id,title,images,price").eq("dealer_id", dealerId).limit(50).then(({ data }) => {
      setListings((data as any)?.filter((l: Listing) => l.images?.length > 0) || []);
    });
  }, [dealerId]);

  const renderPreview = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !selected || !selected.images[imageIdx]) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = selected.images[imageIdx];
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; }).catch(() => {});

    canvas.width = img.naturalWidth || 1200;
    canvas.height = img.naturalHeight || 800;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Price tag
    if (config.showPrice) {
      const price = `€${Number(selected.price).toLocaleString()}`;
      ctx.font = `bold ${Math.round(canvas.height * 0.06)}px Inter, sans-serif`;
      const padding = 24;
      const m = ctx.measureText(price);
      const w = m.width + padding * 2;
      const h = Math.round(canvas.height * 0.09);
      ctx.fillStyle = "rgba(15,23,42,0.92)";
      ctx.fillRect(canvas.width - w - 30, canvas.height - h - 30, w, h);
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      ctx.fillText(price, canvas.width - w - 30 + padding, canvas.height - h / 2 - 30);
    }

    // Business name watermark
    if (config.showLogo && businessName) {
      ctx.font = `bold ${Math.round(canvas.height * 0.035)}px Inter, sans-serif`;
      ctx.fillStyle = `rgba(255,255,255,${config.watermarkOpacity / 100})`;
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 8;
      ctx.textBaseline = "top";
      ctx.fillText(businessName, 30, 30);
      ctx.shadowBlur = 0;
    }

    // SOLD/RESERVED banner
    if (config.showBanner) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 8);
      ctx.fillStyle = config.bannerColor;
      const bw = canvas.width * 0.9;
      const bh = canvas.height * 0.18;
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      ctx.fillStyle = "#fff";
      ctx.font = `bold ${Math.round(bh * 0.55)}px Inter, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.bannerText, 0, 0);
      ctx.restore();
    }
  }, [businessName, config, imageIdx, selected]);

  useEffect(() => { if (open) void renderPreview(); }, [open, renderPreview]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${selected?.title || "ad"}-${Date.now()}.jpg`; a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Image downloaded" });
    }, "image/jpeg", 0.9);
  };

  const shareFacebook = () => {
    if (!selected) return;
    const url = `${window.location.origin}/car/${selected.id}`;
    openExternalUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "width=600,height=600");
  };

  const shareGoogle = () => {
    if (!selected) return;
    const url = `${window.location.origin}/car/${selected.id}`;
    const text = `${selected.title} — €${Number(selected.price).toLocaleString()}`;
    navigator.clipboard.writeText(`${text}\n${url}`);
    toast({ title: "Copied for Google Business", description: "Paste into your Google Business Profile post." });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5" /> Ad Shop & AutoPost</CardTitle>
        <p className="text-xs text-muted-foreground">Add your dealer watermark, price tags and SOLD banners to listing photos. One-click share to Facebook & Google.</p>
      </CardHeader>
      <CardContent>
        {listings.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center"><ImageIcon className="h-10 w-10 text-muted-foreground" /><p className="mt-2 text-sm text-muted-foreground">No listings with photos yet</p></div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {listings.slice(0, 12).map(l => (
                <button key={l.id} className="group relative overflow-hidden rounded-lg border border-border hover:border-primary" onClick={() => { setSelected(l); setImageIdx(0); setOpen(true); }}>
                  <img src={l.images[0]} alt={l.title} className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 text-left">
                    <p className="text-xs font-medium text-white truncate">{l.title}</p>
                    <p className="text-xs text-white/80">€{Number(l.price).toLocaleString()}</p>
                  </div>
                </button>
              ))}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className="max-h-[95vh] overflow-y-auto sm:max-w-5xl">
                <DialogHeader><DialogTitle>Edit Ad — {selected?.title}</DialogTitle></DialogHeader>
                <div className="grid gap-4 lg:grid-cols-[1fr,280px]">
                  <div className="rounded-lg bg-muted/30 p-2">
                    <canvas ref={canvasRef} className="h-auto w-full max-h-[60vh] object-contain" />
                    {selected && selected.images.length > 1 && (
                      <div className="mt-2 flex gap-1 overflow-x-auto">
                        {selected.images.map((src, i) => (
                          <button key={i} onClick={() => setImageIdx(i)} className={`shrink-0 overflow-hidden rounded border-2 ${i === imageIdx ? "border-primary" : "border-transparent"}`}>
                            <img src={src} className="h-12 w-16 object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between"><Label className="text-sm">Show Watermark</Label><input type="checkbox" checked={config.showLogo} onChange={e => setConfig({ ...config, showLogo: e.target.checked })} /></div>
                    <div><Label className="text-xs">Watermark opacity {config.watermarkOpacity}%</Label><Slider value={[config.watermarkOpacity]} onValueChange={v => setConfig({ ...config, watermarkOpacity: v[0] })} max={100} step={5} /></div>
                    <div className="flex items-center justify-between"><Label className="text-sm">Show Price Tag</Label><input type="checkbox" checked={config.showPrice} onChange={e => setConfig({ ...config, showPrice: e.target.checked })} /></div>
                    <div className="flex items-center justify-between"><Label className="text-sm">Show Banner</Label><input type="checkbox" checked={config.showBanner} onChange={e => setConfig({ ...config, showBanner: e.target.checked })} /></div>
                    {config.showBanner && (
                      <>
                        <div>
                          <Label className="text-xs">Banner Text</Label>
                          <Select value={config.bannerText} onValueChange={v => setConfig({ ...config, bannerText: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SOLD">SOLD</SelectItem>
                              <SelectItem value="RESERVED">RESERVED</SelectItem>
                              <SelectItem value="REDUCED">REDUCED</SelectItem>
                              <SelectItem value="NEW IN">NEW IN</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label className="text-xs">Banner Color</Label><Input type="color" value={config.bannerColor} onChange={e => setConfig({ ...config, bannerColor: e.target.value })} className="h-10" /></div>
                      </>
                    )}
                    <div className="space-y-2 border-t border-border pt-3">
                      <Button onClick={download} className="w-full gradient-primary border-0"><Download className="mr-1 h-4 w-4" /> Download Image</Button>
                      <Button onClick={shareFacebook} variant="outline" className="w-full"><Facebook className="mr-1 h-4 w-4" /> Share to Facebook</Button>
                      <Button onClick={shareGoogle} variant="outline" className="w-full"><Share2 className="mr-1 h-4 w-4" /> Copy for Google Business</Button>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AdShopEditor;

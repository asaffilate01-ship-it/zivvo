import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Camera, Video, Maximize2, X, Play, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type MediaTab = "photos" | "video";

interface MediaGalleryProps {
  images: string[];
  videoUrl?: string | null;
  title: string;
  badges?: React.ReactNode;
}

const MediaGallery = ({ images, videoUrl, title, badges }: MediaGalleryProps) => {
  const [tab, setTab] = useState<MediaTab>("photos");
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);

  const safeImages = images.length > 0 ? images : ["https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80"];

  const prev = useCallback(() => setCurrent((p) => (p === 0 ? safeImages.length - 1 : p - 1)), [safeImages.length]);
  const next = useCallback(() => setCurrent((p) => (p === safeImages.length - 1 ? 0 : p + 1)), [safeImages.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, prev, next]);

  const tabs: { id: MediaTab; label: string; icon: typeof Camera; show: boolean }[] = [
    { id: "photos", label: `Photos (${safeImages.length})`, icon: Camera, show: true },
    { id: "video", label: "Video tour", icon: Video, show: !!videoUrl },
  ];

  return (
    <div>
      {/* Tabs */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-muted/40 p-1">
          {tabs
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  tab === t.id
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
        </div>
        {tab === "photos" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setOpen(true)}
            className="h-8 gap-1.5 text-xs"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            View fullscreen
          </Button>
        )}
      </div>

      {/* Main media */}
      <div className="relative overflow-hidden rounded-2xl bg-muted">
        {tab === "photos" ? (
          <div className="relative cursor-zoom-in" onClick={() => setOpen(true)}>
            <AnimatePresence mode="wait">
              <motion.img
                key={current}
                initial={{ opacity: 0, scale: 1.02 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                src={safeImages[current]}
                alt={`${title} — Image ${current + 1}`}
                className="aspect-[16/10] w-full object-cover"
              />
            </AnimatePresence>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-foreground/30 via-transparent to-foreground/10" />

            {safeImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-background/85 backdrop-blur-sm hover:bg-background"
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-background/85 backdrop-blur-sm hover:bg-background"
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
                <div className="absolute bottom-3 right-3 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
                  <ImageIcon className="mr-1 inline h-3 w-3" />
                  {current + 1} / {safeImages.length}
                </div>
              </>
            )}

            {badges && <div className="absolute left-3 top-3 flex flex-wrap gap-2">{badges}</div>}
          </div>
        ) : videoUrl ? (
          <div className="aspect-[16/10] w-full">
            {videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
              <iframe
                src={videoUrl.replace("watch?v=", "embed/")}
                title={`${title} — video tour`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video src={videoUrl} controls poster={safeImages[0]} className="h-full w-full bg-foreground object-contain">
                <track kind="captions" />
              </video>
            )}
          </div>
        ) : null}
      </div>

      {/* Thumbnails */}
      {tab === "photos" && safeImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {safeImages.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                i === current
                  ? "border-primary opacity-100 ring-1 ring-primary/30"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
              aria-label={`Show image ${i + 1}`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
          {videoUrl && (
            <button
              type="button"
              onClick={() => setTab("video")}
              className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 border-transparent bg-foreground/80 text-background hover:bg-foreground"
              aria-label="Play video tour"
            >
              <Play className="h-5 w-5" />
              <span className="absolute bottom-1 left-1 right-1 truncate text-[9px] font-medium">Video</span>
            </button>
          )}
        </div>
      )}

      {/* Fullscreen lightbox */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/95 backdrop-blur-md"
            onClick={() => setOpen(false)}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 text-background hover:bg-background/20"
              onClick={() => setOpen(false)}
              aria-label="Close gallery"
            >
              <X className="h-6 w-6" />
            </Button>

            <Badge variant="outline" className="absolute left-1/2 top-4 -translate-x-1/2 border-background/30 bg-background/10 text-background">
              {current + 1} / {safeImages.length}
            </Badge>

            <motion.img
              key={current}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              src={safeImages[current]}
              alt={title}
              className="max-h-[88vh] max-w-[95vw] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {safeImages.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-background/15 text-background hover:bg-background/30"
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-7 w-7" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 h-12 w-12 -translate-y-1/2 rounded-full bg-background/15 text-background hover:bg-background/30"
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  aria-label="Next"
                >
                  <ChevronRight className="h-7 w-7" />
                </Button>
                <div
                  className="absolute bottom-6 left-1/2 flex max-w-[90vw] -translate-x-1/2 gap-1.5 overflow-x-auto rounded-full bg-background/10 p-2 backdrop-blur-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  {safeImages.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrent(i)}
                      className={`h-10 w-14 shrink-0 overflow-hidden rounded transition-all ${
                        i === current ? "ring-2 ring-background" : "opacity-60 hover:opacity-100"
                      }`}
                      aria-label={`Image ${i + 1}`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MediaGallery;

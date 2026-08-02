import { useState, useRef, useCallback } from "react";
import { X, GripVertical, ImagePlus } from "lucide-react";
import { useTranslation } from "react-i18next";

interface ImageReorderProps {
  existingImages: string[];
  newPreviews: string[];
  onReorderExisting: (images: string[]) => void;
  onReorderNew: (indices: number[]) => void;
  onRemoveExisting: (index: number) => void;
  onRemoveNew: (index: number) => void;
  onAddClick: () => void;
  maxImages?: number;
}

type DragItem = { type: "existing" | "new"; index: number };

const ImageReorder = ({
  existingImages,
  newPreviews,
  onReorderExisting,
  onReorderNew,
  onRemoveExisting,
  onRemoveNew,
  onAddClick,
  maxImages = 20,
}: ImageReorderProps) => {
  const { t } = useTranslation();
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  // Build a unified list for rendering
  const allItems = [
    ...existingImages.map((src, i) => ({ type: "existing" as const, src, originalIndex: i })),
    ...newPreviews.map((src, i) => ({ type: "new" as const, src, originalIndex: i })),
  ];

  const totalImages = allItems.length;

  const handleDragStart = (e: React.DragEvent, type: "existing" | "new", index: number) => {
    setDragItem({ type, index });
    e.dataTransfer.effectAllowed = "move";
    // Store as unified index
    const unifiedIdx = type === "existing" ? index : existingImages.length + index;
    e.dataTransfer.setData("text/plain", String(unifiedIdx));
  };

  const handleDragOver = useCallback((e: React.DragEvent, unifiedIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(unifiedIndex);
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current++;
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetUnifiedIndex: number) => {
    e.preventDefault();
    dragCounter.current = 0;
    setDragOverIndex(null);
    const sourceUnifiedIndex = parseInt(e.dataTransfer.getData("text/plain"));
    if (isNaN(sourceUnifiedIndex) || sourceUnifiedIndex === targetUnifiedIndex) {
      setDragItem(null);
      return;
    }

    // Reorder the unified list
    const newOrder = [...allItems];
    const [moved] = newOrder.splice(sourceUnifiedIndex, 1);
    newOrder.splice(targetUnifiedIndex, 0, moved);

    // Split back into existing and new
    const newExisting = newOrder.filter((i) => i.type === "existing").map((i) => i.src);
    const newNewIndices = newOrder.filter((i) => i.type === "new").map((i) => i.originalIndex);

    onReorderExisting(newExisting);
    onReorderNew(newNewIndices);
    setDragItem(null);
  };

  const handleDragEnd = () => {
    setDragItem(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5" role="list" aria-label={t("productionV2.upload.imageList")}>
      {allItems.map((item, unifiedIndex) => {
        const isDragging =
          dragItem &&
          dragItem.type === item.type &&
          dragItem.index === item.originalIndex;

        return (
          <div
            key={`${item.type}-${item.originalIndex}`}
            draggable
            onDragStart={(e) => handleDragStart(e, item.type, item.originalIndex)}
            onDragOver={(e) => handleDragOver(e, unifiedIndex)}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, unifiedIndex)}
            onDragEnd={handleDragEnd}
            role="listitem"
            className={`group relative aspect-square cursor-grab overflow-hidden rounded-lg border transition-all active:cursor-grabbing ${
              isDragging
                ? "opacity-40 border-primary"
                : dragOverIndex === unifiedIndex
                ? "border-primary ring-2 ring-primary/30"
                : item.type === "new"
                ? "border-primary/30"
                : "border-border"
            }`}
          >
            <img src={item.src} alt={t("productionV2.upload.imageAlt", { number: unifiedIndex + 1 })} className="h-full w-full object-cover" />
            
            {/* Drag handle */}
            <div className="absolute left-1 top-1 rounded bg-background/80 p-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" aria-hidden="true">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </div>

            {/* Remove button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (item.type === "existing") onRemoveExisting(item.originalIndex);
                else onRemoveNew(item.originalIndex);
              }}
              className="absolute right-1 top-1 rounded-full bg-background/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
              aria-label={t("productionV2.upload.removeImage", { number: unifiedIndex + 1 })}
            >
              <X className="h-3 w-3" />
            </button>

            {/* Labels */}
            {unifiedIndex === 0 && (
              <span className="absolute bottom-1 left-1 rounded bg-primary/90 px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                {t("productionV2.upload.cover")}
              </span>
            )}
            {item.type === "new" && (
              <span className="absolute bottom-1 right-1 rounded bg-accent/90 px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                {t("common.new")}
              </span>
            )}
          </div>
        );
      })}

      {totalImages < maxImages && (
        <button
          type="button"
          onClick={onAddClick}
          className="flex aspect-square flex-col items-center justify-center rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ImagePlus className="h-6 w-6" />
          <span className="mt-1 text-xs">{t("productionV2.upload.add")}</span>
        </button>
      )}
    </div>
  );
};

export default ImageReorder;

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { key: "sourced", label: "Sourced" },
  { key: "offer_sent", label: "Offer to seller" },
  { key: "seller_accepted", label: "Seller accepted" },
  { key: "listed_to_dealers", label: "Listed" },
  { key: "dealer_accepted", label: "Dealer accepted" },
  { key: "seller_paid", label: "Seller paid" },
  { key: "completed", label: "Completed" },
] as const;

const TERMINAL_BAD = ["cancelled", "seller_rejected"];

interface Props {
  status: string;
  className?: string;
}

const ArbitragePipelineStepper = ({ status, className }: Props) => {
  if (TERMINAL_BAD.includes(status)) {
    return (
      <div className={cn("flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2", className)}>
        <X className="h-4 w-4 text-destructive" />
        <span className="text-xs font-medium text-destructive capitalize">
          {status.replace(/_/g, " ")}
        </span>
      </div>
    );
  }

  const currentIdx = STEPS.findIndex((s) => s.key === status);
  const idx = currentIdx === -1 ? 0 : currentIdx;

  return (
    <div className={cn("w-full", className)} role="list" aria-label="Deal pipeline progress">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const isDone = i < idx;
          const isCurrent = i === idx;
          return (
            <div key={step.key} className="flex flex-1 items-center last:flex-none">
              <div
                role="listitem"
                aria-current={isCurrent ? "step" : undefined}
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
                  isDone && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-primary/15 text-primary ring-2 ring-primary/20",
                  !isDone && !isCurrent && "border-border bg-muted text-muted-foreground"
                )}
                title={step.label}
              >
                {isDone ? <Check className="h-3 w-3" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px flex-1",
                    i < idx ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Step {idx + 1} of {STEPS.length} · <span className="font-medium text-foreground">{STEPS[idx].label}</span>
      </p>
    </div>
  );
};

export default ArbitragePipelineStepper;

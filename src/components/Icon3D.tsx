import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "accent" | "success" | "warning" | "info";
type Size = "sm" | "md" | "lg" | "xl";

interface Icon3DProps {
  icon: LucideIcon;
  variant?: Variant;
  size?: Size;
  className?: string;
  float?: boolean;
}

const variantBg: Record<Variant, string> = {
  primary: "from-primary to-accent",
  accent: "from-accent to-primary",
  success: "from-success to-[hsl(180_60%_42%)]",
  warning: "from-warning to-[hsl(20_92%_52%)]",
  info: "from-info to-[hsl(260_85%_60%)]",
};

const variantGlow: Record<Variant, string> = {
  primary: "shadow-[0_8px_18px_-8px_hsl(var(--primary)/0.3),inset_0_1px_0_hsl(0_0%_100%/0.18)]",
  accent: "shadow-[0_8px_18px_-8px_hsl(var(--accent)/0.3),inset_0_1px_0_hsl(0_0%_100%/0.18)]",
  success: "shadow-[0_8px_18px_-8px_hsl(var(--success)/0.3),inset_0_1px_0_hsl(0_0%_100%/0.18)]",
  warning: "shadow-[0_8px_18px_-8px_hsl(var(--warning)/0.3),inset_0_1px_0_hsl(0_0%_100%/0.18)]",
  info: "shadow-[0_8px_18px_-8px_hsl(var(--info)/0.3),inset_0_1px_0_hsl(0_0%_100%/0.18)]",
};

const sizeClasses: Record<Size, { wrap: string; icon: string; radius: string }> = {
  sm: { wrap: "h-9 w-9", icon: "h-4 w-4", radius: "rounded-xl" },
  md: { wrap: "h-12 w-12", icon: "h-5 w-5", radius: "rounded-2xl" },
  lg: { wrap: "h-14 w-14", icon: "h-6 w-6", radius: "rounded-2xl" },
  xl: { wrap: "h-16 w-16", icon: "h-7 w-7", radius: "rounded-[1.25rem]" },
};

const Icon3D = ({ icon: Icon, variant = "primary", size = "md", className, float }: Icon3DProps) => {
  const s = sizeClasses[size];
  return (
    <div
      className={cn(
        "group/icon3d relative shrink-0 transition-transform duration-300",
        "hover:-translate-y-0.5 hover:rotate-[-4deg]",
        float && "animate-float",
        className
      )}
    >
      {/* Soft outer glow */}
      <div
        className={cn(
          "pointer-events-none absolute -inset-0.5 opacity-25 blur-md transition-opacity duration-300 group-hover/icon3d:opacity-40",
          s.radius,
          "bg-gradient-to-br",
          variantBg[variant]
        )}
        aria-hidden="true"
      />
      {/* Icon body */}
      <div
        className={cn(
          "relative flex items-center justify-center bg-gradient-to-br text-white",
          s.wrap,
          s.radius,
          variantBg[variant],
          variantGlow[variant]
        )}
      >
        {/* Specular highlight */}
        <span
          className={cn(
            "pointer-events-none absolute inset-x-1 top-1 h-1/3 bg-gradient-to-b from-white/15 to-transparent",
            s.radius
          )}
          aria-hidden="true"
        />
        <Icon className={cn("relative", s.icon)} strokeWidth={2} />
      </div>
    </div>
  );
};

export default Icon3D;

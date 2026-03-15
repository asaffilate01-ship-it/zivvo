import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
}

const EmptyState = ({ icon: Icon, title, description, actionLabel, actionTo, onAction }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center">
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{title}</h3>
    <p className="mt-2 max-w-sm text-muted-foreground">{description}</p>
    {actionLabel && actionTo && (
      <Link to={actionTo}>
        <Button className="gradient-primary mt-6 border-0">{actionLabel}</Button>
      </Link>
    )}
    {actionLabel && onAction && !actionTo && (
      <Button className="gradient-primary mt-6 border-0" onClick={onAction}>{actionLabel}</Button>
    )}
  </div>
);

export default EmptyState;

import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface InspectionBadgeProps {
  score: number;
  totalPoints?: number;
  className?: string;
}

const InspectionBadge = ({ score, totalPoints = 200, className }: InspectionBadgeProps) => {
  const percent = Math.round((score / totalPoints) * 100);
  const color = percent >= 80 ? "text-success" : percent >= 60 ? "text-warning" : "text-destructive";
  const bgColor = percent >= 80 ? "bg-success/10 border-success/30" : percent >= 60 ? "bg-warning/10 border-warning/30" : "bg-destructive/10 border-destructive/30";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={`${bgColor} ${color} text-[10px] gap-1 ${className || ""}`}>
          <Shield className="h-3 w-3" />
          {score}/{totalPoints}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">Inspection Score: {percent}% ({score}/{totalPoints} points)</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default InspectionBadge;

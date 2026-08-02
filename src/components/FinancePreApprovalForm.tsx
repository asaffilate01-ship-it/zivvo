import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Banknote, ShieldAlert } from "lucide-react";

interface FinancePreApprovalFormProps {
  auctionId: string;
  onApproved: () => void;
}

const FinancePreApprovalForm = (_props: FinancePreApprovalFormProps) => (
  <Card className="border-amber-300/60 bg-amber-50/40 dark:bg-amber-950/10">
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center gap-2 text-sm">
        <Banknote className="h-4 w-4 text-primary" /> Finanzierungsfreigabe
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 text-sm">
      <div className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <p>
          Die digitale Prüfung wird derzeit mit unseren Finanzierungspartnern finalisiert. Bis dahin
          ist für Gebote die sichere Kartenautorisierung erforderlich.
        </p>
      </div>
      <Badge variant="outline">Demnächst verfügbar</Badge>
    </CardContent>
  </Card>
);

export default FinancePreApprovalForm;

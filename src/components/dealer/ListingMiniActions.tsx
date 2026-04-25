import { Button } from "@/components/ui/button";
import { Calculator, Car, Truck } from "lucide-react";
import TestDriveDialog from "./TestDriveDialog";
import TransportQuoteDialog from "./TransportQuoteDialog";

interface Props {
  listingId: string;
  dealerId?: string | null;
  onFinance?: () => void;
}

const ListingMiniActions = ({ listingId, dealerId, onFinance }: Props) => {
  return (
    <div className="grid grid-cols-3 gap-1.5 mt-2">
      <Button size="sm" variant="outline" className="h-8 px-2 text-xs"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFinance?.(); }}>
        <Calculator className="w-3 h-3 mr-1" /> Finance
      </Button>
      <TestDriveDialog
        listingId={listingId}
        dealerId={dealerId}
        trigger={
          <Button size="sm" variant="outline" className="h-8 px-2 text-xs"
            onClick={(e) => e.stopPropagation()}>
            <Car className="w-3 h-3 mr-1" /> Test
          </Button>
        }
      />
      <TransportQuoteDialog
        listingId={listingId}
        dealerId={dealerId}
        trigger={
          <Button size="sm" variant="outline" className="h-8 px-2 text-xs"
            onClick={(e) => e.stopPropagation()}>
            <Truck className="w-3 h-3 mr-1" /> Deliver
          </Button>
        }
      />
    </div>
  );
};

export default ListingMiniActions;

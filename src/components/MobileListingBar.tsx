import { Phone, MessageCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSavedCars } from "@/contexts/SavedCarsContext";
import { cn } from "@/lib/utils";

interface Props {
  listingId: string;
  phone?: string | null;
  whatsappNumber?: string | null;
  title: string;
  onMessageClick?: () => void;
}

/**
 * Sticky bottom action bar for listing detail pages on mobile.
 * Sits above the MobileBottomNav (which is hidden on car detail scroll).
 */
const MobileListingBar = ({ listingId, phone, whatsappNumber, title, onMessageClick }: Props) => {
  const { t } = useTranslation();
  const { isSaved, toggle } = useSavedCars();
  const [revealed, setRevealed] = useState(false);
  const saved = isSaved(listingId);

  const wa = (whatsappNumber || phone || "").replace(/[^\d+]/g, "");

  return (
    <div className="md:hidden fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-lg pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch gap-2 p-3">
        <Button
          variant="outline"
          size="icon"
          aria-label={t("carDetail.save", "Speichern")}
          className={cn("h-12 w-12 shrink-0", saved && "text-red-500 border-red-500")}
          onClick={() => toggleSaved(listingId)}
        >
          <Heart className={cn("h-5 w-5", saved && "fill-current")} />
        </Button>

        {phone ? (
          <Button
            asChild={revealed}
            variant="outline"
            className="flex-1 h-12 gap-2"
            onClick={() => !revealed && setRevealed(true)}
          >
            {revealed ? (
              <a href={`tel:${phone}`}>
                <Phone className="h-5 w-5" /> {phone}
              </a>
            ) : (
              <span className="flex items-center gap-2"><Phone className="h-5 w-5" /> {t("carDetail.showPhoneNumber", "Nummer anzeigen")}</span>
            )}
          </Button>
        ) : null}

        {wa ? (
          <Button
            asChild
            className="flex-1 h-12 gap-2 gradient-primary border-0 text-primary-foreground"
          >
            <a
              href={`https://wa.me/${wa.replace(/^\+/, "")}?text=${encodeURIComponent(`Hi, I'm interested in ${title}`)}`}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
            >
              <MessageCircle className="h-5 w-5" /> Chat
            </a>
          </Button>
        ) : (
          <Button className="flex-1 h-12 gap-2 gradient-primary border-0 text-primary-foreground" onClick={onMessageClick}>
            <MessageCircle className="h-5 w-5" /> {t("carDetail.message", "Nachricht")}
          </Button>
        )}
      </div>
    </div>
  );
};

export default MobileListingBar;

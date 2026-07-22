import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Phone, MessageCircle, Mail } from "lucide-react";

interface DealerStickyBarProps {
  phone?: string | null;
  email?: string | null;
  whatsapp?: string;
  accent: string;
  onEnquireClick: () => void;
}

const DealerStickyBar = ({ phone, email, whatsapp, accent, onEnquireClick }: DealerStickyBarProps) => {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-3 py-2.5 backdrop-blur-md shadow-elevated md:hidden">
      <div className="flex items-center gap-2">
        {phone && (
          <a href={`tel:${phone}`} className="flex-1">
            <Button size="sm" variant="outline" className="w-full">
              <Phone className="mr-1 h-3.5 w-3.5" /> {t("dealer.stickyBar.call")}
            </Button>
          </a>
        )}
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button size="sm" className="w-full bg-[#25D366] text-white hover:bg-[#20BD5A]">
              <MessageCircle className="mr-1 h-3.5 w-3.5" /> {t("dealer.stickyBar.whatsapp")}
            </Button>
          </a>
        )}
        <Button
          size="sm"
          onClick={onEnquireClick}
          className="flex-1 border-0 text-white"
          style={{ backgroundColor: accent }}
        >
          <Mail className="mr-1 h-3.5 w-3.5" /> {t("dealer.stickyBar.enquire")}
        </Button>
      </div>
    </div>
  );
};

export default DealerStickyBar;

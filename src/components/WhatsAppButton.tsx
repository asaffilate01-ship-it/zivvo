import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  phone?: string | null;
  listingTitle: string;
  className?: string;
}

const WhatsAppButton = ({ phone, listingTitle, className }: WhatsAppButtonProps) => {
  if (!phone) return null;

  // Clean phone number for WhatsApp link
  const cleanPhone = phone.replace(/[\s\-()]+/g, "").replace(/^0/, "");
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi, I'm interested in: ${listingTitle}. Is it still available?`)}`;

  return (
    <a href={waUrl} target="_blank" rel="noopener noreferrer" className={className}>
      <Button className="w-full bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white border-0">
        <MessageCircle className="mr-2 h-4 w-4" />
        WhatsApp Seller
      </Button>
    </a>
  );
};

export default WhatsAppButton;

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Link as LinkIcon, MessageCircle, Twitter, Facebook } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ShareSheetProps {
  title: string;
  text: string;
  url?: string;
}

const ShareSheet = ({ title, text, url: propUrl }: ShareSheetProps) => {
  const { toast } = useToast();
  const url = propUrl || window.location.href;
  const encoded = encodeURIComponent(url);
  const encodedText = encodeURIComponent(text);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard" });
  };

  // Use native share on mobile if available
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return true;
      } catch { return false; }
    }
    return false;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={async (e) => {
          if (await handleNativeShare()) e.preventDefault();
        }}>
          <Share2 className="h-4 w-4" /> Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => window.open(`https://wa.me/?text=${encodedText}%20${encoded}`, "_blank")}>
          <MessageCircle className="mr-2 h-4 w-4 text-success" /> WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encoded}`, "_blank")}>
          <Twitter className="mr-2 h-4 w-4" /> Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encoded}`, "_blank")}>
          <Facebook className="mr-2 h-4 w-4" /> Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink}>
          <LinkIcon className="mr-2 h-4 w-4" /> Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareSheet;

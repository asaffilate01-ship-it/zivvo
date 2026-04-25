import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Shield, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CONSENT_KEY = "zivvo_cookie_consent";

const CookieConsent = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setShow(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-card p-4 shadow-elevated md:bottom-4 md:left-4 md:right-auto md:max-w-md md:rounded-xl md:border"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-card-foreground">We value your privacy</p>
              <p className="mt-1 text-xs text-muted-foreground">
                We use essential cookies to make Zivvo work. We'd also like to use analytics cookies to improve our service.{" "}
                <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>
              </p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={accept} className="gradient-primary border-0 text-xs">
                  Accept All
                </Button>
                <Button size="sm" variant="outline" onClick={decline} className="text-xs">
                  Essential Only
                </Button>
              </div>
            </div>
            <button onClick={decline} className="text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;

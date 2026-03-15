import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Car, User, Plus, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="gradient-primary flex h-9 w-9 items-center justify-center rounded-lg">
            <Car className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight text-foreground">
            AutoVault
          </span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <Link to="/browse">
            <Button variant="ghost" size="sm">Browse Cars</Button>
          </Link>
          <Link to="/sell">
            <Button variant="ghost" size="sm">Sell Your Car</Button>
          </Link>
          <Link to="/dealers">
            <Button variant="ghost" size="sm">For Dealers</Button>
          </Link>
          <Link to="/finance-check">
            <Button variant="ghost" size="sm">Finance Check</Button>
          </Link>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <Link to="/saved">
            <Button variant="ghost" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="outline" size="sm">
              <User className="mr-1 h-4 w-4" />
              Sign In
            </Button>
          </Link>
          <Link to="/sell">
            <Button size="sm" className="gradient-primary border-0">
              <Plus className="mr-1 h-4 w-4" />
              Post Ad
            </Button>
          </Link>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border bg-background md:hidden"
          >
            <div className="flex flex-col gap-1 p-4">
              <Link to="/browse" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">Browse Cars</Button>
              </Link>
              <Link to="/sell" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">Sell Your Car</Button>
              </Link>
              <Link to="/dealers" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">For Dealers</Button>
              </Link>
              <Link to="/finance-check" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">Finance Check</Button>
              </Link>
              <hr className="my-2 border-border" />
              <Link to="/login" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link to="/sell" onClick={() => setMobileOpen(false)}>
                <Button className="gradient-primary w-full border-0">Post Ad</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

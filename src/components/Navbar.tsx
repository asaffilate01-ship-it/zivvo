import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, X, Car, User, Plus, Heart, LogOut, MessageSquare, Sun, Moon, Monitor, Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { theme, setTheme, resolved } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }

    const fetchUnread = async () => {
      const [messagesRes, enquiriesRes] = await Promise.all([
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("recipient_id", user.id).eq("read", false),
        supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("seller_id", user.id).eq("status", "unread"),
      ]);
      setUnreadCount((messagesRes.count || 0) + (enquiriesRes.count || 0));
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const InboxBadge = () => (
    <div className="relative">
      <MessageSquare className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </div>
  );

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
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {resolved === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" /> Light
                {theme === "light" && <span className="ml-auto text-xs text-primary">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" /> Dark
                {theme === "dark" && <span className="ml-auto text-xs text-primary">✓</span>}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" /> System
                {theme === "system" && <span className="ml-auto text-xs text-primary">✓</span>}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Link to="/saved">
            <Button variant="ghost" size="icon">
              <Heart className="h-5 w-5" />
            </Button>
          </Link>
          {user && (
            <Link to="/inbox">
              <Button variant="ghost" size="icon">
                <InboxBadge />
              </Button>
            </Link>
          )}
          {user ? (
            <>
              <Link to="/profile">
                <Button variant="outline" size="sm">
                  <User className="mr-1 h-4 w-4" />
                  Profile
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="mr-1 h-4 w-4" />
                Sign Out
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">
                <User className="mr-1 h-4 w-4" />
                Sign In
              </Button>
            </Link>
          )}
          <Link to="/sell">
            <Button size="sm" className="gradient-primary border-0">
              <Plus className="mr-1 h-4 w-4" />
              Post Ad
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-1 md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                {resolved === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" /> Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" /> Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" /> System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {user && (
            <Link to="/inbox">
              <Button variant="ghost" size="icon">
                <InboxBadge />
              </Button>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
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
              <Link to="/saved" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">Saved Cars</Button>
              </Link>
              {user && (
                <Link to="/inbox" onClick={() => setMobileOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    Inbox {unreadCount > 0 && <Badge variant="destructive" className="ml-2 text-xs">{unreadCount}</Badge>}
                  </Button>
                </Link>
              )}
              <hr className="my-2 border-border" />
              {user ? (
                <>
                  <Link to="/profile" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">Profile</Button>
                  </Link>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full">Dashboard</Button>
                  </Link>
                  <Button variant="ghost" className="w-full" onClick={() => { signOut(); setMobileOpen(false); }}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
              )}
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

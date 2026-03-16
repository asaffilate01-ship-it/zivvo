import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Menu, X, Car, User, Plus, Heart, LogOut, MessageSquare, Sun, Moon, Monitor,
  LayoutDashboard, ShieldCheck, Users, Building2, HelpCircle, Phone, BookOpen,
} from "lucide-react";
import NotificationBell from "@/components/NotificationBell";
import CountrySwitcher from "@/components/CountrySwitcher";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";

const Navbar = () => {
  const location = useLocation();
  const { user, signOut, hasRole } = useAuth();
  const { theme, setTheme, resolved } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const isActive = (path: string) => location.pathname === path;

  const navLinks = [
    { to: "/browse", label: "Browse" },
    { to: "/sell", label: "Sell" },
    { to: "/dealers", label: "Dealers" },
    { to: "/blog", label: "Blog" },
  ];

  const getDashboardLink = () => {
    if (hasRole("admin")) return "/admin";
    if (hasRole("agent")) return "/agent";
    if (hasRole("dealer")) return "/dashboard";
    return "/profile";
  };

  const InboxBadge = () => (
    <div className="relative">
      <MessageSquare className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </div>
  );

  const mobileLinks = [
    { to: "/browse", label: "Browse Cars", icon: Car },
    { to: "/sell", label: "Sell Your Car", icon: Plus },
    { to: "/dealers", label: "For Dealers", icon: Building2 },
    { to: "/blog", label: "Blog & Guides", icon: BookOpen },
    { to: "/saved", label: "Saved Cars", icon: Heart },
    { to: "/help", label: "Help Centre", icon: HelpCircle },
    { to: "/contact", label: "Contact Us", icon: Phone },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="gradient-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <Car className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-foreground">AutoVault</span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-0.5 md:flex">
          {navLinks.map((link) => (
            <Link key={link.to} to={link.to}>
              <Button
                variant="ghost"
                size="sm"
                className={`text-sm ${isActive(link.to) ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              >
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Desktop right actions */}
        <div className="hidden items-center gap-1.5 md:flex">
          <CountrySwitcher />

          {/* Theme */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {resolved === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
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
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Heart className="h-4 w-4" />
            </Button>
          </Link>

          {user && <NotificationBell />}

          {user && (
            <Link to="/inbox">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <InboxBadge />
              </Button>
            </Link>
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <User className="h-4 w-4" />
                  <span className="max-w-24 truncate">{user.email?.split("@")[0]}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={getDashboardLink()} className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                {hasRole("admin") && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" /> Admin Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                {hasRole("agent") && (
                  <DropdownMenuItem asChild>
                    <Link to="/agent" className="flex items-center gap-2">
                      <Users className="h-4 w-4" /> Agent Panel
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm" className="gap-1.5">
                <User className="h-4 w-4" /> Sign In
              </Button>
            </Link>
          )}

          <Link to="/sell">
            <Button size="sm" className="gradient-primary border-0 gap-1.5">
              <Plus className="h-4 w-4" /> Post Ad
            </Button>
          </Link>
        </div>

        {/* Mobile right */}
        <div className="flex items-center gap-1 md:hidden">
          <CountrySwitcher />
          {user && (
            <Link to="/inbox">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <InboxBadge />
              </Button>
            </Link>
          )}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <SheetHeader className="border-b border-border p-4">
                <SheetTitle className="flex items-center gap-2">
                  <div className="gradient-primary flex h-7 w-7 items-center justify-center rounded-lg">
                    <Car className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                  AutoVault
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-1 p-3">
                {mobileLinks.map((link) => (
                  <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start gap-2 ${isActive(link.to) ? "bg-secondary" : ""}`}
                    >
                      <link.icon className="h-4 w-4 text-muted-foreground" />
                      {link.label}
                    </Button>
                  </Link>
                ))}

                {user && (
                  <Link to="/inbox" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      Inbox
                      {unreadCount > 0 && <Badge variant="destructive" className="ml-auto text-xs">{unreadCount}</Badge>}
                    </Button>
                  </Link>
                )}
              </div>

              <div className="border-t border-border p-3">
                {/* Theme toggle row */}
                <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
                  {[
                    { value: "light" as const, icon: Sun },
                    { value: "dark" as const, icon: Moon },
                    { value: "system" as const, icon: Monitor },
                  ].map((opt) => (
                    <Button
                      key={opt.value}
                      variant={theme === opt.value ? "default" : "ghost"}
                      size="sm"
                      className={`flex-1 gap-1 text-xs ${theme === opt.value ? "gradient-primary border-0 text-primary-foreground" : ""}`}
                      onClick={() => setTheme(opt.value)}
                    >
                      <opt.icon className="h-3.5 w-3.5" />
                      {opt.value.charAt(0).toUpperCase() + opt.value.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="border-t border-border p-3">
                {user ? (
                  <div className="flex flex-col gap-1">
                    <Link to="/profile" onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <User className="h-4 w-4 text-muted-foreground" /> Profile
                      </Button>
                    </Link>
                    <Link to={getDashboardLink()} onClick={() => setMobileOpen(false)}>
                      <Button variant="ghost" className="w-full justify-start gap-2">
                        <LayoutDashboard className="h-4 w-4 text-muted-foreground" /> Dashboard
                      </Button>
                    </Link>
                    {hasRole("admin") && (
                      <Link to="/admin" onClick={() => setMobileOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start gap-2">
                          <ShieldCheck className="h-4 w-4 text-muted-foreground" /> Admin Panel
                        </Button>
                      </Link>
                    )}
                    <Button variant="ghost" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={() => { signOut(); setMobileOpen(false); }}>
                      <LogOut className="h-4 w-4" /> Sign Out
                    </Button>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" className="w-full gap-2">
                      <User className="h-4 w-4" /> Sign In
                    </Button>
                  </Link>
                )}
              </div>

              <div className="p-3">
                <Link to="/sell" onClick={() => setMobileOpen(false)}>
                  <Button className="gradient-primary w-full border-0 gap-2">
                    <Plus className="h-4 w-4" /> Post Your Ad
                  </Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

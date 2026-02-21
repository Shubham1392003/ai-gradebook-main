import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  BookOpen, LogOut, Menu, X, LayoutDashboard, FileText,
  Shield, BarChart3, GraduationCap, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = user
    ? role === "teacher"
      ? [
          { to: "/teacher", label: "Dashboard", icon: LayoutDashboard },
          { to: "/teacher/exams", label: "Exams", icon: FileText },
          { to: "/teacher/grievances", label: "Grievances", icon: Shield },
          { to: "/teacher/analytics", label: "Analytics", icon: BarChart3 },
        ]
      : [
          { to: "/student", label: "Dashboard", icon: LayoutDashboard },
          { to: "/student/exams", label: "My Exams", icon: FileText },
          { to: "/student/grievances", label: "Grievances", icon: Shield },
          { to: "/student/scorecards", label: "Scorecards", icon: GraduationCap },
        ]
    : [];

  return (
    <div className="sticky top-0 z-50 flex justify-center px-4 pt-3">
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`w-full max-w-5xl rounded-full border transition-all duration-300 ${
          scrolled
            ? "bg-white backdrop-blur-xl border-foreground/15 shadow-xl shadow-black/8"
            : "bg-white backdrop-blur-xl border-foreground/10 shadow-lg shadow-black/5"
        }`}
      >
        <div className="flex h-14 items-center justify-between px-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-base font-extrabold text-foreground tracking-tight">
              FairGrade AI
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                    active
                      ? "text-primary"
                      : "text-foreground/70 hover:text-primary"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
            <Link
              to="/docs"
              className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Docs
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <span className="hidden text-xs font-semibold sm:block px-3 py-1 rounded-full bg-primary/10 text-primary">
                  {role === "teacher" ? "Teacher" : "Student"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="gap-1.5 rounded-full h-8 text-foreground/70 hover:text-primary hover:bg-primary/5"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline text-xs">Sign Out</span>
                </Button>
              </>
            ) : (
              <Link to="/auth">
                <Button
                  size="sm"
                  className="rounded-full h-9 text-xs font-bold px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                >
                  Start Learning
                </Button>
              </Link>
            )}
            <button
              className="md:hidden rounded-full p-1.5 text-foreground/70 hover:bg-muted"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border/20 mx-4"
            >
              <div className="flex flex-col gap-1 py-3">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const active = location.pathname === link.to;
                  return (
                    <Link
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "text-primary bg-primary/5"
                          : "text-foreground/70 hover:text-primary hover:bg-primary/5"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}
                <Link
                  to="/docs"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-foreground/70 hover:text-primary hover:bg-primary/5"
                >
                  <BookOpen className="h-4 w-4" />
                  Documentation
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </div>
  );
};

export default Navbar;

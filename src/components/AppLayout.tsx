import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, Calendar, CreditCard,
  Settings, LogOut, Repeat, Menu, Moon, Sun, Bell, Trophy, Award,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/matching", label: "Find Peers", icon: Users },
  { to: "/sessions", label: "Sessions", icon: Calendar },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/badges",      label: "Badges",      icon: Award },
  { to: "/credits", label: "Credits", icon: CreditCard },
  { to: "/profile", label: "Profile", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [pendingSessions, setPendingSessions] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const loadPending = async () => {
      const { data } = await supabase
        .from("sessions")
        .select("*")
        .eq("teacher_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (data) {
        setPendingSessions(data);
        setPendingCount(data.length);
        const ids = data.map((s) => s.learner_id);
        if (ids.length > 0) {
          const { data: profs } = await supabase
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", ids);
          if (profs) {
            const map: Record<string, string> = {};
            profs.forEach((p) => (map[p.user_id] = p.display_name));
            setProfiles(map);
          }
        }
      }
    };
    loadPending();

    const channel = supabase
      .channel("pending-sessions")
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "sessions",
        filter: `teacher_id=eq.${user.id}`,
      }, () => loadPending())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const toggleDark = () => {
    if (isDark) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
      setIsDark(false);
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
      setIsDark(true);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 p-6 border-b border-border">
            <div className="h-9 w-9 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Repeat className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-display font-bold">SkillSwap</span>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className={`h-4 w-4 ${item.to === "/leaderboard" && active ? "text-yellow-500" : ""}`} />
                  {item.label}
                  {item.to === "/sessions" && pendingCount > 0 && (
                    <span className="ml-auto bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                      {pendingCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border space-y-1">
            <button
              onClick={toggleDark}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors w-full"
            >
              {isDark ? <><Sun className="h-4 w-4" /> Light Mode</> : <><Moon className="h-4 w-4" /> Dark Mode</>}
            </button>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <Bell className="h-5 w-5 text-muted-foreground" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-pulse">
                    {pendingCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-xl shadow-lg z-50">
                  <div className="p-4 border-b border-border">
                    <h3 className="font-display font-semibold text-sm">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {pendingSessions.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No new notifications 🎉
                      </div>
                    ) : (
                      pendingSessions.map((s) => (
                        <div
                          key={s.id}
                          className="p-4 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => { setShowNotifications(false); navigate("/sessions"); }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <Bell className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">New session request!</p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {profiles[s.learner_id] || "Someone"} wants to learn from you
                              </p>
                              <p className="text-xs text-primary mt-1">Click to view →</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="text-sm text-muted-foreground">{user?.email}</div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>

      {showNotifications && (
        <div className="fixed inset-0 z-20" onClick={() => setShowNotifications(false)} />
      )}
    </div>
  );
}

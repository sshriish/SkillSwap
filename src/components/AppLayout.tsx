import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Video,
  CreditCard,
  Star,
  Settings,
  LogOut,
  Repeat,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/matching", label: "Find Peers", icon: Users },
  { to: "/sessions", label: "Sessions", icon: Calendar },
  { to: "/credits", label: "Credits", icon: CreditCard },
  { to: "/profile", label: "Profile", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
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
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border">
            <Button variant="ghost" className="w-full justify-start text-muted-foreground" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/20 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-lg border-b border-border px-6 py-4 flex items-center justify-between lg:justify-end">
          <button onClick={() => setMobileOpen(true)} className="lg:hidden">
            <Menu className="h-5 w-5" />
          </button>
          <div className="text-sm text-muted-foreground">
            {user?.email}
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard, TrendingUp, TrendingDown, Gift, RotateCcw,
  GraduationCap, BookOpen, User, Calendar, Clock, Zap,
  ArrowUpRight, ArrowDownRight, Filter, ChevronDown,
  BarChart3, Search, Download, Star
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  session_id: string | null;
  created_at: string;
  // enriched
  other_user_name?: string;
  other_user_id?: string;
  skill_name?: string;
  duration_minutes?: number;
  role?: "teacher" | "learner";
}

type FilterType = "all" | "earned" | "spent" | "bonus" | "refund";
type SortBy = "date" | "amount";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { icon: any; label: string; color: string; bg: string }> = {
  earned: { icon: TrendingUp,    label: "Earned",   color: "#22c55e", bg: "rgba(34,197,94,0.1)"  },
  spent:  { icon: TrendingDown,  label: "Spent",    color: "#ef4444", bg: "rgba(239,68,68,0.1)"  },
  bonus:  { icon: Gift,          label: "Bonus",    color: "#f59e0b", bg: "rgba(245,158,11,0.1)" },
  refund: { icon: RotateCcw,     label: "Refund",   color: "#3b82f6", bg: "rgba(59,130,246,0.1)" },
};

function fmt(date: string) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function fmtTime(date: string) {
  return new Date(date).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}
function fmtDuration(min?: number) {
  if (!min) return null;
  if (min < 60) return `${min}m`;
  return `${Math.floor(min / 60)}h ${min % 60 > 0 ? (min % 60) + "m" : ""}`.trim();
}

// ─── Summary Card ─────────────────────────────────────────────────────────────

function SummaryCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: any; color: string; sub?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-5 flex gap-4 items-start"
    >
      <div className="rounded-xl p-2.5" style={{ background: color + "22" }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold font-mono mt-0.5">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const W = 120, H = 36, pad = 2;
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2);
    const y = H - pad - ((v - min) / range) * (H - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="opacity-70">
      <polyline fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" points={pts}
        className="text-primary" />
    </svg>
  );
}

// ─── Transaction Row ──────────────────────────────────────────────────────────

function TxRow({ tx, delay }: { tx: Transaction; delay: number }) {
  const meta = TYPE_META[tx.type] || TYPE_META["earned"];
  const Icon = meta.icon;
  const isCredit = tx.amount > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.25 }}
      className="group flex items-start gap-4 py-4 px-4 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
    >
      {/* Icon */}
      <div className="mt-0.5 rounded-xl p-2.5 flex-shrink-0" style={{ background: meta.bg }}>
        {tx.role === "teacher" ? (
          <GraduationCap className="h-4 w-4" style={{ color: meta.color }} />
        ) : tx.role === "learner" ? (
          <BookOpen className="h-4 w-4" style={{ color: meta.color }} />
        ) : (
          <Icon className="h-4 w-4" style={{ color: meta.color }} />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">{tx.description || meta.label}</span>
          <Badge variant="secondary" className="text-xs capitalize px-2 py-0"
            style={{ background: meta.bg, color: meta.color, border: "none" }}>
            {meta.label}
          </Badge>
          {tx.role && (
            <Badge variant="outline" className="text-xs px-2 py-0">
              {tx.role === "teacher" ? "You taught" : "You learned"}
            </Badge>
          )}
        </div>

        {/* Who */}
        {tx.other_user_name && (
          <div className="flex items-center gap-1.5 mt-1">
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">{tx.other_user_name}</span>
            {tx.skill_name && (
              <>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-xs text-muted-foreground">{tx.skill_name}</span>
              </>
            )}
          </div>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{fmt(tx.created_at)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{fmtTime(tx.created_at)}</span>
          </div>
          {tx.duration_minutes != null && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Zap className="h-3 w-3" />
              <span>{fmtDuration(tx.duration_minutes)} session</span>
            </div>
          )}
        </div>
      </div>

      {/* Amount */}
      <div className={`flex-shrink-0 flex items-center gap-1 text-base font-bold font-mono
        ${isCredit ? "text-green-500" : "text-red-500"}`}>
        {isCredit
          ? <ArrowUpRight className="h-4 w-4" />
          : <ArrowDownRight className="h-4 w-4" />}
        {isCredit ? "+" : ""}{tx.amount}
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Credits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // ── Load & enrich ────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);

      // 1. Profile credits + raw transactions
      const [profileRes, txRes] = await Promise.all([
        supabase.from("profiles").select("credits").eq("user_id", user.id).single(),
        supabase
          .from("credit_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(200),
      ]);

      if (profileRes.data) setCredits(profileRes.data.credits);
      const rawTxs: Transaction[] = txRes.data || [];

      // 2. Collect session_ids that exist
      const sessionIds = [...new Set(rawTxs.map(t => t.session_id).filter(Boolean))] as string[];

      if (sessionIds.length === 0) {
        setTransactions(rawTxs);
        setLoading(false);
        return;
      }

      // 3. Fetch those sessions (teacher_id, learner_id, skill_id, duration)
      const { data: sessions } = await supabase
        .from("sessions")
        .select("id, teacher_id, learner_id, skill_id, duration_minutes")
        .in("id", sessionIds);

      // 4. Collect all unique user IDs and skill IDs
      const userIds = new Set<string>();
      const skillIds = new Set<string>();
      (sessions || []).forEach(s => {
        if (s.teacher_id) userIds.add(s.teacher_id);
        if (s.learner_id)  userIds.add(s.learner_id);
        if (s.skill_id)    skillIds.add(s.skill_id);
      });
      userIds.delete(user.id); // we only need the other person

      // 5. Fetch profiles and skills in parallel
      const [profilesRes, skillsRes] = await Promise.all([
        userIds.size > 0
          ? supabase.from("profiles").select("user_id, display_name").in("user_id", [...userIds])
          : Promise.resolve({ data: [] }),
        skillIds.size > 0
          ? supabase.from("skills").select("id, name").in("id", [...skillIds])
          : Promise.resolve({ data: [] }),
      ]);

      const profileMap: Record<string, string> = {};
      (profilesRes.data || []).forEach(p => { profileMap[p.user_id] = p.display_name; });

      const skillMap: Record<string, string> = {};
      (skillsRes.data || []).forEach(s => { skillMap[s.id] = s.name; });

      const sessionMap: Record<string, typeof sessions[0]> = {};
      (sessions || []).forEach(s => { sessionMap[s.id] = s; });

      // 6. Enrich transactions
      const enriched: Transaction[] = rawTxs.map(tx => {
        if (!tx.session_id || !sessionMap[tx.session_id]) return tx;
        const sess = sessionMap[tx.session_id];
        const isTeacher = sess.teacher_id === user.id;
        const otherId = isTeacher ? sess.learner_id : sess.teacher_id;
        return {
          ...tx,
          role: isTeacher ? "teacher" : "learner",
          other_user_id: otherId,
          other_user_name: profileMap[otherId] || "Unknown User",
          skill_name: sess.skill_id ? skillMap[sess.skill_id] : undefined,
          duration_minutes: sess.duration_minutes ?? undefined,
        };
      });

      setTransactions(enriched);
      setLoading(false);
    };

    load();
  }, [user]);

  // ── Derived stats ────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const totalEarned = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const totalSpent  = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const sessionsCount = new Set(transactions.filter(t => t.session_id).map(t => t.session_id)).size;
    const peopleTaught = new Set(
      transactions.filter(t => t.role === "teacher" && t.other_user_id).map(t => t.other_user_id)
    ).size;
    const peopleLearntFrom = new Set(
      transactions.filter(t => t.role === "learner" && t.other_user_id).map(t => t.other_user_id)
    ).size;

    // Running balance for sparkline (last 14 days buckets)
    const now = Date.now();
    const buckets = Array.from({ length: 14 }, (_, i) => {
      const day = now - (13 - i) * 86400000;
      return transactions
        .filter(t => new Date(t.created_at).getTime() <= day)
        .reduce((sum, t) => sum + t.amount, 0);
    });

    return { totalEarned, totalSpent, sessionsCount, peopleTaught, peopleLearntFrom, buckets };
  }, [transactions]);

  // ── Filtered list ────────────────────────────────────────────────────────

  const visible = useMemo(() => {
    let list = transactions;
    if (filter !== "all") list = list.filter(t => t.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        (t.other_user_name || "").toLowerCase().includes(q) ||
        (t.skill_name || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        t.type.includes(q)
      );
    }
    if (sortBy === "amount") list = [...list].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
    return list;
  }, [transactions, filter, search, sortBy]);

  // ── Render ───────────────────────────────────────────────────────────────

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all",    label: "All" },
    { key: "earned", label: "Earned" },
    { key: "spent",  label: "Spent" },
    { key: "bonus",  label: "Bonus" },
    { key: "refund", label: "Refunds" },
  ];

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-bold font-display">Credits</h1>
          <p className="text-muted-foreground mt-1">Full transaction history with session details</p>
        </motion.div>

        {/* ── Balance Hero ── */}
        <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.05 }}
          className="rounded-2xl overflow-hidden relative"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.7) 100%)" }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6 p-7">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-5 w-5 text-primary-foreground/80" />
                <p className="text-sm text-primary-foreground/80 font-medium uppercase tracking-widest">Available Balance</p>
              </div>
              <p className="text-5xl font-bold font-mono text-primary-foreground">{credits}</p>
              <p className="text-sm text-primary-foreground/70 mt-2">
                Earn by teaching · Spend to learn
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Sparkline data={stats.buckets} />
              <p className="text-xs text-primary-foreground/60">14-day balance trend</p>
            </div>
          </div>
        </motion.div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "Total Earned", value: `+${stats.totalEarned}`, icon: TrendingUp,  color: "#22c55e", sub: "credits received" },
            { label: "Total Spent",  value: `-${stats.totalSpent}`,  icon: TrendingDown, color: "#ef4444", sub: "credits used" },
            { label: "Sessions",     value: stats.sessionsCount,      icon: BarChart3,   color: "#3b82f6", sub: "total sessions" },
            { label: "Taught",       value: stats.peopleTaught,       icon: GraduationCap, color: "#f59e0b", sub: "unique learners" },
            { label: "Learnt From",  value: stats.peopleLearntFrom,   icon: BookOpen,    color: "#a855f7", sub: "unique teachers" },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}>
              <SummaryCard {...s} />
            </motion.div>
          ))}
        </div>

        {/* ── Transaction History ── */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <CardTitle className="text-lg">Transaction History</CardTitle>
              <div className="flex-1" />

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search person, skill…"
                  className="pl-8 pr-3 py-1.5 text-sm rounded-lg border border-border bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/30 w-48"
                />
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(v => !v)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors"
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
              </button>
            </div>

            {/* Expandable filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <div className="pt-3 flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground self-center mr-1">Type:</span>
                    {FILTERS.map(f => (
                      <button key={f.key} onClick={() => setFilter(f.key)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border
                          ${filter === f.key
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 border-border hover:bg-muted"}`}>
                        {f.label}
                      </button>
                    ))}
                    <span className="text-xs text-muted-foreground self-center ml-3 mr-1">Sort:</span>
                    {([["date", "Date"], ["amount", "Amount"]] as const).map(([k, label]) => (
                      <button key={k} onClick={() => setSortBy(k)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border
                          ${sortBy === k
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted/50 border-border hover:bg-muted"}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardHeader>

          <CardContent className="pt-0">
            {loading ? (
              <div className="space-y-3 py-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex gap-3 items-center animate-pulse">
                    <div className="h-10 w-10 rounded-xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-muted rounded w-48" />
                      <div className="h-2 bg-muted rounded w-32" />
                    </div>
                    <div className="h-4 bg-muted rounded w-12" />
                  </div>
                ))}
              </div>
            ) : visible.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <CreditCard className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                <p className="text-muted-foreground">
                  {search || filter !== "all"
                    ? "No transactions match your filters."
                    : "No transactions yet. Complete a session to earn credits!"}
                </p>
                {(search || filter !== "all") && (
                  <button onClick={() => { setSearch(""); setFilter("all"); }}
                    className="text-sm text-primary hover:underline">
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div className="-mx-2">
                {visible.map((tx, i) => (
                  <TxRow key={tx.id} tx={tx} delay={Math.min(i * 0.04, 0.4)} />
                ))}
              </div>
            )}

            {/* Footer summary */}
            {visible.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span>{visible.length} transaction{visible.length !== 1 ? "s" : ""} shown</span>
                <span className="font-mono">
                  Net: {" "}
                  <span className={visible.reduce((s, t) => s + t.amount, 0) >= 0 ? "text-green-500" : "text-red-500"}>
                    {visible.reduce((s, t) => s + t.amount, 0) > 0 ? "+" : ""}
                    {visible.reduce((s, t) => s + t.amount, 0)}
                  </span>
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Pro Tips Card ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          <Card className="border-dashed bg-muted/30">
            <CardContent className="py-5 px-6">
              <div className="flex gap-3 items-start">
                <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold">How credits work</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    You earn credits each time you teach a session. Credits are deducted when you book someone else to learn from them.
                    Bonus credits may be awarded for streaks, top ratings, or referrals.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </AppLayout>
  );
                    }

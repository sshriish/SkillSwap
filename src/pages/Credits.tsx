import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CreditCard, GraduationCap, BookOpen, Gift, RotateCcw, Coins } from "lucide-react";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string | null;
  session_id: string | null;
  created_at: string;
  other_user_name?: string;
  role?: "teacher" | "learner";
}

function relativeDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: diffDays > 365 ? "numeric" : undefined,
  });
}

function txLine(tx: Transaction): { icon: any; color: string; line: string } {
  if (tx.role === "teacher") {
    return {
      icon: GraduationCap,
      color: "text-green-500",
      line: `+${tx.amount}  You taught ${tx.other_user_name ?? "someone"}`,
    };
  }
  if (tx.role === "learner") {
    return {
      icon: BookOpen,
      color: "text-red-400",
      line: `${tx.amount}  You learned from ${tx.other_user_name ?? "someone"}`,
    };
  }
  if (tx.type === "bonus") {
    return { icon: Gift, color: "text-amber-400", line: `+${tx.amount}  ${tx.description ?? "Bonus credits"}` };
  }
  if (tx.type === "refund") {
    return { icon: RotateCcw, color: "text-blue-400", line: `+${tx.amount}  ${tx.description ?? "Refund"}` };
  }
  return {
    icon: CreditCard,
    color: tx.amount > 0 ? "text-green-500" : "text-red-400",
    line: `${tx.amount > 0 ? "+" : ""}${tx.amount}  ${tx.description ?? tx.type}`,
  };
}

export default function Credits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      const [profileRes, txRes] = await Promise.all([
        supabase.from("profiles").select("credits").eq("user_id", user.id).single(),
        supabase
          .from("credit_transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (profileRes.data) setCredits(profileRes.data.credits);
      const raw: Transaction[] = txRes.data ?? [];

      const sessionIds = [...new Set(raw.map((t) => t.session_id).filter(Boolean))] as string[];
      if (!sessionIds.length) {
        setTransactions(raw);
        setLoading(false);
        return;
      }

      const { data: sessions } = await supabase
        .from("sessions")
        .select("id, teacher_id, learner_id")
        .in("id", sessionIds);

      const otherIds = new Set<string>();
      (sessions ?? []).forEach((s) => {
        if (s.teacher_id !== user.id) otherIds.add(s.teacher_id);
        if (s.learner_id !== user.id) otherIds.add(s.learner_id);
      });

      const { data: profiles } = otherIds.size
        ? await supabase.from("profiles").select("user_id, display_name").in("user_id", [...otherIds])
        : { data: [] };

      const profileMap: Record<string, string> = {};
      (profiles ?? []).forEach((p) => { profileMap[p.user_id] = p.display_name; });

      const sessMap: Record<string, { teacher_id: string; learner_id: string }> = {};
      (sessions ?? []).forEach((s) => { sessMap[s.id] = s; });

      setTransactions(
        raw.map((tx) => {
          const sess = tx.session_id ? sessMap[tx.session_id] : null;
          if (!sess) return tx;
          const isTeacher = sess.teacher_id === user.id;
          const otherId = isTeacher ? sess.learner_id : sess.teacher_id;
          return {
            ...tx,
            role: isTeacher ? "teacher" : "learner",
            other_user_name: profileMap[otherId] ?? "someone",
          };
        })
      );

      setLoading(false);
    })();
  }, [user]);

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-6 pb-12">

        {/* Balance card */}
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-primary text-primary-foreground">
            <CardContent className="flex items-center gap-4 p-7">
              <Coins className="h-9 w-9 opacity-80" />
              <div>
                <p className="text-sm opacity-70 uppercase tracking-widest font-medium">Balance</p>
                <p className="text-5xl font-bold font-mono">{credits}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction list */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Transaction History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0 px-4">
            {loading ? (
              <div className="space-y-4 py-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-4 w-4 rounded-full bg-muted" />
                    <div className="flex-1 h-3 bg-muted rounded" />
                    <div className="h-3 w-14 bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <p className="text-center py-10 text-sm text-muted-foreground">
                No transactions yet — complete a session to get started!
              </p>
            ) : (
              transactions.map((tx, i) => {
                const { icon: Icon, color, line } = txLine(tx);
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(i * 0.03, 0.35) }}
                    className="flex items-center gap-3 py-3 border-b border-border last:border-0"
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${color}`} />
                    <p className={`flex-1 text-sm font-medium ${color}`}>{line}</p>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {relativeDate(tx.created_at)}
                    </span>
                  </motion.div>
                );
              })
            )}
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
}
